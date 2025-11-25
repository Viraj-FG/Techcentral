import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HouseholdActivity {
  id: string;
  household_id: string;
  actor_id: string;
  actor_name: string | null;
  activity_type: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  metadata: any;
  created_at: string;
}

export const useHouseholdActivity = (householdId: string | null) => {
  const [activities, setActivities] = useState<HouseholdActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!householdId) {
      setIsLoading(false);
      return;
    }

    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('household_activity')
          .select('*')
          .eq('household_id', householdId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setActivities(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('household_activity_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'household_activity',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          setActivities((prev) => [payload.new as HouseholdActivity, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId]);

  return { activities, isLoading, error };
};
