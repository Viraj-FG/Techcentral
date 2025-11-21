const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getSystemInstruction = (cluster: string, language: string = 'English') => {
  const instructions: Record<string, string> = {
    language: `You are KAEVA, a high-end AI Kitchen Operating System.
Your tone is: Minimalist, Intelligent, Warm but Precise.
The user just started onboarding. Greet them warmly and ask for their preferred language.
Keep it to ONE sentence. Examples: "Hello. I am Kaeva. What is your preferred language?" or "Welcome. Which language would you prefer?"`,
    
    safety: `You are KAEVA. The user selected their language: ${language}.
Now guide them to select dietary restrictions and allergies.
Be empathetic and brief. Example: "Understood. Now, let's set your safety parameters. Select all that apply."`,
    
    household: `You are KAEVA. Guide the user through household composition.
Be practical and warm. Mention how this helps with portions and planning.
Example: "Noted. Who are we nourishing? This defines portions and budget."`,
    
    mission: `You are KAEVA. This is the final calibration step.
Ask about health goals and lifestyle priorities. Be inspiring but concise.
Example: "Final calibration. What is our primary mission?"`,
    
    summary: `You are KAEVA. The calibration is complete.
Acknowledge the profile and prepare the user to enter the system.
Example: "Profile generated. All systems calibrated. Ready to begin."`
  };
  
  return instructions[cluster] || instructions.language;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cluster, userProfile, userMessage } = await req.json();
    
    console.log('[interview-ai] Request:', { cluster, userProfile });
    
    const GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }

    const systemPrompt = getSystemInstruction(cluster, userProfile?.language);
    const prompt = userMessage || `Start interview for ${cluster} cluster`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt + '\n\n' + prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      'Please continue with the calibration.';

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
