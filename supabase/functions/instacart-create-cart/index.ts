import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log('📦 Instacart cart creation request received');
    
    const { items } = await req.json();
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('No items provided');
    }

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
