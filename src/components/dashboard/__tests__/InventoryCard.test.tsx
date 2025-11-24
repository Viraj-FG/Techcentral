import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InventoryCard from '../InventoryCard';
import { Package } from 'lucide-react';

vi.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({ trigger: vi.fn() }),
}));

describe('InventoryCard', () => {
  const mockItems = [
    { id: '1', name: 'Milk', fillLevel: 10, unit: '%', status: 'warning', autoOrdering: false }, // Low stock
    { id: '2', name: 'Eggs', fillLevel: 50, unit: 'pcs', status: 'normal', autoOrdering: true, expiry_date: new Date().toISOString() }, // Expiring
  ];

  it('renders title and items', () => {
    render(
      <InventoryCard 
        title="Fridge" 
        icon={Package} 
        items={mockItems} 
      />
    );

    expect(screen.getByText('Fridge')).toBeInTheDocument();
    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('Eggs')).toBeInTheDocument();
  });

  it('displays empty state when no items', () => {
    render(
      <InventoryCard 
        title="Empty Fridge" 
        icon={Package} 
        items={[]} 
      />
    );

    expect(screen.getByText('Routine Active')).toBeInTheDocument();
  });
});
