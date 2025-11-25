import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Clock, RefreshCw, Wrench } from "lucide-react";
import { ELEVENLABS_CONFIG } from "@/config/agent";
import { formatDistanceToNow } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AgentStatusData {
  isConfigured: boolean;
  lastConfiguredAt: string | null;
  promptVersion: string | null;
}

interface AgentTool {
  name: string;
  type?: string;
  description?: string;
}

interface AgentDetails {
  onboarding: AgentTool[];
  assistant: AgentTool[];
}

export const AgentStatus = () => {
  const [status, setStatus] = useState<AgentStatusData>({
    isConfigured: false,
    lastConfiguredAt: null,
    promptVersion: null
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [agentTools, setAgentTools] = useState<AgentDetails>({
    onboarding: [],
    assistant: []
  });
  const [isLoadingTools, setIsLoadingTools] = useState(false);

  const fetchAgentTools = async () => {
    setIsLoadingTools(true);
    try {
      const { data, error } = await supabase.functions.invoke('provision-agents', {
        method: 'GET'
      });

      if (error) throw error;

      // Extract tools from the provisioning configuration
      // This is a read-only call that returns agent details
      if (data?.agents) {
        const onboardingTools = data.agents.onboarding?.tools || [];
        const assistantTools = data.agents.assistant?.tools || [];
        
        setAgentTools({
          onboarding: onboardingTools,
          assistant: assistantTools
        });
      }
    } catch (error) {
      console.error('Error fetching agent tools:', error);
      // Set default tools from config as fallback
      setAgentTools({
        onboarding: [
          { name: "updateProfile", type: "client", description: "Save user profile information" },
          { name: "completeConversation", type: "client", description: "End conversation after onboarding" },
          { name: "endConversation", type: "client", description: "Exit conversation early" },
          { name: "navigateTo", type: "client", description: "Navigate to dashboard page" }
        ],
        assistant: [
          { name: "checkInventory", type: "client", description: "Search household inventory" },
          { name: "updateInventory", type: "client", description: "Add/update/remove inventory items" },
          { name: "addToShoppingList", type: "client", description: "Add items to shopping cart" },
          { name: "logMeal", type: "client", description: "Log meal for nutrition tracking" },
          { name: "suggestRecipes", type: "client", description: "Get recipe suggestions" },
          { name: "checkAllergens", type: "client", description: "Check ingredient allergens" },
          { name: "navigateTo", type: "client", description: "Navigate to dashboard page" },
          { name: "endConversation", type: "client", description: "End conversation" }
        ]
      });
    } finally {
      setIsLoadingTools(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('agent_configured, agent_last_configured_at, agent_prompt_version')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setStatus({
          isConfigured: profile.agent_configured || false,
          lastConfiguredAt: profile.agent_last_configured_at,
          promptVersion: profile.agent_prompt_version
        });
      }
    } catch (error) {
      console.error('Error fetching agent status:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStatus(), fetchAgentTools()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchStatus();
    fetchAgentTools();
  }, []);

  const isUpToDate = status.promptVersion === ELEVENLABS_CONFIG.onboarding.promptVersion || 
                     status.promptVersion === ELEVENLABS_CONFIG.assistant.promptVersion;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Agent Status</CardTitle>
            <CardDescription>Current configuration state</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Configuration Status</span>
          <Badge variant={status.isConfigured ? "default" : "destructive"}>
            {status.isConfigured ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configured
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Not Configured
              </>
            )}
          </Badge>
        </div>

        {/* Agent IDs */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Onboarding Agent</span>
          <code className="text-xs bg-background px-2 py-1 rounded">
            ...{ELEVENLABS_CONFIG.onboarding.agentId.slice(-8)}
          </code>
        </div>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Assistant Agent</span>
          <code className="text-xs bg-background px-2 py-1 rounded">
            ...{ELEVENLABS_CONFIG.assistant.agentId.slice(-8)}
          </code>
        </div>


        {/* Current Deployed Version */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Deployed Version</span>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-background px-2 py-1 rounded">
              {status.promptVersion || 'Not set'}
            </code>
            {status.promptVersion && (
              <Badge variant={isUpToDate ? "default" : "secondary"}>
                {isUpToDate ? 'Current' : 'Outdated'}
              </Badge>
            )}
          </div>
        </div>

        {/* Last Configured */}
        {status.lastConfiguredAt && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">Last Configured</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(status.lastConfiguredAt), { addSuffix: true })}
            </div>
          </div>
        )}

        {/* Expected Versions */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Expected Versions</span>
          <div className="flex flex-col items-end gap-1">
            <code className="text-xs bg-background px-2 py-1 rounded">
              Onboarding: {ELEVENLABS_CONFIG.onboarding.promptVersion}
            </code>
            <code className="text-xs bg-background px-2 py-1 rounded">
              Assistant: {ELEVENLABS_CONFIG.assistant.promptVersion}
            </code>
          </div>
        </div>

        {/* Warning if outdated */}
        {!isUpToDate && status.isConfigured && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              ⚠️ Agent prompt version is outdated. Reconfigure to update to latest versions (Onboarding: {ELEVENLABS_CONFIG.onboarding.promptVersion}, Assistant: {ELEVENLABS_CONFIG.assistant.promptVersion})
            </p>
          </div>
        )}

        {/* Registered Tools */}
        <div className="space-y-2">
          <Collapsible>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  <span className="text-sm font-medium">Onboarding Agent Tools</span>
                </div>
                <Badge variant="secondary">{agentTools.onboarding.length}</Badge>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-4 mt-2 space-y-2">
                {isLoadingTools ? (
                  <p className="text-xs text-muted-foreground">Loading tools...</p>
                ) : agentTools.onboarding.length > 0 ? (
                  agentTools.onboarding.map((tool, idx) => (
                    <div key={idx} className="p-2 bg-background rounded border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs font-mono">{tool.name}</code>
                        {tool.type && (
                          <Badge variant="outline" className="text-xs">{tool.type}</Badge>
                        )}
                      </div>
                      {tool.description && (
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No tools configured</p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  <span className="text-sm font-medium">Assistant Agent Tools</span>
                </div>
                <Badge variant="secondary">{agentTools.assistant.length}</Badge>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-4 mt-2 space-y-2">
                {isLoadingTools ? (
                  <p className="text-xs text-muted-foreground">Loading tools...</p>
                ) : agentTools.assistant.length > 0 ? (
                  agentTools.assistant.map((tool, idx) => (
                    <div key={idx} className="p-2 bg-background rounded border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs font-mono">{tool.name}</code>
                        {tool.type && (
                          <Badge variant="outline" className="text-xs">{tool.type}</Badge>
                        )}
                      </div>
                      {tool.description && (
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No tools configured</p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
};
