import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface FailedOnboarding {
  id: string;
  user_name: string | null;
  onboarding_completed: boolean;
  current_household_id: string | null;
  members_count: number;
}

export const OnboardingResetTool = () => {
  const [failedOnboardings, setFailedOnboardings] = useState<FailedOnboarding[]>([]);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState<string | null>(null);

  const loadFailedOnboardings = async () => {
    setLoading(true);
    try {
      // Find users with onboarding_completed: true but incomplete data
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_name, onboarding_completed, current_household_id')
        .eq('onboarding_completed', true);

      if (profileError) throw profileError;

      // Check each profile for missing household or members
      const failed: FailedOnboarding[] = [];
      
      for (const profile of profiles || []) {
        let isIncomplete = false;
        let membersCount = 0;

        // Check if household exists
        if (!profile.current_household_id) {
          isIncomplete = true;
        } else {
          const { data: household } = await supabase
            .from('households')
            .select('id')
            .eq('id', profile.current_household_id)
            .single();
          
          if (!household) {
            isIncomplete = true;
          }
        }

        // Check if household members exist
        const { data: members, count } = await supabase
          .from('household_members')
          .select('id', { count: 'exact' })
          .eq('user_id', profile.id);
        
        membersCount = count || 0;
        
        if (membersCount === 0) {
          isIncomplete = true;
        }

        if (isIncomplete) {
          failed.push({
            ...profile,
            members_count: membersCount
          });
        }
      }

      setFailedOnboardings(failed);
    } catch (error) {
      console.error('Error loading failed onboardings:', error);
      toast.error('Failed to load incomplete onboardings');
    } finally {
      setLoading(false);
    }
  };

  const resetOnboarding = async (userId: string) => {
    setResetting(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: false })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Onboarding reset successfully');
      loadFailedOnboardings(); // Reload list
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      toast.error('Failed to reset onboarding');
    } finally {
      setResetting(null);
    }
  };

  const bulkReset = async () => {
    setLoading(true);
    try {
      const userIds = failedOnboardings.map(f => f.id);
      
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: false })
        .in('id', userIds);

      if (error) throw error;

      toast.success(`Reset ${userIds.length} incomplete onboardings`);
      loadFailedOnboardings();
    } catch (error) {
      console.error('Error bulk resetting:', error);
      toast.error('Failed to bulk reset onboardings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFailedOnboardings();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Incomplete Onboardings
            </CardTitle>
            <CardDescription>
              Users marked as onboarding complete but missing household or member data
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadFailedOnboardings}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {failedOnboardings.length > 0 && (
              <Button
                onClick={bulkReset}
                disabled={loading}
                variant="destructive"
                size="sm"
              >
                Reset All ({failedOnboardings.length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {failedOnboardings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {loading ? 'Loading...' : 'No incomplete onboardings found ✅'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Household ID</TableHead>
                <TableHead>Members Count</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failedOnboardings.map((onboarding) => (
                <TableRow key={onboarding.id}>
                  <TableCell>{onboarding.user_name || '(unnamed)'}</TableCell>
                  <TableCell className="font-mono text-xs">{onboarding.id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    {onboarding.current_household_id ? (
                      <span className="font-mono text-xs">{onboarding.current_household_id.slice(0, 8)}...</span>
                    ) : (
                      <Badge variant="destructive">Missing</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {onboarding.members_count === 0 ? (
                      <Badge variant="destructive">0</Badge>
                    ) : (
                      <Badge variant="secondary">{onboarding.members_count}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => resetOnboarding(onboarding.id)}
                      disabled={resetting === onboarding.id}
                      variant="outline"
                      size="sm"
                    >
                      {resetting === onboarding.id ? 'Resetting...' : 'Reset'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
