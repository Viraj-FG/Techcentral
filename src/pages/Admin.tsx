import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { TestingTools } from "@/components/admin/TestingTools";
import { UserManagement } from "@/components/admin/UserManagement";
import { DatabaseInspector } from "@/components/admin/DatabaseInspector";
import { SystemLogs } from "@/components/admin/SystemLogs";
import { Analytics } from "@/components/admin/Analytics";
import { AgentStatus } from "@/components/admin/AgentStatus";
import { AgentTestPanel } from "@/components/admin/AgentTestPanel";
import { DeploymentChecklist } from "@/components/admin/DeploymentChecklist";
import { AgentHealthDashboard } from "@/components/admin/AgentHealthDashboard";
import ToolCallLogs from "@/components/admin/ToolCallLogs";
import ContextPreview from "@/components/admin/ContextPreview";
import { AgentProvisioning } from "@/components/admin/AgentProvisioning";
import { ConversationMonitor } from "@/components/admin/ConversationMonitor";
import { OnboardingResetTool } from "@/components/admin/OnboardingResetTool";
import { motion } from "framer-motion";
import { kaevaTransition } from "@/hooks/useKaevaMotion";

const Admin = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-kaeva-seattle-slate flex flex-col">
      <ScrollArea className="flex-1">
        <motion.div 
          className="max-w-7xl mx-auto space-y-6 p-6 pb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={kaevaTransition}
        >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield size={24} strokeWidth={1.5} className="text-kaeva-sage" />
              <h1 className="text-display text-3xl text-white">ADMIN DASHBOARD</h1>
            </div>
            <p className="text-body text-white/60">
              Manage agent configuration, testing, and system monitoring
            </p>
          </div>
          <Button variant="glass" onClick={() => navigate("/")}>
            <ArrowLeft size={20} strokeWidth={1.5} />
            <span className="text-micro ml-2">Back to Dashboard</span>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="health" className="space-y-6">
          <TabsList className="grid w-full grid-cols-10 glass-card">
            <TabsTrigger value="health" className="text-micro">Health</TabsTrigger>
            <TabsTrigger value="agent" className="text-micro">Agent</TabsTrigger>
            <TabsTrigger value="monitor" className="text-micro">Monitor</TabsTrigger>
            <TabsTrigger value="testing" className="text-micro">Testing</TabsTrigger>
            <TabsTrigger value="users" className="text-micro">Users</TabsTrigger>
            <TabsTrigger value="database" className="text-micro">Database</TabsTrigger>
            <TabsTrigger value="logs" className="text-micro">Logs</TabsTrigger>
            <TabsTrigger value="tool-logs" className="text-micro">Tools</TabsTrigger>
            <TabsTrigger value="context" className="text-micro">Context</TabsTrigger>
            <TabsTrigger value="analytics" className="text-micro">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="space-y-6">
            <AgentHealthDashboard />
          </TabsContent>

          <TabsContent value="agent" className="space-y-6">
            <AgentProvisioning />
            <AgentStatus />
            <AgentTestPanel />
            <DeploymentChecklist />
          </TabsContent>

          <TabsContent value="monitor">
            <ConversationMonitor />
          </TabsContent>

          <TabsContent value="testing">
            <TestingTools />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
            <OnboardingResetTool />
          </TabsContent>

          <TabsContent value="database">
            <DatabaseInspector />
          </TabsContent>

          <TabsContent value="logs">
            <SystemLogs />
          </TabsContent>

        <TabsContent value="tool-logs">
          <ToolCallLogs />
        </TabsContent>

        <TabsContent value="context">
          <ContextPreview />
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics />
        </TabsContent>
      </Tabs>
      </motion.div>
      </ScrollArea>
    </div>
  );
};

export default Admin;