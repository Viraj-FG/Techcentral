import { supabase } from "@/integrations/supabase/client";
import { transformProfileData, ConversationState } from "./onboardingTransforms";

/**
 * Log error to conversation history for admin debugging
 */
const logError = async (step: string, error: any, data?: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  const errorLog = {
    timestamp: new Date().toISOString(),
    step,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    data,
    userId: user?.id
  };
  console.error(`❌ SAVE ERROR [${step}]:`, errorLog);
  
  const { error: logInsertError } = await supabase.from('conversation_history').insert({
    user_id: user?.id || 'unknown',
    conversation_id: crypto.randomUUID(),
    role: 'system',
    message: `[${step}] ${errorLog.error}`,
    metadata: errorLog
  });
  
  if (logInsertError) {
    console.error("Failed to log error to DB:", logInsertError);
  }
};

/**
 * Save onboarding data to database
 */
export const saveOnboardingData = async (state: ConversationState): Promise<boolean> => {
  console.log("💾 SAVE Step 1: Starting database save...");
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    await logError("auth-check", new Error("No authenticated user"), null);
    return false;
  }
  console.log("✅ SAVE Step 1: User authenticated:", session.user.id);

  const userId = session.user.id;

  try {
    console.log("💾 SAVE Step 2: Raw conversationState:", JSON.stringify(state, null, 2));
    
    console.log("💾 SAVE Step 3: Transforming profile data");
    const transformedData = transformProfileData(state);
    console.log("✅ SAVE Step 3: Transformed data:", JSON.stringify(transformedData, null, 2));

    // Create household first (CRITICAL: Must exist before profile update)
    console.log("💾 SAVE Step 4: Creating household for user");
    const { data: existingHousehold } = await supabase
      .from('households')
      .select('id')
      .eq('owner_id', userId)
      .single();

    let householdId: string;

    if (existingHousehold) {
      console.log("✅ SAVE Step 4: Using existing household:", existingHousehold.id);
      householdId = existingHousehold.id;
    } else {
      const userName = state.userName || session.user.email?.split('@')[0] || 'User';
      const { data: newHousehold, error: householdError } = await supabase
        .from('households')
        .insert({
          name: `${userName}'s Household`,
          owner_id: userId
        })
        .select('id')
        .single();

      if (householdError || !newHousehold) {
        await logError("household-create", householdError, { userId, userName });
        return false;
      }

      console.log("✅ SAVE Step 4: Created new household:", newHousehold.id);
      householdId = newHousehold.id;
    }

    // Update profile with household reference
    console.log("💾 SAVE Step 5: Updating profile in database with household link");
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        ...transformedData,
        current_household_id: householdId
      })
      .eq('id', userId);

    if (profileError) {
      await logError("profile-update", profileError, { transformedData, userId, householdId });
      return false;
    }

    console.log("✅ SAVE Step 5: Profile saved successfully with household link");

    // Save household members
    if (state.householdMembers && state.householdMembers.length > 0) {
      console.log(`💾 SAVE Step 6: Preparing ${state.householdMembers.length} household members`);
      const membersToInsert = state.householdMembers.map(member => ({
        user_id: userId,
        member_type: member.type,
        name: member.name || null,
        age: member.age || null,
        age_group: member.ageGroup || null,
        weight: member.biometrics?.weight || null,
        height: member.biometrics?.height || null,
        gender: member.biometrics?.gender || null,
        activity_level: member.biometrics?.activityLevel || null,
        dietary_restrictions: member.dietaryRestrictions || [],
        allergies: member.allergies || [],
        health_conditions: member.healthConditions || []
      }));
      console.log("✅ SAVE Step 6: Members prepared:", membersToInsert);

      console.log("💾 SAVE Step 7: Inserting household members");
      const { error: membersError } = await supabase
        .from('household_members')
        .insert(membersToInsert);

      if (membersError) {
        await logError("household-insert", membersError, { membersToInsert, userId });
      } else {
        console.log(`✅ SAVE Step 7: Saved ${membersToInsert.length} household members`);
      }
    } else {
      console.log("ℹ️ SAVE Step 6-7: No household members to save");
    }

    // Save pets (legacy support)
    if (state.household?.dogs || state.household?.cats) {
      const pets = [];

      for (let i = 0; i < (state.household.dogs || 0); i++) {
        pets.push({
          user_id: userId,
          species: 'Dog',
          name: `Dog ${i + 1}`,
          toxic_flags_enabled: true
        });
      }

      for (let i = 0; i < (state.household.cats || 0); i++) {
        pets.push({
          user_id: userId,
          species: 'Cat',
          name: `Cat ${i + 1}`,
          toxic_flags_enabled: true
        });
      }

      if (pets.length > 0) {
        const { error: petsError } = await supabase.from('pets').insert(pets);
        if (petsError) {
          console.error("❌ Pets insert error:", petsError);
        } else {
          console.log(`✅ Saved ${pets.length} pets`);
        }
      }
    }

    return true;
  } catch (error) {
    console.error("❌ Error saving onboarding data:", error);
    return false;
  }
};
