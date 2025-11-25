import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RealtimeContextType {
  isConnected: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  newNotifications: number;
  clearNewNotifications: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtimeContext = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within RealtimeProvider');
  }
  return context;
};

interface Props {
  children: ReactNode;
}

export const RealtimeProvider = ({ children }: Props) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [newNotifications, setNewNotifications] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    console.log('[Realtime] Setting up subscriptions for user:', userId);

    const setupSubscriptions = async () => {
      // Get household_id from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', userId)
        .single();

      const householdId = profileData?.current_household_id;
      
      if (!householdId) {
        console.log('[Realtime] No household_id found, skipping subscriptions');
        return;
      }

      console.log('[Realtime] Setting up subscriptions for household:', householdId);
      setIsConnected(true);

      // Inventory subscription (fixed to use household_id)
      const inventoryChannel = supabase
        .channel('inventory-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'inventory',
            filter: `household_id=eq.${householdId}`
          },
          (payload) => {
            console.log('[Realtime] Inventory change:', payload);
            handleInventoryChange(payload);
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Inventory subscription status:', status);
        });

      // Shopping list subscription (fixed to use household_id)
      const shoppingChannel = supabase
        .channel('shopping-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shopping_list',
            filter: `household_id=eq.${householdId}`
          },
          (payload) => {
            console.log('[Realtime] Shopping list change:', payload);
            handleShoppingChange(payload);
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Shopping subscription status:', status);
        });

      // Notifications subscription
      const notificationsChannel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('[Realtime] Notification change:', payload);
            handleNotificationChange(payload);
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Notifications subscription status:', status);
        });

      // Meal logs subscription
      const mealLogsChannel = supabase
        .channel('meal-logs-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'meal_logs',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('[Realtime] Meal log change:', payload);
            handleMealLogChange(payload);
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Meal logs subscription status:', status);
        });

      // Recipes subscription (fixed to use household_id)
      const recipesChannel = supabase
        .channel('recipes-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'recipes',
            filter: `household_id=eq.${householdId}`
          },
          (payload) => {
            console.log('[Realtime] Recipe change:', payload);
            handleRecipeChange(payload);
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Recipes subscription status:', status);
        });

      // Household activity subscription
      const activityChannel = supabase
        .channel('activity-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'household_activity',
            filter: `household_id=eq.${householdId}`
          },
          (payload) => {
            console.log('[Realtime] Household activity:', payload);
            setIsSyncing(true);
            setLastSync(new Date());
            queryClient.invalidateQueries({ queryKey: ['household_activity'] });
            setTimeout(() => setIsSyncing(false), 1000);
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Activity subscription status:', status);
        });

      return () => {
        console.log('[Realtime] Cleaning up subscriptions');
        supabase.removeChannel(inventoryChannel);
        supabase.removeChannel(shoppingChannel);
        supabase.removeChannel(notificationsChannel);
        supabase.removeChannel(mealLogsChannel);
        supabase.removeChannel(recipesChannel);
        supabase.removeChannel(activityChannel);
        setIsConnected(false);
      };
    };

    const cleanup = setupSubscriptions();
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, [userId]);

  const handleInventoryChange = (payload: any) => {
    setIsSyncing(true);
    setLastSync(new Date());

    // Invalidate inventory queries
    queryClient.invalidateQueries({ queryKey: ['inventory'] });

    if (payload.eventType === 'INSERT') {
      toast.success('New item added to inventory', { duration: 2000 });
    } else if (payload.eventType === 'UPDATE') {
      toast.info('Inventory updated', { duration: 2000 });
    } else if (payload.eventType === 'DELETE') {
      toast.info('Item removed from inventory', { duration: 2000 });
    }

    setTimeout(() => setIsSyncing(false), 1000);
  };

  const handleShoppingChange = (payload: any) => {
    setIsSyncing(true);
    setLastSync(new Date());

    // Invalidate shopping list queries
    queryClient.invalidateQueries({ queryKey: ['shopping_list'] });

    if (payload.eventType === 'INSERT') {
      toast.success('Item added to shopping list', { duration: 2000 });
    } else if (payload.eventType === 'UPDATE') {
      toast.info('Shopping list updated', { duration: 2000 });
    } else if (payload.eventType === 'DELETE') {
      toast.info('Item removed from shopping list', { duration: 2000 });
    }

    setTimeout(() => setIsSyncing(false), 1000);
  };

  const handleNotificationChange = (payload: any) => {
    setIsSyncing(true);
    setLastSync(new Date());

    // Invalidate notifications queries
    queryClient.invalidateQueries({ queryKey: ['notifications'] });

    if (payload.eventType === 'INSERT') {
      setNewNotifications(prev => prev + 1);
      const notification = payload.new;
      toast(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    }

    setTimeout(() => setIsSyncing(false), 1000);
  };

  const handleMealLogChange = (payload: any) => {
    setIsSyncing(true);
    setLastSync(new Date());

    // Invalidate meal logs queries
    queryClient.invalidateQueries({ queryKey: ['meal_logs'] });

    if (payload.eventType === 'INSERT') {
      toast.success('Meal logged', { duration: 2000 });
    }

    setTimeout(() => setIsSyncing(false), 1000);
  };

  const handleRecipeChange = (payload: any) => {
    setIsSyncing(true);
    setLastSync(new Date());

    // Invalidate recipes queries
    queryClient.invalidateQueries({ queryKey: ['recipes'] });

    if (payload.eventType === 'INSERT') {
      toast.success('New recipe saved', { duration: 2000 });
    }

    setTimeout(() => setIsSyncing(false), 1000);
  };

  const clearNewNotifications = () => {
    setNewNotifications(0);
  };

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        isSyncing,
        lastSync,
        newNotifications,
        clearNewNotifications,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};
