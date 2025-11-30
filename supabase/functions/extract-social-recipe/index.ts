import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { validateRequest, socialRecipeEnhancedSchema } from "../_shared/schemas.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { getSecret, getSupabaseSecrets, validateRequiredSecrets, SECRET_GROUPS } from "../_shared/secrets.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cost estimation heuristics by category
const CATEGORY_PRICES: Record<string, [number, number]> = {
  'produce': [2, 5],
  'protein': [6, 12],
  'dairy': [3, 6],
  'pantry': [1, 4],
  'spice': [0.5, 2],
  'default': [2, 5]
};

function estimateCost(category?: string): number {
  const range = CATEGORY_PRICES[category || 'default'] || CATEGORY_PRICES['default'];
  return (range[0] + range[1]) / 2;
}

// Fuzzy matching algorithm
function fuzzyMatch(ingredient: string, inventoryItem: string): number {
  const ing = ingredient.toLowerCase().trim();
  const inv = inventoryItem.toLowerCase().trim();
  
  // Exact match
  if (ing === inv) return 100;
  
  // Contains match
  if (ing.includes(inv) || inv.includes(ing)) return 80;
  
  // Word-based matching
  const ingWords = ing.split(/\s+/);
  const invWords = inv.split(/\s+/);
  
  const matches = ingWords.filter(word => 
    invWords.some(invWord => word === invWord || word.includes(invWord) || invWord.includes(word))
  );
  
  if (matches.length > 0) {
    return 60 * (matches.length / Math.max(ingWords.length, invWords.length));
  }
  
  return 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate required secrets early
    validateRequiredSecrets([...SECRET_GROUPS.vision, ...SECRET_GROUPS.supabase]);
    // Validate request
    const body = await req.json();
    const validation = validateRequest(socialRecipeEnhancedSchema, body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url, image, user_id } = validation.data;

    // Rate limiting
    const rateLimit = await checkRateLimit(user_id, 'extract-social-recipe');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter!);
    }

    const apiKey = getSecret('GOOGLE_GEMINI_API_KEY');

    console.log('Processing recipe extraction:', url ? 'URL mode' : 'Image mode');

    let extractPrompt = '';
    let geminiPayload: any = {};

    if (url) {
      // URL Processing Mode
      console.log('Extracting recipe from URL:', url);
      
      // Try to fetch URL metadata (basic check)
      try {
        const urlResponse = await fetch(url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)' }
        });
        
        if (urlResponse.status === 403 || urlResponse.status === 401) {
          return new Response(
            JSON.stringify({ 
              error: 'Content protected. Please upload a screenshot instead.',
              code: 'LINK_PROTECTED' 
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (urlError) {
        console.log('URL fetch warning:', urlError);
        // Continue anyway - Gemini might still extract info from URL text
      }

      extractPrompt = `Analyze this social media recipe post URL and extract the recipe details: ${url}

Extract the following in valid JSON format ONLY (no markdown, no extra text):
{
  "title": "Recipe name",
  "ingredients": [
    {
      "item": "normalized ingredient name",
      "quantity": "amount with unit (e.g., 2 cups, 1 tsp)",
      "category": "produce|protein|dairy|pantry|spice"
    }
  ],
  "instructions": ["step 1", "step 2"],
  "servings": 2,
  "prep_time": 10,
  "cook_time": 15
}

Important rules:
- Normalize ingredient names (e.g., "soy sauce" not "Kikkoman Soy Sauce")
- Include quantities with units
- Separate spices from main ingredients
- Use "to taste" if quantity is unclear
- Return ONLY valid JSON`;

      geminiPayload = {
        contents: [{
          parts: [{ text: extractPrompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        }
      };
      // Image Processing Mode
      console.log('Analyzing recipe screenshot');
      
      if (!image) {
        throw new Error('Image is required for screenshot mode');
      }
      
      // Extract base64 data
      const base64Data = image.split(',')[1] || image;
      
      extractPrompt = `Analyze this social media recipe screenshot and extract all recipe details.

Extract the following in valid JSON format ONLY (no markdown, no extra text):
{
  "title": "Recipe name from the post",
  "ingredients": [
    {
      "item": "normalized ingredient name",
      "quantity": "amount with unit (e.g., 2 cups, 1 tsp, to taste)",
      "category": "produce|protein|dairy|pantry|spice"
    }
  ],
  "instructions": ["step 1", "step 2", "..."],
  "servings": 2,
  "prep_time": 10,
  "cook_time": 15
}

Important rules:
- Extract ALL visible ingredients from the caption or overlay text
- Normalize names (e.g., "chicken breast" not "Foster Farms Chicken")
- Include exact quantities shown
- Categorize each ingredient accurately
- Extract cooking steps if visible
- Use "to taste" if quantity not specified
- Return ONLY valid JSON, no markdown formatting`;

      geminiPayload = {
        contents: [{
          parts: [
            { text: extractPrompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        }
      };
    }

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload)
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error('Failed to extract recipe from content');
    }

    const geminiData = await geminiResponse.json();
    let recipeText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!recipeText) {
      throw new Error('No recipe data extracted');
    }

    // Clean up response (remove markdown formatting)
    recipeText = recipeText.trim();
    if (recipeText.startsWith('```json')) {
      recipeText = recipeText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (recipeText.startsWith('```')) {
      recipeText = recipeText.replace(/```\n?/g, '');
    }

    const recipeData = JSON.parse(recipeText);

    // Fetch user's inventory using Supabase client
    const { url: supabaseUrl, serviceRoleKey } = getSupabaseSecrets();
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select('id, name, category')
      .eq('user_id', user_id)
      .gt('quantity', 0);

    if (invError) {
      console.error('Inventory fetch error:', invError);
    }

    const userInventory = inventory || [];
    console.log('User has', userInventory.length, 'items in inventory');

    // Enhanced fuzzy matching
    const inPantry: any[] = [];
    const missing: any[] = [];

    for (const ingredient of recipeData.ingredients) {
      let bestMatch = 0;
      let matchedItem: any = null;

      for (const item of userInventory) {
        const score = fuzzyMatch(ingredient.item, item.name);
        if (score > bestMatch) {
          bestMatch = score;
          matchedItem = item;
        }
      }

      // Require at least 60% confidence for a match
      if (bestMatch >= 60) {
        inPantry.push({
          ...ingredient,
          in_pantry: true,
          inventory_id: matchedItem.id
        });
      } else {
        missing.push({
          ...ingredient,
          in_pantry: false,
          estimated_cost: estimateCost(ingredient.category)
        });
      }
    }

    const totalIngredients = recipeData.ingredients.length;
    const matchPercent = totalIngredients > 0 
      ? Math.round((inPantry.length / totalIngredients) * 100)
      : 0;

    const estimatedTotalCost = missing.reduce((sum, ing) => sum + (ing.estimated_cost || 0), 0);

    // Build structured response
    const response = {
      recipe: {
        title: recipeData.title || 'Untitled Recipe',
        servings: recipeData.servings || 2,
        prep_time: recipeData.prep_time || 0,
        cook_time: recipeData.cook_time || 0,
        instructions: recipeData.instructions || []
      },
      ingredients: {
        in_pantry: inPantry,
        missing: missing
      },
      match_percent: matchPercent,
      total_ingredients: totalIngredients,
      estimated_total_cost: estimatedTotalCost
    };

    console.log('Recipe extraction complete:', {
      title: response.recipe.title,
      total: totalIngredients,
      in_pantry: inPantry.length,
      missing: missing.length,
      match: matchPercent
    });

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-social-recipe:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
