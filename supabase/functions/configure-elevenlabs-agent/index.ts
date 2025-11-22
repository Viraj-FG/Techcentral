import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROMPT_VERSION = 'v2.0-master-brain';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const { agentId, testMode } = await req.json();
    if (!agentId) {
      throw new Error('agentId is required');
    }

    console.log('=== AGENT CONFIGURATION START ===');
    console.log('Agent ID:', agentId);
    console.log('Configuration timestamp:', new Date().toISOString());
    console.log('Test mode:', testMode || false);

    // Configure the agent with dynamic variables support
    const agentConfig = {
      name: "Kaeva",
      conversation_config: {
        agent: {
          prompt: {
            prompt: `You are Kaeva, a warm AI Life Operating System conducting user onboarding.

**ONBOARDING INTERVIEW FLOW** (ONE question at a time):

1. **Identity**: "What's your name?" → updateProfile("userName", {{name}})

2. **Biometrics** (CLINICAL GRADE):
   - Say: "To provide medical-grade nutritional guidance, I need some basic metrics."
   - Ask: "How old are you?"
   - Ask: "What's your current weight?" (listen for kg/lbs)
   - Ask: "And your height?" (listen for cm/feet)
   - Ask: "How would you describe your gender?"
   - Ask: "How active are you? Sedentary, lightly active, moderately active, very active, or extremely active?"
   - updateProfile("userBiometrics", { age, weight, height, gender, activityLevel })
   - Tell them: "Your baseline is [TDEE] calories per day"

3. **The Palate**:
   - Ask about dietary values (Halal, Kosher, Vegan, Vegetarian, etc.)
   - Ask about food allergies (Nuts, Gluten, Dairy, Shellfish, etc.)
   - updateProfile("dietaryValues", array)
   - updateProfile("allergies", array)

4. **The Mirror**:
   - Ask: "What's your skin type?" (Dry, Oily, Combination, Sensitive, Normal)
   - Ask: "And your hair type?" (Straight, Wavy, Curly, Coily)
   - updateProfile("beautyProfile", { skinType, hairType })

5. **The Tribe** (Household):
   - Ask: "Who lives with you? Tell me about your household"
   - For children: Ask age and allergies
   - For elderly: Ask dietary restrictions and health conditions
   - For pets: Note toxic ingredient safety
   - updateProfile("householdMembers", array)

6. **The Mission**:
   - Ask about health goals (Weight Loss, Muscle Gain, Heart Health, Energy)
   - Ask about lifestyle goals (Meal Prep, New Cuisines, Self-Care)
   - updateProfile("healthGoals", array)
   - updateProfile("lifestyleGoals", array)

**COMPLETION CRITERIA**:
When ALL data collected:
✓ Name, Biometrics, Dietary/Allergies, Beauty Profile, Household, Goals

**FINAL STEP - CRITICAL**:
1. Say: "Perfect, [Name]. Your digital twin is complete."
2. IMMEDIATELY call completeConversation(reason="onboarding_complete")
3. DO NOT wait for user response
4. If tool fails, retry up to 3 times

**VOICE BEHAVIOR**:
- Keep responses under 15 seconds
- ONE question at a time
- Acknowledge barge-ins: "Yes?" or "Go ahead"
- Be warm but efficient`,
          },
          first_message: "Hello! I'm Kaeva, your AI Life Operating System. Let's get to know you. What's your name?",
          language: "en",
        },
        tts: {
          voice_id: "EXAVITQu4vr4xnSDxMaL", // Sarah - warm and friendly
        },
      },
      client_tools: [
        {
          name: "updateProfile",
          description: "Save user profile information immediately as you collect it",
          parameters: {
            type: "object",
            properties: {
              field: {
                type: "string",
                description: "Field to update: userName, userBiometrics, dietaryValues, allergies, beautyProfile, householdMembers, healthGoals, lifestyleGoals",
              },
              value: {
                description: "Value to set - string, array, or object",
              },
            },
            required: ["field", "value"],
          },
        },
        {
          name: "completeConversation",
          description: "BLOCKING TOOL: End conversation and return to dashboard. Call when onboarding complete or user wants to exit.",
          wait_for_response: true, // CRITICAL: Makes this blocking
          parameters: {
            type: "object",
            properties: {
              reason: {
                type: "string",
                description: "Why ending: 'onboarding_complete' or 'user_exit'",
                enum: ["onboarding_complete", "user_exit"]
              }
            },
            required: ["reason"]
          },
        },
        {
          name: "navigateTo",
          description: "Navigate to a specific dashboard page (assistant mode only)",
          parameters: {
            type: "object",
            properties: {
              page: {
                type: "string",
                description: "Page to navigate: inventory, settings, beauty, pets, food",
              },
            },
            required: ["page"],
          },
        },
      ],
    };

    console.log('Prompt length:', agentConfig.conversation_config.agent.prompt.prompt.length, 'characters');
    console.log('Client tools configured:', agentConfig.client_tools.length);
    console.log('Voice ID:', agentConfig.conversation_config.tts.voice_id);

    console.log('Sending configuration to ElevenLabs API...');

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
      {
        method: 'PATCH',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentConfig),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`Failed to configure agent: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    console.log('=== AGENT CONFIGURATION SUCCESS ===');
    console.log('Agent name:', result.name);
    console.log('Voice ID configured:', result.conversation_config?.tts?.voice_id);
    console.log('Prompt version:', PROMPT_VERSION);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Agent configured successfully',
        agent: result,
        configured_at: new Date().toISOString(),
        prompt_version: PROMPT_VERSION
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('=== AGENT CONFIGURATION FAILED ===');
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Failed to configure ElevenLabs agent'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
