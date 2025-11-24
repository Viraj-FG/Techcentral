import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AgentHealthDashboard } from '../AgentHealthDashboard';

import { mockConversationMetrics } from '../../../test/mocks/adminData';

// Mock Recharts
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => <div style={{ width: 800, height: 800 }}>{children}</div>,
    LineChart: () => <div>LineChart</div>,
    BarChart: () => <div>BarChart</div>,
    Line: () => <div />,
    Bar: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
  };
});

const { mockSelect, mockOrder, mockLimit, mockChannel } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockOrder: vi.fn(),
  mockLimit: vi.fn(),
  mockChannel: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: mockSelect.mockReturnValue({
        order: mockOrder.mockReturnValue({
          limit: mockLimit,
        }),
      }),
    }),
    channel: mockChannel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  },
}));

describe('AgentHealthDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard title', () => {
    render(<AgentHealthDashboard />);
    expect(screen.getByText('Agent Status')).toBeInTheDocument();
  });

  it('fetches and displays metrics', async () => {
    mockLimit.mockResolvedValue({
      data: mockConversationMetrics,
      error: null
    });

    render(<AgentHealthDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Conversations')).toBeInTheDocument();
    });
  });
});
