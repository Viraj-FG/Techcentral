import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { instacartCartSchema, validateRequest } from "../_shared/schemas.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🔒 Security: Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Authenticated user:', user.id);
    
    // Rate limiting
    const rateLimit = await checkRateLimit(user.id, 'instacart-create-cart');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter!);
    }
    
    console.log('📦 Instacart cart creation request received');
    
    const requestBody = await req.json();
    
    // Validate request
    const validation = validateRequest(instacartCartSchema, requestBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { items } = validation.data;

    console.log('🛒 Items to add:', items);

    // Transform items to Instacart format
    const lineItems = items.map((item: any) => ({
      name: item.name,
      line_item_measurements: [
        { quantity: item.quantity.toString(), unit: item.unit }
      ]
    }));

    console.log('📝 Transformed line items:', lineItems);

    const INSTACART_API_KEY = Deno.env.get('INSTACART_API_KEY');
    if (!INSTACART_API_KEY) {
      throw new Error('INSTACART_API_KEY is not configured');
    }

    // Call Instacart Developer Platform API
    const response = await fetch(
      'https://api.instacart.com/idp/v1/products/products_link',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${INSTACART_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ line_items: lineItems })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Instacart API error:', response.status, errorText);
      throw new Error(`Instacart API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Instacart cart created:', data);

    return new Response(
      JSON.stringify({ productsLink: data.products_link }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('🔴 Error creating Instacart cart:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
