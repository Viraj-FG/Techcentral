import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HouseholdQuickAccess from '../HouseholdQuickAccess';
import { BrowserRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSelect = vi.fn();
const mockEq = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user' } } },
      }),
    },
    from: () => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq,
      }),
    }),
  },
}));

describe('HouseholdQuickAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and fetches member count', async () => {
    mockEq.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }], error: null });

    render(
      <BrowserRouter>
        <HouseholdQuickAccess />
      </BrowserRouter>
    );

    expect(screen.getByText(/Household Roster/i)).toBeInTheDocument();
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/2 members registered/i)).toBeInTheDocument();
    });
  });

  it('navigates to household page on click', () => {
    render(
      <BrowserRouter>
        <HouseholdQuickAccess />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText(/Household Roster/i).closest('div')!);
    expect(mockNavigate).toHaveBeenCalledWith('/household');
  });
});
