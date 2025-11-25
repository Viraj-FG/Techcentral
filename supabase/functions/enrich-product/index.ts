import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { buildOAuth1Request } from "../_shared/oauth1.ts";
import { processFood, processOpenFoodFactsProduct, processMakeupProduct, processOpenPetFoodFactsProduct } from "../_shared/productProcessors.ts";
import { searchOpenFoodFacts, searchMakeupAPI, searchOpenPetFoodFacts } from "../_shared/apiClients.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichRequest {
  name: string;
  brand?: string;
  barcode?: string;
  category?: 'fridge' | 'pantry' | 'beauty' | 'pets';
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, brand, barcode, category }: EnrichRequest = await req.json();
    
    console.log('Enrichment request:', { name, brand, barcode, category });
    
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

    // Route to Makeup API for beauty products
    if (category === 'beauty') {
      console.log('Routing to Makeup API for beauty product');
      const makeupProduct = await searchMakeupAPI(name, brand);
      
      if (makeupProduct) {
        const enriched = processMakeupProduct(makeupProduct);
        await cacheResult(supabaseClient, searchTerm, { source: 'makeup-api', data: makeupProduct }, enriched);
        return new Response(
          JSON.stringify(enriched),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Route to Open Pet Food Facts for pet products
    if (category === 'pets') {
      console.log('Routing to Open Pet Food Facts');
      const petProduct = await searchOpenPetFoodFacts(name, brand);
      
      if (petProduct) {
        const enriched = processOpenPetFoodFactsProduct(petProduct);
        await cacheResult(supabaseClient, searchTerm, { source: 'openpetfoodfacts', data: petProduct }, enriched);
        return new Response(
          JSON.stringify(enriched),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // FatSecret OAuth 1.0 authentication
    const clientId = Deno.env.get('FATSECRET_CLIENT_ID');
    const clientSecret = Deno.env.get('FATSECRET_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('FatSecret credentials not configured');
    }

    console.log('=== OAUTH 1.0 AUTHENTICATION ===');
    console.log('Using OAuth 1.0 with Consumer Key:', clientId?.substring(0, 8) + '...');

    // Search for product using OAuth 1.0
    let searchParams: Record<string, string> = { format: 'json' };

    if (barcode) {
      searchParams.method = 'food.find_id_for_barcode';
      searchParams.barcode = barcode;
      console.log('Searching by barcode:', barcode);
    } else {
      const searchExpression = brand ? `${brand} ${name}` : name;
      searchParams.method = 'foods.search';
      searchParams.search_expression = searchExpression;
      searchParams.max_results = '5';
      console.log('Searching FatSecret for:', searchExpression);
    }

    const signedUrl = await buildOAuth1Request(
      'GET',
      'https://platform.fatsecret.com/rest/server.api',
      searchParams,
      clientId,
      clientSecret
    );

    console.log('Making OAuth 1.0 authenticated request...');
    const searchResponse = await fetch(signedUrl, { method: 'GET' });

    console.log('=== FATSECRET RESPONSE ===');
    console.log('Status:', searchResponse.status);

    const responseText = await searchResponse.text();
    console.log('FatSecret search response:', responseText);

    let searchData;
    try {
      searchData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse FatSecret response:', e);
      throw new Error('Invalid response from FatSecret');
    }

    if (searchData.error) {
      console.error('FatSecret API error:', searchData.error);
      console.log('No products found in FatSecret, trying Open Food Facts...');
      
      const offProduct = await searchOpenFoodFacts(name, brand);
      
      if (offProduct) {
        const enriched = processOpenFoodFactsProduct(offProduct);
        await cacheResult(supabaseClient, searchTerm, { source: 'openfoodfacts', data: offProduct }, enriched);
        return new Response(
          JSON.stringify(enriched),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Handle barcode response
    if (barcode && searchData.food_id) {
      const foodId = searchData.food_id.value;
      console.log('Barcode matched food ID:', foodId);
      
      const detailParams: Record<string, string> = {
        method: 'food.get.v4',
        food_id: foodId,
        format: 'json',
        include_food_images: 'true'
      };

      const detailSignedUrl = await buildOAuth1Request(
        'GET',
        'https://platform.fatsecret.com/rest/server.api',
        detailParams,
        clientId,
        clientSecret
      );

      const detailResponse = await fetch(detailSignedUrl, { method: 'GET' });
      
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

    console.log('✅ FatSecret returned', foods.length, 'products');

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
