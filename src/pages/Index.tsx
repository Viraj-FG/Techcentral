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
  const isCheckingRef = useRef(false);
  const hasCompletedInitialCheck = useRef(false);

  // Helper to prevent indefinite hangs
  const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout: ${label}`)), ms)
      )
    ]);
  };

  useEffect(() => {
    mountedRef.current = true;
    let mounted = true;

    const checkAuthAndProfile = async () => {
      // Prevent parallel auth checks
      if (isCheckingRef.current) {
        console.log('🔍 [Index] Auth check already in progress, skipping...');
        return;
      }
      
      isCheckingRef.current = true;
      console.log('🔍 [Index] Starting auth check...');
      
      try {
        // Check authentication with timeout
        const { data: { session }, error: sessionError } = await withTimeout(
          supabase.auth.getSession(),
          10000,
          "Auth Session Check"
        );
        
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

        // Check if profile exists and onboarding is complete with timeout
        const { data: profile, error: profileError } = await withTimeout(
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle(),
          10000,
          "Profile Check"
        );

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
            console.warn('User has no household assigned - checking for existing households');
            
            // Check if user already owns a household before creating
            const { data: existingHouseholds } = await supabase
              .from('households')
              .select('id')
              .eq('owner_id', session.user.id)
              .limit(1);
            
            if (existingHouseholds && existingHouseholds.length > 0) {
              // Link existing household
              console.log('✅ Found existing household, linking:', existingHouseholds[0].id);
              await supabase
                .from('profiles')
                .update({ current_household_id: existingHouseholds[0].id })
                .eq('id', session.user.id);
              
              profile.current_household_id = existingHouseholds[0].id;
            } else {
              // Create new household only if none exist
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
        
        // Mark initial check as complete
        hasCompletedInitialCheck.current = true;
      } catch (error) {
        console.error("❌ [Index] Error checking auth:", error);
        if (mounted) {
          toast({
            title: "Connection Error",
            description: "Failed to verify session. Please sign in again.",
            variant: "destructive",
          });
          // Sign out to clear potentially stale session causing loops
          await supabase.auth.signOut();
          navigate('/auth');
        }
      } finally {
        console.log('🔍 [Index] Auth check complete, setting isCheckingAuth to false');
        isCheckingRef.current = false;
        if (mounted) setIsCheckingAuth(false);
      }
    };

    checkAuthAndProfile();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 [Index] Auth state change:', event);
      
      // Skip events during initial check
      if (!hasCompletedInitialCheck.current) {
        console.log('🔍 [Index] Skipping event during initial check:', event);
        return;
      }
      
      // Only handle sign out or subsequent sign ins
      if (event === 'SIGNED_OUT') {
        if (mounted) navigate('/auth');
      } else if (event === 'SIGNED_IN') {
        // Re-authenticate on sign in (e.g., from another tab)
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
          timeout={30000}
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
                // Check for existing household first
                const { data: existingHouseholds } = await supabase
                  .from('households')
                  .select('id')
                  .eq('owner_id', session.user.id)
                  .limit(1);
                
                let householdId: string;
                
                if (existingHouseholds && existingHouseholds.length > 0) {
                  householdId = existingHouseholds[0].id;
                  console.log('✅ Using existing household:', householdId);
                } else {
                  // Create a default household only if none exist
                  const { data: household, error: householdError } = await supabase
                    .from('households')
                    .insert({
                      name: `Default Household`,
                      owner_id: session.user.id
                    })
                    .select()
                    .single();

                  if (householdError) throw householdError;
                  
                  householdId = household.id;
                  console.log('✅ Household created on skip:', householdId);
                }

                // Update profile with household and mark onboarding complete
                await supabase
                  .from('profiles')
                  .update({ 
                    onboarding_completed: true,
                    current_household_id: householdId 
                  })
                  .eq('id', session.user.id);
                
                // Fetch updated profile
                const { data: profile, error: profileError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                
                if (profile && !profileError) {
                  setUserProfile(profile);
                  setAppState("dashboard");
                } else {
                  // Fallback if fetch fails: Reload page to retry full auth check
                  console.error('❌ Failed to fetch profile after skip:', profileError);
                  window.location.reload();
                }
              } catch (error) {
                console.error('❌ Failed to create household on skip:', error);
                // Fallback: Reload page to retry
                window.location.reload();
              }
            }
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
