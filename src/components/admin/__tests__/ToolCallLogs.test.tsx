import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ToolCallLogs from '../ToolCallLogs'; // Default export

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

describe('ToolCallLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockResolvedValue({
      data: [],
      error: null
    });
  });

  it('renders tool call logs', () => {
    render(<ToolCallLogs />);
    expect(screen.getByText(/Tool Call Logs/i)).toBeInTheDocument();
  });

  it('displays logs', async () => {
    const mockLogs = [
      {
        id: '1',
        created_at: new Date().toISOString(),
        message: 'Tool called',
        metadata: { tool: 'updateProfile', parameters: { name: 'Test' } }
      }
    ];

    mockLimit.mockResolvedValue({
      data: mockLogs,
      error: null
    });

    render(<ToolCallLogs />);

    await waitFor(() => {
      expect(screen.getByText(/updateProfile/i)).toBeInTheDocument();
    });
  });
});