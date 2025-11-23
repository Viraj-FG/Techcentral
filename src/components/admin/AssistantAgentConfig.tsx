import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, MessageSquare, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ELEVENLABS_CONFIG } from "@/config/agent";

export const AssistantAgentConfig = () => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  const handleConfigure = async () => {
    setIsConfiguring(true);
    try {
      const { data, error } = await supabase.functions.invoke("configure-assistant-agent", {
        body: { agentId: ELEVENLABS_CONFIG.assistant.agentId },
      });

      if (error) throw error;

      setIsConfigured(true);
      toast({
        title: "Assistant Agent Configured",
        description: "Voice AI assistant for in-app interactions is ready.",
      });
    } catch (error) {
      console.error("Configuration error:", error);
      toast({
        title: "Configuration Failed",
        description: error instanceof Error ? error.message : "Failed to configure assistant agent",
        variant: "destructive",
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <Card className="border-kaeva-electric-sky/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-kaeva-electric-sky" />
            <CardTitle>Assistant Agent</CardTitle>
          </div>
          <Badge variant="outline" className="bg-kaeva-electric-sky/10 text-kaeva-electric-sky border-kaeva-electric-sky/20">
            In-App
          </Badge>
        </div>
        <CardDescription>
          Configure the voice AI assistant for ongoing user interactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-kaeva-electric-sky/5 border-kaeva-electric-sky/20">
          <AlertDescription className="space-y-2 text-sm">
            <div className="font-medium">Agent ID:</div>
            <code className="bg-background px-2 py-1 rounded text-xs block">
              {ELEVENLABS_CONFIG.assistant.agentId}
            </code>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <span className="text-muted-foreground">Voice:</span> Aria
              </div>
              <div>
                <span className="text-muted-foreground">Model:</span> {ELEVENLABS_CONFIG.assistant.model}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Version:</span>{" "}
              <code className="text-xs">{ELEVENLABS_CONFIG.assistant.promptVersion}</code>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-4">
          <Button
            onClick={handleConfigure}
            disabled={isConfiguring || isConfigured}
            className="bg-kaeva-electric-sky hover:bg-kaeva-electric-sky/90"
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
              className="text-sm text-kaeva-electric-sky"
            >
              ✓ Ready for interactions
            </motion.div>
          )}
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">Capabilities:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Inventory management and tracking</li>
            <li>Recipe suggestions based on available items</li>
            <li>Shopping list assistance</li>
            <li>Allergen and pet toxicity checks</li>
            <li>Meal planning within TDEE goals</li>
            <li>Beauty product recommendations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
