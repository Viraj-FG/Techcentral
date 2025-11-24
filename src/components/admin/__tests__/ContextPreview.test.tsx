import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContextPreview from '../ContextPreview';

const { 
  mockSupabase, 
  mockSelect, 
  mockEq, 
  mockSingle, 
  mockOrder, 
  mockLimit 
} = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockLimit = vi.fn();
  const mockOrder = vi.fn(() => ({ limit: mockLimit }));
  
  // We need a flexible mockEq that can handle chaining
  const mockEq = vi.fn();
  // For chains like .eq().eq()
  mockEq.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
    // For chains that end at eq() (awaitable)
    then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve)
  });

  const mockSelect = vi.fn(() => ({
    eq: mockEq,
    order: mockOrder,
    limit: mockLimit
  }));

  const mockSupabase = {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn((table: string) => ({
      select: mockSelect,
    })),
  };

  return { 
    mockSupabase, 
    mockSelect, 
    mockEq, 
    mockSingle, 
    mockOrder, 
    mockLimit 
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('ContextPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default auth session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user' } } },
    });

    // Default responses
    mockSingle.mockResolvedValue({ data: { current_household_id: 'house-1' }, error: null });
    mockLimit.mockResolvedValue({ data: [], error: null });
    
    // Handle the .eq() calls that return data directly (not chained further)
    // We need to be careful because mockEq is recursive in the setup above.
    // We can override implementation based on what it's called with if needed,
    // or just rely on the fact that we need to mock the *end* of the chain.
    
    // However, the component awaits the result of the chain.
    // For `profiles`: .select().eq().single() -> mockSingle resolves data
    // For `household_members`: .select().eq() -> mockEq needs to be awaitable or return a promise-like object
    // For `pets`: .select().eq() -> same
    // For `inventory`: .select().eq().order().limit() -> mockLimit resolves data
    // For `shopping_list`: .select().eq().eq() -> mockEq needs to be awaitable
  });

  it('renders context preview card', () => {
    render(<ContextPreview />);
    expect(screen.getByText(/Context Preview/i)).toBeInTheDocument();
  });

  it('fetches context on refresh', async () => {
    // Setup specific mock responses
    
    // 1. profiles query: .select().eq().single()
    mockSingle.mockResolvedValueOnce({ 
      data: { current_household_id: 'house-1', first_name: 'Test', last_name: 'User' }, 
      error: null 
    });

    // 2. household_members query: .select().eq()
    // 3. pets query: .select().eq()
    // 4. shopping_list query: .select().eq().eq()
    // Since mockEq is recursive, we need to make sure the *last* call returns a promise with data
    // But wait, in the hoisted section, mockEq returns an object with .then (Promise-like)
    // We can override that behavior for specific tests if we want specific data.
    
    // Let's refine the mockEq strategy.
    // The component calls: await supabase.from(...).select(...).eq(...)
    
    // We can use mockImplementation to return different things based on the table, 
    // but `from` is called first.
    
    mockSupabase.from.mockImplementation((table: string) => {
      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        single: vi.fn(),
        order: vi.fn(() => chain),
        limit: vi.fn(),
      };

      if (table === 'profiles') {
        chain.single.mockResolvedValue({ 
          data: { current_household_id: 'house-1' }, 
          error: null 
        });
      } else if (table === 'inventory') {
        chain.limit.mockResolvedValue({ 
          data: [{ id: 1, name: 'Item 1' }], 
          error: null 
        });
      } else {
        // For household_members, pets, shopping_list which end with eq()
        // We make the chain awaitable by adding a 'then' method
        chain.then = (resolve: any) => resolve({ data: [], error: null });
        
        // If we want specific data for shopping list
        if (table === 'shopping_list') {
           chain.then = (resolve: any) => resolve({ data: [{ id: 1, item: 'Milk' }], error: null });
        }
      }
      
      return chain;
    });

    render(<ContextPreview />);
    
    fireEvent.click(screen.getByRole('button', { name: /Refresh Context/i }));

    await waitFor(() => {
      // The component displays "Formatted Prompt" and "Raw JSON" tabs.
      // The content is inside a <pre> tag.
      // We should check if the JSON content is loaded.
      // The component sets context state which is then JSON.stringified.
      
      // Let's check for a string that would appear in the JSON
      expect(screen.getByText(/Inventory Snapshot/)).toBeInTheDocument();
    });
  });
});
