import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { subDays, format, startOfWeek, endOfWeek } from "date-fns";

interface MealLog {
  logged_at: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

interface WeeklyReportCardProps {
  mealLogs: MealLog[];
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

export const WeeklyReportCard = ({ 
  mealLogs, 
  calorieGoal,
  proteinGoal,
  carbsGoal,
  fatGoal 
}: WeeklyReportCardProps) => {
  const weeklyStats = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
    const thisWeekMeals = mealLogs.filter(m => {
      const date = new Date(m.logged_at);
      return date >= weekStart && date <= weekEnd;
    });

    // Calculate averages
    const daysWithLogs = new Set(thisWeekMeals.map(m => 
      format(new Date(m.logged_at), 'yyyy-MM-dd')
    )).size;

    const totalCalories = thisWeekMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const totalProtein = thisWeekMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
    const totalCarbs = thisWeekMeals.reduce((sum, m) => sum + (m.carbs || 0), 0);
    const totalFat = thisWeekMeals.reduce((sum, m) => sum + (m.fat || 0), 0);

    const avgCalories = daysWithLogs > 0 ? totalCalories / daysWithLogs : 0;
    const avgProtein = daysWithLogs > 0 ? totalProtein / daysWithLogs : 0;
    const avgCarbs = daysWithLogs > 0 ? totalCarbs / daysWithLogs : 0;
    const avgFat = daysWithLogs > 0 ? totalFat / daysWithLogs : 0;

    // Compare to goals
    const caloriesDiff = ((avgCalories - calorieGoal) / calorieGoal) * 100;
    const proteinDiff = ((avgProtein - proteinGoal) / proteinGoal) * 100;
    const carbsDiff = ((avgCarbs - carbsGoal) / carbsGoal) * 100;
    const fatDiff = ((avgFat - fatGoal) / fatGoal) * 100;

    // Count days hitting goal (within ±10%)
    const daysHitGoal = Array.from(new Set(
      thisWeekMeals.map(m => format(new Date(m.logged_at), 'yyyy-MM-dd'))
    )).filter(day => {
      const dayMeals = thisWeekMeals.filter(m => 
        format(new Date(m.logged_at), 'yyyy-MM-dd') === day
      );
      const dayCalories = dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
      const diff = Math.abs((dayCalories - calorieGoal) / calorieGoal);
      return diff <= 0.1; // Within 10%
    }).length;

    return {
      daysWithLogs,
      daysHitGoal,
      avgCalories: Math.round(avgCalories),
      avgProtein: Math.round(avgProtein),
      avgCarbs: Math.round(avgCarbs),
      avgFat: Math.round(avgFat),
      caloriesDiff: Math.round(caloriesDiff),
      proteinDiff: Math.round(proteinDiff),
      carbsDiff: Math.round(carbsDiff),
      fatDiff: Math.round(fatDiff),
    };
  }, [mealLogs, calorieGoal, proteinGoal, carbsGoal, fatGoal]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="backdrop-blur-xl bg-white/5 border-white/10 p-6">
        <h2 className="text-xl text-white font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Weekly Summary
        </h2>

        {/* Days Tracked */}
        <div className="mb-6 p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Days tracked this week</span>
            <span className="text-2xl font-bold text-foreground">
              {weeklyStats.daysWithLogs}/7
            </span>
          </div>
          <div className="mt-2">
            <span className="text-sm text-secondary">
              ✓ {weeklyStats.daysHitGoal} days hit calorie goal
            </span>
          </div>
        </div>

        {/* Averages Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Calories */}
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Avg Calories
              </span>
              {weeklyStats.caloriesDiff !== 0 && (
                weeklyStats.caloriesDiff > 0 ? (
                  <TrendingUp className="w-4 h-4 text-destructive" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-secondary" />
                )
              )}
            </div>
            <div className="text-2xl font-bold text-foreground">
              {weeklyStats.avgCalories}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Goal: {calorieGoal} ({Math.abs(weeklyStats.caloriesDiff)}% {weeklyStats.caloriesDiff > 0 ? 'over' : 'under'})
            </div>
          </div>

          {/* Protein */}
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Avg Protein
              </span>
              {weeklyStats.proteinDiff !== 0 && (
                weeklyStats.proteinDiff > 0 ? (
                  <TrendingUp className="w-4 h-4 text-secondary" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )
              )}
            </div>
            <div className="text-2xl font-bold text-foreground">
              {weeklyStats.avgProtein}g
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Goal: {proteinGoal}g ({Math.abs(weeklyStats.proteinDiff)}% {weeklyStats.proteinDiff > 0 ? 'over' : 'under'})
            </div>
          </div>

          {/* Carbs */}
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Avg Carbs
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {weeklyStats.avgCarbs}g
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Goal: {carbsGoal}g
            </div>
          </div>

          {/* Fat */}
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Avg Fat
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {weeklyStats.avgFat}g
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Goal: {fatGoal}g
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};