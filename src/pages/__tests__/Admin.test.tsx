import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Admin from '../Admin';

// Mock child components
vi.mock('@/components/admin/TestingTools', () => ({ TestingTools: () => <div>TestingTools</div> }));
vi.mock('@/components/admin/UserManagement', () => ({ UserManagement: () => <div>UserManagement</div> }));
vi.mock('@/components/admin/DatabaseInspector', () => ({ DatabaseInspector: () => <div>DatabaseInspector</div> }));
vi.mock('@/components/admin/SystemLogs', () => ({ SystemLogs: () => <div>SystemLogs</div> }));
vi.mock('@/components/admin/Analytics', () => ({ Analytics: () => <div>Analytics</div> }));
vi.mock('@/components/admin/AgentStatus', () => ({ AgentStatus: () => <div>AgentStatus</div> }));
vi.mock('@/components/admin/AgentTestPanel', () => ({ AgentTestPanel: () => <div>AgentTestPanel</div> }));
vi.mock('@/components/admin/DeploymentChecklist', () => ({ DeploymentChecklist: () => <div>DeploymentChecklist</div> }));
vi.mock('@/components/admin/AgentHealthDashboard', () => ({ AgentHealthDashboard: () => <div>AgentHealthDashboard</div> }));
vi.mock('@/components/admin/ToolCallLogs', () => ({ default: () => <div>ToolCallLogs</div> }));
vi.mock('@/components/admin/ContextPreview', () => ({ default: () => <div>ContextPreview</div> }));
vi.mock('@/components/admin/AgentProvisioning', () => ({ AgentProvisioning: () => <div>AgentProvisioning</div> }));
vi.mock('@/components/admin/ConversationMonitor', () => ({ ConversationMonitor: () => <div>ConversationMonitor</div> }));

// Mock Tabs
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button>{children}</button>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
}));

const renderAdmin = () => {
  return render(
    <BrowserRouter>
      <Admin />
    </BrowserRouter>
  );
};

describe('Admin Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders admin dashboard components', () => {
    renderAdmin();
    expect(screen.getByText(/ADMIN DASHBOARD/i)).toBeInTheDocument();
    expect(screen.getByText('TestingTools')).toBeInTheDocument();
    expect(screen.getByText('UserManagement')).toBeInTheDocument();
  });
});
