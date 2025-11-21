import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const SystemLogs = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Logs</CardTitle>
        <CardDescription>View edge function and system logs</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            To view detailed system logs, edge function logs, and authentication events, 
            visit the Backend section in your project settings.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};