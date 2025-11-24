import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StoreSelector from '../StoreSelector';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

describe('StoreSelector', () => {
  const mockOnClose = vi.fn();
  const mockOnStoreSelected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog when open', () => {
    render(
      <StoreSelector
        open={true}
        onClose={mockOnClose}
        userId="test-user"
      />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter zip code/i)).toBeInTheDocument();
  });

  it('searches for stores', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({
      data: {
        retailers: [
          { retailer_key: '1', name: 'Test Store', banner_name: 'Test Chain' },
        ],
      },
      error: null,
    });

    render(
      <StoreSelector
        open={true}
        onClose={mockOnClose}
        userId="test-user"
      />
    );

    const input = screen.getByPlaceholderText(/enter zip code/i);
    fireEvent.change(input, { target: { value: '12345' } });

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('instacart-service', {
        body: { action: 'get_nearby_retailers', zipCode: '12345' },
      });
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });
  });

  it('selects a store', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({
      data: {
        retailers: [
          { retailer_key: '1', name: 'Test Store', banner_name: 'Test Chain' },
        ],
      },
      error: null,
    });

    render(
      <StoreSelector
        open={true}
        onClose={mockOnClose}
        userId="test-user"
        onStoreSelected={mockOnStoreSelected}
      />
    );

    // Trigger search to populate list
    const input = screen.getByPlaceholderText(/enter zip code/i);
    fireEvent.change(input, { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    // Select store
    fireEvent.click(screen.getByText('Test Store'));

    await waitFor(() => {
      expect(mockOnStoreSelected).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Store',
      }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
