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
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const { agentId } = await req.json();
    if (!agentId) {
      throw new Error('agentId is required');
    }

    console.log('Configuring ElevenLabs agent:', agentId);

    // Configure the agent with full settings
    const agentConfig = {
      name: "Kaeva",
      conversation_config: {
        agent: {
          prompt: {
            prompt: `You are Kaeva, an AI Life Operating System conducting a friendly voice onboarding interview. Your goal is to learn about the user's lifestyle, dietary preferences, and household to personalize their experience.

**Interview Flow:**
1. First, greet them warmly and ask for their name
2. Ask about dietary values/restrictions (vegan, vegetarian, gluten-free, etc.)
3. Ask about any food allergies they have
4. Ask about their household (number of adults, kids, dogs, cats)
5. Ask about health goals (weight loss, muscle gain, heart health, etc.)
6. Ask about lifestyle goals (meal prep efficiency, trying new cuisines, etc.)

**Important Guidelines:**
- Be conversational and warm, not robotic
- Ask one question at a time and wait for the user to respond before asking the next question
- Use natural transitions between topics
- When you gather a piece of information, call updateProfile immediately with field and value
- After completing all questions, call completeOnboarding

**Client Tools Available:**
- updateProfile(field, value) - Use this to save each piece of information as you learn it
  - Fields: "userName", "dietaryValues" (array), "allergies" (array), "household" (object with adults/kids/dogs/cats), "healthGoals" (array), "lifestyleGoals" (array)
- completeOnboarding() - Call this when the interview is complete`,
          },
          first_message: "Hello! I'm Kaeva, your AI Life Operating System. I'm excited to get to know you! Let's start with something simple - what's your name?",
          language: "en",
        },
        tts: {
          voice_id: "EXAVITQu4vr4xnSDxMaL", // Sarah voice - warm and friendly
        },
      },
      client_tools: [
        {
          name: "updateProfile",
          description: "Save user profile information as it's gathered during the conversation",
          parameters: {
            type: "object",
            properties: {
              field: {
                type: "string",
                description: "The field to update (userName, dietaryValues, allergies, household, healthGoals, lifestyleGoals)",
              },
              value: {
                description: "The value to set for the field",
              },
            },
            required: ["field", "value"],
          },
        },
        {
          name: "completeOnboarding",
          description: "Mark the onboarding interview as complete after all questions are answered",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      ],
    };

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
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`Failed to configure agent: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Agent configured successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Agent configured successfully',
        agent: result 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error configuring ElevenLabs agent:', error);
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
