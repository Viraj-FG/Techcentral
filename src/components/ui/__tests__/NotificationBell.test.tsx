import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationBell } from '../NotificationBell';

// Mock hooks
const mockUseRealtimeNotifications = vi.fn();
const mockUseRealtimeContext = vi.fn();

vi.mock('@/hooks/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => mockUseRealtimeNotifications(),
}));

vi.mock('@/contexts/RealtimeContext', () => ({
  useRealtimeContext: () => mockUseRealtimeContext(),
}));

// Mock ResizeObserver which is used by Radix UI
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRealtimeNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      deleteNotification: vi.fn(),
    });
    mockUseRealtimeContext.mockReturnValue({
      newNotifications: false,
      clearNewNotifications: vi.fn(),
    });
  });

  it('renders bell icon', () => {
    render(<NotificationBell />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows unread count badge', () => {
    mockUseRealtimeNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 5,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      deleteNotification: vi.fn(),
    });

    render(<NotificationBell />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('opens dropdown and clears new notifications', async () => {
    const user = userEvent.setup();
    const clearNewNotifications = vi.fn();
    mockUseRealtimeContext.mockReturnValue({
      newNotifications: true,
      clearNewNotifications,
    });

    render(<NotificationBell />);
    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(clearNewNotifications).toHaveBeenCalled();
    });
  });

  it('displays notifications in dropdown', async () => {
    const user = userEvent.setup();
    const notifications = [
      { id: '1', title: 'Test Notification', message: 'This is a test', type: 'system', created_at: new Date().toISOString(), read: false },
    ];
    mockUseRealtimeNotifications.mockReturnValue({
      notifications,
      unreadCount: 1,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      deleteNotification: vi.fn(),
    });

    render(<NotificationBell />);
    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
      expect(screen.getByText('This is a test')).toBeInTheDocument();
    });
  });
});
