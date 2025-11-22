import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';

export default function NutritionWidget({ userId }: { userId: string }) {
  const [todayCalories, setTodayCalories] = useState(0);
  const [targetCalories, setTargetCalories] = useState(2000);
  const [mealPhotos, setMealPhotos] = useState<string[]>([]);
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
      .select('calories, image_url')
      .eq('user_id', userId)
      .gte('logged_at', `${today}T00:00:00`)
      .lte('logged_at', `${today}T23:59:59`);

    if (data) {
      const total = data.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      setTodayCalories(Math.round(total));
      setMealPhotos(data.map(m => m.image_url).filter(Boolean) as string[]);
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
      <Card className="backdrop-blur-xl bg-white/5 border-white/10 p-6 hover:bg-white/[0.07] transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="text-emerald-400" size={20} />
            <h3 className="text-white font-semibold">Today's Calories</h3>
          </div>
          <button className="text-emerald-400 hover:text-emerald-300 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Calorie Progress */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-4xl font-bold text-white">{todayCalories}</span>
            <span className="text-slate-400 text-sm">/ {targetCalories} cal</span>
          </div>
          
          <Progress 
            value={Math.min(progress, 100)} 
            className={`h-2 ${isOverTarget ? '[&>div]:bg-red-500' : '[&>div]:bg-emerald-500'}`}
          />

          {isOverTarget && (
            <p className="text-red-400 text-xs">⚠️ Over target by {todayCalories - targetCalories} cal</p>
          )}
        </div>

        {/* Meal Photos */}
        {mealPhotos.length > 0 && (
          <div className="mt-4">
            <p className="text-slate-400 text-xs mb-2">Today's Meals</p>
            <div className="flex gap-2">
              {mealPhotos.slice(0, 3).map((photo, idx) => (
                <motion.img
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  src={photo} 
                  alt={`Meal ${idx + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-white/10"
                />
              ))}
              {mealPhotos.length > 3 && (
                <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-white/60 text-xs border border-white/10">
                  +{mealPhotos.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {mealPhotos.length === 0 && (
          <div className="mt-4 text-center py-4">
            <p className="text-slate-400 text-sm">No meals logged yet today</p>
            <p className="text-slate-500 text-xs mt-1">Scan your first meal to start tracking</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
