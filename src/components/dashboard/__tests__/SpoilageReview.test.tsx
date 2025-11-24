import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SpoilageReview } from '../SpoilageReview';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('SpoilageReview', () => {
  const mockOnComplete = vi.fn();
  const mockItems = [
    { id: '1', name: 'Milk', days_old: 5, category: 'Dairy' },
    { id: '2', name: 'Bread', days_old: 3, category: 'Bakery' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders spoiled items', () => {
    render(<SpoilageReview items={mockItems} onComplete={mockOnComplete} />);
    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('Bread')).toBeInTheDocument();
  });

  it('handles keep action', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ error: null });
    const mockEq = vi.fn().mockReturnValue({ update: mockUpdate }); // Fix chain: from().update().eq()
    // Actually, it's from().update().eq()
    // So mockFrom returns { update: () => { eq: ... } }
    
    const mockEqFinal = vi.fn().mockResolvedValue({ error: null });
    const mockUpdateFinal = vi.fn().mockReturnValue({ eq: mockEqFinal });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdateFinal });
    
    vi.mocked(supabase.from).mockImplementation(mockFrom as any);

    render(<SpoilageReview items={[mockItems[0]]} onComplete={mockOnComplete} />);

    const keepButton = screen.getByRole('button', { name: /still good/i });
    fireEvent.click(keepButton);

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('inventory');
      expect(mockUpdateFinal).toHaveBeenCalledWith({ last_activity_at: expect.any(String) });
      expect(mockEqFinal).toHaveBeenCalledWith('id', '1');
    });
  });

  it('handles discard action', async () => {
    // Mock auth
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user1' } },
      error: null,
    } as any);

    // Mock chain for profiles select
    const mockSingle = vi.fn().mockResolvedValue({ data: { current_household_id: 'house1' }, error: null });
    const mockEqProfile = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelectProfile = vi.fn().mockReturnValue({ eq: mockEqProfile });
    
    // Mock chain for inventory update
    const mockEqInventory = vi.fn().mockResolvedValue({ error: null });
    const mockUpdateInventory = vi.fn().mockReturnValue({ eq: mockEqInventory });

    // Mock chain for shopping list insert
    const mockInsertShopping = vi.fn().mockResolvedValue({ error: null });

    // Main mockFrom
    const mockFrom = vi.fn((table) => {
      if (table === 'profiles') return { select: mockSelectProfile };
      if (table === 'inventory') return { update: mockUpdateInventory };
      if (table === 'shopping_list') return { insert: mockInsertShopping };
      return {};
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom as any);

    render(<SpoilageReview items={[mockItems[0]]} onComplete={mockOnComplete} />);

    const discardButton = screen.getByRole('button', { name: /discard/i });
    fireEvent.click(discardButton);

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('inventory');
      expect(mockUpdateInventory).toHaveBeenCalledWith({ quantity: 0, status: 'out_of_stock' });
      expect(mockEqInventory).toHaveBeenCalledWith('id', '1');
      
      expect(mockFrom).toHaveBeenCalledWith('shopping_list');
      expect(mockInsertShopping).toHaveBeenCalledWith(expect.objectContaining({
        item_name: 'Milk',
        source: 'spoilage',
      }));
    });
  });
});
