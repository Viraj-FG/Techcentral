import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    console.log('=== AGENT PROVISIONING START ===');
    console.log('Timestamp:', new Date().toISOString());

    // Define agent configurations with known agent IDs
    const agentConfigs = [
      {
        type: 'onboarding',
        agentId: 'agent_0501kakwnx5rffaby5px9y1pskkb', // Known agent ID
        name: 'Kaeva Onboarding',
        config: {
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

1. **Identity**: Ask: "What's your name?" Then call updateProfile({ userName: name }).

2. **Biometrics** (CLINICAL GRADE):
   - Say: "To provide medical-grade nutritional guidance, I need some basic metrics."
   - Ask: "How old are you?"
   - Ask: "What's your current weight?" (listen for kg/lbs)
   - Ask: "And your height?" (listen for cm/feet)
   - Ask: "How would you describe your gender?"
   - Ask: "How active are you? Sedentary, lightly active, moderately active, very active, or extremely active?"
   - Then call updateProfile({ userAge: age, userWeight: weight, userHeight: height, userGender: gender, userActivityLevel: activityLevel })
   - Tell them: "Your baseline is [TDEE] calories per day"

3. **The Palate**:
   - Ask about dietary values (Halal, Kosher, Vegan, Vegetarian, etc.)
   - Ask about food allergies (Nuts, Gluten, Dairy, Shellfish, etc.)
   - Then call updateProfile({ dietaryPreferences: array })
   - Then call updateProfile({ allergies: array })

4. **The Mirror**:
   - Ask: "What's your skin type?" (Dry, Oily, Combination, Sensitive, Normal)
   - Ask: "And your hair type?" (Straight, Wavy, Curly, Coily)
   - Then call updateProfile({ skinType: skinType, hairType: hairType })

5. **The Tribe** (Household):
   - Ask: "Who lives with you? Tell me about your household."
   - For children: Ask age and allergies.
   - For elderly: Ask dietary restrictions and health conditions.
   - For pets: Note toxic ingredient safety.
   - Then call updateProfile({ householdAdults: count, householdKids: count })

6. **The Mission**:
   - Ask about health goals (Weight Loss, Muscle Gain, Heart Health, Energy)
   - Ask about lifestyle goals (Meal Prep, New Cuisines, Self-Care)
   - Then call updateProfile({ healthGoals: array, lifestyleGoals: array })

# DEBUG SHORTCUTS

**MAGIC WORD: "Jimmy Jim"**

If the user says "Jimmy Jim" at ANY point during the conversation:
1. IMMEDIATELY stop the interview flow
2. Say: "Debug mode activated. Completing onboarding now."
3. Call completeConversation({ summary: "Magic word activation", reason: "magic_word_activated" })
4. DO NOT ask for confirmation or additional information

# Guardrails

- Only ask one question at a time.
- Keep responses under 15 seconds.
- Do not deviate from the onboarding interview flow.
- If a user provides information that is not directly requested, acknowledge it but do not store it unless it fits within the defined data points.
- Do not offer advice or opinions.
- If a tool fails, retry up to 3 times.

# Tools

- updateProfile({ userName?, userAge?, userWeight?, userHeight?, userGender?, userActivityLevel?, dietaryPreferences?, allergies?, skinType?, hairType?, householdAdults?, householdKids?, healthGoals?, lifestyleGoals? }): Update user profile with named parameters. Pass only the fields you want to update.
- completeConversation({ summary }): End conversation after successful onboarding completion.
- endConversation({ reason }): End conversation if user wants to exit early.

**COMPLETION CRITERIA**:

When ALL data is collected: Name, Biometrics, Dietary/Allergies, Beauty Profile, Household, Goals.

**FINAL STEP - CRITICAL**:

1. Say: "Perfect, {{name}}. Your digital twin is complete."
2. IMMEDIATELY call completeConversation({ summary: "Onboarding completed successfully with all profile data collected" })
3. DO NOT wait for user response.

**CONVERSATION ENDERS - DETECT & EXIT**:

If user says ANY of these after completing onboarding:

- "Nothing else" / "That's all" / "I'm done" / "No more"
- "Thank you" / "Thanks" / "Appreciate it"
- "Goodbye" / "Bye" / "See you"

IMMEDIATELY call endConversation({ reason: "user_exit" }) without asking for confirmation.`,
                tools: [
                  {
                    type: "client",
                    name: "updateProfile",
                    description: "Save user profile information immediately as you collect it during onboarding. Pass only the fields you want to update.",
                    parameters: {
                      type: "object",
                      properties: {
                        userName: { type: "string", description: "User's full name" },
                        userAge: { type: "number", description: "User's age in years" },
                        userWeight: { type: "number", description: "User's weight in kg or lbs" },
                        userHeight: { type: "number", description: "User's height in cm or inches" },
                        userGender: { type: "string", description: "User's gender identity" },
                        userActivityLevel: { type: "string", description: "Activity level: sedentary, lightly_active, moderately_active, very_active, extremely_active" },
                        dietaryPreferences: { type: "array", items: { type: "string" }, description: "Array of dietary preferences (Halal, Kosher, Vegan, Vegetarian, etc.)" },
                        allergies: { type: "array", items: { type: "string" }, description: "Array of food allergies (Nuts, Gluten, Dairy, Shellfish, etc.)" },
                        skinType: { type: "string", description: "Skin type: dry, oily, combination, sensitive, normal" },
                        hairType: { type: "string", description: "Hair type: straight, wavy, curly, coily" },
                        householdAdults: { type: "number", description: "Number of adults in household" },
                        householdKids: { type: "number", description: "Number of children in household" },
                        healthGoals: { type: "array", items: { type: "string" }, description: "Array of health goals (Weight Loss, Muscle Gain, Heart Health, Energy)" },
                        lifestyleGoals: { type: "array", items: { type: "string" }, description: "Array of lifestyle goals (Meal Prep, New Cuisines, Self-Care)" }
                      },
                      required: []
                    },
                  },
                  {
                    type: "client",
                    name: "completeConversation",
                    description: "BLOCKING TOOL: End conversation after successful onboarding completion. Call when ALL required data is collected.",
                    wait_for_response: true,
                    parameters: {
                      type: "object",
                      properties: {
                        summary: {
                          type: "string",
                          description: "Brief summary of onboarding completion"
                        },
                        reason: {
                          type: "string",
                          description: "Reason for completion - 'onboarding_complete' or 'magic_word_activated'",
                          enum: ["onboarding_complete", "magic_word_activated"]
                        }
                      },
                      required: ["summary"]
                    },
                  },
                  {
                    type: "client",
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
                    type: "client",
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
              },
              first_message: "Hello! I'm Kaeva, your AI Life Operating System. Let's get to know you. What's your name?",
              language: "en",
            },
            tts: {
              voice_id: "9BWtsMINqrJLrRacOk9x",
            },
          },
        }
      },
      {
        type: 'assistant',
        agentId: 'agent_2601kaqwv4ejfhets9fyyafzj2e6', // Known agent ID
        name: 'Kaeva Assistant',
        config: {
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
                tools: [
                  {
                    type: "client",
                    name: "checkInventory",
                    description: "Search the household inventory for specific items",
                    parameters: {
                      type: "object",
                      properties: {
                        query: {
                          type: "string",
                          description: "Search term for inventory items"
                        }
                      },
                      required: ["query"]
                    }
                  },
                  {
                    type: "client",
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
                          description: "Item details including name, category, quantity, unit",
                          properties: {
                            name: { type: "string", description: "Name of the inventory item" },
                            category: { type: "string", description: "Category: fridge, pantry, beauty, pets" },
                            quantity: { type: "number", description: "Quantity of items" },
                            unit: { type: "string", description: "Unit of measurement (kg, lbs, units, etc.)" }
                          }
                        }
                      },
                      required: ["action", "item_data"]
                    }
                  },
                  {
                    type: "client",
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
                              name: { type: "string", description: "Name of the item to add to shopping list" },
                              reason: { type: "string", description: "Reason for adding this item (e.g., 'low stock', 'recipe ingredient')" }
                            }
                          },
                          description: "Array of items to add to shopping list"
                        }
                      },
                      required: ["items"]
                    }
                  },
                  {
                    type: "client",
                    name: "logMeal",
                    description: "Log a meal description for nutritional tracking",
                    parameters: {
                      type: "object",
                      properties: {
                        description: {
                          type: "string",
                          description: "Description of the meal consumed"
                        }
                      },
                      required: ["description"]
                    }
                  },
                  {
                    type: "client",
                    name: "suggestRecipes",
                    description: "Get recipe suggestions based on available inventory and user preferences",
                    parameters: {
                      type: "object",
                      properties: {
                        constraints: {
                          type: "object",
                          properties: {
                            use_inventory: { type: "boolean", description: "Whether to prioritize ingredients currently in inventory" },
                            max_cook_time: { type: "number", description: "Maximum cooking time in minutes" },
                            cuisine_type: { type: "string", description: "Preferred cuisine type (e.g., Italian, Mexican, Asian)" }
                          },
                          description: "Recipe search constraints"
                        }
                      },
                      required: ["constraints"]
                    }
                  },
                  {
                    type: "client",
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
                    type: "client",
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
                    type: "client",
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
              },
              first_message: "Hi {{user_name}}! How can I help you today?",
              language: "en",
            },
            tts: {
              voice_id: "9BWtsMINqrJLrRacOk9x",
            },
          },
        }
      }
    ];

    const results = [];

    // Process each agent using known agent IDs
    for (const agentDef of agentConfigs) {
      console.log(`\n=== Processing ${agentDef.type} agent ===`);
      console.log(`Attempting update with known ID: ${agentDef.agentId}`);

      // Always try to update first using the known agent ID
      const updateResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${agentDef.agentId}`,
        {
          method: 'PATCH',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(agentDef.config),
        }
      );

      if (updateResponse.ok) {
        const updatedAgent = await updateResponse.json();
        console.log(`✅ ${agentDef.type} agent updated successfully`);
        console.log('Agent ID:', updatedAgent.agent_id);
        
        results.push({
          type: agentDef.type,
          status: 'updated',
          agent_id: updatedAgent.agent_id,
          name: updatedAgent.name
        });

      } else if (updateResponse.status === 404) {
        // Agent doesn't exist, try to create it
        console.log(`Agent ID ${agentDef.agentId} not found, creating new agent...`);

        const createResponse = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(agentDef.config),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error(`Failed to create ${agentDef.type} agent:`, errorText);
          results.push({
            type: agentDef.type,
            status: 'error',
            error: `Creation failed: ${createResponse.status} - ${errorText}`
          });
          continue;
        }

        const newAgent = await createResponse.json();
        console.log(`✅ ${agentDef.type} agent created successfully`);
        console.log('New agent ID:', newAgent.agent_id);

        results.push({
          type: agentDef.type,
          status: 'created',
          agent_id: newAgent.agent_id,
          name: newAgent.name
        });

      } else {
        // Other error during update
        const errorText = await updateResponse.text();
        console.error(`Failed to update ${agentDef.type} agent:`, errorText);
        results.push({
          type: agentDef.type,
          status: 'error',
          error: `Update failed: ${updateResponse.status} - ${errorText}`
        });
      }
    }

    console.log('\n=== AGENT PROVISIONING COMPLETE ===');
    console.log('Results:', JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Agents provisioned successfully',
        results,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('=== AGENT PROVISIONING FAILED ===');
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: 'Failed to provision agents'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
