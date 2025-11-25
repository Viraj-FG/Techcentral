import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, CheckCircle, XCircle } from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";
import { motion } from "framer-motion";

export default function HouseholdInviteAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [householdName, setHouseholdName] = useState("");
  const [error, setError] = useState("");

  const inviteCode = searchParams.get("code");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Redirect to auth with return URL
        navigate(`/auth?redirect=/household/join?code=${encodeURIComponent(inviteCode || '')}`);
        return;
      }

      if (!inviteCode) {
        setError("No invite code provided");
        setIsValidating(false);
        return;
      }

      // Validate invite without accepting
      setIsValidating(false);
      setInviteValid(true);
    };

    checkAuth();
  }, [inviteCode, navigate]);

  const handleAcceptInvite = async () => {
    if (!inviteCode) return;

    setIsLoading(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate(`/auth?redirect=/household/join?code=${encodeURIComponent(inviteCode)}`);
        return;
      }

      const { data, error } = await supabase.functions.invoke("accept-household-invite", {
        body: { invite_code: inviteCode },
      });

      if (error) throw error;

      if (data?.success) {
        setHouseholdName(data.household_name);
        toast({
          title: "Joined household!",
          description: `You've successfully joined ${data.household_name}`,
        });

        setTimeout(() => {
          navigate("/");
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
