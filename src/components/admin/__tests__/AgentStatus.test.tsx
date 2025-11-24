import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentStatus } from '../AgentStatus';
import { mockAdminUser } from '@/test/mocks/adminData';

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { 
          session: { 
            user: {
              id: 'd0ac4e49-ef8f-4820-87e5-94691a88eb5f',
              email: 'admin@example.com',
              role: 'admin',
              user_metadata: {
                email: "admin@example.com",
                email_verified: true,
                phone_verified: false,
                sub: "d0ac4e49-ef8f-4820-87e5-94691a88eb5f"
              },
            } 
          } 
        },
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

describe('AgentStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock response to prevent destructuring error on initial render
    mockSingle.mockResolvedValue({
      data: {
        agent_configured: false,
        agent_last_configured_at: null,
        agent_prompt_version: null
      },
      error: null
    });
  });

  it('renders status card', () => {
    render(<AgentStatus />);
    expect(screen.getByText(/Agent Status/i)).toBeInTheDocument();
  });

  it('fetches and displays status', async () => {
    mockSingle.mockResolvedValue({
      data: {
        agent_configured: true,
        agent_last_configured_at: new Date().toISOString(),
        agent_prompt_version: 'v1.0.0'
      },
      error: null
    });

    render(<AgentStatus />);
    
    // Find the refresh button by the icon class or structure since it might not have text
    const refreshButton = screen.getByRole('button');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      const configuredElements = screen.getAllByText(/Configured/i);
      expect(configuredElements.length).toBeGreaterThan(0);
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });
  });
});
