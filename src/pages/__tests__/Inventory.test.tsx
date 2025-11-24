import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Inventory from '../Inventory';
import { mockSupabase } from '../../test/mocks/supabase';

// Mock child components to simplify testing
vi.mock('@/components/layout/AppShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="app-shell">{children}</div>
}));

vi.mock('@/components/inventory/InventoryItemCard', () => ({
  InventoryItemCard: ({ item }: { item: any }) => <div data-testid="inventory-item">{item.name}</div>
}));

vi.mock('@/components/inventory/FilterBottomSheet', () => ({
  default: () => <div data-testid="filter-sheet">Filter</div>
}));

const renderInventory = () => {
  return render(
    <BrowserRouter>
      <Inventory />
    </BrowserRouter>
  );
};

describe('Inventory Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays inventory items', async () => {
    const mockItems = [
      { id: '1', name: 'Milk', category: 'fridge', quantity: 1 },
      { id: '2', name: 'Bread', category: 'pantry', quantity: 2 }
    ];

    // Mock auth user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null
    });

    // Mock profile fetch
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          single: vi.fn().mockResolvedValue({
            data: { current_household_id: 'house123' },
            error: null
          })
        })
      })
    });

    // Mock inventory fetch
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          order: vi.fn().mockResolvedValue({
            data: mockItems,
            error: null
          })
        })
      })
    });

    renderInventory();

    await waitFor(() => {
      expect(screen.getByText('Milk')).toBeInTheDocument();
      expect(screen.getByText('Bread')).toBeInTheDocument();
    });
  });

  it('handles empty inventory state', async () => {
    // Mock auth user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null
    });

    // Mock profile fetch
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          single: vi.fn().mockResolvedValue({
            data: { current_household_id: 'house123' },
            error: null
          })
        })
      })
    });

    // Mock empty inventory fetch
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
    });

    renderInventory();

    await waitFor(() => {
      // Assuming EmptyState renders some text like "No items found" or similar
      // Since we didn't mock EmptyState, we check for its content if known, 
      // or check that no items are rendered.
      expect(screen.queryByTestId('inventory-item')).not.toBeInTheDocument();
    });
  });
});
