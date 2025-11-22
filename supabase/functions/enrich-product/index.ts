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
      console.log('No products found in FatSecret, trying Open Food Facts...');
      
      // Fallback to Open Food Facts
      const offProduct = await searchOpenFoodFacts(name, brand);
      
      if (offProduct) {
        const enriched = processOpenFoodFactsProduct(offProduct);
        await cacheResult(supabaseClient, searchTerm, { source: 'openfoodfacts', data: offProduct }, enriched);
        return new Response(
          JSON.stringify(enriched),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('No products found in either FatSecret or Open Food Facts');
      return new Response(
        JSON.stringify({ 
          error: 'No products found',
          searchTerm: name,
          suggestion: 'Try a more generic product name or use camera to scan the product'
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

async function searchOpenFoodFacts(name: string, brand?: string) {
  try {
    const searchTerm = brand ? `${brand} ${name}` : name;
    console.log('Searching Open Food Facts for:', searchTerm);
    
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&json=1&page_size=10`,
      {
        headers: {
          'User-Agent': 'Kaeva-App/1.0'
        }
      }
    );
    
    if (!response.ok) {
      console.error('Open Food Facts search failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('Open Food Facts response:', JSON.stringify(data).substring(0, 500));
    
    if (!data.products || data.products.length === 0) {
      console.log('No products found in Open Food Facts');
      return null;
    }
    
    console.log('Found products in Open Food Facts:', data.products.length);
    // Return first product with complete data
    const validProduct = data.products.find((p: any) => 
      p.product_name && (p.nutriments?.energy || p.nutriments?.['energy-kcal'])
    );
    return validProduct || data.products[0];
  } catch (error) {
    console.error('Open Food Facts error:', error);
    return null;
  }
}

function processOpenFoodFactsProduct(product: any) {
  const nutriments = product.nutriments || {};
  
  // Convert energy from kJ to kcal if needed (1 kcal = 4.184 kJ)
  let calories = parseFloat(nutriments['energy-kcal'] || nutriments.energy_value || '0');
  if (calories === 0 && nutriments.energy) {
    calories = parseFloat(nutriments.energy) / 4.184;
  }
  
  return {
    fatsecret_id: null,
    name: product.product_name || product.product_name_en || 'Unknown Product',
    brand: product.brands?.split(',')[0]?.trim() || null,
    image_url: product.image_url || product.image_front_url || product.image_small_url || null,
    nutrition: {
      calories: Math.round(calories),
      protein: parseFloat(nutriments.proteins || nutriments.proteins_100g || '0'),
      carbs: parseFloat(nutriments.carbohydrates || nutriments.carbohydrates_100g || '0'),
      fat: parseFloat(nutriments.fat || nutriments.fat_100g || '0'),
      saturated_fat: parseFloat(nutriments['saturated-fat'] || nutriments['saturated-fat_100g'] || '0'),
      sodium: parseFloat(nutriments.sodium || nutriments.sodium_100g || '0') * 1000, // Convert to mg
      sugar: parseFloat(nutriments.sugars || nutriments.sugars_100g || '0'),
      fiber: parseFloat(nutriments.fiber || nutriments.fiber_100g || '0')
    },
    allergens: extractAllergensFromOFF(product),
    dietary_flags: extractDietaryFlagsFromOFF(product),
    serving_size: product.serving_size || product.serving_quantity || '100g',
    source: 'openfoodfacts'
  };
}

function extractAllergensFromOFF(product: any): string[] {
  const allergens: string[] = [];
  const allergenTags = product.allergens_tags || [];
  const ingredients = (product.ingredients_text || '').toLowerCase();
  
  const allergenMap: Record<string, string[]> = {
    dairy: ['en:milk', 'en:dairy'],
    eggs: ['en:eggs'],
    soy: ['en:soybeans'],
    wheat: ['en:gluten'],
    nuts: ['en:nuts'],
    peanuts: ['en:peanuts'],
    fish: ['en:fish'],
    shellfish: ['en:crustaceans', 'en:molluscs']
  };
  
  for (const [allergen, tags] of Object.entries(allergenMap)) {
    if (tags.some(tag => allergenTags.includes(tag)) || 
        tags.some(tag => ingredients.includes(tag.replace('en:', '')))) {
      allergens.push(allergen);
    }
  }
  
  return allergens;
}

function extractDietaryFlagsFromOFF(product: any): string[] {
  const flags: string[] = [];
  const labels = product.labels_tags || [];
  
  if (labels.includes('en:organic')) flags.push('organic');
  if (labels.includes('en:vegan')) flags.push('vegan');
  if (labels.includes('en:gluten-free')) flags.push('gluten_free');
  if (labels.includes('en:kosher')) flags.push('kosher');
  if (labels.includes('en:halal')) flags.push('halal');
  
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
