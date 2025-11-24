import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentProvisioning } from '../AgentProvisioning';

const { mockInvoke, mockToast } = vi.hoisted(() => {
  return { 
    mockInvoke: vi.fn(),
    mockToast: vi.fn()
  }
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('AgentProvisioning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders provisioning button', () => {
    render(<AgentProvisioning />);
    expect(screen.getByText(/Provision Agents \(One-Click Setup\)/i)).toBeInTheDocument();
  });

  it('handles successful provisioning', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true, results: [{ type: 'test', status: 'created' }] },
      error: null
    });

    render(<AgentProvisioning />);
    
    fireEvent.click(screen.getByText(/Provision Agents \(One-Click Setup\)/i));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Agents Provisioned",
        description: expect.stringMatching(/Successfully provisioned/i)
      }));
    });
  });

  it('handles provisioning error', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: new Error('Failed')
    });

    render(<AgentProvisioning />);
    
    fireEvent.click(screen.getByText(/Provision Agents \(One-Click Setup\)/i));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Provisioning Failed",
        description: expect.stringMatching(/Failed/i)
      }));
    });
  });
});
