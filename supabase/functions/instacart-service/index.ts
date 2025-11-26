import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateRequest, instacartServiceSchema } from "../_shared/schemas.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INSTACART_API_KEY = Deno.env.get('INSTACART_API_KEY');
const INSTACART_ENV_SECRET = Deno.env.get('INSTACART_ENVIRONMENT');

// Determine environment: prioritize explicit secret, fallback to API key detection
let environment: string;
let detectionMethod: string;

if (INSTACART_ENV_SECRET) {
  environment = INSTACART_ENV_SECRET.toLowerCase();
  detectionMethod = 'explicit secret';
} else {
  const isTestKey = INSTACART_API_KEY?.startsWith('test_');
  environment = isTestKey ? 'development' : 'production';
  detectionMethod = 'API key prefix detection';
}

const INSTACART_BASE_URL = environment === 'development'
  ? 'https://connect.dev.instacart.tools/idp/v1'
  : 'https://connect.instacart.com/idp/v1';

console.log(`🔧 Environment detection method: ${detectionMethod}`);
console.log(`🔧 Using Instacart environment: ${environment.toUpperCase()}`);
console.log(`🔧 Base URL: ${INSTACART_BASE_URL}`);

interface CartItem {
  name: string;
  brand?: string;
  quantity: number;
  unit: string;
}

interface RecipePayload {
  name: string;
  ingredients: Array<{ name: string; quantity?: string; unit?: string }>;
  servings?: number;
  image_url?: string;
  description?: string;
}

interface SwapPayload {
  productName: string;
  brand?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request
    const body = await req.json();
    const validation = validateRequest(instacartServiceSchema, body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, userId, items, recipeData, swapData, zipCode, retailerId } = validation.data;
    
    console.log('🚀 Instacart service request:', action);

    // For get_nearby_retailers, we don't need user profile
    if (action === 'get_nearby_retailers') {
      if (!zipCode) {
        return new Response(
          JSON.stringify({ error: 'zipCode is required for get_nearby_retailers' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const result = await getNearbyRetailers(zipCode);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For all other actions, userId is required
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required for this action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For all other actions, fetch user profile
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Fetch user profile for dietary filters
    const { data: profile } = await supabase
      .from('profiles')
      .select('dietary_preferences, allergies, preferred_retailer_id, lifestyle_goals, id')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Build dietary filters from user preferences
    const filters = buildDietaryFilters(profile.dietary_preferences, profile.allergies);
    const cachedRetailerId = retailerId || profile.preferred_retailer_id;
    
    console.log('🔧 Dietary filters:', filters);
    console.log('🏪 Using retailer ID:', cachedRetailerId);

    let result;
    switch (action) {
      case 'create_cart':
        if (!items) {
          throw new Error('items required for create_cart');
        }
        result = await createSmartCart(items, filters, cachedRetailerId);
        break;
      case 'create_recipe':
        if (!recipeData) {
          throw new Error('recipeData required for create_recipe');
        }
        result = await createRecipePage(recipeData, filters, cachedRetailerId, profile, supabase);
        break;
      case 'swap_product':
        if (!swapData) {
          throw new Error('swapData required for swap_product');
        }
        result = await swapProduct(swapData, filters, cachedRetailerId);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🔴 Instacart service error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper: Build dietary filters from user preferences
function buildDietaryFilters(dietary_prefs: any, allergies: any): string[] {
  const filters: string[] = [];
  
  if (!dietary_prefs) return filters;

  // Map user preferences to Instacart filters
  const prefArray = Array.isArray(dietary_prefs) ? dietary_prefs : [];
  
  if (prefArray.includes('vegan')) filters.push('VEGAN');
  if (prefArray.includes('vegetarian')) filters.push('VEGETARIAN');
  if (prefArray.includes('gluten-free')) filters.push('GLUTEN_FREE');
  if (prefArray.includes('organic')) filters.push('ORGANIC');
  if (prefArray.includes('halal')) filters.push('HALAL');
  if (prefArray.includes('kosher')) filters.push('KOSHER');
  
  return filters;
}

// Action 1: Create Smart Cart (for replenishment)
async function createSmartCart(items: CartItem[], filters: string[], retailerId?: string) {
  console.log('🛒 Creating smart cart with', items.length, 'items');

  const lineItems = items.map(item => ({
    name: item.name,
    line_item_measurements: [{ quantity: item.quantity.toString(), unit: item.unit }]
  }));
  
  const brandFilters = items
    .map(item => item.brand)
    .filter(brand => brand);
  
  const requestBody: any = { line_items: lineItems };
  if (filters.length > 0) requestBody.filters = filters;
  if (brandFilters.length > 0) requestBody.brand_filters = brandFilters;
  if (retailerId) requestBody.retailer_id = retailerId;
  
  console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${INSTACART_BASE_URL}/products/products_link`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${INSTACART_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Instacart API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log('✅ Cart created:', data.products_link);
  
  return { productsLink: data.products_link };
}

// Action 2: Create Recipe Page (with pantry logic)
async function createRecipePage(
  recipeData: RecipePayload,
  filters: string[],
  retailerId: string | undefined,
  profile: any,
  supabase: any
) {
  console.log('🍳 Creating recipe page:', recipeData.name);

  // Fetch user's inventory to determine pantry items
  const { data: inventory } = await supabase
    .from('inventory')
    .select('name')
    .eq('user_id', profile.id)
    .gte('fill_level', 50);
  
  const pantryItemNames = inventory?.map((item: any) => item.name.toLowerCase()) || [];
  console.log('🏺 Pantry items:', pantryItemNames);
  
  // Separate pantry items from shopping list
  const lineItems = [];
  const pantryItems = [];
  
  for (const ingredient of recipeData.ingredients) {
    const item = {
      name: ingredient.name,
      line_item_measurements: [{ 
        quantity: ingredient.quantity || '1', 
        unit: ingredient.unit || 'item' 
      }]
    };
    
    if (pantryItemNames.includes(ingredient.name.toLowerCase())) {
      pantryItems.push({ name: ingredient.name });
    } else {
      lineItems.push(item);
    }
  }
  
  const requestBody: any = {
    name: recipeData.name,
    servings: recipeData.servings || 4,
    line_items: lineItems,
    enable_pantry_items: true
  };
  
  if (pantryItems.length > 0) requestBody.pantry_items = pantryItems;
  if (filters.length > 0) requestBody.filters = filters;
  if (retailerId) requestBody.retailer_id = retailerId;
  if (recipeData.image_url) requestBody.image_url = recipeData.image_url;
  if (recipeData.description) requestBody.description = recipeData.description;
  
  console.log('📤 Recipe request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${INSTACART_BASE_URL}/products/recipe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${INSTACART_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Instacart Recipe API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log('✅ Recipe page created:', data.recipe_link);
  
  return { 
    recipeLink: data.recipe_link,
    recipeUuid: data.recipe_uuid
  };
}

// Action 3: Swap Product (single-item alternative)
async function swapProduct(swapData: SwapPayload, filters: string[], retailerId?: string) {
  console.log('🔄 Creating swap link for:', swapData.productName);

  const requestBody: any = {
    line_items: [{
      name: swapData.productName,
      line_item_measurements: [{ quantity: '1', unit: 'item' }]
    }]
  };
  
  if (swapData.brand) requestBody.brand_filters = [swapData.brand];
  if (filters.length > 0) requestBody.filters = filters;
  if (retailerId) requestBody.retailer_id = retailerId;
  
  const response = await fetch(`${INSTACART_BASE_URL}/products/products_link`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${INSTACART_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Instacart API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log('✅ Swap link created:', data.products_link);
  
  return { productsLink: data.products_link };
}

// Action 4: Get Nearby Retailers
async function getNearbyRetailers(zipCode: string) {
  console.log('📍 Fetching retailers for zip:', zipCode);
  console.log('🔑 API Key present:', !!INSTACART_API_KEY);
  console.log('🔑 API Key prefix:', INSTACART_API_KEY?.substring(0, 10) + '...');

  // Determine country code - default to US, but could be enhanced with validation
  const countryCode = 'US';
  
  const url = `${INSTACART_BASE_URL}/retailers?postal_code=${zipCode}&country_code=${countryCode}`;
  console.log('📤 Request URL:', url);

  const response = await fetch(url, {
    headers: { 
      'Authorization': `Bearer ${INSTACART_API_KEY}`,
      'Accept': 'application/json'
    }
  });
  
  console.log('📥 Response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Instacart API error response:', errorText);
    throw new Error(`Instacart Retailers API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log('✅ Found', data.retailers?.length || 0, 'retailers');
  
  // Enhanced logging to see actual API response structure
  if (data.retailers && data.retailers.length > 0) {
    console.log('📊 Sample retailer data:', JSON.stringify(data.retailers[0], null, 2));
  }
  
  return { retailers: data.retailers || [] };
}
