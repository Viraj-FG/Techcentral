import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RecipeBook from '../RecipeBook';
import { mockSupabase } from '../../test/mocks/supabase';

// Mock child components
vi.mock('@/components/recipes/RecipeCard', () => ({
  RecipeCard: ({ recipe }: { recipe: any }) => (
    <div data-testid={`recipe-${recipe.id}`}>
      {recipe.name} - Score: {recipe.match_score}
    </div>
  )
}));

vi.mock('@/components/layout/AppShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="app-shell">{children}</div>
}));

// Mock Tabs to control state
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, onValueChange }: any) => (
    <div>
      {children}
      {/* Hidden buttons to trigger state change directly */}
      <button data-testid="trigger-ready" onClick={() => onValueChange('ready')}>Trigger Ready</button>
      <button data-testid="trigger-wishlist" onClick={() => onValueChange('wishlist')}>Trigger Wishlist</button>
    </div>
  ),
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button>{children}</button>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
}));

const renderRecipeBook = () => {
  return render(
    <BrowserRouter>
      <RecipeBook />
    </BrowserRouter>
  );
};

describe('RecipeBook Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays recipes', async () => {
    const mockRecipes = [
      { id: '1', name: 'Pasta', match_score: 90, cached_at: '2023-01-01' },
      { id: '2', name: 'Salad', match_score: 70, cached_at: '2023-01-02' }
    ];

    // Mock auth user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null
    });

    // Mock recipes fetch
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockRecipes,
            error: null
          })
        })
      })
    });

    renderRecipeBook();

    await waitFor(() => {
      expect(screen.getByText(/Pasta/)).toBeInTheDocument();
      expect(screen.getByText(/Salad/)).toBeInTheDocument();
    });
  });

  it('filters recipes by tabs', async () => {
    const mockRecipes = [
      { id: '1', name: 'Pasta', match_score: 90 },
      { id: '2', name: 'Salad', match_score: 70 }
    ];

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockRecipes,
            error: null
          })
        })
      })
    });

    renderRecipeBook();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/Pasta/)).toBeInTheDocument();
    });

    // Click "Cook Now" (Ready) tab - score >= 80
    const readyTrigger = screen.getByTestId('trigger-ready');
    fireEvent.click(readyTrigger);

    await waitFor(() => {
      expect(screen.getByText(/Pasta/)).toBeInTheDocument();
      expect(screen.queryByText(/Salad/)).not.toBeInTheDocument();
    });

    // Click "Wishlist" tab - score < 80
    const wishlistTrigger = screen.getByTestId('trigger-wishlist');
    fireEvent.click(wishlistTrigger);

    await waitFor(() => {
      expect(screen.queryByText(/Pasta/)).not.toBeInTheDocument();
      expect(screen.getByText(/Salad/)).toBeInTheDocument();
    });
  });
});
