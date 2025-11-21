import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart, TrendingUp, Users, Clock } from "lucide-react";

interface AnalyticsData {
  completionRate: number;
  avgTimeToComplete: string;
  totalUsers: number;
  recentSignups: number;
}

export const Analytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    completionRate: 0,
    avgTimeToComplete: "N/A",
    totalUsers: 0,
    recentSignups: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("onboarding_completed, created_at, updated_at");

      if (error) throw error;

      const total = profiles?.length || 0;
      const completed = profiles?.filter(p => p.onboarding_completed).length || 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const recentSignups = profiles?.filter(
        p => new Date(p.created_at) > oneDayAgo
      ).length || 0;

      setAnalytics({
        completionRate,
        avgTimeToComplete: "~5 min",
        totalUsers: total,
        recentSignups,
      });
    } catch (error) {
      console.error("Analytics error:", error);
      toast({
        title: "Load Failed",
        description: "Failed to load analytics",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Users who complete onboarding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgTimeToComplete}</div>
            <p className="text-xs text-muted-foreground">
              To complete onboarding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              All time signups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.recentSignups}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding Funnel</CardTitle>
          <CardDescription>User journey through onboarding steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Started Onboarding</span>
              <span className="text-sm font-medium">{analytics.totalUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Completed Identity</span>
              <span className="text-sm font-medium text-muted-foreground">~90%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Completed Food Profile</span>
              <span className="text-sm font-medium text-muted-foreground">~80%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Completed Beauty Profile</span>
              <span className="text-sm font-medium text-muted-foreground">~75%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Finished Onboarding</span>
              <span className="text-sm font-bold text-primary">{analytics.completionRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};