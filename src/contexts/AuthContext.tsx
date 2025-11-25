import { createContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logError, isNetworkError, isAuthError } from "@/lib/errorHandler";

interface Profile {
  id: string;
  user_name?: string;
  onboarding_completed: boolean;
  permissions_granted?: boolean;
  language?: string;
  // ... other profile fields
  [key: string]: any;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  const loadProfile = async (userId: string, retries = 3) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data && retries > 0) {
        console.log(`⚠️ Profile not found, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return loadProfile(userId, retries - 1);
      }

      setProfile(data);
      return data;
    } catch (error: any) {
      console.error("Failed to load profile:", error);
      if (retries > 0) {
        console.log(`⚠️ Error loading profile, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return loadProfile(userId, retries - 1);
      }
      logError(error, { component: "AuthContext", action: "loadProfile" });
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  const attemptSessionRecovery = async () => {
    console.log('🔄 Attempting session recovery...');
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session recovery failed:', error);
        return false;
      }

      if (data.session) {
        console.log('✅ Session recovered, reloading profile');
        setSession(data.session);
        setUser(data.session.user);
        await loadProfile(data.session.user.id);
        
        toast({
          title: "Connection Restored",
          description: "Your session has been recovered.",
        });
        return true;
      } else {
        console.log('❌ No session found during recovery');
        return false;
      }
    } catch (error) {
      console.error('❌ Session recovery error:', error);
      return false;
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        await loadProfile(data.session.user.id);
      }
    } catch (error: any) {
      console.error("Session refresh failed:", error);
      logError(error, { component: "AuthContext", action: "refreshSession" });
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 signIn called with email:', email);
    setError(null);
    try {
      console.log('🔐 Calling supabase.auth.signInWithPassword...');
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('🔐 Sign in successful - onAuthStateChange will handle state updates');
      // Don't manually update state - onAuthStateChange will handle it
    } catch (error: any) {
      console.error('🔐 Sign in error:', error);

      const categorizedError = logError(error, {
        component: "AuthContext",
        action: "signIn",
      });

      let errorMessage = categorizedError.userMessage;
      if (isAuthError(error)) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (isNetworkError(error)) {
        errorMessage = "Network error. Please check your internet connection.";
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signUp = async (email: string, password: string) => {
    setError(null);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;
    } catch (error: any) {
      const categorizedError = logError(error, {
        component: "AuthContext",
        action: "signUp",
      });

      let errorMessage = categorizedError.userMessage;
      if (isAuthError(error)) {
        errorMessage = "Unable to create account. Please check your email and password.";
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      const redirectUrl = `${window.location.origin}/auth?type=recovery`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      if (error) throw error;
    } catch (error: any) {
      const categorizedError = logError(error, {
        component: "AuthContext",
        action: "resetPassword",
      });
      setError(categorizedError.userMessage);
      throw new Error(categorizedError.userMessage);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (error: any) {
      logError(error, { component: "AuthContext", action: "signOut" });
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let isProcessingAuth = false;

    const initAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');

        // Set up auth listener FIRST - this is the single source of truth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            
            console.log('🔐 Auth event:', event, { hasSession: !!session });

            // Handle session-based events (SIGNED_IN and INITIAL_SESSION)
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
              // Avoid duplicate processing if we already have this user's profile
              if (profile?.id === session.user.id) {
                console.log('🔐 Profile already loaded for this user, skipping');
                return;
              }
              
              isProcessingAuth = true;
              try {
                console.log(`🔐 ${event} event - loading profile`);
                setSession(session);
                setUser(session.user);
                await loadProfile(session.user.id);
              } finally {
                isProcessingAuth = false;
              }
            }

            if (event === 'SIGNED_OUT') {
              console.log('🔐 SIGNED_OUT event');
              setSession(null);
              setUser(null);
              setProfile(null);
            }

            if (event === 'TOKEN_REFRESHED' && session) {
              console.log('🔐 TOKEN_REFRESHED event');
              setSession(session);
            }
          }
        );

        // THEN check for existing session - but DON'T update state here
        // Let onAuthStateChange handle it via INITIAL_SESSION event
        console.log('🔐 Checking for existing session...');
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), 15000)
        );

        let sessionData;
        try {
          const result = await Promise.race([
            supabase.auth.getSession(),
            timeoutPromise
          ]);
          sessionData = result;
        } catch (err) {
          console.warn('⚠️ Auth initialization check timed out, proceeding with auth state from listener', err);
        }

        // Small delay to allow onAuthStateChange to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Fallback: If we have a session but no profile loaded, load it explicitly
        if (mounted && sessionData?.data?.session && !profile) {
          console.log('🔐 Fallback: Session exists but profile not loaded, loading explicitly');
          const currentSession = sessionData.data.session;
          setSession(currentSession);
          setUser(currentSession.user);
          await loadProfile(currentSession.user.id);
        }
        
        if (mounted) {
          setIsLoading(false);
          console.log('🔐 Auth initialization complete');
        }

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("🔐 Auth initialization error:", error);
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Connection monitoring and automatic session recovery
  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 Connection restored');
      setIsOnline(true);
      
      // If we have a user but no profile, attempt recovery
      if (user && !profile) {
        console.log('🔄 User session exists but profile missing, attempting recovery');
        await attemptSessionRecovery();
      } else if (session) {
        // We have both session and profile, just refresh to ensure data is fresh
        console.log('🔄 Refreshing session after reconnection');
        await refreshSession();
        
        toast({
          title: "Back Online",
          description: "Connection restored.",
        });
      }
    };

    const handleOffline = () => {
      console.log('📡 Connection lost');
      setIsOnline(false);
      
      toast({
        title: "Connection Lost",
        description: "You're currently offline. Changes will sync when reconnected.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, profile, session]);

  // Periodic session health check when online
  useEffect(() => {
    if (!isOnline || !session) return;

    const healthCheckInterval = setInterval(async () => {
      try {
        // Quick health check: verify session is still valid
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          console.warn('⚠️ Session health check failed, attempting recovery');
          await attemptSessionRecovery();
        }
      } catch (error) {
        console.error('❌ Session health check error:', error);
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(healthCheckInterval);
  }, [isOnline, session]);

  const value: AuthContextValue = {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated: !!session && !!user,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshSession,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
