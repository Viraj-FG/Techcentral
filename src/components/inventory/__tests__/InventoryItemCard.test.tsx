import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InventoryItemCard } from '../InventoryItemCard';

const { mockSupabase, mockUpdate, mockEq } = vi.hoisted(() => {
  const mockEq = vi.fn();
  const mockUpdate = vi.fn(() => ({ eq: mockEq }));
  const mockSupabase = {
    from: vi.fn(() => ({
      update: mockUpdate,
    })),
  };
  return { mockSupabase, mockUpdate, mockEq };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

const mockItem = {
  id: 'item-1',
  household_id: 'house-1',
  name: 'Test Item',
  brand_name: 'Test Brand',
  category: 'fridge' as const,
  quantity: 5,
  unit: 'pcs',
  fill_level: 50,
  expiry_date: '2024-12-31',
  status: 'ok',
  auto_order_enabled: false,
  reorder_threshold: 10,
  product_image_url: null
};

describe('InventoryItemCard', () => {
  const mockOnToggleSelection = vi.fn();
  const mockOnLongPress = vi.fn();
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
  });

  it('renders item details', () => {
    render(
      <InventoryItemCard
        item={mockItem}
        isSelectionMode={false}
        isSelected={false}
        onToggleSelection={mockOnToggleSelection}
        onLongPress={mockOnLongPress}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
    expect(screen.getByText('5 pcs')).toBeInTheDocument();
  });

  it('handles quantity update', async () => {
    render(
      <InventoryItemCard
        item={mockItem}
        isSelectionMode={false}
        isSelected={false}
        onToggleSelection={mockOnToggleSelection}
        onLongPress={mockOnLongPress}
        onRefresh={mockOnRefresh}
      />
    );

    const quantityText = screen.getByText('5 pcs');
    const stepperContainer = quantityText.parentElement;
    // The structure is Button, span, Button
    const plusButton = stepperContainer?.children[2];

    expect(plusButton).toBeDefined();
    if (plusButton) {
      fireEvent.click(plusButton);
    }

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('inventory');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        quantity: 6
      }));
      expect(mockEq).toHaveBeenCalledWith('id', 'item-1');
    });
  });
});
