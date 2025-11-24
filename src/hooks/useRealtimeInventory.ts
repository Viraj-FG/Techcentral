import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface InventoryItem {
  id: string;
  household_id: string;
  name: string;
  category: string;
  quantity: number | null;
  fill_level: number | null;
  status: string | null;
  expiry_date: string | null;
}

export const useRealtimeInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      // Fetch user's household_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', user.id)
        .single();

      if (!profile?.current_household_id || !mounted) return;

      const inventoryTable = supabase.from('inventory') as any;
      const { data, error } = await inventoryTable
        .select('*')
        .eq('household_id', profile.current_household_id)
        .order('name');

      if (!error && data && mounted) {
        setItems(data);
      }
      setIsLoading(false);
    };

    fetchInitialData();

    return () => {
      mounted = false;
    };
  }, []);

  // The actual realtime subscription is handled by RealtimeProvider
  // This hook just provides easy access to the data
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event?.type === 'updated' &&
        event.query.queryKey[0] === 'inventory'
      ) {
        // Re-fetch when inventory is invalidated
        const fetchUpdated = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Fetch user's household_id
          const { data: profile } = await supabase
            .from('profiles')
            .select('current_household_id')
            .eq('id', user.id)
            .single();

          if (!profile?.current_household_id) return;

          const inventoryTable = supabase.from('inventory') as any;
          const { data } = await inventoryTable
            .select('*')
            .eq('household_id', profile.current_household_id)
            .order('name');

          if (data) {
            setItems(data);
          }
        };

        fetchUpdated();
      }
    });

    return unsubscribe;
  }, [queryClient]);

  return {
    items,
    isLoading,
  };
};
