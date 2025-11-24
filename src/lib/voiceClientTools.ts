import { supabase } from "@/integrations/supabase/client";
import { NavigateFunction } from "react-router-dom";

/**
 * Update user profile field in the database
 */
export const createUpdateProfileTool = (
  onProfileUpdate?: (profile: any) => void
) => {
  return async (parameters: { field: string; value: any }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return "Not authenticated";

      console.log("💾 Updating profile:", parameters.field, parameters.value);

      let updateData: any = {};

      // Handle household members using transactional RPC
      if (parameters.field === "householdMembers" && Array.isArray(parameters.value)) {
        console.log("Storing household members via batch insert:", parameters.value);
        
        const { data, error } = await supabase.rpc('insert_household_batch', {
          p_user_id: session.user.id,
          p_members: parameters.value,
          p_pets: []
        });

        if (error) {
          console.error("Error storing household data:", error);
          return `ERROR: ${error.message}`;
        }

        console.log("✅ Batch insert successful:", data);
        const result = data as { members_count: number; pets_count: number };
        return `Household members saved (${result.members_count} members)`;
      }

      // Handle pets using transactional RPC
      if (parameters.field === "household" && parameters.value.petDetails) {
        console.log("Storing pets via batch insert:", parameters.value.petDetails);
        
        const { data, error } = await supabase.rpc('insert_household_batch', {
          p_user_id: session.user.id,
          p_members: [],
          p_pets: parameters.value.petDetails
        });

        if (error) {
          console.error("Error storing pets:", error);
          return `ERROR: ${error.message}`;
        }

        console.log("✅ Pets batch insert successful:", data);
      }

      // Map fields to profile columns
      switch (parameters.field) {
        case "userName":
          updateData.user_name = parameters.value;
          break;
        case "userBiometrics":
          updateData = {
            user_age: parameters.value.age,
            user_weight: parameters.value.weight,
            user_height: parameters.value.height,
            user_gender: parameters.value.gender,
            user_activity_level: parameters.value.activityLevel
          };
          break;
        case "dietaryValues":
          updateData.dietary_preferences = parameters.value;
          break;
        case "allergies":
          updateData.allergies = parameters.value;
          break;
        case "beautyProfile":
          updateData.beauty_profile = parameters.value;
          break;
        case "household":
          updateData = {
            household_adults: parameters.value.adults || 1,
            household_kids: parameters.value.kids || 0
          };
          // Handle dogs/cats using transactional RPC
          if (parameters.value.dogs || parameters.value.cats) {
            const pets = [];
            for (let i = 0; i < (parameters.value.dogs || 0); i++) {
              pets.push({
                name: `Dog ${i + 1}`,
                type: 'Dog',
                toxicFlagsEnabled: true
              });
            }
            for (let i = 0; i < (parameters.value.cats || 0); i++) {
              pets.push({
                name: `Cat ${i + 1}`,
                type: 'Cat',
                toxicFlagsEnabled: true
              });
            }
            if (pets.length > 0) {
              await supabase.rpc('insert_household_batch', {
                p_user_id: session.user.id,
                p_members: [],
                p_pets: pets
              });
            }
          }
          break;
        case "healthGoals":
          updateData.health_goals = parameters.value;
          break;
        case "lifestyleGoals":
          updateData.lifestyle_goals = parameters.value;
          break;
        default:
          console.warn("Unknown field:", parameters.field);
          return "Unknown field";
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', session.user.id);

      if (error) throw error;

      if (onProfileUpdate) {
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (updatedProfile) onProfileUpdate(updatedProfile);
      }

      return `Updated ${parameters.field}`;
    } catch (error) {
      console.error("updateProfile error:", error);
      return "Failed to update profile";
    }
  };
};

/**
 * Complete conversation and perform cleanup
 */
export const createCompleteConversationTool = (
  conversationEndSession: () => Promise<void>,
  setters: {
    setShowConversation: (show: boolean) => void;
    setUserTranscript: (text: string) => void;
    setAiTranscript: (text: string) => void;
    setVoiceState: (state: any) => void;
    setApertureState: (state: any) => void;
  },
  onComplete?: (reason: string) => void
) => {
  return async (parameters: { reason: string }) => {
    console.log("🎯 Complete conversation:", parameters.reason);
    
    try {
      await conversationEndSession();
      
      setters.setShowConversation(false);
      setters.setUserTranscript("");
      setters.setAiTranscript("");
      setters.setVoiceState("idle");
      setters.setApertureState("idle");
      
      if (onComplete) {
        onComplete(parameters.reason);
      }
      
      return "SUCCESS: Conversation ended";
    } catch (error) {
      console.error("completeConversation error:", error);
      return `ERROR: ${error instanceof Error ? error.message : "Failed to complete"}`;
    }
  };
};

/**
 * End conversation tool for onboarding
 */
export const createEndConversationTool = (
  conversationEndSession: () => Promise<void>,
  setters: {
    setShowConversation: (show: boolean) => void;
    setUserTranscript: (text: string) => void;
    setAiTranscript: (text: string) => void;
    setVoiceState: (state: any) => void;
    setApertureState: (state: any) => void;
  }
) => {
  return async (parameters: { reason: string }) => {
    console.log("🔚 End conversation called:", parameters.reason);
    
    try {
      await conversationEndSession();
      
      setters.setShowConversation(false);
      setters.setUserTranscript("");
      setters.setAiTranscript("");
      setters.setVoiceState("idle");
      setters.setApertureState("idle");
      
      return "SUCCESS: Conversation ended";
    } catch (error) {
      console.error("endConversation error:", error);
      return `ERROR: ${error instanceof Error ? error.message : "Failed to end conversation"}`;
    }
  };
};

/**
 * Navigate to a different page
 */
export const createNavigateToTool = (navigate: NavigateFunction) => {
  return (parameters: { page: string }) => {
    console.log("🧭 Navigate to:", parameters.page);
    navigate(`/${parameters.page}`);
    return `Navigating to ${parameters.page}`;
  };
};
