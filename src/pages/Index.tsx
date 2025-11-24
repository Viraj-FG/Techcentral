import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Splash from "@/components/Splash";
import VoiceOnboarding from "@/components/VoiceOnboarding";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const navigate = useNavigate();
  const [appState, setAppState] = useState<"splash" | "onboarding" | "dashboard" | null>(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      console.log('🔍 [Index] Starting auth check...');
      try {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 [Index] Session:', session?.user?.email || 'No session');
        
        if (!session) {
          console.log('🔍 [Index] No session - redirecting to /auth');
          navigate('/auth');
          return;
        }

        // Check if profile exists and onboarding is complete
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        console.log('🔍 [Index] Profile data:', {
          exists: !!profile,
          onboarding_completed: profile?.onboarding_completed,
          current_household_id: profile?.current_household_id,
          error: profileError
        });

        if (profile?.onboarding_completed) {
          console.log('🔍 [Index] User completed onboarding - checking household...');
          // Ensure user has a household before loading dashboard
          if (!profile.current_household_id) {
            console.warn('User has no household assigned - attempting auto-creation');
            
            // Try to create household automatically
            try {
              const { data: household, error } = await supabase
                .from('households')
                .insert({
                  name: `${profile.user_name || 'User'}'s Household`,
                  owner_id: session.user.id
                })
                .select()
                .single();

              if (error) throw error;

              // Update profile with new household
              await supabase
                .from('profiles')
                .update({ current_household_id: household.id })
                .eq('id', session.user.id);

              profile.current_household_id = household.id;
              console.log('✅ Auto-created household:', household.id);
            } catch (createError) {
              console.error('Failed to auto-create household:', createError);
              // Only redirect if auto-creation fails
              navigate('/household');
              return;
            }
          }
          console.log('🔍 [Index] Setting up dashboard with profile:', profile.id);
          setUserProfile(profile);
          setAppState("dashboard"); // Returning user → Dashboard with voice assistant
        } else {
          console.log('🔍 [Index] Onboarding not completed - showing onboarding flow');
          setAppState("onboarding"); // New user → Onboarding (which includes splash internally)
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        navigate('/auth');
      } finally {
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

  console.log('🔍 [Index] Render state:', { isCheckingAuth, appState, hasProfile: !!userProfile });

  if (isCheckingAuth || appState === null) {
    return (
      <div className="fixed inset-0 bg-kaeva-void flex items-center justify-center">
        <div className="text-kaeva-sage text-lg animate-pulse">Loading Kaeva...</div>
      </div>
    );
  }

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
            // For admin testing: mark onboarding as complete to prevent loop
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              // Update profile to mark onboarding as complete
              await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', session.user.id);
              
              // Fetch updated profile
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              setUserProfile(profile);
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
