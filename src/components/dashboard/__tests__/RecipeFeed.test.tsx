import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import RecipeFeed from '../RecipeFeed';

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          in: mockIn.mockReturnValue({
            order: mockOrder.mockReturnValue({
              limit: mockLimit,
            }),
          }),
          order: mockOrder.mockReturnValue({
            limit: mockLimit,
          }),
        }),
      }),
    }),
  },
}));

describe('RecipeFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders recipe feed tabs', () => {
    render(<RecipeFeed userInventory={{}} userProfile={{}} />);
    expect(screen.getByText(/Cook My Pantry/i)).toBeInTheDocument();
    expect(screen.getByText(/Explore World/i)).toBeInTheDocument();
  });

  it('loads recipes on mount', async () => {
    mockLimit.mockResolvedValue({
      data: [
        { name: 'Pasta', cooking_time: 20, difficulty: 'Easy', required_appliances: [], instructions: [], estimated_calories: 500, servings: 2 }
      ],
      error: null
    });

    render(<RecipeFeed userInventory={{}} userProfile={{}} />);

    await waitFor(() => {
      expect(screen.getByText(/Recipes you can make/i)).toBeInTheDocument();
    });
  });
});
