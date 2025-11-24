import { createContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_name?: string;
  onboarding_completed: boolean;
  permissions_granted?: boolean;
  language?: string;
  current_household_id?: string;
  [key: string]: any;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      setProfile(data);
      return data;
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // State will be updated by onAuthStateChange listener
    } catch (err: any) {
      const errorMessage = err.message || "Failed to sign in";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    
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
    } catch (err: any) {
      const errorMessage = err.message || "Failed to sign up";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsReady(false);
    } catch (err: any) {
      console.error("Sign out error:", err);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Set up auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;

            console.log('🔐 Auth event:', event);

            if (event === 'SIGNED_IN' && session) {
              setSession(session);
              setUser(session.user);
              const profile = await loadProfile(session.user.id);
              if (mounted) {
                setIsReady(true);
              }
            }

            if (event === 'SIGNED_OUT') {
              setSession(null);
              setUser(null);
              setProfile(null);
              setIsReady(false);
            }

            if (event === 'TOKEN_REFRESHED' && session) {
              setSession(session);
            }
          }
        );

        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && mounted) {
          // Let onAuthStateChange handle all state updates for consistency
          setIsReady(true);
        } else {
          setIsReady(true);
        }

        setIsLoading(false);

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error("Auth initialization error:", err);
        if (mounted) {
          setIsLoading(false);
          setIsReady(true);
        }
      }
    };

    initAuth();
  }, []);

  const value: AuthContextValue = {
    session,
    user,
    profile,
    isLoading,
    isReady,
    isAuthenticated: !!session && !!user,
    error,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
