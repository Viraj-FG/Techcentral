import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GlobalSearch from '../GlobalSearch';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock useNavigate
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('GlobalSearch', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    render(<GlobalSearch open={false} onOpenChange={mockOnOpenChange} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('fetches data when opened', async () => {
    // Mock auth
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user1' } },
      error: null,
    } as any);

    // Mock profile select
    const mockSingle = vi.fn().mockResolvedValue({ data: { current_household_id: 'house1' }, error: null });
    const mockEqProfile = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelectProfile = vi.fn().mockReturnValue({ eq: mockEqProfile });

    // Mock data selects
    const mockSelectInventory = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ id: 1, name: 'Milk' }], error: null }) });
    const mockSelectRecipes = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) });
    const mockSelectPets = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) });

    const mockFrom = vi.fn((table) => {
      if (table === 'profiles') return { select: mockSelectProfile };
      if (table === 'inventory') return { select: mockSelectInventory };
      if (table === 'recipes') return { select: mockSelectRecipes };
      if (table === 'pets') return { select: mockSelectPets };
      return {};
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom as any);

    render(<GlobalSearch open={true} onOpenChange={mockOnOpenChange} />);

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('inventory');
      expect(screen.getByText('Milk')).toBeInTheDocument();
    });
  });
});
