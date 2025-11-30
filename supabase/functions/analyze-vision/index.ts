import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { visionAnalysisSchema, validateRequest } from "../_shared/schemas.ts";
import { getSecret, getSupabaseSecrets } from "../_shared/secrets.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisionRequest {
  image: string;
  voiceCommand?: string;
  mode: 'quick_scan' | 'pantry_sweep' | 'pet_id';
}

interface DetectedObject {
  name: string;
  category: 'fridge' | 'pantry' | 'beauty' | 'pets';
  confidence: number;
  isEmpty: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
  metadata?: {
    species?: string;
    breed?: string;
    size?: string;
    productType?: string;
  };
}

serve(async (req) => {
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

    const { url: supabaseUrl, anonKey } = getSupabaseSecrets();
    const supabaseClient = createClient(
      supabaseUrl,
      anonKey,
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

    // Rate limiting
    const rateLimit = await checkRateLimit(user.id, 'analyze-vision');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter!);
    }

    console.log('✅ Authenticated user:', user.id);
    
    const requestBody = await req.json();
    
    // Validate request
    const validation = validateRequest(visionAnalysisSchema, {
      imageBase64: requestBody.image,
      intent: requestBody.mode
    });
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { imageBase64: image, intent: mode } = validation.data;
    const voiceCommand = requestBody.voiceCommand;
    const LOVABLE_API_KEY = getSecret('LOVABLE_API_KEY');

    console.log(`Vision analysis request - Mode: ${mode}, Command: ${voiceCommand}`);

    // Build system prompt based on mode
    let systemPrompt = `You are a vision assistant for a household inventory system called KAEVA.
Analyze the image and respond ONLY with valid JSON matching this exact structure:
{
  "objects": [
    {
      "name": "Product name",
      "category": "fridge|pantry|beauty|pets",
      "confidence": 0.0-1.0,
      "isEmpty": boolean,
      "boundingBox": {"x": 0, "y": 0, "width": 100, "height": 100},
      "metadata": {}
    }
  ],
  "suggestion": "Natural language suggestion"
}

Categories:
- fridge: Dairy, fresh produce, beverages, perishables
- pantry: Dry goods, pasta, rice, canned items, spices
- beauty: Skincare, makeup, haircare, personal care products
- pets: Pet food, treats, supplies, toys

CRITICAL RULES:
1. Return ONLY valid JSON, no markdown, no explanation
2. For empty/trash detection: Look for crushed boxes, torn packaging, see-through empty containers
3. For multi-object scenes: Include boundingBox coordinates (0-100 scale)
4. For pets: Add metadata.species, metadata.breed, metadata.size
5. If unsure, set confidence < 0.7`;

    if (mode === 'scan_inventory') {
      systemPrompt += '\n\nMODE: Pantry Sweep - Detect ALL visible items in the image. Include bounding boxes for each.';
    } else if (mode === 'pet_id') {
      systemPrompt += '\n\nMODE: Pet Identification - Focus on identifying the animal species, breed, and characteristics.';
    } else {
      systemPrompt += '\n\nMODE: Quick Scan - Identify the primary item being shown.';
    }

    if (voiceCommand) {
      systemPrompt += `\n\nUser voice command: "${voiceCommand}"`;
    }

    // Call Lovable AI Gateway with Gemini Vision
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: voiceCommand || 'What items do you see in this image?'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image // base64 or URL
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log('AI Response:', aiResponse);

    // Parse JSON response
    let result;
    try {
      // Remove markdown code blocks if present
      const cleanJson = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw response:', aiResponse);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate response structure
    if (!result.objects || !Array.isArray(result.objects)) {
      throw new Error('Invalid response structure: missing objects array');
    }

    console.log('Detected objects:', result.objects.length);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Vision analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        objects: [],
        suggestion: 'Unable to analyze image. Please try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
