import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@11labs/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSignedUrl } from "@/lib/elevenLabsAudio";
import { ELEVENLABS_CONFIG } from "@/config/agent";
import { useNavigate } from "react-router-dom";
import { generateConversationId, storeMessage } from "@/lib/conversationUtils";
import { logConversationEvent } from "@/lib/conversationLogger";
import { fetchHouseholdContext, buildInitialContext, buildInventoryUpdate, buildCartUpdate } from "@/lib/contextBuilder";

type ApertureState = "idle" | "listening" | "thinking" | "speaking";

interface UseAssistantVoiceProps {
  userProfile: any;
}

export const useAssistantVoice = ({ userProfile }: UseAssistantVoiceProps) => {
  const [apertureState, setApertureState] = useState<ApertureState>("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [showConversation, setShowConversation] = useState(false);
  const [audioAmplitude, setAudioAmplitude] = useState(0);

  const { toast } = useToast();
  const navigate = useNavigate();
  const conversationIdRef = useRef<string>("");
  const audioIntervalRef = useRef<NodeJS.Timeout>();
  const realtimeChannelRef = useRef<any>(null);
  const lastContextUpdateRef = useRef<number>(0);

  // Define clientTools INLINE to avoid stale closures
  const conversation = useConversation({
    onConnect: async () => {
      console.log("🔌 Assistant agent connected");
      logConversationEvent({
        conversationId: conversationIdRef.current,
        agentType: 'assistant',
        eventType: 'session_start',
        eventData: { timestamp: new Date().toISOString() }
      });

      // Inject initial household context
      if (userProfile?.id && conversation.sendContextualUpdate) {
        try {
          const context = await fetchHouseholdContext(userProfile.id);
          if (context) {
            const contextString = buildInitialContext(context);
            console.log("🧠 Injecting initial context:", contextString);
            await conversation.sendContextualUpdate(contextString);
          }
        } catch (error) {
          console.error("❌ Failed to inject initial context:", error);
        }
      }

      // Set up realtime subscriptions
      setupRealtimeSubscriptions();
    },
    onDisconnect: () => {
      console.log("🔌 Assistant agent disconnected");
      setApertureState("idle");
      logConversationEvent({
        conversationId: conversationIdRef.current,
        agentType: 'assistant',
        eventType: 'session_end',
        eventData: { timestamp: new Date().toISOString() }
      });
    },
    onError: (error) => {
      console.error("❌ Assistant agent error:", error);
      toast({
        title: "Connection Error",
        description: "Voice connection failed. Please try again.",
        variant: "destructive"
      });
      endConversation();
    },
    onMessage: (message) => {
      console.log("📨 Assistant message:", message);
      
      if (message.source === "user") {
        setUserTranscript(message.message);
        storeMessage("user", message.message, conversationIdRef.current);
        logConversationEvent({
          conversationId: conversationIdRef.current,
          agentType: 'assistant',
          eventType: 'user_transcript',
          eventData: { message: message.message },
          role: 'user'
        });
      } else if (message.source === "ai") {
        setAiTranscript(message.message);
        storeMessage("assistant", message.message, conversationIdRef.current);
        logConversationEvent({
          conversationId: conversationIdRef.current,
          agentType: 'assistant',
          eventType: 'agent_transcript',
          eventData: { message: message.message },
          role: 'assistant'
        });
      }
    },
    
    // CLIENT TOOLS DEFINED INLINE - No stale closures!
    clientTools: {
      check_inventory: async (parameters: { query: string }) => {
        console.log("🔍 check_inventory called:", parameters);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            return "ERROR: Not authenticated";
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('current_household_id')
            .eq('id', session.user.id)
            .single();

          if (!profile?.current_household_id) {
            return "ERROR: No household found";
          }

          const { data: items, error } = await supabase
            .from("inventory")
            .select("name, quantity, unit, status, expiry_date, category")
            .eq("household_id", profile.current_household_id)
            .ilike("name", `%${parameters.query}%`)
            .limit(10);

          if (error) throw error;

          if (!items || items.length === 0) {
            return `No items found matching "${parameters.query}"`;
          }

          const itemList = items
            .map((i) => {
              const qty = `${i.quantity || 0}${i.unit ? " " + i.unit : ""}`;
              const status = i.status === "low" ? " (LOW STOCK)" : "";
              const expiry = i.expiry_date
                ? ` - expires ${new Date(i.expiry_date).toLocaleDateString()}`
                : "";
              return `${i.name}: ${qty}${status}${expiry}`;
            })
            .join(", ");

          logConversationEvent({
            conversationId: conversationIdRef.current,
            agentType: 'assistant',
            eventType: 'tool_call',
            eventData: { tool: 'check_inventory', parameters, result: itemList }
          });

          return `Found ${items.length} items: ${itemList}`;
        } catch (error) {
          console.error("❌ check_inventory error:", error);
          return `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      },

      add_to_cart: async (parameters: { item_name: string; reason: string }) => {
        console.log("🛒 add_to_cart called:", parameters);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            return "ERROR: Not authenticated";
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('current_household_id')
            .eq('id', session.user.id)
            .single();

          if (!profile?.current_household_id) {
            return "ERROR: No household found";
          }

          const { error } = await supabase.from("shopping_list").insert({
            household_id: profile.current_household_id,
            item_name: parameters.item_name,
            source: "voice",
            status: "pending",
            quantity: 1,
          });

          if (error) throw error;

          const result = `Added ${parameters.item_name} to cart (reason: ${parameters.reason})`;
          
          logConversationEvent({
            conversationId: conversationIdRef.current,
            agentType: 'assistant',
            eventType: 'tool_call',
            eventData: { tool: 'add_to_cart', parameters, result }
          });

          return result;
        } catch (error) {
          console.error("❌ add_to_cart error:", error);
          return `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      },

      log_meal: async (parameters: { description: string }) => {
        console.log("🍽️ log_meal called:", parameters);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            return "ERROR: Not authenticated";
          }

          const { data, error } = await supabase.functions.invoke("analyze-meal", {
            body: {
              description: parameters.description,
              meal_type: "snack",
            },
          });

          if (error) throw error;

          const nutrition = data?.nutrition || {};
          const result = `Logged: ${parameters.description} (${nutrition.calories || "?"} cal, ${nutrition.protein || "?"}g protein)`;
          
          logConversationEvent({
            conversationId: conversationIdRef.current,
            agentType: 'assistant',
            eventType: 'tool_call',
            eventData: { tool: 'log_meal', parameters, result }
          });

          return result;
        } catch (error) {
          console.error("❌ log_meal error:", error);
          return `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      },

      search_recipes: async (parameters: { constraints?: any }) => {
        console.log("📖 search_recipes called:", parameters);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            return "ERROR: Not authenticated";
          }

          const { data: profile } = await supabase
            .from("profiles")
            .select("allergies")
            .eq("id", session.user.id)
            .single();

          const allergies = (profile?.allergies as string[]) || [];

          const { data, error } = await supabase.functions.invoke(
            "suggest-recipes",
            {
              body: {
                constraints: {
                  ...parameters.constraints,
                  excludeAllergens: allergies,
                },
              },
            }
          );

          if (error) throw error;

          const recipes = data?.recipes || [];
          if (recipes.length === 0) {
            return "No recipes found matching your criteria";
          }

          const recipeList = recipes
            .slice(0, 5)
            .map((r: any) => `${r.name} (${r.cooking_time || "?"}min)`)
            .join(", ");
          
          const result = `Found ${recipes.length} recipes: ${recipeList}`;
          
          logConversationEvent({
            conversationId: conversationIdRef.current,
            agentType: 'assistant',
            eventType: 'tool_call',
            eventData: { tool: 'search_recipes', parameters, result }
          });

          return result;
        } catch (error) {
          console.error("❌ search_recipes error:", error);
          return `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      },

      check_allergens: async (parameters: { ingredient: string }) => {
        console.log("🛡️ check_allergens called:", parameters);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            return "ERROR: Not authenticated";
          }

          const warnings: string[] = [];

          // Check user allergies
          const { data: profile } = await supabase
            .from("profiles")
            .select("allergies")
            .eq("id", session.user.id)
            .single();

          const userAllergies = (profile?.allergies as string[]) || [];
          const ingredient = parameters.ingredient.toLowerCase();

          userAllergies.forEach((allergen) => {
            if (ingredient.includes(allergen.toLowerCase())) {
              warnings.push(
                `⚠️ WARNING: ${parameters.ingredient} contains ${allergen} (YOU are allergic)`
              );
            }
          });

          // Check household member allergies
          const { data: householdMembers } = await supabase
            .from("household_members")
            .select("name, member_type, allergies")
            .eq("user_id", session.user.id);

          householdMembers?.forEach((member) => {
            const allergies = (member.allergies as string[]) || [];
            allergies.forEach((allergen) => {
              if (ingredient.includes(allergen.toLowerCase())) {
                warnings.push(
                  `⚠️ WARNING: ${parameters.ingredient} contains ${allergen} (${member.name || member.member_type} is allergic)`
                );
              }
            });
          });

          // Check pet toxic foods
          const { data: pets } = await supabase
            .from("pets")
            .select("name, species")
            .eq("user_id", session.user.id)
            .eq("toxic_flags_enabled", true);

          if (pets && pets.length > 0) {
            const toxicFoods = [
              "chocolate", "xylitol", "grapes", "raisins",
              "onion", "garlic", "avocado", "macadamia",
            ];
            toxicFoods.forEach((toxic) => {
              if (ingredient.includes(toxic)) {
                pets.forEach((pet) => {
                  warnings.push(
                    `🚨 TOXIC WARNING: ${parameters.ingredient} contains ${toxic} - TOXIC to ${pet.name} (${pet.species})`
                  );
                });
              }
            });
          }

          const result = warnings.length > 0
            ? warnings.join("\n")
            : `✅ SAFE: ${parameters.ingredient} is safe for your household`;

          logConversationEvent({
            conversationId: conversationIdRef.current,
            agentType: 'assistant',
            eventType: 'tool_call',
            eventData: { tool: 'check_allergens', parameters, result }
          });

          return result;
        } catch (error) {
          console.error("❌ check_allergens error:", error);
          return `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      },

      end_conversation: async (parameters: { reason: string }) => {
        console.log("🔚 end_conversation called:", parameters.reason);
        
        logConversationEvent({
          conversationId: conversationIdRef.current,
          agentType: 'assistant',
          eventType: 'tool_call',
          eventData: { tool: 'end_conversation', reason: parameters.reason }
        });

        setTimeout(() => {
          endConversation();
        }, 500);

        return "SUCCESS: Conversation ended";
      },

      navigateTo: async (parameters: { route: string }) => {
        console.log("🧭 navigateTo called:", parameters);
        
        try {
          navigate(parameters.route);
          return `SUCCESS: Navigated to ${parameters.route}`;
        } catch (error) {
          console.error("❌ navigateTo error:", error);
          return `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }
    }
  });

  // Setup realtime subscriptions for contextual updates
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!userProfile?.current_household_id || !conversation.sendContextualUpdate) return;

    // Clean up existing channel
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase
      .channel('assistant-context-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
          filter: `household_id=eq.${userProfile.current_household_id}`
        },
        async (payload) => {
          // Throttle updates (max 1 per 5 seconds)
          const now = Date.now();
          if (now - lastContextUpdateRef.current < 5000) {
            console.log("⏱️ Throttling context update");
            return;
          }
          lastContextUpdateRef.current = now;

          if (conversation.status !== 'connected') return;

          try {
            const updateString = buildInventoryUpdate({
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              item: payload.new || payload.old
            });
            console.log("📦 Sending inventory update:", updateString);
            await conversation.sendContextualUpdate(updateString);
          } catch (error) {
            console.error("❌ Failed to send inventory update:", error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list',
          filter: `household_id=eq.${userProfile.current_household_id}`
        },
        async () => {
          // Throttle updates
          const now = Date.now();
          if (now - lastContextUpdateRef.current < 5000) return;
          lastContextUpdateRef.current = now;

          if (conversation.status !== 'connected') return;

          try {
            // Re-fetch shopping list
            const { data } = await supabase
              .from('shopping_list')
              .select('*')
              .eq('household_id', userProfile.current_household_id)
              .eq('status', 'pending');

            const updateString = buildCartUpdate(data || []);
            console.log("🛒 Sending cart update:", updateString);
            await conversation.sendContextualUpdate(updateString);
          } catch (error) {
            console.error("❌ Failed to send cart update:", error);
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;
  }, [userProfile, conversation]);

  // Real-time audio visualization from SDK
  useEffect(() => {
    if (conversation.status === "connected") {
      audioIntervalRef.current = setInterval(() => {
        if (conversation.isSpeaking) {
          const outputVolume = conversation.getOutputVolume?.() || 0;
          setAudioAmplitude(outputVolume);
        } else {
          const inputVolume = conversation.getInputVolume?.() || 0;
          setAudioAmplitude(inputVolume);
        }
      }, 50);
    } else {
      setAudioAmplitude(0);
    }

    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    };
  }, [conversation.status, conversation.isSpeaking]);

  // Update aperture state based on conversation status
  useEffect(() => {
    if (conversation.isSpeaking) {
      setApertureState("speaking");
    } else if (conversation.status === "connected") {
      setApertureState("listening");
    } else {
      setApertureState("idle");
    }
  }, [conversation.isSpeaking, conversation.status]);

  const startConversation = useCallback(async () => {
    console.log("🚀 Starting assistant conversation");
    setShowConversation(true);
    setApertureState("thinking");

    try {
      conversationIdRef.current = generateConversationId();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const signedUrl = await getSignedUrl(ELEVENLABS_CONFIG.assistant.agentId);
      console.log("🤖 Starting assistant agent");

      await conversation.startSession({ signedUrl });
      setApertureState("listening");
    } catch (error) {
      console.error("❌ Failed to start assistant:", error);
      toast({
        title: "Connection Failed",
        description: "Could not start voice assistant",
        variant: "destructive"
      });
      endConversation();
    }
  }, [conversation, toast]);

  const endConversation = useCallback(async () => {
    console.log("🔚 Ending assistant conversation");
    
    if (conversation.status === "connected") {
      await conversation.endSession();
    }

    conversationIdRef.current = "";
    setUserTranscript("");
    setAiTranscript("");
    setShowConversation(false);
    setApertureState("idle");
    setAudioAmplitude(0);
  }, [conversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversation.status === "connected") {
        conversation.endSession();
      }
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  return {
    apertureState,
    audioAmplitude,
    userTranscript,
    aiTranscript,
    showConversation,
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    startConversation,
    endConversation
  };
};
