import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Splash from "@/components/Splash";
import VoiceOnboarding from "@/components/VoiceOnboarding";
import Dashboard from "@/components/Dashboard";
import LoadingState from "@/components/LoadingState";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appState, setAppState] = useState<"splash" | "onboarding" | "dashboard" | null>(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let mounted = true;

    // Set up timeout for stuck auth check (10 seconds)
    authTimeoutRef.current = setTimeout(() => {
      if (isCheckingAuth && mounted) {
        console.warn("⏱️ Auth check timeout - redirecting to login");
        toast({
          title: "Loading Timeout",
          description: "Authentication is taking too long. Redirecting to login...",
          variant: "destructive",
        });
        navigate("/auth");
      }
    }, 10000);

    const checkAuthAndProfile = async () => {
      console.log('🔍 [Index] Starting auth check...');
      
      // Clear any existing timeout before starting new check
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      
      try {
        // Check authentication
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('🔍 [Index] Session error:', sessionError);
          throw sessionError;
        }

        console.log('🔍 [Index] Session:', session?.user?.email || 'No session');
        
        if (!session || !mounted) {
          console.log('🔍 [Index] No session - redirecting to /auth');
          if (mounted) navigate('/auth');
          return;
        }

        // Check if profile exists and onboarding is complete
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        console.log('🔍 [Index] Profile data:', {
          exists: !!profile,
          onboarding_completed: profile?.onboarding_completed,
          current_household_id: profile?.current_household_id,
          error: profileError
        });

        if (profileError) {
          console.error('🔍 [Index] Profile error:', profileError);
          throw profileError;
        }

        if (!mounted) return;

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

              // Fetch updated profile instead of mutating
              const { data: updatedProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (updatedProfile) {
                profile.current_household_id = updatedProfile.current_household_id;
                console.log('✅ Auto-created household:', household.id);
              } else {
                console.error('Failed to fetch updated profile');
                if (mounted) navigate('/household');
                return;
              }
            } catch (createError) {
              console.error('Failed to auto-create household:', createError);
              // Only redirect if auto-creation fails
              if (mounted) navigate('/household');
              return;
            }
          }
          console.log('🔍 [Index] Setting up dashboard with profile:', profile.id);
          if (mounted) {
            setUserProfile(profile);
            setAppState("dashboard");
          }
        } else {
          console.log('🔍 [Index] Onboarding not completed - showing onboarding flow');
          if (mounted) setAppState("onboarding");
        }
      } catch (error) {
        console.error("❌ [Index] Error checking auth:", error);
        if (mounted) navigate('/auth');
      } finally {
        console.log('🔍 [Index] Auth check complete, setting isCheckingAuth to false');
        if (mounted) setIsCheckingAuth(false);
      }
    };

    checkAuthAndProfile();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 [Index] Auth state change:', event);
      
      // Skip INITIAL_SESSION and SIGNED_IN when already authenticated
      if (event === 'INITIAL_SESSION' || (event === 'SIGNED_IN' && appState === 'dashboard')) {
        return;
      }
      
      if (!session && mounted) {
        navigate('/auth');
      } else if (session && mounted) {
        // Re-check profile when auth state changes
        checkAuthAndProfile();
      }
    });

    return () => {
      mounted = false;
      mountedRef.current = false;
      subscription.unsubscribe();
      
      // Clear timeout on unmount
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, [navigate, toast]);

  console.log('🔍 [Index] Render state:', { isCheckingAuth, appState, hasProfile: !!userProfile });

  if (isCheckingAuth || appState === null) {
    return (
      <div className="fixed inset-0 bg-kaeva-void flex items-center justify-center">
        <LoadingState
          message="Loading Kaeva..."
          timeout={10000}
          onTimeout={() => {
            console.warn("⏱️ Loading timeout - redirecting to login");
            toast({
              title: "Loading Timeout",
              description: "Redirecting to login...",
              variant: "destructive",
            });
            navigate("/auth");
          }}
        />
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
            // Create household and mark onboarding as complete when skipped
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              try {
                // Create a default household first
                const { data: household, error: householdError } = await supabase
                  .from('households')
                  .insert({
                    name: `Default Household`,
                    owner_id: session.user.id
                  })
                  .select()
                  .single();

                if (householdError) throw householdError;

                // Update profile with household and mark onboarding complete
                await supabase
                  .from('profiles')
                  .update({ 
                    onboarding_completed: true,
                    current_household_id: household.id 
                  })
                  .eq('id', session.user.id);
                
                // Fetch updated profile
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                
                if (profile) {
                  setUserProfile(profile);
                  console.log('✅ Household created on skip:', household.id);
                }
              } catch (error) {
                console.error('❌ Failed to create household on skip:', error);
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
