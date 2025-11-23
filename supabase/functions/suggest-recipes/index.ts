import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { 
      ingredients, 
      appliances, 
      dietary_preferences, 
      inventory_match, 
      user_id,
      health_goal 
    }: RecipeRequest = await req.json();

    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
    }

    let availableIngredients = ingredients || [];
    let inventoryContext = '';

    // If inventory_match mode, fetch user's actual inventory
    if (inventory_match && user_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const inventoryResponse = await fetch(
        `${supabaseUrl}/rest/v1/inventory?user_id=eq.${user_id}&quantity=gt.0&select=name,quantity,category`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
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

    const prompt = `You are a helpful recipe assistant. ${inventoryContext}
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
${inventory_match ? '- missing_ingredients: Array of ingredients user doesn\'t have\n- match_score: Percentage (0-100) of ingredients user has' : ''}

Return ONLY valid JSON array (no markdown):
[
  {
    "name": "Recipe Name",
    "cooking_time": 30,
    "difficulty": "easy",
    "required_appliances": ["Oven"],
    "instructions": ["Step 1", "Step 2", "Step 3"],
    "estimated_calories": 400,
    "servings": 4${inventory_match ? ',\n    "missing_ingredients": ["ingredient1"],\n    "match_score": 85' : ''}
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