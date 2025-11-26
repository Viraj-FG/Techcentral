import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppShell from '@/components/layout/AppShell';
import { PageTransition } from '@/components/layout/PageTransition';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { WeeklyCalendar } from '@/components/meal-planner/WeeklyCalendar';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { startOfWeek, addWeeks, format } from 'date-fns';

interface MealPlan {
  id: string;
  recipe_id: string;
  planned_date: string;
  meal_type: string;
  notes: string | null;
  recipes: {
    id: string;
    name: string;
    ingredients: any;
    estimated_calories: number;
  };
}

const MealPlanner = () => {
  const navigate = useNavigate();
  const swipeState = useSwipeNavigation();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );

  useEffect(() => {
    fetchMealPlans();
  }, [currentWeekStart]);

  const fetchMealPlans = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', user.id)
        .single();

      if (!profile?.current_household_id) return;

      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data, error } = await supabase
        .from('meal_plans')
        .select(`
          id,
          recipe_id,
          planned_date,
          meal_type,
          notes,
          recipes (
            id,
            name,
            ingredients,
            estimated_calories
          )
        `)
        .eq('household_id', profile.current_household_id)
        .gte('planned_date', currentWeekStart.toISOString().split('T')[0])
        .lt('planned_date', weekEnd.toISOString().split('T')[0])
        .order('planned_date', { ascending: true })
        .order('meal_type', { ascending: true });

      if (error) throw error;
      setMealPlans(data || []);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      toast.error('Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateShoppingList = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', user.id)
        .single();

      if (!profile?.current_household_id) return;

      // Get current inventory
      const { data: inventory } = await supabase
        .from('inventory')
        .select('name, quantity')
        .eq('household_id', profile.current_household_id);

      const inventoryMap = new Map(
        (inventory || []).map(item => [item.name.toLowerCase(), item.quantity || 0])
      );

      // Collect all ingredients from planned recipes
      const ingredientsNeeded: { [key: string]: number } = {};
      
      mealPlans.forEach(plan => {
        const ingredients = plan.recipes?.ingredients || [];
        if (Array.isArray(ingredients)) {
          ingredients.forEach((ing: any) => {
            const name = ing.name || ing.ingredient || '';
            const amount = parseFloat(ing.amount || ing.quantity || 1);
            if (name) {
              ingredientsNeeded[name] = (ingredientsNeeded[name] || 0) + amount;
            }
          });
        }
      });

      // Create shopping list items for missing ingredients
      const shoppingItems = [];
      for (const [ingredient, needed] of Object.entries(ingredientsNeeded)) {
        const inStock = inventoryMap.get(ingredient.toLowerCase()) || 0;
        if (inStock < needed) {
          shoppingItems.push({
            household_id: profile.current_household_id,
            item_name: ingredient,
            quantity: needed - inStock,
            source: 'meal_plan',
            priority: 'normal',
            status: 'pending'
          });
        }
      }

      if (shoppingItems.length > 0) {
        const { error } = await supabase
          .from('shopping_list')
          .insert(shoppingItems);

        if (error) throw error;
        toast.success(`Added ${shoppingItems.length} items to shopping list!`);
      } else {
        toast.info('You have all ingredients for this week!');
      }
    } catch (error) {
      console.error('Error generating shopping list:', error);
      toast.error('Failed to generate shopping list');
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, -1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const goToThisWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  return (
    <AppShell onScan={() => navigate('/')}>
      <PageTransition 
        swipeProgress={swipeState.progress}
        swipeDirection={swipeState.direction}
      >
        <div className="container mx-auto px-4 py-8 max-w-7xl pb-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Calendar className="w-10 h-10 text-primary" />
                Meal Planner
              </h1>
              <p className="text-muted-foreground">Plan your week and reduce food waste</p>
            </div>
            <Button 
              onClick={handleGenerateShoppingList}
              className="gap-2"
              disabled={mealPlans.length === 0}
            >
              <ShoppingCart className="w-4 h-4" />
              Generate Shopping List
            </Button>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-foreground">
                Week of {format(currentWeekStart, 'MMM d, yyyy')}
              </h2>
              <Button variant="ghost" size="sm" onClick={goToThisWeek}>
                This Week
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <WeeklyCalendar 
            weekStart={currentWeekStart}
            mealPlans={mealPlans}
            onRefresh={fetchMealPlans}
            loading={loading}
          />
        </div>
      </PageTransition>
    </AppShell>
  );
};

export default MealPlanner;
