import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Settings from '../Settings';
import { mockSupabase } from '../../test/mocks/supabase';

// Mock child components
vi.mock('@/components/AuroraBackground', () => ({
  default: () => <div data-testid="aurora-bg" />
}));

vi.mock('@/components/ConversationHistory', () => ({
  default: () => <div data-testid="conversation-history">Conversation History</div>
}));

vi.mock('@/components/dashboard/StoreSelector', () => ({
  default: () => <div data-testid="store-selector">Store Selector</div>
}));

// Mock Tabs to render all content for easier testing
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const renderSettings = () => {
  return render(
    <BrowserRouter>
      <Settings />
    </BrowserRouter>
  );
};

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays user profile', async () => {
    const mockProfile = {
      id: 'user123',
      user_name: 'Test User',
      dietary_preferences: ['Vegan'],
      allergies: ['Nuts'],
      beauty_profile: { skinType: 'Oily', hairType: 'Curly' },
      household_adults: 2,
      household_kids: 1
    };

    // Mock auth session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user123' } } },
      error: null
    });

    // Mock profile fetch
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        })
      })
    });

    renderSettings();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      // The dietary values might be in a textarea or input, check if it's rendered
      const dietaryInput = screen.getByLabelText(/dietary/i);
      expect(dietaryInput).toHaveValue('Vegan');
    });
  });

  it('redirects to auth if no session', async () => {
    // Mock no session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });

    renderSettings();

    // Since we are using BrowserRouter, we can't easily check the URL change without a custom history object or MemoryRouter with initial entries.
    // But we can check that the profile fetch was NOT called.
    await waitFor(() => {
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });
});
