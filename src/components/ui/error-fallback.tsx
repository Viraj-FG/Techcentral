import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "./button";
import { useNavigate } from "react-router-dom";

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
}

export const ErrorFallback = ({ error, resetError }: ErrorFallbackProps) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    resetError();
    navigate('/app');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
      <div className="glass-card p-8 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground">
            We encountered an unexpected error. Please try again.
          </p>
        </div>

        {error && (
          <details className="text-left">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              Technical details
            </summary>
            <pre className="mt-2 text-xs text-muted-foreground bg-background/50 p-3 rounded overflow-auto max-h-32">
              {error.message}
            </pre>
          </details>
        )}

        <div className="flex gap-3">
          <Button
            onClick={resetError}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={handleGoHome}
            className="flex-1"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
};
