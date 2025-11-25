import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export const useHouseholdInit = () => {
  const { user } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureHousehold = useCallback(async () => {
    if (!user || !profile) return;

    if (profile.current_household_id) {
      return;
    }

    setIsInitializing(true);
    setError(null);

    // Add timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Household initialization timed out')), 10000)
    );

    try {
      await Promise.race([
        (async () => {
          // Check if user already owns a household
          const { data: existingHouseholds } = await supabase
            .from('households')
            .select('id')
            .eq('owner_id', user.id)
            .limit(1);

          if (existingHouseholds && existingHouseholds.length > 0) {
            // Link existing household
            console.log('✅ Found existing household, linking:', existingHouseholds[0].id);
            await supabase
              .from('profiles')
              .update({ current_household_id: existingHouseholds[0].id })
              .eq('id', user.id);
            
            await refreshProfile();
          } else {
            // Create new household
            const { data: household, error: createError } = await supabase
              .from('households')
              .insert({
                name: `${profile.user_name || 'User'}'s Household`,
                owner_id: user.id
              })
              .select()
              .single();

            if (createError) throw createError;

            // Update profile with new household
            await supabase
              .from('profiles')
              .update({ current_household_id: household.id })
              .eq('id', user.id);

            await refreshProfile();
            console.log('✅ Auto-created household:', household.id);
          }
        })(),
        timeoutPromise
      ]);
    } catch (err: any) {
      console.error('❌ Failed to ensure household:', err);
      setError(err.message);
    } finally {
      setIsInitializing(false);
    }
  }, [user, profile, refreshProfile]);

  const completeOnboarding = useCallback(async () => {
    if (!user) return;
    
    console.log('🏁 completeOnboarding started');
    setIsInitializing(true);
    
    // Add timeout for the entire completion process
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Onboarding completion timed out')), 15000)
    );

    try {
      await Promise.race([
        (async () => {
          console.log('📝 Updating profile onboarding_completed=true...');
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ onboarding_completed: true })
            .eq('id', user.id);
          
          if (updateError) throw updateError;
          
          console.log('🏠 Ensuring household exists...');
          await ensureHousehold();
          
          console.log('🔄 Refreshing profile...');
          await refreshProfile();
        })(),
        timeoutPromise
      ]);
      console.log('✅ completeOnboarding finished successfully');
    } catch (err: any) {
      console.error('❌ Failed to complete onboarding:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsInitializing(false);
    }
  }, [user, ensureHousehold, refreshProfile]);

  return { ensureHousehold, completeOnboarding, isInitializing, error };
};
