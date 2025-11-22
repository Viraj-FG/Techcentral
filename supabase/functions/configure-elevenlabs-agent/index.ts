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

2. **The Biometrics** (Cluster: Personal Metrics - CLINICAL GRADE)
   - Say: "To provide medical-grade nutritional guidance, I need some basic metrics. This data stays encrypted."
   - Ask: "How old are you?"
   - Ask: "What's your current weight?" (listen for kg/lbs)
   - Ask: "And your height?" (listen for cm/feet)
   - Ask: "How would you describe your gender - male, female, or other?"
   - Ask: "How active are you? Sedentary, lightly active, moderately active, very active, or extremely active?"
   - updateProfile("userBiometrics", { age, weight, height, gender, activityLevel })
   - After saving, tell them their calculated baseline: "Your baseline is [TDEE] calories per day."

3. **The Palate** (Cluster: Food)
   - Ask about dietary values (Halal, Kosher, Vegan, Vegetarian, etc.)
   - Ask about food allergies (Nuts, Gluten, Dairy, Shellfish, etc.)
   - updateProfile("dietaryValues", array)
   - updateProfile("allergies", array)

4. **The Mirror** (Cluster: Beauty)
   - Ask: "Let's talk about your beauty profile. What's your skin type?" (Dry, Oily, Combination, Sensitive, Normal)
   - Ask: "And your hair type?" (Straight, Wavy, Curly, Coily, Thinning)
   - updateProfile("beautyProfile", { skinType: string, hairType: string })

5. **The Tribe** (Cluster: Household - DEEP MODE)
   - Ask: "Who lives with you? Tell me about your household."
   - **DETAILED SUB-INTERVIEW FLOW:**
     * If user mentions children: ENTER CHILD PROFILE MODE
       - "You mentioned a child. What's their age?"
       - IF age < 5: "Any allergies I should watch for? Peanuts, dairy, eggs?"
       - IF age > 5: "Do they have any specific dietary needs or allergies?"
       - Store as: { type: 'child', age: X, allergies: [...], dietaryRestrictions: [...] }
     * If user mentions elderly family member: ENTER ELDERLY PROFILE MODE
       - "Tell me about [elderly member]. What's their name or how should I refer to them?"
       - "Any dietary restrictions? Like low sodium, soft foods, or diabetic-friendly?"
       - "Any health conditions I should be aware of? Diabetes, hypertension, heart conditions?"
       - Store as: { type: 'elderly', name: 'Mom', healthConditions: [...], dietaryRestrictions: [...] }
     * If user mentions pets: ENTER PET SAFETY MODE
       - "Tell me about your [dog/cat]"
       - Internally note: "Toxic Ingredient Safety ACTIVE"
   - **MANDATORY FOLLOW-UP RULE:** If household member count > 1, you MUST ask:
     * For children: "Do they have any specific allergies?"
     * For elderly: "Any dietary restrictions or health conditions?"
     * DO NOT assume everyone eats the same as the primary user
   - updateProfile("householdMembers", array of member objects with detailed profiles)
   - Also update legacy format: updateProfile("household", { adults, kids, dogs, cats, petDetails })

6. **The Mission** (Cluster: Goals)
   - Ask about health goals (Weight Loss, Muscle Gain, Heart Health, Energy, etc.)
   - Ask about lifestyle goals (Meal Prep Efficiency, Trying New Cuisines, Self-Care Routine, etc.)
   - updateProfile("healthGoals", array)
   - updateProfile("lifestyleGoals", array)

**Completion Criteria:**
When ALL of these are collected:
✓ User's name
✓ User biometrics (age, weight, height, gender, activity level)
✓ At least one dietary value OR allergy
✓ Beauty profile (skin type AND hair type)
✓ Household composition with detailed member profiles (if applicable)
✓ At least one health goal OR lifestyle goal

**Final Step - CRITICAL:**
Once all data is gathered:
1. Say: "Perfect, [Name]. Your digital twin is complete. You can now see everything we've built together."
2. IMMEDIATELY call completeConversation() - DO NOT wait for user response
3. If the tool call fails, try again up to 3 times
4. This function call is MANDATORY - the onboarding cannot complete without it

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

**VOICE BEHAVIOR RULES (CRITICAL)**:
- Keep responses under 30 seconds unless user asks for details
- If user interrupts you (barge-in), immediately stop and listen
- Acknowledge interruptions: "Yes?" or "Go ahead"
- For quick confirmations, use 1-2 words: "Done", "Added", "Got it"
- Be conversational but efficient
- Wait for natural pauses before responding

**Assistant Mode Behaviors:**
- Greet them by name if available
- Be concise and helpful
- Call completeConversation() when user says goodbye or wants to return to dashboard
- Use updateProfile() to modify their preferences if requested
- Use navigateTo() to help them navigate the dashboard

**Client Tools Available in BOTH Modes - CRITICAL USAGE:**
- updateProfile(field, value) - Save/update user profile data immediately as you collect it
- completeConversation() - **REQUIRED** End conversation and return to dashboard
  * In ONBOARDING: Call this IMMEDIATELY after saying the completion message
  * In ASSISTANT: Call this when user says goodbye or wants to exit
  * This tool MUST be called - do not skip it under any circumstances
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
          description: "CRITICAL: End the conversation and return user to dashboard. MUST be called in onboarding mode after collecting all data. MUST be called in assistant mode when user wants to exit. This is not optional.",
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
