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

      // Handle household members as structured data
      if (parameters.field === "householdMembers" && Array.isArray(parameters.value)) {
        for (const member of parameters.value) {
          const { error } = await supabase.from('household_members').insert({
            user_id: session.user.id,
            member_type: member.type || 'other',
            name: member.name || null,
            age: member.age || null,
            age_group: member.ageGroup || null,
            allergies: member.allergies || [],
            dietary_restrictions: member.dietaryRestrictions || [],
            health_conditions: member.healthConditions || [],
            gender: member.gender || null,
            weight: member.weight || null,
            height: member.height || null,
            activity_level: member.activityLevel || null
          });

          if (error) console.error("Error storing household member:", error);
        }
        return "Household members saved";
      }

      // Handle pets
      if (parameters.field === "household" && parameters.value.petDetails) {
        for (const pet of parameters.value.petDetails) {
          const { error } = await supabase.from('pets').insert({
            user_id: session.user.id,
            name: pet.name,
            species: pet.type,
            breed: pet.breed || null,
            age: pet.age || null,
            toxic_flags_enabled: true
          });

          if (error) console.error("Error storing pet:", error);
        }
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
          // Handle dogs/cats
          if (parameters.value.dogs || parameters.value.cats) {
            const pets = [];
            for (let i = 0; i < (parameters.value.dogs || 0); i++) {
              pets.push({
                user_id: session.user.id,
                species: 'Dog',
                name: `Dog ${i + 1}`,
                toxic_flags_enabled: true
              });
            }
            for (let i = 0; i < (parameters.value.cats || 0); i++) {
              pets.push({
                user_id: session.user.id,
                species: 'Cat',
                name: `Cat ${i + 1}`,
                toxic_flags_enabled: true
              });
            }
            if (pets.length > 0) {
              await supabase.from('pets').insert(pets);
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
 * Navigate to a different page
 */
export const createNavigateToTool = (navigate: NavigateFunction) => {
  return (parameters: { page: string }) => {
    console.log("🧭 Navigate to:", parameters.page);
    navigate(`/${parameters.page}`);
    return `Navigating to ${parameters.page}`;
  };
};
