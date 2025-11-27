import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, Clock, CheckCircle2, XCircle, TrendingUp, MessageSquare } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ConversationMetrics {
  totalConversations: number;
  completedConversations: number;
  failedConversations: number;
  averageResponseTime: number;
  averageDuration: number;
  messagesPerConversation: number;
}

interface ResponseTimeData {
  timestamp: string;
  responseTime: number;
}

interface RecentConversation {
  id: string;
  started_at: string;
  completed: boolean;
  message_count: number;
  duration: number;
}

export const AgentHealthDashboard = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<ConversationMetrics>({
    totalConversations: 0,
    completedConversations: 0,
    failedConversations: 0,
    averageResponseTime: 0,
    averageDuration: 0,
    messagesPerConversation: 0,
  });
  const [responseTimeData, setResponseTimeData] = useState<ResponseTimeData[]>([]);
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [agentStatus, setAgentStatus] = useState<'healthy' | 'degraded' | 'offline'>('healthy');

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30s
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('conversation-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_history'
        },
        () => {
          loadMetrics();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);

      // Get all conversations
      const { data: conversations, error: convError } = await supabase
        .from('conversation_history')
        .select('conversation_id, created_at, role, message')
        .order('created_at', { ascending: false });

      if (convError) throw convError;

      // Get profiles with completion status
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_completed, agent_configured, agent_last_configured_at');

      if (profileError) throw profileError;

      // Process conversation data
      const conversationGroups = new Map<string, any[]>();
      conversations?.forEach(msg => {
        if (!conversationGroups.has(msg.conversation_id)) {
          conversationGroups.set(msg.conversation_id, []);
        }
        conversationGroups.get(msg.conversation_id)!.push(msg);
      });

      // Calculate metrics
      const totalConversations = conversationGroups.size;
      let completedCount = 0;
      let totalResponseTime = 0;
      let responseCount = 0;
      let totalMessages = 0;
      let totalDuration = 0;
      const recentConvs: RecentConversation[] = [];
      const responseTimes: ResponseTimeData[] = [];

      conversationGroups.forEach((messages, convId) => {
        const sortedMessages = messages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        totalMessages += messages.length;

        // Check if conversation was completed
        const hasCompletion = messages.some(m => 
          m.role === 'assistant' && m.message.toLowerCase().includes('complete')
        );
        if (hasCompletion) completedCount++;

        // Calculate conversation duration
        const startTime = new Date(sortedMessages[0].created_at).getTime();
        const endTime = new Date(sortedMessages[sortedMessages.length - 1].created_at).getTime();
        const duration = (endTime - startTime) / 1000; // in seconds
        totalDuration += duration;

        // Calculate response times
        for (let i = 0; i < sortedMessages.length - 1; i++) {
          if (sortedMessages[i].role === 'user' && sortedMessages[i + 1].role === 'assistant') {
            const userTime = new Date(sortedMessages[i].created_at).getTime();
            const assistantTime = new Date(sortedMessages[i + 1].created_at).getTime();
            const responseTime = (assistantTime - userTime) / 1000; // in seconds
            
            totalResponseTime += responseTime;
            responseCount++;

            responseTimes.push({
              timestamp: new Date(sortedMessages[i + 1].created_at).toLocaleTimeString(),
              responseTime: Math.round(responseTime * 100) / 100
            });
          }
        }

        // Add to recent conversations
        if (recentConvs.length < 5) {
          recentConvs.push({
            id: convId,
            started_at: sortedMessages[0].created_at,
            completed: hasCompletion,
            message_count: messages.length,
            duration: Math.round(duration)
          });
        }
      });

      const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
      const avgDuration = totalConversations > 0 ? totalDuration / totalConversations : 0;
      const avgMessages = totalConversations > 0 ? totalMessages / totalConversations : 0;

      // Determine agent status
      let status: 'healthy' | 'degraded' | 'offline' = 'healthy';
      if (avgResponseTime > 5) status = 'degraded';
      if (totalConversations === 0 || !profiles?.some(p => p.agent_configured)) status = 'offline';

      setMetrics({
        totalConversations,
        completedConversations: completedCount,
        failedConversations: totalConversations - completedCount,
        averageResponseTime: Math.round(avgResponseTime * 100) / 100,
        averageDuration: Math.round(avgDuration),
        messagesPerConversation: Math.round(avgMessages * 10) / 10
      });

      setResponseTimeData(responseTimes.slice(-20)); // Last 20 data points
      setRecentConversations(recentConvs);
      setAgentStatus(status);

    } catch (error) {
      console.error('Error loading metrics:', error);
      toast({
        title: "Error loading metrics",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completionRate = metrics.totalConversations > 0 
    ? Math.round((metrics.completedConversations / metrics.totalConversations) * 100)
    : 0;

  const completionData = [
    { name: 'Completed', value: metrics.completedConversations },
    { name: 'Failed', value: metrics.failedConversations }
  ];

  return (
    <div className="space-y-6">
      {/* Agent Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agent Status</CardTitle>
              <CardDescription>Real-time health monitoring</CardDescription>
            </div>
            <Badge variant={
              agentStatus === 'healthy' ? 'default' : 
              agentStatus === 'degraded' ? 'secondary' : 
              'destructive'
            }>
              <Activity className="h-3 w-3 mr-1" />
              {agentStatus.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.messagesPerConversation} avg messages per conversation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageResponseTime}s</div>
            <p className="text-xs text-muted-foreground">
              Time between user message and response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.completedConversations} of {metrics.totalConversations} successful
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Times Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Response Times</CardTitle>
            <CardDescription>Last 20 agent responses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} className="sm:h-[300px]">
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" className="text-xs" />
                <YAxis label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }} className="text-xs" />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Conversation Outcomes</CardTitle>
            <CardDescription>Success vs failure breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} className="sm:h-[300px]">
              <BarChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
          <CardDescription>Latest 5 conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentConversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No conversations yet</p>
            ) : (
              recentConversations.map((conv) => (
                <div key={conv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {conv.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        Conversation {conv.id.substring(0, 8)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.started_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-sm sm:text-right ml-7 sm:ml-0">
                    <p className="font-medium">{conv.message_count} msgs</p>
                    <p className="text-muted-foreground">{conv.duration}s</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
