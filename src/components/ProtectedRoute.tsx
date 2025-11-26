import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Centralized authentication guard
 * 
 * Ensures user is authenticated before rendering protected content.
 * Stores intended destination for post-auth redirect.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // Store current path for redirect after login
        sessionStorage.setItem('kaeva_redirect_after_auth', location.pathname + location.search);
        navigate('/auth', { replace: true });
      } else if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Store intended destination
        sessionStorage.setItem('kaeva_redirect_after_auth', location.pathname + location.search);
        navigate('/auth', { replace: true });
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate('/auth', { replace: true });
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
