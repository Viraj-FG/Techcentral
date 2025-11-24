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

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (error: any) {
      console.error("Failed to load profile:", error);
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
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔐 Sign in response:', { session: !!session, error });

      if (error) throw error;

      // Don't load profile here - let onAuthStateChange handle it to avoid race condition
      if (session) {
        console.log('🔐 Session received, setting state');
        setSession(session);
        setUser(session.user);
      }
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
        
        // Set up auth listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;

            console.log('🔐 Auth event:', event, { hasSession: !!session });

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
          }
        );

        // THEN check for existing session
        console.log('🔐 Checking for existing session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && mounted) {
          console.log('🔐 Existing session found');
          setSession(session);
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          console.log('🔐 No existing session');
        }

        setIsLoading(false);
        console.log('🔐 Auth initialization complete');

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("🔐 Auth initialization error:", error);
        setIsLoading(false);
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
    refreshSession,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
