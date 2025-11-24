import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { ELEVENLABS_CONFIG } from "@/config/agent";
import { getSignedUrl } from "@/lib/elevenLabsAudio";

interface TestResult {
  status: 'idle' | 'running' | 'success' | 'error';
  message?: string;
  details?: any;
}

export const AgentTestPanel = () => {
  const { toast } = useToast();
  const [configTest, setConfigTest] = useState<TestResult>({ status: 'idle' });
  const [connectionTest, setConnectionTest] = useState<TestResult>({ status: 'idle' });
  const [contextTest, setContextTest] = useState<TestResult>({ status: 'idle' });

  const testConfiguration = async () => {
    setConfigTest({ status: 'running' });
    try {
      // Test that provision-agents endpoint exists
      const { data, error } = await supabase.functions.invoke('provision-agents', {
        body: { testMode: true }
      });

      if (error) throw error;

      const resultsArray = Array.isArray(data?.results) ? data.results : [];
      const allSuccess = resultsArray.every((r: any) => r.status === 'created' || r.status === 'updated');

      if (allSuccess && resultsArray.length === 2) {
        setConfigTest({
          status: 'success',
          message: 'Both agents properly configured via provision-agents',
          details: {
            onboarding: resultsArray.find((r: any) => r.type === 'onboarding'),
            assistant: resultsArray.find((r: any) => r.type === 'assistant')
          }
        });
      } else {
        setConfigTest({
          status: 'error',
          message: 'Agent provisioning incomplete',
          details: { results: resultsArray }
        });
      }
    } catch (error) {
      setConfigTest({
        status: 'error',
        message: error instanceof Error ? error.message : 'Configuration test failed'
      });
    }
  };

  const testConnection = async () => {
    setConnectionTest({ status: 'running' });
    try {
      const signedUrl = await getSignedUrl(ELEVENLABS_CONFIG.onboarding.agentId);
      if (signedUrl) {
        setConnectionTest({
          status: 'success',
          message: 'Successfully connected to ElevenLabs API'
        });
      } else {
        throw new Error('No signed URL received');
      }
    } catch (error) {
      setConnectionTest({
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection test failed'
      });
    }
  };

  const testContextInjection = async () => {
    setContextTest({ status: 'running' });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profile?.current_household_id) {
        throw new Error('No household configured');
      }

      const { data: members } = await supabase
        .from('household_members')
        .select('*')
        .eq('user_id', session.user.id);

      const { data: pets } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', session.user.id);

      const inventoryTable = supabase.from('inventory') as any;
      const { data: inventory } = await inventoryTable
        .select('id, name, category, quantity, unit, status')
        .eq('household_id', profile.current_household_id)
        .limit(5);

      setContextTest({
        status: 'success',
        message: 'Context data loaded successfully',
        details: {
          profile: !!profile,
          householdMembers: members?.length || 0,
          pets: pets?.length || 0,
          inventoryItems: inventory?.length || 0
        }
      });
    } catch (error) {
      setContextTest({
        status: 'error',
        message: error instanceof Error ? error.message : 'Context test failed'
      });
    }
  };

  const runAllTests = async () => {
    await testConfiguration();
    await testConnection();
    await testContextInjection();
    
    toast({
      title: "Test Suite Complete",
      description: "Check results below",
    });
  };

  const renderTestResult = (test: TestResult, name: string) => {
    const icon = {
      idle: null,
      running: <Loader2 className="h-4 w-4 animate-spin" />,
      success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      error: <XCircle className="h-4 w-4 text-red-500" />
    }[test.status];

    return (
      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{name}</span>
          <div className="flex items-center gap-2">
            {icon}
            <Badge variant={test.status === 'success' ? 'default' : test.status === 'error' ? 'destructive' : 'secondary'}>
              {test.status}
            </Badge>
          </div>
        </div>
        {test.message && (
          <p className="text-xs text-muted-foreground">{test.message}</p>
        )}
        {test.details && (
          <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
            {JSON.stringify(test.details, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Test Suite</CardTitle>
        <CardDescription>Verify agent configuration and connectivity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            These tests verify your agent is properly configured and can connect to ElevenLabs services.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {renderTestResult(configTest, 'Configuration Check')}
          {renderTestResult(connectionTest, 'Connection Test')}
          {renderTestResult(contextTest, 'Context Injection')}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={testConfiguration} variant="outline" size="sm">
            Test Config
          </Button>
          <Button onClick={testConnection} variant="outline" size="sm">
            Test Connection
          </Button>
          <Button onClick={testContextInjection} variant="outline" size="sm">
            Test Context
          </Button>
          <Button onClick={runAllTests} variant="default" size="sm">
            Run All Tests
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
