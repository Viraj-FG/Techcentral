import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useHousehold = () => {
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHouseholdId();
  }, []);

  const fetchHouseholdId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', user.id)
        .single();

      setHouseholdId(profile?.current_household_id || null);
    } catch (error) {
      console.error('Error fetching household:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { householdId, isLoading, refetch: fetchHouseholdId };
};
