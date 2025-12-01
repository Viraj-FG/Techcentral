import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { recipeSuggestionSchema, validateRequest } from "../_shared/schemas.ts";
import { getSecret, getSupabaseSecrets, validateRequiredSecrets } from "../_shared/secrets.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecipeRequest {
  ingredients?: string[];
  appliances: string[];
  dietary_preferences?: any;
  inventory_match?: boolean;
  user_id?: string;
  health_goal?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate required secrets early
    validateRequiredSecrets(['GOOGLE_GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY']);
    // Authentication
    const authHeader = req.headers.get('Authorization');
    const { url, anonKey } = getSupabaseSecrets();
    const supabaseClient = createClient(
      url,
      anonKey,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(user.id, 'suggest-recipes');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter!);
    }

    const requestBody = await req.json();
    
    const { 
      ingredients, 
      appliances, 
      dietary_preferences, 
      inventory_match, 
      user_id,
      health_goal 
    }: RecipeRequest = requestBody;

    // Validate required fields
    if (!appliances || appliances.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Appliances array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = getSecret('GOOGLE_GEMINI_API_KEY');

    let availableIngredients = ingredients || [];
    let inventoryContext = '';
    let learnedPreferencesContext = '';

    // Fetch learned preferences
    const { data: learnedPrefs } = await supabaseClient
      .from('learned_preferences')
      .select('preference_type, preference_value, confidence')
      .eq('user_id', user.id)
      .gte('confidence', 0.5)
      .order('confidence', { ascending: false })
      .limit(15);

    if (learnedPrefs && learnedPrefs.length > 0) {
      const cuisinePrefs = learnedPrefs.filter(p => p.preference_type === 'cuisine').map(p => `${p.preference_value} (${Math.round(p.confidence * 100)}%)`);
      const ingredientPrefs = learnedPrefs.filter(p => p.preference_type === 'ingredient').slice(0, 8).map(p => p.preference_value);
      const timePrefs = learnedPrefs.filter(p => p.preference_type === 'cooking_time').map(p => p.preference_value);
      
      if (cuisinePrefs.length > 0) {
        learnedPreferencesContext += `\nUser prefers these cuisines: ${cuisinePrefs.join(', ')}`;
      }
      if (ingredientPrefs.length > 0) {
        learnedPreferencesContext += `\nUser frequently uses: ${ingredientPrefs.join(', ')}`;
      }
      if (timePrefs.some(p => p === 'quick')) {
        learnedPreferencesContext += `\nUser often cooks quick meals (under 30 minutes)`;
      }
    }

    // If inventory_match mode, fetch user's actual inventory
    if (inventory_match && user_id) {
      const { url: supabaseUrl, serviceRoleKey } = getSupabaseSecrets();
      if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
      }
      
      const inventoryResponse = await fetch(
        `${supabaseUrl}/rest/v1/inventory?user_id=eq.${user_id}&quantity=gt.0&select=name,quantity,category`,
        {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          }
        }
      );

      if (inventoryResponse.ok) {
        const inventory = await inventoryResponse.json();
        availableIngredients = inventory.map((item: any) => item.name);
        inventoryContext = `\nUser's available inventory: ${availableIngredients.join(', ')}`;
      }
    }

    if (!availableIngredients || availableIngredients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No ingredients available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dietaryInfo = dietary_preferences 
      ? `Dietary preferences: ${JSON.stringify(dietary_preferences)}`
      : 'No specific dietary restrictions';

    const healthInfo = health_goal 
      ? `Health goal: ${health_goal}. Prioritize recipes that support this goal.`
      : '';

    const matchRequirement = inventory_match 
      ? `IMPORTANT: User should have at least 80% of ingredients. Mark any missing ingredients separately.`
      : '';

    const prompt = `You are a helpful recipe assistant. ${inventoryContext}${learnedPreferencesContext}
Available appliances: ${appliances.join(', ')}
${dietaryInfo}
${healthInfo}
${matchRequirement}

Suggest 3 recipes that use PRIMARILY these ingredients: ${availableIngredients.join(', ')}.

For each recipe provide:
- name: Recipe name
- cooking_time: Cooking time in minutes
- difficulty: easy/medium/hard
- required_appliances: Array of appliances needed from the available list
- instructions: Array of 3-5 brief steps
- estimated_calories: Calories per serving
- servings: Number of servings
- explanation: Clear 1-2 sentence explanation of WHY this recipe is recommended (e.g., "92% match because you have chicken, tomatoes. Missing: basil (common pantry item). Supports your weight loss goal with 400 cal, 35g protein.")
${inventory_match ? '- missing_ingredients: Array of ingredients user doesn\'t have\n- match_score: Percentage (0-100) of ingredients user has' : ''}

IMPORTANT: The explanation should be transparent about:
1. What ingredients the user already has
2. What's missing (if any) and why it's acceptable
3. How it aligns with their health goals (if provided)

Return ONLY valid JSON array (no markdown):
[
  {
    "name": "Recipe Name",
    "cooking_time": 30,
    "difficulty": "easy",
    "required_appliances": ["Oven"],
    "instructions": ["Step 1", "Step 2", "Step 3"],
    "estimated_calories": 400,
    "servings": 4,
    "explanation": "Great match explanation here"${inventory_match ? ',\n    "missing_ingredients": ["ingredient1"],\n    "match_score": 85' : ''}
  }
]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
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
    
    console.log('Recipe suggestions:', text);

    // Extract JSON from response
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const recipes = JSON.parse(jsonText);

    return new Response(
      JSON.stringify(recipes),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-recipes:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});