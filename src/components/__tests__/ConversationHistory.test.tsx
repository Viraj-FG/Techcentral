import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ConversationHistory from '../ConversationHistory';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

// Mock Sonner toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('ConversationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays conversations', async () => {
    const mockSession = { user: { id: 'user-123' } };
    const mockConversations = [
      {
        id: 'msg-1',
        conversation_id: 'conv-1',
        role: 'user',
        message: 'Hello',
        created_at: '2023-01-01T10:00:00Z',
        user_id: 'user-123',
      },
      {
        id: 'msg-2',
        conversation_id: 'conv-1',
        role: 'assistant',
        message: 'Hi there',
        created_at: '2023-01-01T10:00:01Z',
        user_id: 'user-123',
      },
    ];

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
    });

    const selectMock = vi.fn();
    (supabase.from as any).mockImplementation(() => ({
      select: selectMock,
    }));

    selectMock.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockConversations, error: null }),
      }),
    });

    render(<ConversationHistory />);

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      // 'Hi there' is in the expanded view, so we need to click to see it
      // or just check if 'Hello' (preview) is there.
    });
  });

  it('displays empty state when no conversations', async () => {
    const mockSession = { user: { id: 'user-123' } };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
    });

    const selectMock = vi.fn();
    (supabase.from as any).mockImplementation(() => ({
      select: selectMock,
    }));

    selectMock.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    render(<ConversationHistory />);

    await waitFor(() => {
      expect(screen.getByText(/No conversation history yet/i)).toBeInTheDocument();
    });
  });
});
