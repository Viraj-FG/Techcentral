import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SmartCartWidget from '../SmartCartWidget';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    }),
  },
}));

vi.mock('react-webcam', () => ({
  default: () => <div data-testid="webcam" />,
}));

describe('SmartCartWidget', () => {
  const mockItems = [
    { name: 'Milk', fillLevel: 10, unit: '%', autoOrdering: true, category: 'fridge' as const },
  ];

  it('renders cart items', () => {
    render(<SmartCartWidget cartItems={mockItems} />);
    expect(screen.getByText('Smart Cart')).toBeInTheDocument();
    expect(screen.getByText('Milk')).toBeInTheDocument();
  });

  it('shows empty state when no items', () => {
    render(<SmartCartWidget cartItems={[]} />);
    expect(screen.getByText('No items need restocking')).toBeInTheDocument();
  });
});
