interface DeceptionFlag {
  type: 'hidden_sugar' | 'misleading_claim' | 'serving_manipulation' | 'ingredient_obfuscation';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface DietaryConflict {
  claim: string;
  conflict: string;
  severity: 'low' | 'medium' | 'high';
}

export async function analyzeProductDeception(
  productName: string,
  ingredients: string,
  nutritionLabel: any,
  healthClaims: string[]
): Promise<{ deceptionFlags: DeceptionFlag[]; dietaryConflicts: DietaryConflict[] }> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    console.log('LOVABLE_API_KEY not configured, skipping deception analysis');
    return { deceptionFlags: [], dietaryConflicts: [] };
  }

  try {
    const prompt = `Analyze this food product for deceptive marketing practices:

Product: ${productName}
Ingredients: ${ingredients || 'Not provided'}
Nutrition per serving: ${JSON.stringify(nutritionLabel || {})}
Health claims: ${healthClaims.join(', ') || 'None'}

Identify:
1. Hidden sugars (alternate names like evaporated cane juice, dextrose, maltose)
2. Misleading health claims (e.g., "natural" doesn't mean healthy, "gluten-free" on naturally gluten-free items)
3. Serving size manipulation (unrealistic serving sizes to hide high calories/sugar)
4. Ingredient obfuscation (breaking ingredients into multiple entries)

Respond ONLY with valid JSON:
{
  "deceptionFlags": [
    {
      "type": "hidden_sugar|misleading_claim|serving_manipulation|ingredient_obfuscation",
      "description": "specific issue found",
      "severity": "low|medium|high"
    }
  ],
  "dietaryConflicts": [
    {
      "claim": "health claim made",
      "conflict": "actual conflict found",
      "severity": "low|medium|high"
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a nutrition expert identifying deceptive food marketing. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error('Deception analysis failed:', response.status);
      return { deceptionFlags: [], dietaryConflicts: [] };
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      return { deceptionFlags: [], dietaryConflicts: [] };
    }

    // Parse JSON response
    const cleanJson = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanJson);

    return {
      deceptionFlags: result.deceptionFlags || [],
      dietaryConflicts: result.dietaryConflicts || [],
    };

  } catch (error) {
    console.error('Deception analysis error:', error);
    return { deceptionFlags: [], dietaryConflicts: [] };
  }
}
