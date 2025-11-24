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
    let mounted = true;
    let inventoryChannel: any = null;
    let shoppingChannel: any = null;
    let notificationsChannel: any = null;
    let mealLogsChannel: any = null;
    let recipesChannel: any = null;

    const setupRealtimeConnection = async () => {
      try {
        // Step 1: Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user || !mounted) {
          console.log('[Realtime] No authenticated user');
          setIsConnected(false);
          return;
        }

        console.log('[Realtime] Authenticated user:', user.id);
        setUserId(user.id);

        // Step 2: Fetch household_id BEFORE proceeding with subscriptions
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('current_household_id')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('[Realtime] Error fetching profile:', profileError);
          setIsConnected(false);
          return;
        }

        if (!profile?.current_household_id || !mounted) {
          console.warn('[Realtime] No household assigned to user');
          setIsConnected(false);
          return;
        }

        console.log('[Realtime] Household ID:', profile.current_household_id);
        setHouseholdId(profile.current_household_id);

        // Step 3: NOW set up subscriptions with guaranteed householdId
        console.log('[Realtime] Setting up subscriptions...');
        setIsConnected(true);

        // Inventory subscription (household-based)
        inventoryChannel = supabase
          .channel('inventory-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'inventory',
              filter: `household_id=eq.${profile.current_household_id}`
            },
            (payload) => {
              console.log('[Realtime] Inventory change:', payload);
              handleInventoryChange(payload);
            }
          )
          .subscribe((status) => {
            console.log('[Realtime] Inventory subscription status:', status);
          });

        // Shopping list subscription (household-based)
        shoppingChannel = supabase
          .channel('shopping-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'shopping_list',
              filter: `household_id=eq.${profile.current_household_id}`
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
        notificationsChannel = supabase
          .channel('notifications-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
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
        mealLogsChannel = supabase
          .channel('meal-logs-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'meal_logs',
              filter: `user_id=eq.${user.id}`
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
        recipesChannel = supabase
          .channel('recipes-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'recipes',
              filter: `household_id=eq.${profile.current_household_id}`
            },
            (payload) => {
              console.log('[Realtime] Recipe change:', payload);
              handleRecipeChange(payload);
            }
          )
          .subscribe((status) => {
            console.log('[Realtime] Recipes subscription status:', status);
          });
        
      } catch (error) {
        console.error('[Realtime] Setup error:', error);
        setIsConnected(false);
      }
    };

    setupRealtimeConnection();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && mounted) {
        await setupRealtimeConnection();
      } else {
        setUserId(null);
        setHouseholdId(null);
        setIsConnected(false);
      }
    });

    return () => {
      mounted = false;
      console.log('[Realtime] Cleaning up subscriptions');
      subscription.unsubscribe();
      if (inventoryChannel) supabase.removeChannel(inventoryChannel);
      if (shoppingChannel) supabase.removeChannel(shoppingChannel);
      if (notificationsChannel) supabase.removeChannel(notificationsChannel);
      if (mealLogsChannel) supabase.removeChannel(mealLogsChannel);
      if (recipesChannel) supabase.removeChannel(recipesChannel);
      setIsConnected(false);
    };
  }, []);

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
