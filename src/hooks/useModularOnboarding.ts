import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type OnboardingModule = 'core' | 'nutrition' | 'pantry' | 'beauty' | 'pets' | 'household';

export interface ModularOnboardingState {
  core: boolean;
  nutrition: boolean;
  pantry: boolean;
  beauty: boolean;
  pets: boolean;
  household: boolean;
}

const DISMISSED_KEY = 'dismissed_onboarding_prompts';

export const useModularOnboarding = () => {
  const [modules, setModules] = useState<ModularOnboardingState>({
    core: false,
    nutrition: false,
    pantry: false,
    beauty: false,
    pets: false,
    household: false,
  });
  const [loading, setLoading] = useState(true);
  const [dismissedThisSession, setDismissedThisSession] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadModules();
    
    // Load dismissed prompts from sessionStorage
    const stored = sessionStorage.getItem(DISMISSED_KEY);
    if (stored) {
      setDismissedThisSession(new Set(JSON.parse(stored)));
    }
  }, []);

  const loadModules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_modules')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.onboarding_modules && typeof data.onboarding_modules === 'object') {
        setModules(data.onboarding_modules as unknown as ModularOnboardingState);
      }
    } catch (error) {
      console.error('Error loading onboarding modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const isModuleComplete = (module: OnboardingModule): boolean => {
    return modules[module];
  };

  const completeModule = async (module: OnboardingModule): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const updatedModules = { ...modules, [module]: true };

      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_modules: updatedModules })
        .eq('id', user.id);

      if (error) throw error;

      setModules(updatedModules);
      return true;
    } catch (error) {
      console.error('Error completing module:', error);
      return false;
    }
  };

  const isDismissedThisSession = (module: OnboardingModule): boolean => {
    return dismissedThisSession.has(module);
  };

  const dismissPrompt = (module: OnboardingModule) => {
    const updated = new Set(dismissedThisSession);
    updated.add(module);
    setDismissedThisSession(updated);
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(updated)));
  };

  const allModulesComplete = (): boolean => {
    return Object.values(modules).every(completed => completed);
  };

  const completionPercentage = (): number => {
    const completed = Object.values(modules).filter(Boolean).length;
    return Math.round((completed / 6) * 100);
  };

  return {
    modules,
    loading,
    isModuleComplete,
    completeModule,
    isDismissedThisSession,
    dismissPrompt,
    allModulesComplete,
    completionPercentage,
    reloadModules: loadModules,
  };
};
