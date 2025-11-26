import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format, isSameDay } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { MealPlanCard } from './MealPlanCard';
import { RecipeSelector } from './RecipeSelector';
import { toast } from 'sonner';

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

interface WeeklyCalendarProps {
  weekStart: Date;
  mealPlans: MealPlan[];
  onRefresh: () => void;
  loading: boolean;
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const WeeklyCalendar = ({ weekStart, mealPlans, onRefresh, loading }: WeeklyCalendarProps) => {
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; mealType: string } | null>(null);

  const getMealsForDay = (date: Date) => {
    return mealPlans.filter(plan => 
      isSameDay(new Date(plan.planned_date), date)
    );
  };

  const getMealForSlot = (date: Date, mealType: string) => {
    return mealPlans.find(plan => 
      isSameDay(new Date(plan.planned_date), date) && plan.meal_type === mealType
    );
  };

  const handleAddMeal = (date: Date, mealType: string) => {
    setSelectedSlot({ date, mealType });
  };

  const handleSelectRecipe = async (recipeId: string) => {
    if (!selectedSlot) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', user.id)
        .single();

      if (!profile?.current_household_id) return;

      const { error } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          household_id: profile.current_household_id,
          recipe_id: recipeId,
          planned_date: selectedSlot.date.toISOString().split('T')[0],
          meal_type: selectedSlot.mealType
        });

      if (error) throw error;

      toast.success('Meal added to plan!');
      setSelectedSlot(null);
      onRefresh();
    } catch (error) {
      console.error('Error adding meal plan:', error);
      toast.error('Failed to add meal');
    }
  };

  const handleDeleteMeal = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast.success('Meal removed from plan');
      onRefresh();
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      toast.error('Failed to remove meal');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="p-4 h-96 animate-pulse bg-card/30" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, dayIndex) => {
          const date = addDays(weekStart, dayIndex);
          const isToday = isSameDay(date, new Date());

          return (
            <div key={dayIndex} className="space-y-2">
              {/* Day Header */}
              <div className={`text-center p-2 rounded-lg ${
                isToday ? 'bg-primary/20 border border-primary/30' : 'bg-card/30'
              }`}>
                <div className="text-sm font-medium text-muted-foreground">
                  {DAYS[dayIndex]}
                </div>
                <div className={`text-lg font-bold ${
                  isToday ? 'text-primary' : 'text-foreground'
                }`}>
                  {format(date, 'd')}
                </div>
              </div>

              {/* Meal Slots */}
              <div className="space-y-2">
                {MEAL_TYPES.map(mealType => {
                  const meal = getMealForSlot(date, mealType);

                  return (
                    <Card 
                      key={mealType}
                      className="p-2 min-h-[80px] bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors"
                    >
                      {meal ? (
                        <MealPlanCard 
                          meal={meal}
                          onDelete={() => handleDeleteMeal(meal.id)}
                        />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
                          onClick={() => handleAddMeal(date, mealType)}
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-xs capitalize">{mealType}</span>
                        </Button>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recipe Selector Dialog */}
      {selectedSlot && (
        <RecipeSelector
          open={!!selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onSelect={handleSelectRecipe}
          mealType={selectedSlot.mealType}
        />
      )}
    </>
  );
};
