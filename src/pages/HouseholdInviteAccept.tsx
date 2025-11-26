import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, CheckCircle, XCircle } from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";
import { motion } from "framer-motion";

/**
 * HouseholdInviteAccept - Handles household invite links
 * 
 * This is a PUBLIC route that handles both authenticated and unauthenticated users:
 * 
 * 1. Unauthenticated user:
 *    - Store invite code in sessionStorage
 *    - Redirect to /auth
 *    - After auth, redirect back here with the code
 * 
 * 2. Authenticated user:
 *    - Show invite acceptance UI
 *    - Process invite
 *    - Redirect to /app
 */
export default function HouseholdInviteAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [householdName, setHouseholdName] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const inviteCode = searchParams.get("code");

  useEffect(() => {
    const checkAuthAndValidate = async () => {
      // First, check if we have an invite code
      if (!inviteCode) {
        // Check sessionStorage for a stored code (from pre-auth redirect)
        const storedCode = sessionStorage.getItem('kaeva_pending_invite');
        if (storedCode) {
          sessionStorage.removeItem('kaeva_pending_invite');
          // Redirect with the stored code
          navigate(`/household/join?code=${encodeURIComponent(storedCode)}`, { replace: true });
          return;
        }
        setError("No invite code provided");
        setIsValidating(false);
        return;
      }

      // Check authentication status
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Store invite code and redirect to auth
        sessionStorage.setItem('kaeva_pending_invite', inviteCode);
        sessionStorage.setItem('kaeva_redirect_after_auth', `/household/join?code=${encodeURIComponent(inviteCode)}`);
        navigate('/auth', { replace: true });
        return;
      }

      setIsAuthenticated(true);
      setInviteValid(true);
      setIsValidating(false);
    };

    checkAuthAndValidate();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        // Re-check for pending invite
        const storedCode = sessionStorage.getItem('kaeva_pending_invite');
        if (storedCode && !inviteCode) {
          sessionStorage.removeItem('kaeva_pending_invite');
          navigate(`/household/join?code=${encodeURIComponent(storedCode)}`, { replace: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [inviteCode, navigate]);

  const handleAcceptInvite = async () => {
    if (!inviteCode) return;

    setIsLoading(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        sessionStorage.setItem('kaeva_pending_invite', inviteCode);
        sessionStorage.setItem('kaeva_redirect_after_auth', `/household/join?code=${encodeURIComponent(inviteCode)}`);
        navigate('/auth', { replace: true });
        return;
      }

      const { data, error } = await supabase.functions.invoke("accept-household-invite", {
        body: { invite_code: inviteCode },
      });

      if (error) throw error;

      if (data?.success) {
        setHouseholdName(data.household_name);
        
        // Clear any pending invite
        sessionStorage.removeItem('kaeva_pending_invite');
        
        toast({
          title: "Joined household!",
          description: `You've successfully joined ${data.household_name}`,
        });

        setTimeout(() => {
          navigate("/app", { replace: true });
        }, 2000);
      }
    } catch (err: any) {
      console.error("Error accepting invite:", err);
      setError(err.message || "Failed to accept invite");
      toast({
        title: "Error",
        description: err.message || "Failed to accept invite",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AuroraBackground />
        <div className="relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AuroraBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Join Household</CardTitle>
              <CardDescription>
                You've been invited to join a household
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <div className="flex flex-col items-center space-y-4 py-4">
                  <XCircle className="h-12 w-12 text-destructive" />
                  <p className="text-sm text-muted-foreground text-center">{error}</p>
                  <Button onClick={() => navigate("/")} variant="outline">
                    Go to Dashboard
                  </Button>
                </div>
              ) : inviteValid && !householdName ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Click below to accept the invitation and join the household.
                  </p>
                  <Button
                    onClick={handleAcceptInvite}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Accept Invitation
                  </Button>
                  <Button
                    onClick={() => navigate("/")}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              ) : householdName ? (
                <div className="flex flex-col items-center space-y-4 py-4">
                  <CheckCircle className="h-12 w-12 text-primary" />
                  <p className="text-sm text-muted-foreground text-center">
                    Successfully joined {householdName}!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Redirecting to dashboard...
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }
