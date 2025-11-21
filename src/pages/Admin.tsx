import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { AgentConfig } from "@/components/admin/AgentConfig";
import { TestingTools } from "@/components/admin/TestingTools";
import { UserManagement } from "@/components/admin/UserManagement";
import { DatabaseInspector } from "@/components/admin/DatabaseInspector";
import { SystemLogs } from "@/components/admin/SystemLogs";
import { Analytics } from "@/components/admin/Analytics";

const Admin = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">
              Manage agent configuration, testing, and system monitoring
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="agent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="agent">Agent Config</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="agent">
            <AgentConfig />
          </TabsContent>

          <TabsContent value="testing">
            <TestingTools />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="database">
            <DatabaseInspector />
          </TabsContent>

          <TabsContent value="logs">
            <SystemLogs />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;