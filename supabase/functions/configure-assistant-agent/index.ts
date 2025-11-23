import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROMPT_VERSION = 'v1.0-assistant';

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

    console.log('=== ASSISTANT AGENT CONFIGURATION START ===');
    console.log('Agent ID:', agentId);
    console.log('Configuration timestamp:', new Date().toISOString());

    // Configure the assistant agent for in-app interactions
    const agentConfig = {
      name: "Kaeva Assistant",
      conversation_config: {
        agent: {
          prompt: {
            prompt: `# Personality

You are Kaeva, an AI Life Operating System assistant helping users manage their household. You are warm, efficient, and proactive.

# Environment

You are assisting a user who has completed onboarding. You have access to their profile data including:
- Name: {{user_name}}
- Daily calorie baseline (TDEE): {{calculated_tdee}}
- Allergies: {{allergies}}
- Household members: {{household_summary}}
- Pets: {{pets_summary}}
- Recent inventory: {{recent_inventory}}

# Tone

Your tone is warm, helpful, and conversational. Keep responses concise and actionable. Use the user's name when appropriate.

# Capabilities

You can help users with:

1. **Inventory Management**
   - Check what's in their fridge, pantry, beauty, or pet supplies
   - Identify items running low or expiring soon
   - Add items to shopping list

2. **Recipe Suggestions**
   - Suggest recipes based on available ingredients
   - Consider dietary restrictions and allergies
   - Factor in household members' needs

3. **Meal Planning**
   - Plan meals within TDEE goals
   - Account for family members and their allergies
   - Suggest healthy alternatives

4. **Shopping Assistance**
   - Review shopping list
   - Suggest items to restock
   - Consider household needs and preferences

5. **Pet Care**
   - Check pet food inventory
   - Alert to toxic ingredients when scanning items
   - Track feeding schedules

6. **Beauty & Self-Care**
   - Track beauty product inventory
   - Suggest products based on skin/hair type
   - Alert to allergens in products

# Interaction Guidelines

- Be proactive: If you notice items expiring soon, suggest recipes
- Be safety-conscious: Always flag allergens and pet-toxic ingredients
- Be helpful: Offer actionable suggestions, not just information
- Be concise: Keep responses under 20 seconds
- Use context: Reference their profile data naturally

# Tools

- updateInventory(action, item_data): Add, update, or remove inventory items
- addToShoppingList(items): Add items to shopping cart
- suggestRecipes(constraints): Get recipe suggestions based on inventory and preferences
- checkAllergens(ingredient): Check if ingredient conflicts with household allergies
- navigateTo(page): Navigate to specific dashboard page

# Response Style

- Start with acknowledgment: "Sure, {{user_name}}" or "Let me check that"
- Provide context: "You have 3 items expiring in the next 2 days"
- Offer actions: "Would you like me to suggest recipes using those ingredients?"
- End with next steps: "I've added milk to your cart. Anything else?"`,
          },
          first_message: "Hi {{user_name}}! How can I help you today?",
          language: "en",
        },
        tts: {
          voice_id: "9BWtsMINqrJLrRacOk9x", // Aria - warm and friendly
        },
      },
      client_tools: [
        {
          name: "updateInventory",
          description: "Add, update, or remove items from the user's inventory",
          parameters: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["add", "update", "remove"],
                description: "Action to perform on inventory"
              },
              item_data: {
                type: "object",
                description: "Item details including name, category, quantity, unit"
              }
            },
            required: ["action", "item_data"]
          }
        },
        {
          name: "addToShoppingList",
          description: "Add items to the user's shopping cart",
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    quantity: { type: "number" },
                    priority: { type: "string", enum: ["low", "medium", "high"] }
                  }
                },
                description: "Array of items to add to shopping list"
              }
            },
            required: ["items"]
          }
        },
        {
          name: "suggestRecipes",
          description: "Get recipe suggestions based on available inventory and user preferences",
          parameters: {
            type: "object",
            properties: {
              constraints: {
                type: "object",
                properties: {
                  use_inventory: { type: "boolean" },
                  max_cook_time: { type: "number" },
                  cuisine_type: { type: "string" }
                },
                description: "Recipe search constraints"
              }
            },
            required: ["constraints"]
          }
        },
        {
          name: "checkAllergens",
          description: "Check if an ingredient conflicts with household allergies or pet toxicity",
          parameters: {
            type: "object",
            properties: {
              ingredient: {
                type: "string",
                description: "Ingredient name to check"
              }
            },
            required: ["ingredient"]
          }
        },
        {
          name: "navigateTo",
          description: "Navigate to a specific page in the dashboard",
          parameters: {
            type: "object",
            properties: {
              page: {
                type: "string",
                enum: ["inventory", "shopping", "recipes", "household", "settings"],
                description: "Page to navigate to"
              }
            },
            required: ["page"]
          }
        },
        {
          name: "endConversation",
          description: "End the conversation when user is finished",
          parameters: {
            type: "object",
            properties: {
              reason: {
                type: "string",
                description: "Reason for ending conversation"
              }
            },
            required: ["reason"]
          }
        }
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
    
    console.log('=== ASSISTANT AGENT CONFIGURATION SUCCESS ===');
    console.log('Agent name:', result.name);
    console.log('Voice ID configured:', result.conversation_config?.tts?.voice_id);
    console.log('Prompt version:', PROMPT_VERSION);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Assistant agent configured successfully',
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
    console.error('=== ASSISTANT AGENT CONFIGURATION FAILED ===');
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Failed to configure ElevenLabs assistant agent'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
