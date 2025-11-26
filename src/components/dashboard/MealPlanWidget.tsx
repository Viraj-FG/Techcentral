import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChefHat, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { startOfWeek, endOfWeek, format, parseISO } from 'date-fns';

interface MealPlan {
  id: string;
  meal_type: string;
  planned_date: string;
  recipes: {
    name: string;
    estimated_calories: number | null;
  } | null;
}

export const MealPlanWidget = () => {
  const navigate = useNavigate();
  const [upcomingMeals, setUpcomingMeals] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingMeals();
  }, []);

  const fetchUpcomingMeals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', user.id)
        .single();

      if (!profileData?.current_household_id) return;

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from('meal_plans')
        .select(`
          id,
          meal_type,
          planned_date,
          recipes (
            name,
            estimated_calories
          )
        `)
        .eq('household_id', profileData.current_household_id)
        .gte('planned_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('planned_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('planned_date', { ascending: true })
        .limit(4);

      if (error) throw error;
      setUpcomingMeals(data || []);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast': return 'text-primary';
      case 'lunch': return 'text-accent';
      case 'dinner': return 'text-secondary';
      case 'snack': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-white">This Week's Meals</h3>
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (upcomingMeals.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-8 text-center overflow-hidden">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <ChefHat className="text-primary" size={32} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-light text-white mb-2">No Meals Planned</h3>
        <p className="text-sm text-white/60 mb-4">
          Plan your week's meals for smarter shopping
        </p>
        <Button
          size="sm"
          onClick={() => navigate('/meal-planner')}
          className="gap-2 bg-primary text-background hover:bg-primary/90"
        >
          Start Planning
        </Button>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-white">This Week's Meals</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/meal-planner')}
          className="text-xs gap-1 text-muted-foreground hover:text-foreground"
        >
          View All
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      <div className="space-y-2">
        {upcomingMeals.map((meal) => (
          <div
            key={meal.id}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => navigate('/meal-planner')}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 mb-0.5">
                {format(parseISO(meal.planned_date), 'EEE, MMM d')}
              </p>
              <p className="text-sm font-medium text-white truncate">
                {meal.recipes?.name || 'Unnamed Recipe'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {meal.recipes?.estimated_calories && (
                <span className="text-xs text-white/60">
                  {meal.recipes.estimated_calories} cal
                </span>
              )}
              <span className={`text-xs font-bold uppercase ${getMealTypeColor(meal.meal_type)}`}>
                {meal.meal_type}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={() => navigate('/meal-planner')}
        className="w-full mt-4 gap-2 border-white/10 hover:bg-white/10"
      >
        <ChefHat className="w-4 h-4" />
        Plan More Meals
      </Button>
    </div>
  );
};
