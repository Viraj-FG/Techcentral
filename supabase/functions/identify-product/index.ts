import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { getSecret, getSupabaseSecrets, validateRequiredSecrets } from "../_shared/secrets.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IdentifyRequest {
  image: string; // base64 encoded image
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate required secrets early
    validateRequiredSecrets(['GOOGLE_GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY']);
    const authHeader = req.headers.get('Authorization');
    const { url, anonKey } = getSupabaseSecrets();
    const supabaseClient = createClient(
      url,
      anonKey,
      {
        global: {
          headers: { Authorization: authHeader! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(user.id, 'identify-product');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter!);
    }

    const { image }: IdentifyRequest = await req.json();
    
    if (!image || image.length < 100) {
      return new Response(
        JSON.stringify({ error: 'Valid image data required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Product identification request received');
    
    const geminiApiKey = getSecret('GOOGLE_GEMINI_API_KEY');

    console.log('Calling Gemini Vision API...');
    
    // Use Gemini to identify the product
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Analyze this product image and extract:
1. Product name (be specific, include variety/flavor if visible)
2. Brand name
3. Product type/category (fridge, pantry, beauty, or pets)
4. Any visible barcode numbers

Respond in JSON format:
{
  "name": "product name",
  "brand": "brand name",
  "category": "fridge|pantry|beauty|pets",
  "barcode": "barcode if visible",
  "confidence": 0.0-1.0
}

If you cannot identify the product clearly, set confidence below 0.5`
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: image.includes('base64,') ? image.split('base64,')[1] : image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API failed:', response.status, errorText);
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const geminiData = await response.json();
    console.log('Gemini response received');
    
    // Extract the JSON from Gemini's response
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('Gemini text response:', text);
    
    // Try to parse JSON from the response
    let productInfo;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      productInfo = JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON:', e);
      throw new Error('Failed to parse product identification response');
    }

    console.log('Identified product:', productInfo);

    // If confidence is high enough and we have a name, try to enrich with nutrition data
    if (productInfo.confidence > 0.5 && productInfo.name) {
      console.log('Attempting to enrich product data...');
      
      const { data: enrichedData, error: enrichError } = await supabaseClient.functions.invoke(
        'enrich-product',
        {
          body: {
            name: productInfo.name,
            brand: productInfo.brand,
            barcode: productInfo.barcode
          }
        }
      );

      if (!enrichError && enrichedData) {
        console.log('Product enriched successfully');
        return new Response(
          JSON.stringify({
            ...productInfo,
            enriched: enrichedData
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log('Enrichment failed, returning basic info:', enrichError);
      }
    }

    return new Response(
      JSON.stringify(productInfo),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Product identification error:', error);
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
