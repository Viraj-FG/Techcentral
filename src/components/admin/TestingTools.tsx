import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PlayCircle, Trash2, Wifi, Mic, RefreshCw, Zap, StopCircle } from "lucide-react";

export const TestingTools = () => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showDebugLogs, setShowDebugLogs] = useState(() => {
    return localStorage.getItem('kaeva_debug_logs') === 'true';
  });
  const { toast } = useToast();

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { error } = await supabase.functions.invoke("generate-signed-url", {
        body: { agentId: "agent_0501kakwnx5rffaby5px9y1pskkb" },
      });

      if (error) throw error;

      toast({
        title: "Connection Test Passed",
        description: "Successfully connected to ElevenLabs API",
      });
    } catch (error) {
      console.error("Connection test failed:", error);
      toast({
        title: "Connection Test Failed",
        description: error instanceof Error ? error.message : "Failed to connect",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testAudioPermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      toast({
        title: "Audio Permissions Granted",
        description: "Microphone access is available",
      });
    } catch (error) {
      toast({
        title: "Audio Permissions Denied",
        description: "Please grant microphone access to test voice features",
        variant: "destructive",
      });
    }
  };

  const clearTestData = async () => {
    setIsClearing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Clear current user's test data
      await supabase.from("profiles").update({
        onboarding_completed: false,
        dietary_preferences: [],
        allergies: [],
        beauty_profile: {},
        health_goals: [],
        lifestyle_goals: [],
        household_adults: 1,
        household_kids: 0,
        user_name: null,
      }).eq("id", user.id);

      await supabase.from("pets").delete().eq("user_id", user.id);
      await supabase.from("conversation_history").delete().eq("user_id", user.id);

      toast({
        title: "Test Data Cleared",
        description: "Your profile has been reset for testing",
      });

      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Clear data error:", error);
      toast({
        title: "Clear Failed",
        description: error instanceof Error ? error.message : "Failed to clear data",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const testWakeWord = () => {
    toast({
      title: "Wake Word Test",
      description: "Say 'Kaeva' or 'Hey Kaeva' to activate",
    });
    // In production, this would trigger the wake word detection manually
  };

  const forceEndConversation = () => {
    // Dispatch a custom event to force end any active conversation
    window.dispatchEvent(new CustomEvent('force-end-conversation'));
    toast({
      title: "Conversation Ended",
      description: "All active voice sessions have been terminated",
    });
  };

  const toggleDebugLogs = () => {
    const newValue = !showDebugLogs;
    setShowDebugLogs(newValue);
    localStorage.setItem('kaeva_debug_logs', String(newValue));
    toast({
      title: newValue ? "Debug Logs Enabled" : "Debug Logs Disabled",
      description: newValue ? "Check console for detailed logs" : "Console logging reduced",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connection Tests</CardTitle>
          <CardDescription>Test external service connectivity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={testConnection}
            disabled={isTestingConnection}
            variant="outline"
            className="w-full justify-start"
          >
            <Wifi className="h-4 w-4" />
            {isTestingConnection ? "Testing..." : "Test ElevenLabs Connection"}
          </Button>

          <Button
            onClick={testAudioPermissions}
            variant="outline"
            className="w-full justify-start"
          >
            <Mic className="h-4 w-4" />
            Test Audio Permissions
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding Testing</CardTitle>
          <CardDescription>Test the voice onboarding flow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => window.location.href = "/"}
            variant="outline"
            className="w-full justify-start"
          >
            <PlayCircle className="h-4 w-4" />
            Start Test Conversation
          </Button>

          <Button
            onClick={clearTestData}
            disabled={isClearing}
            variant="destructive"
            className="w-full justify-start"
          >
            {isClearing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Clear My Test Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Voice Control</CardTitle>
          <CardDescription>Manual voice assistant controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={testWakeWord}
            variant="outline"
            className="w-full justify-start"
          >
            <Zap className="h-4 w-4" />
            Test Wake Word
          </Button>

          <Button
            onClick={forceEndConversation}
            variant="outline"
            className="w-full justify-start"
          >
            <StopCircle className="h-4 w-4" />
            Force End Conversation
          </Button>

          <Button
            onClick={toggleDebugLogs}
            variant={showDebugLogs ? "default" : "outline"}
            className="w-full justify-start"
          >
            <RefreshCw className="h-4 w-4" />
            {showDebugLogs ? "Debug Logs: ON" : "Debug Logs: OFF"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};