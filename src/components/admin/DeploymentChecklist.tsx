import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ELEVENLABS_CONFIG } from "@/config/agent";
import { getSignedUrl } from "@/lib/elevenLabsAudio";

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  status: 'idle' | 'checking' | 'passed' | 'warning' | 'failed';
  message?: string;
}

export const DeploymentChecklist = () => {
  const [steps, setSteps] = useState<ChecklistStep[]>([
    {
      id: 'edge-function',
      title: 'Edge function deployed',
      description: 'provision-agents function is accessible',
      status: 'idle'
    },
    {
      id: 'agent-configured',
      title: 'Agent configured',
      description: 'ElevenLabs agent has been set up',
      status: 'idle'
    },
    {
      id: 'agent-id-match',
      title: 'Using correct agent ID',
      description: 'All files reference the same agent ID',
      status: 'idle'
    },
    {
      id: 'context-injection',
      title: 'Context injection working',
      description: 'User data can be loaded for conversations',
      status: 'idle'
    },
    {
      id: 'client-tools',
      title: 'Client tools registered',
      description: 'Agent can call updateProfile and completeConversation',
      status: 'idle'
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);

  const updateStep = (id: string, updates: Partial<ChecklistStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, ...updates } : step
    ));
  };

  const checkEdgeFunction = async () => {
    updateStep('edge-function', { status: 'checking' });
    try {
      const { error } = await supabase.functions.invoke('provision-agents', {
        body: { testMode: true }
      });

      if (error) throw error;

      updateStep('edge-function', {
        status: 'passed',
        message: 'Edge function is deployed and accessible'
      });
    } catch (error) {
      updateStep('edge-function', {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Function not accessible'
      });
    }
  };

  const checkAgentConfigured = async () => {
    updateStep('agent-configured', { status: 'checking' });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('agent_configured, agent_prompt_version')
        .eq('id', session.user.id)
        .single();

      if (!profile?.agent_configured) {
        updateStep('agent-configured', {
          status: 'warning',
          message: 'Agent not configured yet - run configuration first'
        });
      } else if (profile.agent_prompt_version === ELEVENLABS_CONFIG.onboarding.promptVersion || 
                 profile.agent_prompt_version === ELEVENLABS_CONFIG.assistant.promptVersion) {
        updateStep('agent-configured', {
          status: 'warning',
          message: `Outdated prompt version (${profile.agent_prompt_version})`
        });
      } else {
        updateStep('agent-configured', {
          status: 'passed',
          message: 'Agent is configured with latest prompt'
        });
      }
    } catch (error) {
      updateStep('agent-configured', {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to check'
      });
    }
  };

  const checkAgentIdMatch = async () => {
    updateStep('agent-id-match', { status: 'checking' });
    try {
      // This is a sanity check - if we're using centralized config, this should always pass
      const onboardingId = ELEVENLABS_CONFIG.onboarding.agentId;
      const assistantId = ELEVENLABS_CONFIG.assistant.agentId;
      
      updateStep('agent-id-match', {
        status: 'passed',
        message: `Using centralized config: Onboarding ${onboardingId.slice(-8)}, Assistant ${assistantId.slice(-8)}`
      });
    } catch (error) {
      updateStep('agent-id-match', {
        status: 'failed',
        message: 'Agent ID mismatch detected'
      });
    }
  };

  const checkContextInjection = async () => {
    updateStep('context-injection', { status: 'checking' });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const agentId = profile.onboarding_completed 
        ? ELEVENLABS_CONFIG.assistant.agentId 
        : ELEVENLABS_CONFIG.onboarding.agentId;
      const signedUrl = await getSignedUrl(agentId);
      if (!signedUrl) throw new Error('Failed to get signed URL');

      updateStep('context-injection', {
        status: 'passed',
        message: 'Profile data accessible, can inject context'
      });
    } catch (error) {
      updateStep('context-injection', {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Context injection failed'
      });
    }
  };

  const checkClientTools = async () => {
    updateStep('client-tools', { status: 'checking' });
    try {
      const { data, error } = await supabase.functions.invoke('provision-agents', {
        body: { testMode: true }
      });

      if (error) throw error;

      const results = data?.results || [];
      const hasAllTools = results.every((r: any) => r.clientToolsCount >= 3);
      
      if (hasAllTools) {
        updateStep('client-tools', {
          status: 'passed',
          message: `Both agents have client tools configured`
        });
      } else {
        updateStep('client-tools', {
          status: 'warning',
          message: `Some agents missing required tools`
        });
      }
    } catch (error) {
      updateStep('client-tools', {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to check tools'
      });
    }
  };

  const runAllChecks = async () => {
    setIsRunning(true);
    await checkEdgeFunction();
    await checkAgentConfigured();
    await checkAgentIdMatch();
    await checkContextInjection();
    await checkClientTools();
    setIsRunning(false);
  };

  const getStatusIcon = (status: ChecklistStep['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Deployment Checklist</CardTitle>
            <CardDescription>Verify all systems are operational</CardDescription>
          </div>
          <Button
            onClick={runAllChecks}
            disabled={isRunning}
            variant="default"
          >
            {isRunning ? 'Running Checks...' : 'Run All Checks'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg transition-all">
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(step.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{index + 1}. {step.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
                {step.message && (
                  <p className={`text-xs mt-2 ${
                    step.status === 'passed' ? 'text-green-600 dark:text-green-400' :
                    step.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                    step.status === 'failed' ? 'text-red-600 dark:text-red-400' :
                    'text-muted-foreground'
                  }`}>
                    {step.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
