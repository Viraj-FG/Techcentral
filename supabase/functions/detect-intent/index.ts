import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
import { validateRequest, detectIntentSchema } from "../_shared/schemas.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { getSecret, validateRequiredSecrets, SECRET_GROUPS } from "../_shared/secrets.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DetectIntentRequest {
  image: string; // base64
}

interface DetectedItem {
  name: string;
  brand?: string;
  category: 'fridge' | 'pantry' | 'beauty' | 'pets' | 'appliance' | 'meal';
  confidence: number;
  metadata?: {
    barcode?: string;
    pao_symbol?: string;
    species?: string;
    breed?: string;
    size?: string;
    estimated_shelf_life_days?: number;
  };
}

interface IntentResponse {
  intent: string;
  confidence: number;
  subtype?: 'raw' | 'cooked';
  items: DetectedItem[];
  suggestion: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate required secrets early
    validateRequiredSecrets([...SECRET_GROUPS.vision, ...SECRET_GROUPS.supabase]);
    // Validate request
    const body = await req.json();
    const validation = validateRequest(detectIntentSchema, body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { image } = validation.data;

    const apiKey = getSecret('GOOGLE_GEMINI_API_KEY');

    const systemPrompt = `Analyze this image and classify the SCENE into one of these categories:

1. INVENTORY_SWEEP: Multiple items on shelves, in bags, fridge/pantry view
   - Detect: All visible products (food, beverages, packaged goods)
   - Estimate: Shelf life for each item in days
   
2. APPLIANCE_SCAN: Kitchen counter with gadgets
   - Detect: Air Fryer, Blender, Instant Pot, Microwave, etc.
   
3. VANITY_SWEEP: Bathroom shelf, makeup bag, skincare
   - Detect: Cosmetic products with brands
   - Look for: PAO symbols (12M, 6M jar icons on packaging)
   
4. NUTRITION_TRACK: Plated cooked meal OR raw ingredients on cutting board
   - Sub-classify: "raw" vs "cooked"
   - For raw: List ingredients for recipe suggestions
   - For cooked: Estimate portion size and main components
   
5. PRODUCT_ANALYSIS: Single packaged item being held
   - Detect: Barcode, brand, product name, label text
   
6. PET_ID: Live animal (dog, cat, bird, etc.)
   - Detect: Species, breed (if identifiable), approximate size

7. EMPTY_PACKAGE: Empty container, trash can with discarded packaging, or nearly empty bottle
   - Detect: Product that is clearly empty or being thrown away
   - Look for: Empty bottles, finished packages, items in trash

Return JSON ONLY (no markdown):
{
  "intent": "INVENTORY_SWEEP|APPLIANCE_SCAN|VANITY_SWEEP|NUTRITION_TRACK|PRODUCT_ANALYSIS|PET_ID|EMPTY_PACKAGE",
  "confidence": 0.0-1.0,
  "subtype": "raw|cooked" (only for NUTRITION_TRACK),
  "items": [
    {
      "name": "Item name",
      "brand": "Brand if visible",
      "category": "fridge|pantry|beauty|pets|appliance|meal",
      "confidence": 0.0-1.0,
      "metadata": {
        "barcode": "if visible",
        "pao_symbol": "12M" (for beauty products),
        "species": "dog" (for pets),
        "breed": "Golden Retriever" (for pets),
        "size": "medium" (for pets),
        "estimated_shelf_life_days": 7 (for food)
      }
    }
  ],
  "suggestion": "Helpful user guidance"
}

Confidence threshold: Only return intent if > 0.75. Be precise with item detection.`;

    // Call Gemini Vision API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: systemPrompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: image.replace(/^data:image\/\w+;base64,/, '')
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Check for MAX_TOKENS finish reason
    if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
      console.error('Gemini hit token limit:', JSON.stringify(data));
      throw new Error('Response too long - please try with a simpler image or closer view');
    }
    
    // Validate response structure
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Unexpected Gemini response structure:', JSON.stringify(data));
      throw new Error('Invalid response from Gemini API - unexpected structure');
    }
    
    const text = data.candidates[0].content.parts[0].text;
    
    console.log('Gemini response:', text);

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const result: IntentResponse = JSON.parse(jsonText);

    // Validate confidence threshold
    if (result.confidence < 0.75) {
      return new Response(
        JSON.stringify({
          error: 'Low confidence detection',
          confidence: result.confidence,
          suggestion: 'Please try again with better lighting or a clearer view'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in detect-intent:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});