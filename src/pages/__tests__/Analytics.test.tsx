import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Analytics from '../Analytics';
import { mockSupabase } from '../../test/mocks/supabase';

// Mock child components
vi.mock('@/components/AuroraBackground', () => ({ default: () => <div data-testid="aurora-bg" /> }));
vi.mock('@/components/analytics/CalendarView', () => ({ CalendarView: () => <div>CalendarView</div> }));
vi.mock('@/components/analytics/MacroChart', () => ({ MacroChart: () => <div>MacroChart</div> }));
vi.mock('@/components/analytics/CalorieChart', () => ({ CalorieChart: () => <div>CalorieChart</div> }));
vi.mock('@/components/analytics/DayDetailModal', () => ({ DayDetailModal: () => <div>DayDetailModal</div> }));

const renderAnalytics = () => {
  return render(
    <BrowserRouter>
      <Analytics />
    </BrowserRouter>
  );
};

describe('Analytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays analytics data', async () => {
    // Mock auth user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null
    });

    // Mock profile fetch (TDEE)
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { tdee: 2500 },
                error: null
              })
            })
          })
        } as any;
      }
      if (table === 'meal_logs') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                })
              })
            })
          })
        } as any;
      }
      return { select: vi.fn().mockReturnThis() } as any;
    });

    renderAnalytics();

    await waitFor(() => {
      expect(screen.getByText('CalendarView')).toBeInTheDocument();
      expect(screen.getByText('MacroChart')).toBeInTheDocument();
    });
  });
});
