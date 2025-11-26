import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface PublicRouteProps {
  children: React.ReactNode;
  /** If true, redirects authenticated users to /app */
  redirectIfAuthenticated?: boolean;
}

/**
 * PublicRoute - For pages that should be accessible to everyone
 * 
 * Optional: Can redirect authenticated users away (e.g., from /auth page)
 */
export const PublicRoute = ({ 
  children, 
  redirectIfAuthenticated = false 
}: PublicRouteProps) => {
  const [isChecking, setIsChecking] = useState(redirectIfAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!redirectIfAuthenticated) {
      setIsChecking(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Check if there's a stored redirect path
          const redirectPath = sessionStorage.getItem('kaeva_redirect_after_auth');
          sessionStorage.removeItem('kaeva_redirect_after_auth');
          
          navigate(redirectPath || '/app', { replace: true });
          return;
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();

    // Listen for auth state changes (e.g., OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && redirectIfAuthenticated) {
        const redirectPath = sessionStorage.getItem('kaeva_redirect_after_auth');
        sessionStorage.removeItem('kaeva_redirect_after_auth');
        navigate(redirectPath || '/app', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectIfAuthenticated, location]);

  if (isChecking) {
    return <div className="fixed inset-0 bg-background" />;
  }

  return <>{children}</>;
};

export default PublicRoute;
