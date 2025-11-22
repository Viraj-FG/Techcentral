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
  category?: 'fridge' | 'pantry' | 'beauty' | 'pets';
}

// OAuth 1.0 Helper Functions
async function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string = ''
): Promise<string> {
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  // Create signature base string
  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');

  // Create signing key
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

  // Generate HMAC-SHA1 signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(signingKey);
  const messageData = encoder.encode(signatureBaseString);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  
  // Convert to base64
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

async function buildOAuth1Request(
  method: string,
  baseUrl: string,
  queryParams: Record<string, string>,
  consumerKey: string,
  consumerSecret: string
): Promise<string> {
  // Generate OAuth parameters
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: generateTimestamp(),
    oauth_nonce: generateNonce(),
    oauth_version: '1.0',
    ...queryParams
  };

  // Generate signature
  const signature = await generateOAuthSignature(
    method,
    baseUrl,
    oauthParams,
    consumerSecret
  );

  oauthParams.oauth_signature = signature;

  // Build query string
  const queryString = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
    .join('&');

  return `${baseUrl}?${queryString}`;
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

    // Get OAuth credentials from FatSecret
    const clientId = Deno.env.get('FATSECRET_CLIENT_ID');
    const clientSecret = Deno.env.get('FATSECRET_CLIENT_SECRET');

    console.log('FatSecret credentials check:', { 
      hasClientId: !!clientId, 
      hasClientSecret: !!clientSecret 
    });

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

    if (!clientId || !clientSecret) {
      throw new Error('FatSecret credentials not configured');
    }

    console.log('=== OAUTH 1.0 AUTHENTICATION ===');
    console.log('Using OAuth 1.0 with Consumer Key:', clientId?.substring(0, 8) + '...');
    console.log('Signature method: HMAC-SHA1');

    // Search for product using OAuth 1.0
    let searchParams: Record<string, string> = { format: 'json' };

    if (barcode) {
      searchParams.method = 'food.find_id_for_barcode';
      searchParams.barcode = barcode;
      console.log('Searching by barcode:', barcode);
    } else {
      const searchExpression = brand ? `${brand} ${name}` : name;
      searchParams.method = 'foods.search.v3';
      searchParams.search_expression = searchExpression;
      searchParams.max_results = '5';
      console.log('Searching FatSecret for:', searchExpression);
    }

    // Build OAuth 1.0 signed URL
    const signedUrl = await buildOAuth1Request(
      'GET',
      'https://platform.fatsecret.com/rest/server.api',
      searchParams,
      clientId,
      clientSecret
    );

    console.log('OAuth 1.0 signed request URL:', signedUrl.substring(0, 120) + '...');
    console.log('Making OAuth 1.0 authenticated request...');

    const searchResponse = await fetch(signedUrl, { method: 'GET' });

    console.log('=== FATSECRET RESPONSE ===');
    console.log('Status:', searchResponse.status);
    console.log('Status Text:', searchResponse.statusText);

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
      console.log('Barcode matched food ID:', foodId);
      
      // Fetch detailed food info using OAuth 1.0
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

    console.log('✅ FatSecret returned', foods.length, 'products');

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

async function searchMakeupAPI(name: string, brand?: string) {
  try {
    let url = 'http://makeup-api.herokuapp.com/api/v1/products.json?';
    
    if (brand) {
      url += `brand=${encodeURIComponent(brand.toLowerCase())}&`;
    }
    
    const productType = inferProductType(name);
    if (productType) {
      url += `product_type=${productType}`;
    }
    
    console.log('Searching Makeup API:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Makeup API search failed:', response.status);
      return null;
    }
    
    const products = await response.json();
    console.log('Makeup API found products:', products.length);
    
    if (!products || products.length === 0) {
      return null;
    }
    
    return findBestMatch(products, name, brand);
  } catch (error) {
    console.error('Makeup API error:', error);
    return null;
  }
}

function inferProductType(name: string): string | null {
  const types: Record<string, string[]> = {
    'lipstick': ['lipstick', 'lip color', 'lip'],
    'eyeliner': ['eyeliner', 'eye liner'],
    'foundation': ['foundation', 'base'],
    'mascara': ['mascara'],
    'eyeshadow': ['eyeshadow', 'eye shadow'],
    'blush': ['blush'],
    'bronzer': ['bronzer'],
    'nail_polish': ['nail polish', 'nail color']
  };
  
  const nameLower = name.toLowerCase();
  for (const [type, keywords] of Object.entries(types)) {
    if (keywords.some(kw => nameLower.includes(kw))) return type;
  }
  return null;
}

function findBestMatch(products: any[], name: string, brand?: string) {
  const nameLower = name.toLowerCase();
  return products
    .filter(p => !brand || p.brand?.toLowerCase() === brand.toLowerCase())
    .sort((a, b) => {
      const aScore = similarity(a.name.toLowerCase(), nameLower);
      const bScore = similarity(b.name.toLowerCase(), nameLower);
      return bScore - aScore;
    })[0];
}

function similarity(str1: string, str2: string): number {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  const overlap = words1.filter(w => words2.includes(w)).length;
  return overlap / Math.max(words1.length, words2.length);
}

function processMakeupProduct(product: any) {
  return {
    fatsecret_id: null,
    name: product.name,
    brand: product.brand || null,
    image_url: product.image_link || null,
    product_type: product.product_type,
    price: product.price ? `$${product.price}` : null,
    category: product.category || null,
    tags: product.tag_list || [],
    nutrition: null,
    allergens: [],
    dietary_flags: product.tag_list || [],
    description: product.description || null,
    source: 'makeup-api'
  };
}

async function searchOpenPetFoodFacts(name: string, brand?: string) {
  try {
    const searchTerm = brand ? `${brand} ${name}` : name;
    console.log('Searching Open Pet Food Facts for:', searchTerm);
    
    const response = await fetch(
      `https://world.openpetfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&json=1&page_size=5`,
      {
        headers: {
          'User-Agent': 'Kaeva-App/1.0'
        }
      }
    );
    
    if (!response.ok) {
      console.error('Open Pet Food Facts search failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.products || data.products.length === 0) {
      console.log('No products found in Open Pet Food Facts');
      return null;
    }
    
    return data.products[0];
  } catch (error) {
    console.error('Open Pet Food Facts error:', error);
    return null;
  }
}

function processOpenPetFoodFactsProduct(product: any) {
  const nutriments = product.nutriments || {};
  
  return {
    fatsecret_id: null,
    name: product.product_name || 'Unknown Pet Product',
    brand: product.brands?.split(',')[0]?.trim() || null,
    image_url: product.image_url || product.image_front_url || null,
    nutrition: {
      calories: parseFloat(nutriments['energy-kcal'] || '0'),
      protein: parseFloat(nutriments.proteins || '0'),
      carbs: parseFloat(nutriments.carbohydrates || '0'),
      fat: parseFloat(nutriments.fat || '0'),
      fiber: parseFloat(nutriments.fiber || '0')
    },
    allergens: [],
    dietary_flags: product.labels_tags || [],
    serving_size: product.serving_size || '100g',
    source: 'openpetfoodfacts'
  };
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
