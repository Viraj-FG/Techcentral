import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AgentResult {
  type: string;
  status: 'created' | 'updated' | 'error';
  agent_id?: string;
  name?: string;
  error?: string;
}

export const AgentProvisioning = () => {
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [results, setResults] = useState<AgentResult[]>([]);
  const { toast } = useToast();

  const handleProvisionAgents = async () => {
    setIsProvisioning(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('provision-agents');

      if (error) throw error;

      if (data.success) {
        setResults(data.results);
        toast({
          title: "Agents Provisioned",
          description: `Successfully provisioned ${data.results.length} agents`,
        });
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Provisioning error:', error);
      toast({
        title: "Provisioning Failed",
        description: error instanceof Error ? error.message : 'Failed to provision agents',
        variant: "destructive",
      });
    } finally {
      setIsProvisioning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created':
      case 'updated':
        return <CheckCircle2 className="h-5 w-5 text-kaeva-sage" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-kaeva-electric-sky" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'created':
        return <Badge className="bg-kaeva-sage/20 text-kaeva-sage border-kaeva-sage/30">Created</Badge>;
      case 'updated':
        return <Badge className="bg-kaeva-electric-sky/20 text-kaeva-electric-sky border-kaeva-electric-sky/30">Updated</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card className="glass-card border-kaeva-sage/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-kaeva-sage" />
          <CardTitle className="text-display text-white">Agent Provisioning</CardTitle>
        </div>
        <CardDescription className="text-body text-white/60">
          Automatically create and configure ElevenLabs agents with one click
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3">
          <p className="text-micro text-white/70">
            This will create or update both the Onboarding and Assistant agents in your ElevenLabs account.
            All configurations will be applied automatically.
          </p>

          <Button
            onClick={handleProvisionAgents}
            disabled={isProvisioning}
            className="w-full bg-kaeva-sage hover:bg-kaeva-sage/80 text-white"
            size="lg"
          >
            {isProvisioning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Provisioning Agents...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Provision Agents (One-Click Setup)
              </>
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h4 className="text-body font-medium text-white">Provisioning Results</h4>
            
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 rounded-lg bg-background/20 border border-white/10"
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="text-micro font-medium text-white capitalize">
                        {result.type} Agent
                      </h5>
                      {getStatusBadge(result.status)}
                    </div>
                    
                    {result.name && (
                      <p className="text-micro text-white/60">
                        Name: {result.name}
                      </p>
                    )}
                    
                    {result.agent_id && (
                      <p className="text-micro text-white/60 font-mono">
                        ID: {result.agent_id}
                      </p>
                    )}
                    
                    {result.error && (
                      <p className="text-micro text-red-400">
                        Error: {result.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-white/10">
          <h4 className="text-micro font-medium text-white mb-2">What happens:</h4>
          <ul className="space-y-1 text-micro text-white/60">
            <li>• Checks if agents exist in your ElevenLabs account</li>
            <li>• Creates new agents if they don't exist</li>
            <li>• Updates existing agents with latest configuration</li>
            <li>• Applies all prompts, tools, and voice settings</li>
            <li>• Safe to run multiple times (idempotent)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
