import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductSelector from '../ProductSelector';

const mockProduct = {
  fatsecret_id: '1',
  name: 'Product 1',
  brand: 'Brand 1',
  image_url: null,
  nutrition: {
    calories: 100,
    protein: 10,
    carbs: 10,
    fat: 2,
  },
  allergens: [],
  dietary_flags: [],
  serving_size: '100g',
};

const mockAlternatives = [
  {
    fatsecret_id: '2',
    name: 'Product 2',
    brand: 'Brand 2',
    image_url: null,
    nutrition: {
      calories: 200,
      protein: 20,
      carbs: 20,
      fat: 4,
    },
    allergens: [],
    dietary_flags: [],
    serving_size: '200g',
  },
];

describe('ProductSelector', () => {
  const mockOnClose = vi.fn();
  const mockOnSelect = vi.fn();

  it('renders product options', () => {
    render(
      <ProductSelector
        open={true}
        onClose={mockOnClose}
        alternatives={mockAlternatives}
        currentProduct={mockProduct}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Select Correct Product')).toBeInTheDocument();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  it('selects a product', async () => {
    render(
      <ProductSelector
        open={true}
        onClose={mockOnClose}
        alternatives={mockAlternatives}
        currentProduct={mockProduct}
        onSelect={mockOnSelect}
      />
    );

    // Click on the second product
    fireEvent.click(screen.getByText('Product 2'));

    const confirmButton = screen.getByRole('button', { name: /confirm selection/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(expect.objectContaining({
        fatsecret_id: '2'
      }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
