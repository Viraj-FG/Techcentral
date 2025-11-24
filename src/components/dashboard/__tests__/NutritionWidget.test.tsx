import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import NutritionWidget from '../NutritionWidget';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
          single: vi.fn().mockResolvedValue({ data: { calculated_tdee: 2000 }, error: null }),
        })),
      })),
    })),
  },
}));

describe('NutritionWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nutrition info', async () => {
    render(<NutritionWidget userId="123" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Today's Calories/i)).toBeInTheDocument();
    });
  });
});
