import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InsightCard {
  type: 'expiring_food' | 'meal_suggestion' | 'restock_alert' | 'nutrition_tip' | 'recipe_match' | 'video_tutorial';
  priority: 1 | 2 | 3;
  title: string;
  message: string;
  reasoning: string;
  action: { type: string; payload: any };
  expiresAt?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication required', details: authError.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!user) {
      console.error('No user found');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
    }

    // Use service role for data fetching
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user profile with household info
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*, households!current_household_id(*)')
      .eq('id', user.id)
      .single();

    if (!profile?.current_household_id) {
      return new Response(
        JSON.stringify({ error: 'No household found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch expiring inventory (next 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const { data: expiringItems } = await supabaseAdmin
      .from('inventory')
      .select('*')
      .eq('household_id', profile.current_household_id)
      .lte('expiry_date', threeDaysFromNow.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true })
      .limit(10);

    // Fetch low stock items
    const { data: lowStockItems } = await supabaseAdmin
      .from('inventory')
      .select('*')
      .eq('household_id', profile.current_household_id)
      .lte('fill_level', 20)
      .limit(10);

    // Fetch recent meal logs (last 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const { data: recentMeals } = await supabaseAdmin
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', threeDaysAgo.toISOString())
      .order('logged_at', { ascending: false });

    // Fetch household members for dietary context
    const { data: householdMembers } = await supabaseAdmin
      .from('household_members')
      .select('*')
      .eq('user_id', user.id);

    // Get time context
    const hour = new Date().getHours();
    let timeOfDay = 'morning';
    let mealType = 'breakfast';
    
    if (hour >= 5 && hour < 11) {
      timeOfDay = 'morning';
      mealType = 'breakfast';
    } else if (hour >= 11 && hour < 15) {
      timeOfDay = 'afternoon';
      mealType = 'lunch';
    } else if (hour >= 15 && hour < 19) {
      timeOfDay = 'late afternoon';
      mealType = 'dinner';
    } else if (hour >= 19 && hour < 22) {
      timeOfDay = 'evening';
      mealType = 'dinner';
    } else {
      timeOfDay = 'night';
      mealType = 'snack';
    }

    // Build context for Gemini
    const contextPrompt = `You are KAEVA's proactive AI assistant. Generate 3-5 personalized insight cards for the user based on their current household state.

Current time: ${timeOfDay} (${hour}:00), appropriate for ${mealType}

User Profile:
- Name: ${profile.user_name || 'User'}
- Health Goals: ${profile.health_goals ? JSON.stringify(profile.health_goals) : 'None set'}
- Dietary Preferences: ${profile.dietary_preferences ? JSON.stringify(profile.dietary_preferences) : 'None set'}
- Allergies: ${profile.allergies ? JSON.stringify(profile.allergies) : 'None'}

Household Members: ${householdMembers?.length || 0} members
${householdMembers?.map(m => `- ${m.name} (${m.age_group || 'adult'}): Allergies: ${JSON.stringify(m.allergies || [])}, Restrictions: ${JSON.stringify(m.dietary_restrictions || [])}`).join('\n') || 'No members added'}

Expiring Items (next 3 days): ${expiringItems?.length || 0} items
${expiringItems?.map(i => `- ${i.name} (expires: ${i.expiry_date})`).join('\n') || 'None'}

Low Stock Items: ${lowStockItems?.length || 0} items
${lowStockItems?.map(i => `- ${i.name} (${i.fill_level}% remaining)`).join('\n') || 'None'}

Recent Meals (last 3 days): ${recentMeals?.length || 0} logged
${recentMeals?.slice(0, 5).map(m => `- ${m.meal_type}: ${m.calories}cal`).join('\n') || 'No recent meals'}

Generate 3-5 insight cards prioritized by urgency and relevance. Each card should:
1. Address a specific, actionable item
2. Explain WHY this matters (reasoning)
3. Provide clear next action

Card types:
- expiring_food: Alert about items expiring soon (priority 1 if <1 day, 2 if 1-3 days)
- meal_suggestion: Time-appropriate meal ideas using available ingredients (priority 2-3)
- restock_alert: Low stock items needing reorder (priority 2-3)
- nutrition_tip: Gaps in recent nutrition based on goals (priority 3)
- recipe_match: Perfect recipe match using expiring ingredients (priority 1-2)

Return ONLY valid JSON array (no markdown):
[
  {
    "type": "expiring_food",
    "priority": 1,
    "title": "Chicken Expires Tomorrow",
    "message": "Use your chicken breast before it spoils",
    "reasoning": "This item expires in less than 24 hours. Using it now prevents waste and saves money.",
    "action": {
      "type": "find_recipe",
      "payload": { "ingredients": ["chicken"] }
    },
    "expiresAt": "2024-01-15T23:59:59Z"
  }
]

Focus on what's MOST important NOW. Be conversational but concise.`;

    console.log('Generating AI digest with Gemini...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: contextPrompt }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    // Extract JSON
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const insights: InsightCard[] = JSON.parse(jsonText);

    console.log(`Generated ${insights.length} insight cards`);

    // Store digest in database
    const { data: digest, error: digestError } = await supabaseAdmin
      .from('daily_digests')
      .upsert({
        user_id: user.id,
        household_id: profile.current_household_id,
        digest_date: new Date().toISOString().split('T')[0],
        insights: insights,
        generated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,digest_date'
      })
      .select()
      .single();

    if (digestError) {
      console.error('Error storing digest:', digestError);
      throw digestError;
    }

    return new Response(
      JSON.stringify({ digest, insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in daily-ai-digest:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});