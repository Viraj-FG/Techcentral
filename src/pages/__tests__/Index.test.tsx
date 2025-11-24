import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Index from '../Index';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          limit: vi.fn(),
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

// Mock child components
vi.mock('@/components/Splash', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="splash-screen">
      Splash Screen
      <button onClick={onComplete}>Complete Splash</button>
    </div>
  ),
}));

vi.mock('@/components/VoiceOnboarding', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="voice-onboarding">
      Voice Onboarding
      <button onClick={onComplete}>Complete Onboarding</button>
    </div>
  ),
}));

vi.mock('@/components/Dashboard', () => ({
  default: () => <div data-testid="dashboard">Dashboard</div>,
}));

vi.mock('@/components/LoadingState', () => ({
  default: () => <div data-testid="loading-state">Loading...</div>,
}));

describe('Index Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to auth if no session', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<div>Auth Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Auth Page')).toBeInTheDocument();
    });
  });

  it('shows dashboard if onboarding is completed', async () => {
    const mockSession = { user: { id: 'user-123', email: 'test@example.com' } };
    const mockProfile = {
      id: 'user-123',
      onboarding_completed: true,
      current_household_id: 'house-123',
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const selectMock = vi.fn();
    (supabase.from as any).mockImplementation(() => ({
      select: selectMock,
    }));

    // Mock profile fetch
    selectMock.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      }),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Index />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });

  it('shows onboarding if onboarding is not completed', async () => {
    const mockSession = { user: { id: 'user-123', email: 'test@example.com' } };
    const mockProfile = {
      id: 'user-123',
      onboarding_completed: false,
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const selectMock = vi.fn();
    (supabase.from as any).mockImplementation(() => ({
      select: selectMock,
    }));

    // Mock profile fetch
    selectMock.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      }),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Index />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show onboarding directly
    await waitFor(() => {
      expect(screen.getByTestId('voice-onboarding')).toBeInTheDocument();
    });
  });
});
