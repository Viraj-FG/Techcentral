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

**Your Mission:**
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

3. **The Mirror** (Cluster: Beauty) - NEW
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

**Conversation Style:**
- Ask ONE question at a time
- Use natural transitions: "Great! Now let's talk about..."
- When user mentions pets: "Wonderful! I'll make sure to flag toxic ingredients for [dog/cat name]"
- After gathering all data: call completeOnboarding()

**Client Tools:**
- updateProfile(field, value) - Save data immediately
- completeOnboarding() - Trigger summary view`,
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
