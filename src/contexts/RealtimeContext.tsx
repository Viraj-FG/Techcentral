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
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Get current user and household
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        
        // Fetch household_id from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_household_id')
          .eq('id', user.id)
          .single();
        
        if (profile?.current_household_id) {
          setHouseholdId(profile.current_household_id);
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        
        // Fetch household_id from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_household_id')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.current_household_id) {
          setHouseholdId(profile.current_household_id);
        }
      } else {
        setUserId(null);
        setHouseholdId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setIsConnected(false);
      return;
    }

    // Wait for householdId to be fetched before proceeding
    if (!householdId) {
      console.log('[Realtime] Waiting for household data...');
      setIsConnected(false);
      return; // Exit early until householdId is set
    }

    console.log('[Realtime] Setting up subscriptions for user:', userId);
    console.log('[Realtime] Household ID:', householdId);
    
    setIsConnected(true); // Only set connected when we have household data

    // Inventory subscription (household-based)
    const inventoryChannel = householdId ? supabase
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
      }) : null;

    // Shopping list subscription (household-based)
    const shoppingChannel = householdId ? supabase
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
      }) : null;

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

    // Recipes subscription (household-based)
    const recipesChannel = householdId ? supabase
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
      }) : null;

    return () => {
      console.log('[Realtime] Cleaning up subscriptions');
      if (inventoryChannel) supabase.removeChannel(inventoryChannel);
      if (shoppingChannel) supabase.removeChannel(shoppingChannel);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(mealLogsChannel);
      if (recipesChannel) supabase.removeChannel(recipesChannel);
      setIsConnected(false);
    };
  }, [userId, householdId]);

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
