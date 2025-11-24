import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UserManagement } from '../UserManagement';
import { mockProfiles } from '@/test/mocks/adminData';

const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: mockSelect.mockReturnValue({
        order: mockOrder.mockReturnValue({
          limit: mockLimit,
        }),
      }),
    }),
  },
}));

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user stats', async () => {
    mockLimit.mockResolvedValue({
      data: mockProfiles.slice(0, 5),
      error: null
    });

    render(<UserManagement />);

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('User 0')).toBeInTheDocument();
      expect(screen.getByText('User 1')).toBeInTheDocument();
    });
  });
});
