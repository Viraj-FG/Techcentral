import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Settings, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export const AgentConfig = () => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  const handleConfigure = async () => {
    setIsConfiguring(true);
    try {
      const agentId = "agent_0501kakwnx5rffaby5px9y1pskkb";
      
      const { error } = await supabase.functions.invoke("configure-elevenlabs-agent", {
        body: { agentId },
      });

      if (error) throw error;

      setIsConfigured(true);
      toast({
        title: "Agent Configured",
        description: "ElevenLabs agent has been successfully configured.",
      });
    } catch (error) {
      console.error("Configuration error:", error);
      toast({
        title: "Configuration Failed",
        description: error instanceof Error ? error.message : "Failed to configure agent",
        variant: "destructive",
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ElevenLabs Agent Configuration</CardTitle>
          <CardDescription>
            Configure the voice AI agent for onboarding conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Agent ID: <code className="bg-muted px-2 py-1 rounded">agent_0501kakwnx5rffaby5px9y1pskkb</code>
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleConfigure}
              disabled={isConfiguring || isConfigured}
              size="lg"
            >
              {isConfiguring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Configuring...
                </>
              ) : isConfigured ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Configured
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4" />
                  Configure Agent
                </>
              )}
            </Button>

            {isConfigured && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-muted-foreground"
              >
                ✓ Agent is ready for onboarding
              </motion.div>
            )}
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">Agent Features:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Collects user name, dietary preferences, and allergies</li>
              <li>Gathers beauty profile (skin type, hair type)</li>
              <li>Captures household composition and pet information</li>
              <li>Records health and lifestyle goals</li>
              <li>Automatically triggers dashboard after completion</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};