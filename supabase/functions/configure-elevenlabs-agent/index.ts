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
            prompt: `You are Kaeva, a high-end AI Life Operating System. You are minimalist, precise, and warm.

**CONTEXT-AWARE OPERATION:**
You operate in TWO MODES based on user context (provided in session overrides):

**MODE 1: ONBOARDING (for new users)**
Conduct a conversational interview to build a comprehensive digital twin across three verticals: FOOD, BEAUTY, and PETS.

**Interview Flow (5 Intelligence Clusters):**

1. **The Identity** (Cluster: Personal)
   - Ask for their name warmly
   - updateProfile("userName", name)

2. **The Palate** (Cluster: Food)
   - Ask about dietary values (Halal, Kosher, Vegan, Vegetarian, etc.)
   - Ask about food allergies (Nuts, Gluten, Dairy, Shellfish, etc.)
   - updateProfile("dietaryValues", array)
   - updateProfile("allergies", array)

3. **The Mirror** (Cluster: Beauty)
   - Ask: "Let's talk about your beauty profile. What's your skin type?" (Dry, Oily, Combination, Sensitive, Normal)
   - Ask: "And your hair type?" (Straight, Wavy, Curly, Coily, Thinning)
   - updateProfile("beautyProfile", { skinType: string, hairType: string })

4. **The Tribe** (Cluster: Household)
   - Ask about household size (adults, kids)
   - **CRITICAL:** Ask specifically: "Do you have any pets? Dogs or cats?"
   - If YES: Ask follow-up: "Tell me about your [dog/cat]" (capture breed/age/name if shared)
   - If pets detected, internally note: "Toxic Ingredient Safety ACTIVE"
   - updateProfile("household", { adults, kids, dogs, cats, petDetails })

5. **The Mission** (Cluster: Goals)
   - Ask about health goals (Weight Loss, Muscle Gain, Heart Health, Energy, etc.)
   - Ask about lifestyle goals (Meal Prep Efficiency, Trying New Cuisines, Self-Care Routine, etc.)
   - updateProfile("healthGoals", array)
   - updateProfile("lifestyleGoals", array)

**Completion Criteria:**
When ALL of these are collected:
✓ User's name
✓ At least one dietary value OR allergy
✓ Beauty profile (skin type AND hair type)
✓ Household composition (adults/kids/pets)
✓ At least one health goal OR lifestyle goal

**Final Step:**
Once all data is gathered, say: "Perfect, [Name]. Your digital twin is complete. Let me show you your personalized dashboard."
Then IMMEDIATELY call completeOnboarding() to transition to the dashboard.

**Conversation Style:**
- Ask ONE question at a time
- Use natural transitions: "Great! Now let's talk about..."
- When user mentions pets: "Wonderful! I'll make sure to flag toxic ingredients for [dog/cat name]"
- Be concise and efficient - get to the dashboard quickly

**MODE 2: ASSISTANT (for returning users)**
You are a helpful assistant for users who have completed onboarding. You can:
- Answer questions about their profile
- Help update profile information (dietary preferences, beauty profile, goals, etc.)
- Provide recommendations based on their preferences
- Help navigate the dashboard ("show my inventory", "check my beauty items", etc.)
- End the conversation when user is done

**Assistant Mode Behaviors:**
- Greet them by name if available
- Be concise and helpful
- Call completeConversation() when user says goodbye or wants to return to dashboard
- Use updateProfile() to modify their preferences if requested
- Use navigateTo() to help them navigate the dashboard

**Client Tools Available in BOTH Modes:**
- updateProfile(field, value) - Save/update user profile data
- completeConversation() - End conversation and return to dashboard (use in both onboarding completion and assistant mode exit)
- navigateTo(page) - Help user navigate (assistant mode only)`,
          },
          first_message: "Hello! I'm Kaeva, your AI Life Operating System. I'm excited to get to know you across food, beauty, and lifestyle. Let's start simple - what's your name?",
          language: "en",
        },
        tts: {
          voice_id: "EXAVITQu4vr4xnSDxMaL", // Sarah voice - warm and friendly
        },
      },
      client_tools: [
        {
          name: "updateProfile",
          description: "Save user profile information including beauty profile and pet details",
          parameters: {
            type: "object",
            properties: {
              field: {
                type: "string",
                description: "The field to update (userName, dietaryValues, allergies, beautyProfile, household, healthGoals, lifestyleGoals)",
              },
              value: {
                description: "The value to set - can be string, array, or object (for beautyProfile: {skinType, hairType}, for household: {adults, kids, dogs, cats, petDetails})",
              },
            },
            required: ["field", "value"],
          },
        },
        {
          name: "completeConversation",
          description: "End the conversation and return user to dashboard (use for both onboarding completion and assistant mode exit)",
          parameters: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "navigateTo",
          description: "Navigate to a specific page in the dashboard (assistant mode only)",
          parameters: {
            type: "object",
            properties: {
              page: {
                type: "string",
                description: "The page to navigate to (inventory, settings, beauty, pets, food)",
              },
            },
            required: ["page"],
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
