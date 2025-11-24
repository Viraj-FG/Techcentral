import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UserManagement } from '../UserManagement';
import { mockRealProfile, mockRealInventory } from '@/test/mocks/adminData';
import Inventory from '@/pages/Inventory';
import Dashboard from '@/components/Dashboard';

// Mock AppShell to avoid complex layout rendering
vi.mock('@/components/layout/AppShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock SwipeableCard
vi.mock('@/components/ui/SwipeableCard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock EmptyState
vi.mock('@/components/ui/EmptyState', () => ({
  default: () => <div>Empty State</div>,
}));

// Mock FilterBottomSheet
vi.mock('@/components/inventory/FilterBottomSheet', () => ({
  default: () => <div>Filter Bottom Sheet</div>,
}));

// Mock InventoryItemCard
vi.mock('@/components/inventory/InventoryItemCard', () => ({
  InventoryItemCard: ({ item }: { item: any }) => (
    <div>
      <div>{item.name}</div>
      <div>{item.quantity} {item.unit}</div>
    </div>
  ),
}));

// Mock NotificationBell
vi.mock('@/components/ui/NotificationBell', () => ({
  NotificationBell: () => <div>Notification Bell</div>,
}));

// Mock KaevaAperture
vi.mock('@/components/KaevaAperture', () => ({
  default: () => <div>Kaeva Aperture</div>,
}));

// Mock UI Components
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock Dashboard dependencies
vi.mock('@/components/voice/VoiceAssistant', () => ({
  default: () => <div>Voice Assistant</div>,
  useVoiceAssistant: () => ({ isListening: false }),
}));

vi.mock('@/hooks/useTimeBasedGreeting', () => ({
  useTimeBasedGreeting: (name: string) => ({
    greeting: `Good Morning, ${name || 'User'}`,
    emoji: '☀️',
    timeOfDay: 'morning',
    color: 'from-amber-400/20 to-orange-400/20',
    message: 'Ready to start your day fresh?'
  }),
}));

vi.mock('@/hooks/usePullToRefresh', () => ({
  usePullToRefresh: () => ({ ref: { current: null } }),
}));

// Mock Dashboard sub-components
vi.mock('@/components/dashboard/PulseHeader', () => ({
  default: () => <div>Pulse Header</div>,
}));

vi.mock('@/components/search/GlobalSearch', () => ({
  default: () => <div>Global Search</div>,
}));

vi.mock('@/components/dashboard/WelcomeBanner', () => ({
  default: () => <div>Welcome Banner</div>,
}));

vi.mock('@/components/dashboard/SmartCartWidget', () => ({
  default: () => <div>Smart Cart Widget</div>,
}));

vi.mock('@/components/dashboard/InventoryMatrix', () => ({
  default: () => <div>Inventory Matrix</div>,
}));

vi.mock('@/components/dashboard/RecipeFeed', () => ({
  default: () => <div>Recipe Feed</div>,
}));

vi.mock('@/components/dashboard/SocialImport', () => ({
  default: () => <div>Social Import</div>,
}));

vi.mock('@/components/dashboard/SafetyShield', () => ({
  default: () => <div>Safety Shield</div>,
}));

vi.mock('@/components/dashboard/HouseholdQuickAccess', () => ({
  default: () => <div>Household Quick Access</div>,
}));

vi.mock('@/components/dashboard/RecentActivity', () => ({
  default: () => <div>Recent Activity</div>,
}));

vi.mock('@/components/scanner/SmartScanner', () => ({
  default: () => <div>Smart Scanner</div>,
}));

vi.mock('@/components/dashboard/InventoryMatrixSkeleton', () => ({
  default: () => <div>Inventory Matrix Skeleton</div>,
}));

vi.mock('@/components/dashboard/NutritionWidget', () => ({
  default: () => <div>Nutrition Widget</div>,
}));

// Mock Framer Motion
vi.mock('framer-motion', () => {
  const motion = new Proxy({}, {
    get: (target, prop) => {
      return ({ children, ...props }: any) => {
        const Tag = prop as any;
        return <Tag {...props}>{children}</Tag>;
      }
    }
  });
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Mock Sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock Custom Hooks
vi.mock('@/hooks/useOptimisticUpdate', () => ({
  useOptimisticUpdate: () => ({ performUpdate: vi.fn() }),
}));

vi.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({ trigger: vi.fn() }),
}));

// Mock Supabase
const { mockSelect, mockOrder, mockLimit, mockEq, mockSingle, mockGetUser, mockOnAuthStateChange, mockChannel } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockOrder: vi.fn(),
  mockLimit: vi.fn(),
  mockEq: vi.fn(),
  mockSingle: vi.fn(),
  mockGetUser: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockChannel: vi.fn(),
}));

const mockQueryBuilder = {
  select: mockSelect,
  eq: mockEq,
  order: mockOrder,
  limit: mockLimit,
  single: mockSingle,
};

// Setup chaining
mockSelect.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockOrder.mockReturnValue(mockQueryBuilder);

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => mockQueryBuilder,
    channel: mockChannel.mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn()
      })
    }),
    removeChannel: vi.fn(),
    auth: {
      getUser: mockGetUser,
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-id' } } }, error: null }),
      onAuthStateChange: mockOnAuthStateChange
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
  },
}));

// Mock other hooks
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

// Mock RealtimeContext
vi.mock('@/contexts/RealtimeContext', () => ({
  useRealtime: () => ({
    isConnected: true,
  }),
}));

describe('End-to-End Integration with Real Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default auth mocks
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockRealProfile.id } },
      error: null
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });
  });

  describe('Admin View of User Profile', () => {
    it('displays the real user profile data correctly', async () => {
      // Setup mock to return the real profile
      mockLimit.mockResolvedValue({
        data: [mockRealProfile],
        error: null
      });

      render(<UserManagement />);

      await waitFor(() => {
        // Check for Name
        expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
        
        // Check for completion status (Alex has completed onboarding)
        // The component might show a checkmark or "Completed" text depending on implementation
        // Based on previous tests, we know it lists users.
      });
    });
  });

  describe('User Feature: Inventory Management', () => {
    it('displays the real inventory items for the user', async () => {
      // Mock profile fetch (first call)
      mockSingle.mockResolvedValue({
        data: { current_household_id: mockRealProfile.current_household_id },
        error: null
      });

      // Mock inventory fetch (second call)
      mockOrder.mockResolvedValue({
        data: mockRealInventory,
        error: null
      });

      render(<Inventory />);

      await waitFor(() => {
        // Check for specific real items
        expect(screen.getByText('Organic Whole Milk')).toBeInTheDocument();
        expect(screen.getByText('Free Range Eggs')).toBeInTheDocument();
        expect(screen.getByText('Chicken Breast')).toBeInTheDocument();
        expect(screen.getByText('Greek Yogurt')).toBeInTheDocument();
        expect(screen.getByText('Bell Peppers')).toBeInTheDocument();

        // Check for quantities/units if displayed
        expect(screen.getByText('1 gallon')).toBeInTheDocument();
        expect(screen.getByText('6 count')).toBeInTheDocument();
      });
    });
  });

  describe('User Feature: Dashboard', () => {
    it('displays the welcome message for the user', async () => {
      // Mock inventory fetch for dashboard
      mockOrder.mockResolvedValue({
        data: mockRealInventory,
        error: null
      });

      render(<Dashboard profile={mockRealProfile} />);

      await waitFor(() => {
        // Check for Greeting and Name
        // The dashboard usually says "Good Morning, Alex Morgan" or similar
        // We mocked the greeting to "Good Morning"
        expect(screen.getByText(/Good Morning/i)).toBeInTheDocument();
        expect(screen.getByText(/Alex Morgan/i)).toBeInTheDocument();
      });
    });
  });
});
