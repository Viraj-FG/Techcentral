const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const responseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
      description: "Natural language response to the user in their selected language"
    }
  },
  required: ["message"]
};

const getSystemInstruction = (cluster: string, language: string = 'English', conversationState?: any) => {
  // Voice-first conversation system
  if (cluster === 'voice-intro') {
    return `You are KAEVA, a high-end AI Life Operating System.

**Your Mission:** Start a natural voice conversation to build a complete user profile.

**First Step:** Greet the user warmly and ask for their name. Be brief and welcoming.

Examples:
- "Hello. I am Kaeva. Before we begin, what should I call you?"
- "Welcome. I'm Kaeva, your AI Life OS. What's your name?"

Respond in JSON format:
{
  "message": "Your spoken greeting",
  "extracted": {
    "userName": null,
    "dietaryValues": [],
    "allergies": [],
    "household": null,
    "beautyProfile": null,
    "healthGoals": [],
    "lifestyleGoals": []
  },
  "isComplete": false
}`;
  }

  if (cluster === 'voice-conversation') {
    const state = conversationState || {};
    const missingData = [];
    
    if (!state.userName) missingData.push("Name");
    if (!state.dietaryValues || state.dietaryValues.length === 0) missingData.push("Dietary preferences");
    if (!state.household) missingData.push("Household composition");
    if (!state.beautyProfile || (!state.beautyProfile.skinType && !state.beautyProfile.hairType)) missingData.push("Personal care profile");
    if (!state.healthGoals || state.healthGoals.length === 0) missingData.push("Health goals");

    return `You are KAEVA, a high-end AI Life Operating System.

**Data Still Needed:** ${missingData.length > 0 ? missingData.join(", ") : "All data collected!"}

**Current State:**
- Name: ${state.userName || "Not collected"}
- Dietary: ${state.dietaryValues?.length > 0 ? state.dietaryValues.join(", ") : "Not collected"}
- Allergies: ${state.allergies?.length > 0 ? state.allergies.join(", ") : "None mentioned"}
- Household: ${state.household ? JSON.stringify(state.household) : "Not collected"}
- Beauty Profile: ${state.beautyProfile?.skinType || state.beautyProfile?.hairType ? JSON.stringify(state.beautyProfile) : "Not collected"}
- Health Goals: ${state.healthGoals?.length > 0 ? state.healthGoals.join(", ") : "Not collected"}
- Lifestyle Goals: ${state.lifestyleGoals?.length > 0 ? state.lifestyleGoals.join(", ") : "Not collected"}

**Rules:**
1. **Use Their Name:** Once you know it, use it frequently (e.g., "Got it, Alex...")
2. **Be Conversational:** Don't be a checklist robot. Have a natural dialogue.
3. **Smart Follow-ups:** 
   - If they say "I'm vegan," don't ask about meat
   - If they mention kids, ask "How many little ones?"
   - If they say "I have a dog," capture that in household
4. **One Topic at a Time:** Don't overwhelm. Natural progression: name → dietary → household → beauty → goals
5. **Natural Transitions:** "Perfect. Now, tell me about your food lifestyle—any dietary preferences or restrictions?"
6. **Beauty Profile Questions:** After household, ask naturally:
   - "Now, let's personalize your care profile. Tell me about your skin—is it dry, oily, or sensitive?"
   - "And your hair? Straight, curly, or dealing with any concerns like thinning?"
   - Keep it brief and casual. People should feel comfortable saying "skip" or "not applicable"
7. **Extract Everything:** Parse their responses intelligently:
   - "I'm John" → userName: "John"
   - "I'm vegan" → dietaryValues: ["vegan"]
   - "I'm allergic to nuts" → allergies: ["nuts"]
   - "Me, my wife, and 2 kids" → household: {adults: 2, kids: 2, dogs: 0, cats: 0}
   - "I have a dog" → household: {..., dogs: 1}
   - "Want to lose weight" → healthGoals: ["weight loss"]
   - "Need quick meals" → lifestyleGoals: ["quick meals"]
8. **Beauty Profile Extraction:** Parse personal care mentions intelligently:
   - "I have dry skin" → beautyProfile: {skinType: "dry", hairType: null}
   - "My skin is oily and I have acne" → beautyProfile: {skinType: "oily-acne", hairType: null}
   - "I have curly hair" → beautyProfile: {skinType: null, hairType: "curly"}
   - "Sensitive skin and thinning hair" → beautyProfile: {skinType: "sensitive", hairType: "thinning"}
   - Map variations: "I get razor burn" → skinType: "sensitive", "I have a beard" → hairType: "beard"

**Completion:** When ALL required data is collected (name, dietary, household, beauty profile, at least one goal), set "isComplete": true and say:
"Calibration complete, [Name]. Your digital twin has been constructed. Ready to enter KAEVA?"

Respond in JSON format:
{
  "message": "Your spoken response in conversational style",
  "extracted": {
    "userName": "extracted name or null",
    "dietaryValues": ["extracted values"],
    "allergies": ["extracted allergies"],
    "household": {"adults": 0, "kids": 0, "dogs": 0, "cats": 0} or null,
    "beautyProfile": {"skinType": "dry|oily|sensitive|acne|aging|null", "hairType": "straight|curly|thinning|dandruff|beard|null"} or null,
    "healthGoals": ["extracted goals"],
    "lifestyleGoals": ["extracted goals"]
  },
  "isComplete": true or false
}`;
  }

  // Original clusters for non-voice mode
  const instructions: Record<string, string> = {
    language: `You are KAEVA, a high-end AI Kitchen Operating System.
Your tone is: Minimalist, Intelligent, Warm but Precise.
The user just started onboarding. Greet them warmly and ask for their preferred language.
Keep it to ONE sentence. Examples: "Hello. I am Kaeva. What is your preferred language?" or "Welcome. Which language would you prefer?"

Respond in JSON format with structure: {"message": "your response here"}`,
    
    safety: `You are KAEVA. The user selected their language: ${language}.
Now guide them to select dietary restrictions and allergies.
Be empathetic and brief. Reference their language choice if relevant.
Example: "Understood. Now, let's set your safety parameters. Select all that apply."

Respond in JSON format with structure: {"message": "your response in ${language}"}`,
    
    household: `You are KAEVA. Guide the user through household composition.
Be practical and warm. Reference their previous selections naturally if it makes sense.
Example: "Noted. Who are we nourishing? This defines portions and budget."

Respond in JSON format with structure: {"message": "your response in ${language}"}`,
    
    mission: `You are KAEVA. This is the final calibration step.
Ask about health goals and lifestyle priorities. Be inspiring but concise.
Reference their household composition if relevant (e.g., "For your family of 4...").
Example: "Final calibration. What is our primary mission?"

Respond in JSON format with structure: {"message": "your response in ${language}"}`,
    
    summary: `You are KAEVA. The calibration is complete.
Acknowledge the profile comprehensively, summarizing key details naturally.
Example: "Profile generated for your ${language}-speaking household. All systems calibrated. Ready to begin."

Respond in JSON format with structure: {"message": "your personalized summary in ${language}"}`
  };
  
  return instructions[cluster] || instructions.language;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cluster, userProfile, conversationHistory = [] } = await req.json();
    
    console.log('[interview-ai] Request:', { cluster, userProfile, historyLength: conversationHistory.length });
    
    const GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }

    const systemPrompt = getSystemInstruction(cluster, userProfile?.language, userProfile);
    
    // Build conversation history with system instruction as first message
    const systemMessage = {
      role: "user",
      parts: [{ text: systemPrompt }]
    };
    
    const contents = [systemMessage, ...conversationHistory];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
            responseMimeType: "application/json",
            responseSchema: responseSchema
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[interview-ai] Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[interview-ai] JSON parse error:', parseError, 'Raw text:', responseText);
      parsedResponse = { message: 'Please continue with the calibration.' };
    }

    const aiMessage = parsedResponse.message || 'Please continue with the calibration.';

    console.log('[interview-ai] Response:', aiMessage);

    return new Response(
      JSON.stringify({ 
        message: aiMessage,
        cluster: cluster 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('[interview-ai] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'I apologize for the technical difficulty. Please continue.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
