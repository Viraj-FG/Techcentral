import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InventoryMatrix from '../InventoryMatrix';

// Mock InventoryCard to simplify testing
vi.mock('../InventoryCard', () => ({
  default: ({ title }: { title: string }) => <div data-testid="inventory-card">{title}</div>,
}));

describe('InventoryMatrix', () => {
  const mockInventory = {
    fridge: [],
    pantry: [],
    beauty: [],
    pets: [],
  };

  it('renders all inventory categories', () => {
    render(<InventoryMatrix inventory={mockInventory} />);

    expect(screen.getByText('Fridge')).toBeInTheDocument();
    expect(screen.getByText('Pantry')).toBeInTheDocument();
    expect(screen.getByText('Beauty')).toBeInTheDocument();
    expect(screen.getByText('Pets')).toBeInTheDocument();
  });
});
