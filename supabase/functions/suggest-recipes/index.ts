import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecipeRequest {
  ingredients: string[];
  appliances: string[];
  dietary_preferences?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingredients, appliances, dietary_preferences }: RecipeRequest = await req.json();

    if (!ingredients || ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Ingredients are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
    }

    const dietaryInfo = dietary_preferences 
      ? `Dietary preferences: ${JSON.stringify(dietary_preferences)}`
      : 'No specific dietary restrictions';

    const prompt = `You are a helpful recipe assistant. Given these ingredients: ${ingredients.join(', ')}, 
and these available appliances: ${appliances.join(', ')}, 
suggest 3 recipes. ${dietaryInfo}.

For each recipe provide:
- name: Recipe name
- cooking_time: Cooking time in minutes
- difficulty: easy/medium/hard
- required_appliances: Array of appliances needed from the available list
- instructions: Array of 3-5 brief steps
- estimated_calories: Calories per serving
- servings: Number of servings

Return ONLY valid JSON array (no markdown):
[
  {
    "name": "Recipe Name",
    "cooking_time": 30,
    "difficulty": "easy",
    "required_appliances": ["Oven"],
    "instructions": ["Step 1", "Step 2", "Step 3"],
    "estimated_calories": 400,
    "servings": 4
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