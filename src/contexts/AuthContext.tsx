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
      
      // Add timeout for sign in
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timed out')), 10000)
      );

      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        timeoutPromise
      ]) as any;

      const session = data?.session;

      console.log('🔐 Sign in response:', { session: !!session, error });

      if (error) throw error;

      // Don't load profile here - let onAuthStateChange handle it to avoid race condition
      // We do NOT set session/user here manually anymore.
      // The onAuthStateChange listener will pick up the SIGNED_IN event.
    } catch (error: any) {
      console.error('🔐 Sign in error:', error);

      // Check if we actually have a session despite the timeout/error
      if (error.message === 'Sign in timed out') {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          console.log('🔐 Sign in timed out but session was established. Treating as success.');
          return;
        }
      }

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

    const initAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');
        
        // Set a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), 5000)
        );

        // Set up auth listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;

            console.log('🔐 Auth event:', event, { hasSession: !!session });

            if (event === 'SIGNED_IN' && session) {
              console.log('🔐 SIGNED_IN event - Provider:', session.user.app_metadata?.provider);
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
          }
        );

        // THEN check for existing session with timeout
        console.log('🔐 Checking for existing session...');
        
        try {
          const { data } = await Promise.race([
            supabase.auth.getSession(),
            timeoutPromise
          ]) as any;
          
          const session = data?.session;
          
          if (session && mounted) {
            console.log('🔐 Existing session found');
            setSession(session);
            setUser(session.user);
            await loadProfile(session.user.id);
          } else {
            console.log('🔐 No existing session');
          }
        } catch (err) {
          console.warn('⚠️ Auth initialization timed out or failed, proceeding as logged out', err);
        }

        if (mounted) setIsLoading(false);
        console.log('🔐 Auth initialization complete');

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
