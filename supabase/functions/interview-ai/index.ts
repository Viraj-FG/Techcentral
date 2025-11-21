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

const getSystemInstruction = (cluster: string, language: string = 'English') => {
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

    const systemPrompt = getSystemInstruction(cluster, userProfile?.language);
    
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
