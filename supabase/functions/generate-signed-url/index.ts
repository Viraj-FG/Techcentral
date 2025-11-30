import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { validateRequest, signedUrlSchema } from "../_shared/schemas.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { getSecret, getSupabaseSecrets } from "../_shared/secrets.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestStartTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🎤 [SignedURL] Request received', {
    method: req.method,
    timestamp: new Date().toISOString()
  });

  try {
    // 🔒 Security: Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ [SignedURL] No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    console.log('🔐 [SignedURL] Verifying JWT token');
    
    // Create admin client with service role key to verify the JWT
    const { url: supabaseUrl, serviceRoleKey } = getSupabaseSecrets();
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error('❌ [SignedURL] Authentication failed:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [SignedURL] Authenticated user:', user.id);

    // Rate limiting
    const rateLimit = await checkRateLimit(user.id, 'generate-signed-url');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter!);
    }
    
    // Validate request body
    const body = await req.json();
    const validation = validateRequest(signedUrlSchema, body);
    
    if (!validation.success) {
      console.error('❌ [SignedURL] Validation failed:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { agentId } = validation.data;
    
    const ELEVENLABS_API_KEY = getSecret('ELEVENLABS_API_KEY');

    console.log('🤖 [SignedURL] Generating signed URL for agent:', agentId, {
      userId: user.id
    });

    const elevenLabsStartTime = Date.now();
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      }
    );

    const elevenLabsDuration = Date.now() - elevenLabsStartTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [SignedURL] ElevenLabs API error:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
        duration: elevenLabsDuration
      });
      throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    const totalDuration = Date.now() - requestStartTime;
    
    console.log("✅ [SignedURL] Signed URL generated successfully", {
      agentId,
      userId: user.id,
      elevenLabsDuration,
      totalDuration,
      urlLength: data.signed_url?.length
    });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const totalDuration = Date.now() - requestStartTime;
    
    console.error("❌ [SignedURL] Error generating signed URL:", {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      duration: totalDuration
    });
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
