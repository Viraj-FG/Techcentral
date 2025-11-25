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
          <ScrollArea className="w-full">
            <TabsList className="inline-flex h-12 w-max gap-1 p-1 glass-card">
              <TabsTrigger value="health" className="text-micro px-4 min-w-[80px]">Health</TabsTrigger>
              <TabsTrigger value="agent" className="text-micro px-4 min-w-[80px]">Agent</TabsTrigger>
              <TabsTrigger value="monitor" className="text-micro px-4 min-w-[80px]">Monitor</TabsTrigger>
              <TabsTrigger value="testing" className="text-micro px-4 min-w-[80px]">Testing</TabsTrigger>
              <TabsTrigger value="users" className="text-micro px-4 min-w-[80px]">Users</TabsTrigger>
              <TabsTrigger value="database" className="text-micro px-4 min-w-[80px]">Database</TabsTrigger>
              <TabsTrigger value="logs" className="text-micro px-4 min-w-[80px]">Logs</TabsTrigger>
              <TabsTrigger value="tool-logs" className="text-micro px-4 min-w-[80px]">Tools</TabsTrigger>
              <TabsTrigger value="context" className="text-micro px-4 min-w-[80px]">Context</TabsTrigger>
              <TabsTrigger value="analytics" className="text-micro px-4 min-w-[80px]">Analytics</TabsTrigger>
            </TabsList>
          </ScrollArea>

          <TabsContent value="health" className="space-y-6">
            <AgentHealthDashboard />
          </TabsContent>

          <TabsContent value="agent" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgentProvisioning />
              <AgentStatus />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgentTestPanel />
              <DeploymentChecklist />
            </div>
          </TabsContent>

          <TabsContent value="monitor">
            <ConversationMonitor />
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