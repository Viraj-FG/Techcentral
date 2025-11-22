import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MealAnalysisRequest {
  items?: string[];
  image: string; // base64
}

// FatSecret OAuth 1.0 Helper Functions
function percentEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

async function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string = ''
): Promise<string> {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join('&');

  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');

  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

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
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: generateTimestamp(),
    oauth_nonce: generateNonce(),
    oauth_version: '1.0',
    ...queryParams
  };

  const signature = await generateOAuthSignature(
    method,
    baseUrl,
    oauthParams,
    consumerSecret
  );

  oauthParams.oauth_signature = signature;

  const queryString = Object.keys(oauthParams)
    .sort()
    .map(key => `${percentEncode(key)}=${percentEncode(oauthParams[key])}`)
    .join('&');

  return `${baseUrl}?${queryString}`;
}

async function searchFatSecret(itemName: string, clientId: string, clientSecret: string) {
  try {
    const searchParams: Record<string, string> = {
      method: 'foods.search.v3',
      search_expression: itemName,
      max_results: '1',
      format: 'json'
    };

    const signedUrl = await buildOAuth1Request(
      'GET',
      'https://platform.fatsecret.com/rest/server.api',
      searchParams,
      clientId,
      clientSecret
    );

    const response = await fetch(signedUrl, { method: 'GET' });
    
    if (!response.ok) {
      console.error(`FatSecret search failed for ${itemName}:`, response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.foods?.food || data.foods.food.length === 0) {
      console.log(`No FatSecret results for: ${itemName}`);
      return null;
    }

    const food = Array.isArray(data.foods.food) ? data.foods.food[0] : data.foods.food;
    const serving = Array.isArray(food.servings?.serving) 
      ? food.servings.serving[0] 
      : food.servings?.serving;

    return {
      name: food.food_name,
      calories: parseFloat(serving?.calories || '0'),
      protein: parseFloat(serving?.protein || '0'),
      carbs: parseFloat(serving?.carbohydrate || '0'),
      fat: parseFloat(serving?.fat || '0'),
      fiber: parseFloat(serving?.fiber || '0')
    };
  } catch (error) {
    console.error(`Error searching FatSecret for ${itemName}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items: providedItems, image }: MealAnalysisRequest = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
    }

    const clientId = Deno.env.get('FATSECRET_CLIENT_ID');
    const clientSecret = Deno.env.get('FATSECRET_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      throw new Error('FatSecret credentials not configured');
    }

    // Step A: Use Gemini Vision to identify food items
    const prompt = `Analyze this food image and identify specific components with estimated quantities.
Return ONLY valid JSON (no markdown, no backticks):
{
  "items": [
    { "name": "Grilled Salmon", "quantity": "150g" },
    { "name": "Quinoa", "quantity": "1 cup" }
  ]
}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: image.replace(/^data:image\/\w+;base64,/, '')
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 32,
            topP: 1,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const error = await geminiResponse.text();
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData.candidates[0].content.parts[0].text;
    
    console.log('Gemini vision analysis:', text);

    // Parse JSON from response
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const visionResult = JSON.parse(jsonText);
    const detectedItems = visionResult.items || [];

    console.log('Detected items:', detectedItems);

    // Step B: Enrich each item with FatSecret nutrition data
    const enrichedItems = await Promise.all(
      detectedItems.map(async (item: any) => {
        const nutrition = await searchFatSecret(item.name, clientId, clientSecret);
        
        return {
          name: item.name,
          quantity: item.quantity || '1 serving',
          nutrition: nutrition || {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0
          }
        };
      })
    );

    console.log('Enriched items with FatSecret data:', enrichedItems);

    // Step C: Aggregate totals
    const totals = enrichedItems.reduce((sum, item) => ({
      calories: sum.calories + item.nutrition.calories,
      protein: sum.protein + item.nutrition.protein,
      carbs: sum.carbs + item.nutrition.carbs,
      fat: sum.fat + item.nutrition.fat,
      fiber: sum.fiber + item.nutrition.fiber
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    return new Response(
      JSON.stringify({ items: enrichedItems, totals }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-meal:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
