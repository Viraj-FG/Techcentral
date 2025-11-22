import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichRequest {
  name: string;
  brand?: string;
  barcode?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, brand, barcode }: EnrichRequest = await req.json();
    
    console.log('Enrichment request:', { name, brand, barcode });
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Check cache first
    const searchTerm = barcode || `${name}-${brand || ''}`.toLowerCase();
    const { data: cached } = await supabaseClient
      .from('product_cache')
      .select('*')
      .eq('search_term', searchTerm)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached) {
      console.log('Cache hit for:', searchTerm);
      return new Response(
        JSON.stringify({
          ...cached.nutrition_summary,
          image_url: cached.image_url,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get OAuth token from FatSecret
    const clientId = Deno.env.get('FATSECRET_CLIENT_ID');
    const clientSecret = Deno.env.get('FATSECRET_CLIENT_SECRET');

    console.log('FatSecret credentials check:', { 
      hasClientId: !!clientId, 
      hasClientSecret: !!clientSecret 
    });

    if (!clientId || !clientSecret) {
      throw new Error('FatSecret credentials not configured');
    }

    console.log('Requesting FatSecret OAuth token...');
    const tokenResponse = await fetch(
      'https://oauth.fatsecret.com/connect/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
        },
        body: 'grant_type=client_credentials&scope=basic'
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('FatSecret OAuth failed:', tokenResponse.status, errorText);
      throw new Error(`Failed to get FatSecret access token: ${tokenResponse.status}`);
    }

    const { access_token } = await tokenResponse.json();
    console.log('FatSecret OAuth token obtained successfully');

    // Search for product
    let searchQuery = '';
    if (barcode) {
      searchQuery = `method=food.find_id_for_barcode&barcode=${barcode}&format=json`;
      console.log('Searching by barcode:', barcode);
    } else {
      const searchExpression = brand ? `${brand} ${name}` : name;
      searchQuery = `method=foods.search.v3&search_expression=${encodeURIComponent(searchExpression)}&format=json&max_results=5`;
      console.log('Searching FatSecret for:', searchExpression);
    }

    const searchResponse = await fetch(
      `https://platform.fatsecret.com/rest/server.api?${searchQuery}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('FatSecret search failed:', searchResponse.status, errorText);
      throw new Error(`FatSecret search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('FatSecret search response:', JSON.stringify(searchData).substring(0, 500));
    
    // Handle barcode response
    if (barcode && searchData.food_id) {
      const foodId = searchData.food_id.value;
      // Fetch detailed food info
      const detailResponse = await fetch(
        `https://platform.fatsecret.com/rest/server.api?method=food.get.v4&food_id=${foodId}&format=json&include_food_images=true`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        }
      );
      
      if (detailResponse.ok) {
        const detailData = await detailResponse.json();
        const enriched = processFood(detailData.food);
        await cacheResult(supabaseClient, searchTerm, searchData, enriched);
        return new Response(
          JSON.stringify(enriched),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle search results
    if (!searchData.foods?.food || searchData.foods.food.length === 0) {
      console.log('No products found for search term:', name);
      return new Response(
        JSON.stringify({ 
          error: 'No products found',
          searchTerm: name,
          suggestion: 'Try a more generic product name (e.g., "milk" instead of "organic almond milk")'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const foods = Array.isArray(searchData.foods.food) 
      ? searchData.foods.food 
      : [searchData.foods.food];

    // Return top result + alternatives
    const topResult = processFood(foods[0]);
    const alternatives = foods.slice(1, 5).map(processFood);

    await cacheResult(supabaseClient, searchTerm, searchData, topResult);

    return new Response(
      JSON.stringify({
        ...topResult,
        alternatives,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Enrichment error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function processFood(food: any) {
  const serving = Array.isArray(food.servings?.serving) 
    ? food.servings.serving[0] 
    : food.servings?.serving;

  const imageUrl = food.food_images?.food_image?.[0]?.image_url || 
                   food.food_images?.food_image?.image_url || null;

  return {
    fatsecret_id: food.food_id,
    name: food.food_name,
    brand: food.brand_name || null,
    image_url: imageUrl,
    nutrition: {
      calories: parseFloat(serving?.calories || '0'),
      protein: parseFloat(serving?.protein || '0'),
      carbs: parseFloat(serving?.carbohydrate || '0'),
      fat: parseFloat(serving?.fat || '0'),
      saturated_fat: parseFloat(serving?.saturated_fat || '0'),
      sodium: parseFloat(serving?.sodium || '0'),
      sugar: parseFloat(serving?.sugar || '0'),
      fiber: parseFloat(serving?.fiber || '0')
    },
    allergens: extractAllergens(food),
    dietary_flags: extractDietaryFlags(food),
    serving_size: serving?.serving_description || null
  };
}

function extractAllergens(food: any): string[] {
  const allergens: string[] = [];
  const description = food.food_description?.toLowerCase() || '';
  
  const allergenMap: Record<string, string[]> = {
    dairy: ['milk', 'dairy', 'cheese', 'butter', 'cream', 'whey', 'lactose'],
    eggs: ['egg', 'eggs'],
    soy: ['soy', 'soya'],
    wheat: ['wheat', 'gluten'],
    nuts: ['almond', 'cashew', 'walnut', 'pecan', 'pistachio'],
    peanuts: ['peanut'],
    fish: ['fish', 'salmon', 'tuna'],
    shellfish: ['shrimp', 'crab', 'lobster']
  };

  for (const [allergen, keywords] of Object.entries(allergenMap)) {
    if (keywords.some(kw => description.includes(kw))) {
      allergens.push(allergen);
    }
  }

  return allergens;
}

function extractDietaryFlags(food: any): string[] {
  const flags: string[] = [];
  const description = food.food_description?.toLowerCase() || '';
  
  if (description.includes('organic')) flags.push('organic');
  if (description.includes('vegan') || description.includes('plant-based')) flags.push('vegan');
  if (description.includes('gluten-free') || description.includes('gluten free')) flags.push('gluten_free');
  if (description.includes('kosher')) flags.push('kosher');
  if (description.includes('halal')) flags.push('halal');
  if (description.includes('low sodium') || description.includes('low-sodium')) flags.push('low_sodium');
  
  return flags;
}

async function cacheResult(
  supabase: any, 
  searchTerm: string, 
  fullResponse: any, 
  summary: any
) {
  await supabase.from('product_cache').insert({
    search_term: searchTerm,
    fatsecret_response: fullResponse,
    image_url: summary.image_url,
    nutrition_summary: summary
  });
}
