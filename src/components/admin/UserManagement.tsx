import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileStats {
  total: number;
  completed: number;
  pending: number;
}

interface RecentProfile {
  id: string;
  user_name: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

export const UserManagement = () => {
  const [stats, setStats] = useState<ProfileStats>({ total: 0, completed: 0, pending: 0 });
  const [recentProfiles, setRecentProfiles] = useState<RecentProfile[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, user_name, onboarding_completed, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const completed = profiles?.filter(p => p.onboarding_completed).length || 0;
      
      setStats({
        total: profiles?.length || 0,
        completed,
        pending: (profiles?.length || 0) - completed,
      });

      setRecentProfiles(profiles || []);
    } catch (error) {
      console.error("Load users error:", error);
      toast({
        title: "Load Failed",
        description: "Failed to load user data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <XCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Most recently created profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentProfiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {profile.user_name || "Anonymous"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={profile.onboarding_completed ? "default" : "secondary"}>
                  {profile.onboarding_completed ? "Completed" : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};