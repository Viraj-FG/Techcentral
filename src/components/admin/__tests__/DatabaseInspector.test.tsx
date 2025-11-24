import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DatabaseInspector } from '../DatabaseInspector';

const { mockFrom } = vi.hoisted(() => {
  return { mockFrom: vi.fn() }
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('DatabaseInspector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockFrom.mockImplementation((table) => {
      const builder: any = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn(),
      };

      if (table === 'profiles') {
        builder.limit.mockResolvedValue({
          data: [{ id: 'p1', user_name: 'Test User' }],
          error: null
        });
      } else if (table === 'pets') {
        builder.limit.mockResolvedValue({
          data: [{ id: 'pet1', name: 'Buddy' }],
          error: null
        });
      } else if (table === 'inventory') {
        builder.limit.mockResolvedValue({
          data: [{ id: 'i1', name: 'Apple' }],
          error: null
        });
      } else {
        builder.limit.mockResolvedValue({ data: [], error: null });
      }

      return builder;
    });
  });

  it('renders database inspector', () => {
    render(<DatabaseInspector />);
    expect(screen.getByText(/Database Inspector/i)).toBeInTheDocument();
  });

  it('loads and displays data', async () => {
    render(<DatabaseInspector />);

    await waitFor(() => {
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });
  });
});