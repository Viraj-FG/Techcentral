import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentTestPanel } from '../AgentTestPanel';

const { mockInvoke } = vi.hoisted(() => {
  return { mockInvoke: vi.fn() }
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/lib/elevenLabsAudio', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://test-url.com'),
}));

describe('AgentTestPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders test panel', () => {
    render(<AgentTestPanel />);
    expect(screen.getByText(/Agent Test Suite/i)).toBeInTheDocument();
  });

  it('runs configuration test', async () => {
    mockInvoke.mockResolvedValue({
      data: { 
        results: [
          { type: 'onboarding', status: 'created' },
          { type: 'assistant', status: 'created' }
        ] 
      },
      error: null
    });

    render(<AgentTestPanel />);
    
    fireEvent.click(screen.getByText(/Test Config/i));

    await waitFor(() => {
      expect(screen.getByText(/Both agents properly configured/i)).toBeInTheDocument();
    });
  });
});
