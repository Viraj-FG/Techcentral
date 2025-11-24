import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipeDetail } from '../RecipeDetail';

const { mockSupabase, mockSelect, mockEq, mockSingle } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockEq = vi.fn();
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  };
  
  // Setup chain return values
  mockEq.mockReturnValue({ single: mockSingle, then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve) });

  return { mockSupabase, mockSelect, mockEq, mockSingle };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock CookingMode component since it's used inside RecipeDetail
vi.mock('../CookingMode', () => ({
  CookingMode: () => <div data-testid="cooking-mode">Cooking Mode Active</div>,
}));

const mockRecipe = {
  id: '1',
  user_id: 'user-1',
  name: 'Test Recipe',
  ingredients: [
    { item: 'Milk', amount: '1 cup' },
    { item: 'Eggs', amount: '2' }
  ],
  instructions: [
    { text: 'Mix ingredients' },
    { text: 'Cook' }
  ],
  servings: 4,
  cooking_time: 30,
  difficulty: 'medium',
  match_score: 85,
  estimated_calories: 500,
  required_appliances: ['Oven'],
};

describe('RecipeDetail', () => {
  const mockOnClose = vi.fn();
  const mockOnRecipeDeleted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'test-user' } } });
    mockSingle.mockResolvedValue({ data: { current_household_id: 'house-1' } });
    
    // Mock inventory response
    // We need to handle the chain: from('inventory').select('*').eq(...)
    // The mockEq above returns a promise-like object for the 'then' part.
    // We can override the implementation for specific tests if needed.
  });

  it('renders recipe details when open', () => {
    render(
      <RecipeDetail
        recipe={mockRecipe}
        open={true}
        onClose={mockOnClose}
        onRecipeDeleted={mockOnRecipeDeleted}
      />
    );

    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    expect(screen.getByText(/30\s*min/i)).toBeInTheDocument();
    expect(screen.getByText('4 servings')).toBeInTheDocument();
    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('Eggs')).toBeInTheDocument();
  });

  it('fetches inventory on open', async () => {
    render(
      <RecipeDetail
        recipe={mockRecipe}
        open={true}
        onClose={mockOnClose}
        onRecipeDeleted={mockOnRecipeDeleted}
      />
    );

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.from).toHaveBeenCalledWith('inventory');
    });
  });

  it('starts cooking mode', () => {
    render(
      <RecipeDetail
        recipe={mockRecipe}
        open={true}
        onClose={mockOnClose}
        onRecipeDeleted={mockOnRecipeDeleted}
      />
    );

    const startButton = screen.getByRole('button', { name: /start cooking/i });
    fireEvent.click(startButton);

    expect(screen.getByTestId('cooking-mode')).toBeInTheDocument();
  });
});
