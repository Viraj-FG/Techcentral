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
import { AgentStatus } from "@/components/admin/AgentStatus";
import { AgentTestPanel } from "@/components/admin/AgentTestPanel";
import { DeploymentChecklist } from "@/components/admin/DeploymentChecklist";
import { motion } from "framer-motion";
import { kaevaTransition } from "@/hooks/useKaevaMotion";

const Admin = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-kaeva-seattle-slate p-6">
      <motion.div 
        className="max-w-7xl mx-auto space-y-6"
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
        <Tabs defaultValue="agent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 glass-card">
            <TabsTrigger value="agent" className="text-micro">Agent Config</TabsTrigger>
            <TabsTrigger value="testing" className="text-micro">Testing</TabsTrigger>
            <TabsTrigger value="users" className="text-micro">Users</TabsTrigger>
            <TabsTrigger value="database" className="text-micro">Database</TabsTrigger>
            <TabsTrigger value="logs" className="text-micro">Logs</TabsTrigger>
            <TabsTrigger value="analytics" className="text-micro">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="agent" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgentConfig />
              <AgentStatus />
            </div>
            <AgentTestPanel />
            <DeploymentChecklist />
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
      </motion.div>
    </div>
  );
};

export default Admin;