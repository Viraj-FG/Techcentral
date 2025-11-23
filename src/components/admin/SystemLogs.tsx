import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SystemLogs = () => {
  const { data: errorLogs, isLoading } = useQuery({
    queryKey: ['system-errors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('conversation_id', 'onboarding-error')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Logs</CardTitle>
        <CardDescription>View onboarding errors and system logs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            To view detailed edge function logs and authentication events, 
            visit the Backend section in your project settings.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading error logs...</div>
        ) : errorLogs && errorLogs.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Onboarding Errors ({errorLogs.length})</span>
            </div>
            <ScrollArea className="h-[400px] w-full rounded border">
              <div className="p-4 space-y-3">
                {errorLogs.map((log) => {
                  const metadata = log.metadata as any;
                  return (
                    <div key={log.id} className="p-3 rounded-lg border bg-muted/50 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="text-xs">
                              {metadata?.step || 'Unknown Step'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{log.message}</p>
                          {metadata?.userId && (
                            <p className="text-xs text-muted-foreground">User: {metadata.userId}</p>
                          )}
                        </div>
                      </div>
                      {metadata?.error && (
                        <div className="text-xs font-mono bg-background p-2 rounded border">
                          {metadata.error}
                        </div>
                      )}
                      {metadata?.stack && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Stack trace
                          </summary>
                          <pre className="mt-2 p-2 bg-background rounded border overflow-x-auto">
                            {metadata.stack}
                          </pre>
                        </details>
                      )}
                      {metadata?.data && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            State data
                          </summary>
                          <pre className="mt-2 p-2 bg-background rounded border overflow-x-auto">
                            {JSON.stringify(metadata.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No error logs found</div>
        )}
      </CardContent>
    </Card>
  );
};