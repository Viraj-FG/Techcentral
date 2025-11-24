import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Join from '../Join';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      update: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
    })),
  },
}));

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Join Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error when no token is provided', async () => {
    render(
      <MemoryRouter initialEntries={['/join']}>
        <Routes>
          <Route path="/join" element={<Join />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Invalid Invite')).toBeInTheDocument();
      expect(screen.getByText('Invalid invite link - no token provided')).toBeInTheDocument();
    });
  });

  it('verifies invite and shows join card', async () => {
    const mockInviteData = {
      household_id: 'house-123',
      household_name: 'Test House',
      inviter_id: 'user-123',
    };

    (supabase.functions.invoke as any).mockResolvedValue({
      data: mockInviteData,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/join?token=valid-token']}>
        <Routes>
          <Route path="/join" element={<Join />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Join Household')).toBeInTheDocument();
      expect(screen.getByText(/You've been invited to join/)).toBeInTheDocument();
      expect(screen.getByText('Test House')).toBeInTheDocument();
    });
  });

  it('handles invite verification error', async () => {
    (supabase.functions.invoke as any).mockResolvedValue({
      data: null,
      error: new Error('Invalid token'),
    });

    render(
      <MemoryRouter initialEntries={['/join?token=invalid-token']}>
        <Routes>
          <Route path="/join" element={<Join />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Invalid Invite')).toBeInTheDocument();
    });
  });

  it('redirects to auth if user tries to accept without session', async () => {
    const mockInviteData = {
      household_id: 'house-123',
      household_name: 'Test House',
      inviter_id: 'user-123',
    };

    (supabase.functions.invoke as any).mockResolvedValue({
      data: mockInviteData,
      error: null,
    });

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
    });

    render(
      <MemoryRouter initialEntries={['/join?token=valid-token']}>
        <Routes>
          <Route path="/join" element={<Join />} />
          <Route path="/auth" element={<div>Auth Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Join Household')).toBeInTheDocument();
    });

    const joinButton = screen.getByRole('button', { name: /Accept Invite/i });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Auth Page')).toBeInTheDocument();
    });
  });
});
