import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SyncIndicator } from '../SyncIndicator';

// Mock hooks
const mockUseRealtimeContext = vi.fn();

vi.mock('@/contexts/RealtimeContext', () => ({
  useRealtimeContext: () => mockUseRealtimeContext(),
}));

describe('SyncIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when connected and not syncing (and no lastSync)', () => {
    mockUseRealtimeContext.mockReturnValue({
      isConnected: true,
      isSyncing: false,
      lastSync: null,
    });

    const { container } = render(<SyncIndicator />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('shows offline indicator when disconnected', () => {
    mockUseRealtimeContext.mockReturnValue({
      isConnected: false,
      isSyncing: false,
      lastSync: null,
    });

    render(<SyncIndicator />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('shows syncing indicator when syncing', () => {
    mockUseRealtimeContext.mockReturnValue({
      isConnected: true,
      isSyncing: true,
      lastSync: null,
    });

    render(<SyncIndicator />);
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
  });
});
