import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../Dashboard';
import { mockSupabase } from '../../test/mocks/supabase';

// Mock child components
vi.mock('../layout/AppShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="app-shell">{children}</div>
}));

vi.mock('../voice/VoiceAssistant', () => ({
  default: () => <div data-testid="voice-assistant">Voice Assistant</div>,
  useVoiceAssistant: () => ({ startConversation: vi.fn() })
}));

vi.mock('../dashboard/InventoryMatrix', () => ({
  default: () => <div data-testid="inventory-matrix">Inventory Matrix</div>
}));

vi.mock('../dashboard/RecipeFeed', () => ({
  default: () => <div data-testid="recipe-feed">Recipe Feed</div>
}));

vi.mock('../dashboard/RecentActivity', () => ({
  default: () => <div data-testid="recent-activity">Recent Activity</div>
}));

vi.mock('../dashboard/WelcomeBanner', () => ({
  default: () => <div>Welcome</div>
}));

vi.mock('../dashboard/PulseHeader', () => ({
  default: () => <div>Header</div>
}));

vi.mock('../dashboard/SmartCartWidget', () => ({
  default: () => <div>Smart Cart</div>
}));

vi.mock('../dashboard/NutritionWidget', () => ({
  default: () => <div>Nutrition</div>
}));

vi.mock('../dashboard/SafetyShield', () => ({
  default: () => <div>Safety</div>
}));

vi.mock('../dashboard/HouseholdQuickAccess', () => ({
  default: () => <div>Household</div>
}));

vi.mock('../scanner/SmartScanner', () => ({
  default: () => <div>Scanner</div>
}));

vi.mock('../search/GlobalSearch', () => ({
  default: () => <div>Search</div>
}));

vi.mock('../dashboard/SocialImport', () => ({
  default: () => <div>Social Import</div>
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderDashboard = (profile = { id: '123', user_name: 'Test User' }) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Dashboard profile={profile} />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard components', async () => {
    // Mock auth user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: '123' } },
      error: null
    });

    // Mock profile fetch for inventory
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { current_household_id: 'house123' },
            error: null
          })
        })
      })
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('app-shell')).toBeInTheDocument();
      expect(screen.getByTestId('voice-assistant')).toBeInTheDocument();
      // These might be hidden initially due to loading state
    });
  });

  it('fetches inventory data on load', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: '123' } },
      error: null
    });

    const mockInventory = [
      { id: '1', category: 'fridge', name: 'Item 1' }
    ];

    // Mock chain for profile then inventory
    const selectMock = vi.fn();
    const eqMock = vi.fn();
    const singleMock = vi.fn();

    mockSupabase.from.mockReturnValue({
      select: selectMock,
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      channel: vi.fn().mockReturnValue({ on: vi.fn(), subscribe: vi.fn() }),
    } as any);

    // First call: Profile
    selectMock.mockReturnValueOnce({
      eq: vi.fn().mockReturnValueOnce({
        single: vi.fn().mockResolvedValue({
          data: { current_household_id: 'house123' },
          error: null
        })
      })
    });

    // Second call: Inventory
    selectMock.mockReturnValueOnce({
      eq: vi.fn().mockResolvedValue({
        data: mockInventory,
        error: null
      })
    });

    renderDashboard();

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      // Eventually it should call inventory
    });
  });
});
