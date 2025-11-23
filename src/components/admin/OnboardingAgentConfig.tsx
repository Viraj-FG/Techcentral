import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, UserPlus, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ELEVENLABS_CONFIG } from "@/config/agent";

export const OnboardingAgentConfig = () => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  const handleConfigure = async () => {
    setIsConfiguring(true);
    try {
      const { data, error } = await supabase.functions.invoke("configure-elevenlabs-agent", {
        body: { agentId: ELEVENLABS_CONFIG.onboarding.agentId },
      });

      if (error) throw error;

      setIsConfigured(true);
      toast({
        title: "Onboarding Agent Configured",
        description: "Voice AI agent for new user onboarding is ready.",
      });
    } catch (error) {
      console.error("Configuration error:", error);
      toast({
        title: "Configuration Failed",
        description: error instanceof Error ? error.message : "Failed to configure onboarding agent",
        variant: "destructive",
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <Card className="border-kaeva-sage/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-kaeva-sage" />
            <CardTitle>Onboarding Agent</CardTitle>
          </div>
          <Badge variant="outline" className="bg-kaeva-sage/10 text-kaeva-sage border-kaeva-sage/20">
            New Users
          </Badge>
        </div>
        <CardDescription>
          Configure the voice AI agent for collecting new user information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-kaeva-sage/5 border-kaeva-sage/20">
          <AlertDescription className="space-y-2 text-sm">
            <div className="font-medium">Agent ID:</div>
            <code className="bg-background px-2 py-1 rounded text-xs block">
              {ELEVENLABS_CONFIG.onboarding.agentId}
            </code>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <span className="text-muted-foreground">Voice:</span> Aria
              </div>
              <div>
                <span className="text-muted-foreground">Model:</span> {ELEVENLABS_CONFIG.onboarding.model}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Version:</span>{" "}
              <code className="text-xs">{ELEVENLABS_CONFIG.onboarding.promptVersion}</code>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-4">
          <Button
            onClick={handleConfigure}
            disabled={isConfiguring || isConfigured}
            className="bg-kaeva-sage hover:bg-kaeva-sage/90"
          >
            {isConfiguring ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Configuring...
              </>
            ) : isConfigured ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Configured
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Configure Agent
              </>
            )}
          </Button>

          {isConfigured && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-kaeva-sage"
            >
              ✓ Ready for new users
            </motion.div>
          )}
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">Collects:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>User name, biometrics, and TDEE calculation</li>
            <li>Dietary preferences and allergies</li>
            <li>Beauty profile (skin & hair type)</li>
            <li>Household composition and pet details</li>
            <li>Health and lifestyle goals</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
