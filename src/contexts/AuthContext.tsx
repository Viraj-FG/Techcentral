import React, { createContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!session;

  useEffect(() => {
    console.log('🔐 AuthContext: Initializing auth state');

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event, session ? 'Session exists' : 'No session');

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setIsLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session) {
            setSession(session);
            setUser(session.user);
            setIsLoading(false);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          if (session) {
            setSession(session);
            setUser(session.user);
          }
        } else {
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Initial session check:', session ? 'Session exists' : 'No session');
      if (session) {
        setSession(session);
        setUser(session.user);
      }
      setIsLoading(false);
    });

    return () => {
      console.log('🔐 AuthContext: Cleaning up');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in for:', email);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Sign in error:', error.message);
      setError(error.message);
    }

    return { error };
  };

  const signUp = async (email: string, password: string) => {
    console.log('🔐 Attempting sign up for:', email);
    setError(null);

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      console.error('❌ Sign up error:', error.message);
      setError(error.message);
    }

    return { error };
  };

  const signOut = async () => {
    console.log('🔐 Signing out');
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    console.log('🔐 Requesting password reset for:', email);
    setError(null);

    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('❌ Password reset error:', error.message);
      setError(error.message);
    }

    return { error };
  };

  const value: AuthContextValue = {
    session,
    user,
    isLoading,
    isAuthenticated,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
