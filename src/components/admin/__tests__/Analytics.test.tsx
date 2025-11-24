import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Analytics } from '../Analytics';
import { mockProfiles } from '@/test/mocks/adminData';

const mockSelect = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: mockSelect,
    }),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders analytics dashboard', () => {
    render(<Analytics />);
    expect(screen.getByText(/Completion Rate/i)).toBeInTheDocument();
  });

  it('fetches and displays analytics data', async () => {
    mockSelect.mockResolvedValue({
      data: mockProfiles,
      error: null
    });

    render(<Analytics />);

    await waitFor(() => {
      // Calculate expected completion rate: 2/3 of 50 is ~33 completed. 33/50 = 66%
      const elements = screen.getAllByText(/66%/);
      expect(elements[0]).toBeInTheDocument();
      
      const totalUsersElements = screen.getAllByText('50');
      expect(totalUsersElements.length).toBeGreaterThan(0);
      expect(totalUsersElements[0]).toBeInTheDocument();
    });
  });
});
