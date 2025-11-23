import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const Join = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteData, setInviteData] = useState<{
    household_id: string;
    household_name: string;
    inviter_id: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifyInvite();
  }, []);

  const verifyInvite = async () => {
    const token = searchParams.get("token");

    if (!token) {
      setError("Invalid invite link - no token provided");
      setLoading(false);
      return;
    }

    try {
      const { data, error: verifyError } = await supabase.functions.invoke("verify-invite", {
        body: { token }
      });

      if (verifyError) throw verifyError;
      if (data.error) throw new Error(data.error);

      setInviteData(data);
    } catch (err) {
      console.error("Error verifying invite:", err);
      setError(err instanceof Error ? err.message : "Failed to verify invite");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please sign in first");
      navigate("/auth");
      return;
    }

    if (!inviteData) return;

    setAccepting(true);

    try {
      // Update user's current_household_id
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ current_household_id: inviteData.household_id })
        .eq("id", session.user.id);

      if (updateError) throw updateError;

      toast.success(`Welcome to ${inviteData.household_name}!`);
      navigate("/household");
    } catch (err) {
      console.error("Error accepting invite:", err);
      toast.error("Failed to join household");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Invalid Invite</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Join Household</CardTitle>
          </div>
          <CardDescription>
            You've been invited to join <strong>{inviteData?.household_name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            By accepting this invite, you'll be able to share inventory, recipes, and shopping lists with other household members.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleAcceptInvite}
              disabled={accepting}
              className="flex-1"
            >
              {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Accept Invite
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              disabled={accepting}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Join;
