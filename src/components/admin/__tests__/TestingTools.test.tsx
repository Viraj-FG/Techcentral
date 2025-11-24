import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestingTools } from '../TestingTools';

const { mockInvoke, mockToast } = vi.hoisted(() => {
  return { 
    mockInvoke: vi.fn(),
    mockToast: vi.fn()
  }
});

const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user' } } },
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user' } },
      }),
    },
    from: () => ({
      update: mockUpdate.mockReturnValue({ eq: mockEq }),
      delete: mockDelete.mockReturnValue({ eq: mockEq }),
    }),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('TestingTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders testing tools', () => {
    render(<TestingTools />);
    expect(screen.getByText(/Connection Tests/i)).toBeInTheDocument();
  });

  it('tests connection successfully', async () => {
    mockInvoke.mockResolvedValue({ error: null });

    render(<TestingTools />);
    
    const testButton = screen.getByRole('button', { name: /Test ElevenLabs Connection/i });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Connection Test Passed"
      }));
    });
  });

  it('clears test data', async () => {
    mockEq.mockResolvedValue({ error: null });

    render(<TestingTools />);
    
    // Find the clear button (it has trash icon)
    const clearButton = screen.getByRole('button', { name: /Clear My Test Data/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Test Data Cleared"
      }));
    });
  });
});