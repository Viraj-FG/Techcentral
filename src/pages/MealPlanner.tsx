import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppShell from '@/components/layout/AppShell';
import { PageTransition } from '@/components/layout/PageTransition';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { Button } from '@/components/ui/button';
import { Calendar, ShoppingCart } from 'lucide-react';
import { WeeklyCalendar } from '@/components/meal-planner/WeeklyCalendar';
import { ShoppingPreviewSheet } from '@/components/meal-planner/ShoppingPreviewSheet';
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
  const [weekOffset, setWeekOffset] = useState(0);
  const [shoppingPreviewOpen, setShoppingPreviewOpen] = useState(false);
  const [recipesForShopping, setRecipesForShopping] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const currentWeekStart = addWeeks(
    startOfWeek(new Date(), { weekStartsOn: 0 }), 
    weekOffset
  );

  useEffect(() => {
    fetchMealPlans();
  }, [weekOffset]);

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

  const handleGenerateShoppingListPreview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', user.id)
        .single();

      if (!profile?.current_household_id) return;

      // Fetch recipes for all meal plans
      const recipeIds = mealPlans
        .filter(plan => plan.recipe_id)
        .map(plan => plan.recipe_id);

      if (recipeIds.length === 0) {
        toast.error('No meals planned for this week');
        return;
      }

      const { data: recipes, error: recipesError } = await supabase
        .from('recipes')
        .select('id, name, ingredients')
        .in('id', recipeIds);

      if (recipesError) throw recipesError;

      // Open preview sheet with recipes
      setRecipesForShopping(recipes || []);
      setShoppingPreviewOpen(true);
    } catch (error) {
      console.error('Error generating shopping preview:', error);
      toast.error('Failed to generate shopping list');
    }
  };

  const goToPreviousWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const goToNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const goToThisWeek = () => {
    setWeekOffset(0);
  };

  const handleGenerateWeeklyPlan = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
        body: {
          week_start_date: currentWeekStart.toISOString().split('T')[0],
          preferences: {
            cooking_time_max: 60,
          }
        }
      });

      if (error) throw error;

      toast.success(`Generated ${data.meals_created} meals and added ${data.shopping_items_added} items to shopping list!`);
      fetchMealPlans();
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast.error('Failed to generate meal plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      goToPreviousWeek();
    } else {
      goToNextWeek();
    }
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
              onClick={handleGenerateShoppingListPreview}
              className="gap-2 bg-primary text-background hover:bg-primary/90"
              disabled={mealPlans.length === 0}
            >
              <ShoppingCart className="w-4 h-4" />
              Generate Shopping List
            </Button>
          </div>

          {/* Week Display */}
          <div className="flex items-center justify-center mb-6 gap-4">
            <h2 className="text-xl font-semibold text-foreground">
              Week of {format(currentWeekStart, 'MMM d, yyyy')}
            </h2>
            <div className="flex gap-2">
              {weekOffset !== 0 && (
                <Button variant="ghost" size="sm" onClick={goToThisWeek}>
                  Back to This Week
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateWeeklyPlan}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'AI Generate Week'}
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <WeeklyCalendar 
            weekStart={currentWeekStart}
            mealPlans={mealPlans}
            onRefresh={fetchMealPlans}
            loading={loading}
            onWeekChange={handleWeekChange}
            currentWeekIndex={weekOffset}
          />

          <ShoppingPreviewSheet
            open={shoppingPreviewOpen}
            onOpenChange={setShoppingPreviewOpen}
            recipes={recipesForShopping}
          />
        </div>
      </PageTransition>
    </AppShell>
  );
};

export default MealPlanner;
