import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseLogger";
import { logger } from "@/lib/logger";
import Splash from "@/components/Splash";
import VoiceOnboarding from "@/components/VoiceOnboarding";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const navigate = useNavigate();
  const [appState, setAppState] = useState<"splash" | "onboarding" | "dashboard" | null>(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authCheckTimeout, setAuthCheckTimeout] = useState(false);

  useEffect(() => {
    logger.info('🚀 Index.tsx mounted - Starting auth check');
    
    // Timeout detection - if auth check takes more than 10 seconds
    const timeoutId = setTimeout(() => {
      logger.error('⏱️ Auth check timeout - taking longer than 10 seconds');
      setAuthCheckTimeout(true);
    }, 10000);

    const validateOnboardingComplete = async (userId: string, householdId: string | null): Promise<boolean> => {
      logger.debug('🔍 Validating onboarding completion', { userId, householdId });
      
      // Check 1: Has household assigned
      if (!householdId) {
        logger.warn('❌ Validation failed: No household ID');
        return false;
      }
      
      // Check 2: Household exists in database
      logger.debug('🔍 Checking household existence in database', { householdId });
      const { data: household, error: householdError } = await supabase
        .from('households')
        .select('id')
        .eq('id', householdId)
        .single();
      
      if (householdError) {
        logger.error('❌ Error fetching household', householdError, { householdId });
        return false;
      }
      
      if (!household) {
        logger.warn('❌ Validation failed: Household not found in database');
        return false;
      }
      logger.debug('✅ Household found in database');
      
      // Check 3: Has at least basic profile data
      logger.debug('🔍 Checking profile data completeness', { userId });
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_name, language')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        logger.error('❌ Error fetching profile for validation', profileError, { userId });
        return false;
      }
      
      if (!profile?.user_name) {
        logger.warn('❌ Validation failed: Missing user_name');
        return false;
      }
      
      logger.info('✅ Onboarding validation passed');
      return true; // All checks passed
    };

    const checkAuthAndProfile = async () => {
      try {
        logger.info('🔐 Checking authentication session');
        
        // Check authentication
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.error('❌ Error getting session', sessionError);
          navigate('/auth');
          return;
        }
        
        if (!session) {
          logger.warn('⚠️ No active session - redirecting to auth');
          navigate('/auth');
          return;
        }

        logger.info('✅ Active session found', { userId: session.user.id, email: session.user.email });

        // Check if profile exists and onboarding is complete
        logger.debug('📋 Fetching user profile', { userId: session.user.id });
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          logger.error('❌ Error fetching profile', profileError, { userId: session.user.id });
          throw profileError;
        }

        if (!profile) {
          logger.warn('⚠️ No profile found - redirecting to auth');
          navigate('/auth');
          return;
        }

        logger.info('📋 Profile loaded', { 
          userId: profile.id, 
          userName: profile.user_name,
          onboardingCompleted: profile.onboarding_completed,
          hasHousehold: !!profile.current_household_id
        });

        if (profile?.onboarding_completed) {
          logger.info('🔍 Profile marked as onboarding complete - validating...');
          
          // Validate that onboarding is truly complete
          const isValid = await validateOnboardingComplete(session.user.id, profile.current_household_id);
          
          if (!isValid) {
            logger.warn('❌ Incomplete onboarding detected - resetting to restart');
            
            // Reset onboarding_completed flag
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ onboarding_completed: false })
              .eq('id', session.user.id);
            
            if (updateError) {
              logger.error('❌ Error resetting onboarding flag', updateError);
            } else {
              logger.info('✅ Onboarding flag reset successfully');
            }
            
            logger.info('🎯 Setting app state to: onboarding');
            setAppState("onboarding");
            return;
          }

          // Onboarding is valid, proceed to dashboard
          logger.info('✅ Onboarding validation successful - proceeding to dashboard');
          setUserProfile(profile);
          logger.info('🎯 Setting app state to: dashboard');
          setAppState("dashboard");
        } else {
          logger.info('📝 Onboarding not completed - showing onboarding flow');
          logger.info('🎯 Setting app state to: onboarding');
          setAppState("onboarding");
        }
      } catch (error) {
        logger.error('❌ Error in checkAuthAndProfile', error as Error);
        navigate('/auth');
      } finally {
        clearTimeout(timeoutId);
        logger.info('🏁 Auth check complete - setting isCheckingAuth to false');
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndProfile();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isCheckingAuth || appState === null) {
    return (
      <div className="fixed inset-0 bg-kaeva-void flex items-center justify-center">
        <div className="text-kaeva-sage text-lg animate-pulse">
          {authCheckTimeout ? 'Connection taking longer than expected...' : 'Loading Kaeva...'}
        </div>
        {authCheckTimeout && (
          <div className="absolute bottom-8 text-center">
            <p className="text-white/60 text-sm mb-2">Check the browser console for details</p>
          </div>
        )}
      </div>
    );
  }

  logger.debug('🎨 Rendering Index with state', { appState, hasProfile: !!userProfile });

  return (
    <AnimatePresence mode="wait">
      {appState === "onboarding" && (
        <VoiceOnboarding 
          key="voice-onboarding"
          onComplete={(profile) => {
            setUserProfile(profile);
            setAppState("dashboard");
          }}
          onExit={async () => {
            // Skip to dashboard WITHOUT marking onboarding complete
            // This allows users to come back and finish later
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (profile) {
                setUserProfile(profile);
              }
            }
            setAppState("dashboard");
          }}
        />
      )}
      
      {appState === "dashboard" && userProfile && (
        <Dashboard key="dashboard" profile={userProfile} />
      )}
    </AnimatePresence>
  );
};

export default Index;
