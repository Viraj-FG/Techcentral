import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SystemLogs } from '../SystemLogs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockSystemLogs } from '@/test/mocks/adminData';

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder.mockReturnValue({
            limit: mockLimit,
          }),
        }),
      }),
    }),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('SystemLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockResolvedValue({
      data: mockSystemLogs,
      error: null
    });
  });

  it('renders system logs', async () => {
    render(<SystemLogs />, { wrapper });
    expect(screen.getByRole('heading', { name: /System Logs/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('System started')).toBeInTheDocument();
      expect(screen.getByText('High memory usage')).toBeInTheDocument();
    });
  });

  it('displays error logs', async () => {
    render(<SystemLogs />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });
  });
});