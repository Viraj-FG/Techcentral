import { useState } from 'react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useRealtimeContext } from '@/contexts/RealtimeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useRealtimeNotifications();
  const { newNotifications, clearNewNotifications } = useRealtimeContext();

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      clearNewNotifications();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'spoilage':
        return '⚠️';
      case 'low_stock':
        return '📦';
      case 'recipe':
        return '🍳';
      case 'system':
        return 'ℹ️';
      default:
        return '🔔';
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {(unreadCount > 0 || newNotifications > 0) && (
            <div className="absolute -top-1 -right-1">
              <Badge
                variant="destructive"
                className="h-5 min-w-[20px] flex items-center justify-center p-0 text-xs"
              >
                {Math.min(unreadCount + newNotifications, 99)}
              </Badge>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="gap-2 text-xs"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    "p-4 hover:bg-accent/50 transition-colors relative group",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                  )}

                  <div className="flex gap-3 pl-4">
                    {/* Icon */}
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
