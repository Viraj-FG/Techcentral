import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import InventoryCardSkeleton from '../InventoryCardSkeleton';

describe('InventoryCardSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<InventoryCardSkeleton />);
    // Check for skeleton classes or structure
    // The component uses Skeleton from ui/skeleton which usually renders a div with animate-pulse
    
    // We can check if it renders without crashing and has some structure
    expect(container.firstChild).toHaveClass('aspect-square');
  });
});
