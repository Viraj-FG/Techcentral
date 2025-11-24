import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditItemModal } from '../EditItemModal';

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
  name: 'Test Item',
  brand_name: 'Test Brand',
  category: 'fridge' as const,
  quantity: 5,
  unit: 'pcs',
  expiry_date: '2024-12-31',
  auto_order_enabled: false,
  reorder_threshold: 10,
};

describe('EditItemModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
  });

  it('renders modal when open', () => {
    render(
      <EditItemModal
        item={mockItem}
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    expect(screen.getByText('Edit Item Details')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <EditItemModal
        item={mockItem}
        open={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    expect(screen.queryByText('Edit Item Details')).not.toBeInTheDocument();
  });

  it('updates item successfully', async () => {
    render(
      <EditItemModal
        item={mockItem}
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByDisplayValue('Test Item');
    fireEvent.change(nameInput, { target: { value: 'Updated Item' } });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('inventory');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Updated Item'
      }));
      expect(mockEq).toHaveBeenCalledWith('id', 'item-1');
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('validates required fields', async () => {
    render(
      <EditItemModal
        item={mockItem}
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByDisplayValue('Test Item');
    fireEvent.change(nameInput, { target: { value: '' } });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
