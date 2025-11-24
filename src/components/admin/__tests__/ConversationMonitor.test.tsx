import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ConversationMonitor } from '../ConversationMonitor';
import { mockConversationEvents } from '../../../test/mocks/adminData';

// Hoist the mock functions so they can be used in vi.mock
const { mockSelect, mockOrder, mockLimit, mockGte, mockChannel, mockOn, mockSubscribe, mockRemoveChannel } = vi.hoisted(() => {
  return {
    mockSelect: vi.fn(),
    mockOrder: vi.fn(),
    mockLimit: vi.fn(),
    mockGte: vi.fn(),
    mockChannel: vi.fn(),
    mockOn: vi.fn(),
    mockSubscribe: vi.fn(),
    mockRemoveChannel: vi.fn(),
  }
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: mockSelect,
    }),
    channel: mockChannel.mockReturnValue({
      on: mockOn.mockReturnValue({
        subscribe: mockSubscribe,
      }),
    }),
    removeChannel: mockRemoveChannel,
  },
}));

describe('ConversationMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    // Chain 1: select -> order -> limit -> then
    // Chain 2: select -> gte -> order -> then

    const mockPromise = (data: any) => ({
      then: (resolve: any) => resolve({ data, error: null })
    });

    mockLimit.mockImplementation(() => mockPromise([]));
    
    // mockOrder needs to handle being awaited (for Chain 2) AND having limit (for Chain 1)
    const orderReturn = {
      limit: mockLimit,
      then: (resolve: any) => resolve({ data: [], error: null })
    };
    mockOrder.mockReturnValue(orderReturn);

    // mockGte returns object with order
    mockGte.mockReturnValue({ order: mockOrder });

    // mockSelect returns object with gte and order
    mockSelect.mockReturnValue({
      gte: mockGte,
      order: mockOrder
    });
  });

  it('renders conversation monitor', () => {
    render(<ConversationMonitor />);
    expect(screen.getByRole('heading', { name: /Active Conversations/i })).toBeInTheDocument();
  });

  it('loads recent events', async () => {
    // Override mockLimit for this test to return data
    mockLimit.mockImplementation(() => ({
      then: (resolve: any) => resolve({ data: mockConversationEvents, error: null })
    }));

    render(<ConversationMonitor />);

    await waitFor(() => {
      expect(screen.getByText(/Hello World Event/i)).toBeInTheDocument();
    });
  });
});