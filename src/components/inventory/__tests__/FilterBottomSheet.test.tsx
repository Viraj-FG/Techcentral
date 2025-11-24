import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBottomSheet } from '../FilterBottomSheet';

describe('FilterBottomSheet', () => {
  const mockOnClose = vi.fn();
  const mockOnApplyFilters = vi.fn();

  it('renders filter options', () => {
    render(
      <FilterBottomSheet
        isOpen={true}
        onClose={mockOnClose}
        onApplyFilters={mockOnApplyFilters}
      />
    );

    expect(screen.getByText('Filter Items')).toBeInTheDocument();
    expect(screen.getByText('fridge')).toBeInTheDocument();
    expect(screen.getByText('pantry')).toBeInTheDocument();
  });

  it('toggles categories', () => {
    render(
      <FilterBottomSheet
        isOpen={true}
        onClose={mockOnClose}
        onApplyFilters={mockOnApplyFilters}
      />
    );

    const fridgeCategory = screen.getByText('fridge');
    fireEvent.click(fridgeCategory);
    
    // Check if it has the active class (bg-kaeva-sage/20)
    // Note: Testing classes is brittle, but we can check if the state update logic works by applying
    
    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    fireEvent.click(applyButton);

    expect(mockOnApplyFilters).toHaveBeenCalledWith(expect.objectContaining({
      categories: ['fridge']
    }));
  });

  it('resets filters', () => {
    render(
      <FilterBottomSheet
        isOpen={true}
        onClose={mockOnClose}
        onApplyFilters={mockOnApplyFilters}
      />
    );

    const fridgeCategory = screen.getByText('fridge');
    fireEvent.click(fridgeCategory);

    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    fireEvent.click(applyButton);

    expect(mockOnApplyFilters).toHaveBeenCalledWith(expect.objectContaining({
      categories: []
    }));
  });
});
