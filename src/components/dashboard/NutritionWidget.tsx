import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { MealLogCard } from './MealLogCard';

export default function NutritionWidget({ userId }: { userId: string }) {
  const [todayCalories, setTodayCalories] = useState(0);
  const [targetCalories, setTargetCalories] = useState(2000);
  const [recentMeals, setRecentMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    await Promise.all([fetchTodayMeals(), fetchUserTDEE()]);
    setLoading(false);
  };

  const fetchTodayMeals = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', `${today}T00:00:00`)
      .lte('logged_at', `${today}T23:59:59`)
      .order('logged_at', { ascending: false })
      .limit(3);

    if (data) {
      const total = data.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      setTodayCalories(Math.round(total));
      setRecentMeals(data);
    }
  };

  const fetchUserTDEE = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('calculated_tdee')
      .eq('id', userId)
      .single();

    if (data?.calculated_tdee) {
      setTargetCalories(data.calculated_tdee);
    }
  };

  const progress = (todayCalories / targetCalories) * 100;
  const isOverTarget = progress > 100;

  if (loading) {
    return (
      <Card className="backdrop-blur-xl bg-white/5 border-white/10 p-6 animate-pulse">
        <div className="h-32" />
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="backdrop-blur-xl bg-white/5 border-white/10 p-6 hover:bg-white/[0.07] transition-colors overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Activity className="text-secondary flex-shrink-0" size={20} />
            <h3 className="text-white font-semibold truncate">Today's Calories</h3>
          </div>
          <button className="text-secondary hover:text-secondary/80 transition-colors flex-shrink-0">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Calorie Progress */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-4xl font-bold text-white truncate">{todayCalories}</span>
            <span className="text-slate-400 text-sm flex-shrink-0">/ {targetCalories} cal</span>
          </div>
          
          <Progress 
            value={Math.min(progress, 100)} 
            className={`h-2 ${isOverTarget ? '[&>div]:bg-destructive' : '[&>div]:bg-secondary'}`}
          />

          {isOverTarget && (
            <p className="text-destructive text-xs truncate">⚠️ Over target by {todayCalories - targetCalories} cal</p>
          )}
        </div>

        {/* Meal Cards */}
        {recentMeals.length > 0 && (
          <div className="mt-4 space-y-2">
            {recentMeals.map((meal) => (
              <MealLogCard
                key={meal.id}
                id={meal.id}
                mealType={meal.meal_type}
                loggedAt={meal.logged_at}
                calories={meal.calories || 0}
                protein={meal.protein || 0}
                carbs={meal.carbs || 0}
                fat={meal.fat || 0}
                imageUrl={meal.image_url}
                items={meal.items}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {recentMeals.length === 0 && (
          <div className="mt-4 text-center py-4">
            <p className="text-slate-400 text-sm">No meals logged yet today</p>
            <p className="text-slate-500 text-xs mt-1">Scan your first meal to start tracking</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
