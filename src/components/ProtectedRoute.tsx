import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import LoadingState from "@/components/LoadingState";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isReady, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isReady && !isAuthenticated && !isLoading) {
      navigate("/auth", { replace: true });
    }
  }, [isReady, isAuthenticated, isLoading, navigate]);

  if (!isReady || isLoading) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
