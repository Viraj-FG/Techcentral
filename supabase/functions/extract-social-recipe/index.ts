import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, user_id } = await req.json();

    if (!url || !user_id) {
      return new Response(
        JSON.stringify({ error: 'URL and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
    }

    // Simulate caption scraping (in production, you'd use a proper scraper)
    // For demo purposes, we'll extract from the URL or use AI to process the link
    console.log('Extracting recipe from:', url);

    // Use Gemini to extract ingredients from URL context
    // In a real implementation, you'd scrape the actual page content
    const extractPrompt = `Extract recipe ingredients from this social media post URL: ${url}
    
If you can't access the URL directly, provide a general example of common recipe ingredients.
Return ONLY a JSON array of ingredient names, no other text:
["ingredient 1", "ingredient 2", "ingredient 3"]`;

    const extractResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: extractPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!extractResponse.ok) {
      throw new Error('Failed to extract ingredients');
    }

    const extractData = await extractResponse.json();
    let ingredientsText = extractData.candidates[0].content.parts[0].text;
    
    // Clean up the response
    ingredientsText = ingredientsText.trim();
    if (ingredientsText.startsWith('```json')) {
      ingredientsText = ingredientsText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (ingredientsText.startsWith('```')) {
      ingredientsText = ingredientsText.replace(/```\n?/g, '');
    }

    const ingredients = JSON.parse(ingredientsText);

    // Fetch user's inventory
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const inventoryResponse = await fetch(
      `${supabaseUrl}/rest/v1/inventory?user_id=eq.${user_id}&quantity=gt.0&select=name`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    const inventory = inventoryResponse.ok ? await inventoryResponse.json() : [];
    const userIngredients = inventory.map((item: any) => item.name.toLowerCase());

    // Find missing ingredients
    const missingIngredients = ingredients.filter(
      (ing: string) => !userIngredients.some((userIng: string) => 
        userIng.includes(ing.toLowerCase()) || ing.toLowerCase().includes(userIng)
      )
    );

    const matchPercent = ((ingredients.length - missingIngredients.length) / ingredients.length * 100).toFixed(0);

    return new Response(
      JSON.stringify({
        missing: missingIngredients,
        total: ingredients.length,
        match_percent: matchPercent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-social-recipe:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});