import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, xi-signature',
};

// Validate webhook signature from ElevenLabs
async function validateWebhookSignature(
  req: Request, 
  body: string
): Promise<boolean> {
  const signature = req.headers.get('xi-signature');
  const webhookSecret = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET');
  
  if (!signature || !webhookSecret) {
    console.warn('⚠️ Missing signature or webhook secret');
    return false;
  }

  // ElevenLabs uses HMAC-SHA256
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(body)
  );

  // Convert to hex string
  const computedSignature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Compare signatures
  const isValid = signature === computedSignature;
  
  if (!isValid) {
    console.error('❌ Signature mismatch:', {
      received: signature,
      computed: computedSignature
    });
  }
  
  return isValid;
}

interface WebhookPayload {
  tool: string;
  conversation_id: string;
  parameters: any;
  agent_id: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// TDEE Calculator
const calculateTDEE = (weight: number, height: number, age: number, gender: string, activityLevel: string): number => {
  let bmr = 0;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityMultipliers: Record<string, number> = {
    'sedentary': 1.2,
    'lightly_active': 1.375,
    'moderately_active': 1.55,
    'very_active': 1.725,
    'extra_active': 1.9
  };

  return Math.round(bmr * (activityMultipliers[activityLevel] || 1.2));
};

// Get user_id from conversation metadata (stored when conversation starts)
async function getUserIdFromConversation(conversationId: string): Promise<string | null> {
  const { data } = await supabase
    .from('conversation_events')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .limit(1)
    .single();
  
  return data?.user_id || null;
}

// Tool: updateProfile - Save profile data immediately
async function handleUpdateProfile(userId: string, conversationId: string, params: { field: string; value: any }) {
  console.log(`📝 updateProfile - field: ${params.field}, userId: ${userId}`);

  const { field, value } = params;
  const updateData: any = {};

  // Map field names to database columns
  switch (field) {
    case 'userName':
      updateData.user_name = value;
      break;
    case 'userBiometrics':
      updateData.user_age = value.age;
      updateData.user_weight = value.weight;
      updateData.user_height = value.height;
      updateData.user_gender = value.gender;
      updateData.user_activity_level = value.activityLevel;
      
      // Calculate TDEE if we have all data
      if (value.weight && value.height && value.age && value.gender && value.activityLevel) {
        updateData.calculated_tdee = calculateTDEE(
          value.weight,
          value.height,
          value.age,
          value.gender,
          value.activityLevel
        );
        console.log(`🔢 Calculated TDEE: ${updateData.calculated_tdee}`);
      }
      break;
    case 'dietaryValues':
      updateData.dietary_preferences = value;
      break;
    case 'allergies':
      updateData.allergies = value;
      break;
    case 'beautyProfile':
      updateData.beauty_profile = value;
      break;
    case 'household':
      // Handle household members batch insert
      if (value.members && value.members.length > 0) {
        console.log(`👥 Inserting ${value.members.length} household members`);
        const { data: batchResult, error: batchError } = await supabase.rpc('insert_household_batch', {
          p_user_id: userId,
          p_members: value.members || [],
          p_pets: value.pets || []
        });

        if (batchError) {
          console.error('❌ Batch insert error:', batchError);
          throw batchError;
        }
        console.log('✅ Household batch insert result:', batchResult);
      }
      return { success: true, message: 'Household data saved' };
    case 'healthGoals':
      updateData.health_goals = value;
      break;
    case 'lifestyleGoals':
      updateData.lifestyle_goals = value;
      break;
    case 'language':
      updateData.language = value;
      break;
    default:
      console.warn(`⚠️ Unknown field: ${field}`);
      return { success: false, message: `Unknown field: ${field}` };
  }

  // Update profile
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error('❌ Profile update error:', error);
    throw error;
  }

  // Log to conversation events
  await supabase.from('conversation_events').insert({
    conversation_id: conversationId,
    user_id: userId,
    agent_type: 'onboarding',
    event_type: 'tool_call',
    role: 'system',
    event_data: { tool: 'updateProfile', field, value }
  });

  console.log(`✅ Profile updated successfully - ${field}`);
  return { success: true, message: `Updated ${field}` };
}

// Tool: completeConversation - Mark onboarding complete
async function handleCompleteConversation(userId: string, conversationId: string, params: { reason: string }) {
  console.log(`🎉 completeConversation - userId: ${userId}, reason: ${params.reason}`);

  try {
    // Mark onboarding as complete
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error('❌ Profile completion error:', profileError);
      throw profileError;
    }

    // Log completion event
    await supabase.from('conversation_events').insert({
      conversation_id: conversationId,
      user_id: userId,
      agent_type: 'onboarding',
      event_type: 'session_end',
      role: 'system',
      event_data: { 
        tool: 'completeConversation',
        reason: params.reason,
        completed_at: new Date().toISOString()
      }
    });

    // Store final message in conversation history
    await supabase.from('conversation_history').insert({
      conversation_id: conversationId,
      user_id: userId,
      role: 'system',
      message: `Onboarding completed: ${params.reason}`
    });

    console.log('✅ Onboarding marked as complete');
    return { 
      success: true, 
      message: 'Onboarding completed successfully',
      action: 'navigate',
      destination: '/dashboard'
    };
  } catch (error) {
    console.error('❌ Complete conversation error:', error);
    // Even if some steps fail, try to mark as complete
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId);
    
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Webhook received');
    
    // Read body as text first for signature validation
    const bodyText = await req.text();
    
    // Validate webhook signature
    const isValid = await validateWebhookSignature(req, bodyText);
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid webhook signature' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('✅ Webhook signature validated');
    
    // Parse the validated body
    const payload: WebhookPayload = JSON.parse(bodyText);
    console.log('🔔 Processing tool call:', {
      tool: payload.tool,
      conversation_id: payload.conversation_id,
      agent_id: payload.agent_id
    });

    // Get user_id from conversation
    const userId = await getUserIdFromConversation(payload.conversation_id);
    if (!userId) {
      console.error('❌ No user_id found for conversation:', payload.conversation_id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not found for conversation' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`👤 Found user: ${userId}`);

    let result;

    // Route to appropriate tool handler
    switch (payload.tool) {
      case 'updateProfile':
        result = await handleUpdateProfile(userId, payload.conversation_id, payload.parameters);
        break;
      
      case 'completeConversation':
        result = await handleCompleteConversation(userId, payload.conversation_id, payload.parameters);
        break;
      
      default:
        console.warn(`⚠️ Unknown tool: ${payload.tool}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unknown tool: ${payload.tool}` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
