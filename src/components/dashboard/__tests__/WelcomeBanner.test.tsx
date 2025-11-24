import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WelcomeBanner from '../WelcomeBanner';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('WelcomeBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders nothing if onboarding is completed', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: '123' } } },
    });
    
    // Mock profile with onboarding_completed: true
    (supabase.from as any).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { onboarding_completed: true } }),
        }),
      }),
    }));

    render(<WelcomeBanner />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Welcome/i)).not.toBeInTheDocument();
    });
  });

  it('renders banner if onboarding is not completed', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: '123' } } },
    });
    
    // Mock profile with onboarding_completed: false
    (supabase.from as any).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { onboarding_completed: false } }),
        }),
      }),
    }));

    render(<WelcomeBanner />);
    
    await waitFor(() => {
      expect(screen.getByText(/Welcome to Kaeva Command Center/i)).toBeInTheDocument();
    });
  });
});
