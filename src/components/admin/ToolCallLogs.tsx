import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolCallLog {
  id: string;
  created_at: string;
  message: string;
  metadata: any;
}

const ToolCallLogs = () => {
  const [logs, setLogs] = useState<ToolCallLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("conversation_history")
        .select("*")
        .eq("role", "tool")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Failed to fetch tool logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tool Call Logs</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-300px)] max-h-[600px] min-h-[300px]">
            <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No tool calls logged yet
              </p>
            ) : (
              logs.map((log) => {
                const metadata = log.metadata as any;
                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border ${
                      metadata?.error
                        ? "bg-destructive/10 border-destructive"
                        : "bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{metadata?.tool || "Unknown"}</Badge>
                        {metadata?.error && (
                          <Badge variant="destructive">ERROR</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold">Parameters:</span>
                        <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                          {JSON.stringify(metadata?.parameters || {}, null, 2)}
                        </pre>
                      </div>

                      {metadata?.error ? (
                        <div>
                          <span className="font-semibold text-destructive">
                            Error:
                          </span>
                          <p className="mt-1 text-destructive">
                            {metadata.error}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold">Result:</span>
                          <p className="mt-1">{metadata?.result || "No result"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ToolCallLogs;
