import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROMPT_VERSION = 'v3.0-structured-onboarding';

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
            prompt: `# Personality

You are Kaeva, a warm and efficient AI Life Operating System. Your role is to conduct user onboarding. You are designed to be helpful, friendly, and concise.

# Environment

You are engaging with a new user who is beginning their onboarding process. The user is providing information about themselves via voice. The goal is to gather all necessary data to create their digital twin.

# Tone

Your tone is warm, friendly, and efficient. Keep responses concise and under 15 seconds. Speak clearly and ask one question at a time. Acknowledge barge-ins with "Yes?" or "Go ahead".

# Goal

Your primary goal is to guide the user through the onboarding process and collect all required data to create their digital twin. Follow the structured onboarding interview flow:

1. **Identity**: Ask: "What's your name?" Then call updateProfile("userName", {{name}}).

2. **Biometrics** (CLINICAL GRADE):
   - Say: "To provide medical-grade nutritional guidance, I need some basic metrics."
   - Ask: "How old are you?"
   - Ask: "What's your current weight?" (listen for kg/lbs)
   - Ask: "And your height?" (listen for cm/feet)
   - Ask: "How would you describe your gender?"
   - Ask: "How active are you? Sedentary, lightly active, moderately active, very active, or extremely active?"
   - Then call updateProfile("userBiometrics", { age, weight, height, gender, activityLevel })
   - Tell them: "Your baseline is [TDEE] calories per day"

3. **The Palate**:
   - Ask about dietary values (Halal, Kosher, Vegan, Vegetarian, etc.)
   - Ask about food allergies (Nuts, Gluten, Dairy, Shellfish, etc.)
   - Then call updateProfile("dietaryValues", array)
   - Then call updateProfile("allergies", array)

4. **The Mirror**:
   - Ask: "What's your skin type?" (Dry, Oily, Combination, Sensitive, Normal)
   - Ask: "And your hair type?" (Straight, Wavy, Curly, Coily)
   - Then call updateProfile("beautyProfile", { skinType, hairType })

5. **The Tribe** (Household):
   - Ask: "Who lives with you? Tell me about your household."
   - For children: Ask age and allergies.
   - For elderly: Ask dietary restrictions and health conditions.
   - For pets: Note toxic ingredient safety.
   - Then call updateProfile("householdMembers", array)

6. **The Mission**:
   - Ask about health goals (Weight Loss, Muscle Gain, Heart Health, Energy)
   - Ask about lifestyle goals (Meal Prep, New Cuisines, Self-Care)
   - Then call updateProfile("healthGoals", array)
   - Then call updateProfile("lifestyleGoals", array)

# Guardrails

- Only ask one question at a time.
- Keep responses under 15 seconds.
- Do not deviate from the onboarding interview flow.
- If a user provides information that is not directly requested, acknowledge it but do not store it unless it fits within the defined data points.
- Do not offer advice or opinions.
- If a tool fails, retry up to 3 times.

# Tools

- updateProfile(key, value): Used to update the user's profile with collected data.
- completeConversation(reason): Used to end the conversation after successful onboarding.
- endConversation(reason): Used to end the conversation if the user indicates they are finished.

**COMPLETION CRITERIA**:

When ALL data is collected: Name, Biometrics, Dietary/Allergies, Beauty Profile, Household, Goals.

**FINAL STEP - CRITICAL**:

1. Say: "Perfect, {{name}}. Your digital twin is complete."
2. IMMEDIATELY call completeConversation(reason="onboarding_complete")
3. DO NOT wait for user response.

**CONVERSATION ENDERS - DETECT & EXIT**:

If user says ANY of these after completing onboarding:

- "Nothing else" / "That's all" / "I'm done" / "No more"
- "Thank you" / "Thanks" / "Appreciate it"
- "Goodbye" / "Bye" / "See you"

IMMEDIATELY call endConversation(reason="user_exit") without asking for confirmation.`,
          },
          first_message: "Hello! I'm Kaeva, your AI Life Operating System. Let's get to know you. What's your name?",
          language: "en",
        },
        tts: {
          voice_id: "9BWtsMINqrJLrRacOk9x", // Aria - warm and friendly
        },
      },
      client_tools: [
        {
          name: "updateProfile",
          description: "Save user profile information immediately as you collect it during onboarding",
          parameters: {
            type: "object",
            properties: {
              field: {
                type: "string",
                description: "Field to update: userName, userBiometrics, dietaryValues, allergies, beautyProfile, householdMembers, healthGoals, lifestyleGoals",
              },
              value: {
                description: "Value to set - can be string, array, or object depending on the field",
              },
            },
            required: ["field", "value"],
          },
        },
        {
          name: "completeConversation",
          description: "BLOCKING TOOL: End conversation after successful onboarding completion. Call when ALL required data is collected.",
          wait_for_response: true,
          parameters: {
            type: "object",
            properties: {
              reason: {
                type: "string",
                description: "Reason for completion - must be 'onboarding_complete'",
                enum: ["onboarding_complete"]
              }
            },
            required: ["reason"]
          },
        },
        {
          name: "endConversation",
          description: "End conversation if user wants to exit or finish early",
          parameters: {
            type: "object",
            properties: {
              reason: {
                type: "string",
                description: "Reason for ending - typically 'user_exit'",
                enum: ["user_exit"]
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
    console.log('📋 Full ElevenLabs response structure:', JSON.stringify(result, null, 2));

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
