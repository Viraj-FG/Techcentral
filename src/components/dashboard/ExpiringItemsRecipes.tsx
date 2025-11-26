import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChefHat, AlertTriangle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ExpiringItem {
  id: string;
  name: string;
  expiry_date: string;
  daysUntilExpiry: number;
}

export const ExpiringItemsRecipes = () => {
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExpiringItems();
  }, []);

  const fetchExpiringItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', user.id)
        .single();

      if (!profile?.current_household_id) return;

      const today = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(today.getDate() + 7);

      const { data: items } = await supabase
        .from('inventory')
        .select('id, name, expiry_date')
        .eq('household_id', profile.current_household_id)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', weekFromNow.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true });

      if (items) {
        const itemsWithDays = items.map(item => {
          const expiryDate = new Date(item.expiry_date!);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return { ...item, daysUntilExpiry };
        });
        setExpiringItems(itemsWithDays);
      }
    } catch (error) {
      console.error('Error fetching expiring items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecipes = async () => {
    if (expiringItems.length === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_household_id, dietary_preferences, allergies')
        .eq('id', user.id)
        .single();

      if (!profile?.current_household_id) return;

      // Get all inventory for matching
      const { data: inventory } = await supabase
        .from('inventory')
        .select('name, category')
        .eq('household_id', profile.current_household_id);

      const ingredientsList = expiringItems.map(item => item.name).join(', ');

      const { data, error } = await supabase.functions.invoke('suggest-recipes', {
        body: {
          ingredients: ingredientsList,
          dietary_preferences: profile.dietary_preferences || [],
          inventory_match: true,
          user_id: user.id
        }
      });

      if (error) throw error;

      toast.success('Recipe suggestions generated!');
      navigate('/recipes');
    } catch (error) {
      console.error('Error generating recipes:', error);
      toast.error('Failed to generate recipes');
    }
  };

  if (loading) return null;
  if (expiringItems.length === 0) return null;

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-destructive/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">Items Expiring Soon</h3>
            <p className="text-sm text-muted-foreground">Use them before they go to waste</p>
          </div>
        </div>
        <Button 
          onClick={handleGetRecipes}
          variant="outline"
          className="gap-2"
        >
          <ChefHat className="w-4 h-4" />
          Get Recipes
        </Button>
      </div>

      <div className="space-y-2">
        {expiringItems.slice(0, 3).map(item => (
          <div 
            key={item.id}
            className="flex items-center justify-between p-3 rounded-lg bg-background/50"
          >
            <span className="text-sm font-medium text-foreground">{item.name}</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span className={item.daysUntilExpiry <= 2 ? 'text-destructive' : ''}>
                {item.daysUntilExpiry <= 0 
                  ? 'Expired' 
                  : `${item.daysUntilExpiry} day${item.daysUntilExpiry > 1 ? 's' : ''}`
                }
              </span>
            </div>
          </div>
        ))}
        {expiringItems.length > 3 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{expiringItems.length - 3} more items expiring soon
          </p>
        )}
      </div>
    </Card>
  );
};
