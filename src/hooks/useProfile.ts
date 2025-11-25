import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  user_name: string | null;
  language: string | null;
  onboarding_completed: boolean;
  current_household_id: string | null;
  household_adults: number | null;
  household_kids: number | null;
  allergies: any;
  dietary_preferences: any;
  health_goals: any;
  lifestyle_goals: any;
  beauty_profile: any;
  user_age: number | null;
  user_gender: string | null;
  user_height: number | null;
  user_weight: number | null;
  user_activity_level: string | null;
  user_zip_code: string | null;
  calculated_tdee: number | null;
  permissions_granted: boolean | null;
  preferred_retailer_id: string | null;
  preferred_retailer_name: string | null;
  last_retailer_refresh: string | null;
  agent_configured: boolean | null;
  agent_configured_at: string | null;
  agent_last_configured_at: string | null;
  agent_prompt_version: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async (userId: string) => {
    console.log('👤 Loading profile for user:', userId);
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Error loading profile:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        console.log('✅ Profile loaded successfully');
        setProfile(data as Profile);
      } else {
        console.warn('⚠️ No profile found for user');
        setProfile(null);
      }
    } catch (err: any) {
      console.error('❌ Exception loading profile:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  // Load profile when we have a user
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setProfile(null);
      setIsLoading(false);
      return;
    }
    
    loadProfile(user.id);
  }, [user?.id, isAuthenticated]);

  return { profile, isLoading, error, refreshProfile };
};
