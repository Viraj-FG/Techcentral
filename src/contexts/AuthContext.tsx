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
            if (!mounted || isProcessingAuth) return;
            
            isProcessingAuth = true;
            console.log('🔐 Auth event:', event, { hasSession: !!session });

            try {
              if (event === 'SIGNED_IN' && session) {
                console.log('🔐 SIGNED_IN event - loading profile');
                setSession(session);
                setUser(session.user);
                await loadProfile(session.user.id);
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

              if (event === 'INITIAL_SESSION' && session) {
                console.log('🔐 INITIAL_SESSION event - loading profile');
                setSession(session);
                setUser(session.user);
                await loadProfile(session.user.id);
              }
            } finally {
              isProcessingAuth = false;
            }
          }
        );

        // THEN check for existing session - but DON'T update state here
        // Let onAuthStateChange handle it via INITIAL_SESSION event
        console.log('🔐 Checking for existing session...');
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), 8000)
        );

        try {
          await Promise.race([
            supabase.auth.getSession(),
            timeoutPromise
          ]);
        } catch (err) {
          console.warn('⚠️ Auth initialization check timed out, proceeding with auth state from listener', err);
        }

        // Small delay to allow onAuthStateChange to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
