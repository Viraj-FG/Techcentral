import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeploymentChecklist } from '../DeploymentChecklist';

const { mockInvoke } = vi.hoisted(() => {
  return { mockInvoke: vi.fn() }
});

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user' } } },
      }),
    },
    from: () => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          single: mockSingle,
        }),
      }),
    }),
  },
}));

describe('DeploymentChecklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders checklist', () => {
    render(<DeploymentChecklist />);
    expect(screen.getByText(/Edge function deployed/i)).toBeInTheDocument();
  });

  it('checks edge function status', async () => {
    mockInvoke.mockResolvedValue({ error: null });

    render(<DeploymentChecklist />);
    
    const runButton = screen.getByRole('button', { name: /Run All Checks/i });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText(/Edge function is deployed/i)).toBeInTheDocument();
    });
  });

  it('checks agent configuration', async () => {
    mockSingle.mockResolvedValue({
      data: { agent_configured: true, agent_prompt_version: 'v2' },
      error: null
    });

    render(<DeploymentChecklist />);
    
    const runButton = screen.getByRole('button', { name: /Run All Checks/i });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(mockSingle).toHaveBeenCalled();
    });
  });
});