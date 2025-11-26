import { useMemo } from "react";
import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, Award, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { format, subDays } from "date-fns";

interface MealLog {
  logged_at: string;
  meal_type: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
}

interface NutritionInsightsProps {
  mealLogs: MealLog[];
  calorieGoal: number;
  proteinGoal: number;
  fiberGoal?: number;
}

export const NutritionInsights = ({ 
  mealLogs, 
  calorieGoal,
  proteinGoal,
  fiberGoal = 25
}: NutritionInsightsProps) => {
  const insights = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentMeals = mealLogs.filter(m => 
      new Date(m.logged_at) >= sevenDaysAgo
    );

    if (recentMeals.length === 0) {
      return [];
    }

    const insights: Array<{
      icon: any;
      type: 'success' | 'warning' | 'info';
      message: string;
    }> = [];

    // Group by day for protein goal analysis
    const dailyData: { [key: string]: { protein: number; fiber: number; calories: number; mealsByType: { [key: string]: number } } } = {};
    
    recentMeals.forEach(meal => {
      const day = format(new Date(meal.logged_at), 'yyyy-MM-dd');
      if (!dailyData[day]) {
        dailyData[day] = { protein: 0, fiber: 0, calories: 0, mealsByType: {} };
      }
      dailyData[day].protein += meal.protein || 0;
      dailyData[day].fiber += meal.fiber || 0;
      dailyData[day].calories += meal.calories || 0;
      
      // Track meal types
      const mealType = meal.meal_type;
      dailyData[day].mealsByType[mealType] = (dailyData[day].mealsByType[mealType] || 0) + (meal.calories || 0);
    });

    const daysData = Object.values(dailyData);
    const daysCount = daysData.length;

    // Protein goal insight
    const proteinHitDays = daysData.filter(d => d.protein >= proteinGoal * 0.9).length;
    if (proteinHitDays >= 5) {
      insights.push({
        icon: Award,
        type: 'success',
        message: `You hit your protein goal ${proteinHitDays} out of ${daysCount} days! 💪`
      });
    } else if (proteinHitDays < 3) {
      insights.push({
        icon: AlertCircle,
        type: 'warning',
        message: `Only ${proteinHitDays}/${daysCount} days hit protein goal. Try adding more lean proteins.`
      });
    }

    // Fiber insight
    const avgFiber = daysData.reduce((sum, d) => sum + d.fiber, 0) / daysCount;
    if (avgFiber < fiberGoal * 0.8) {
      const percentBelow = Math.round(((fiberGoal - avgFiber) / fiberGoal) * 100);
      insights.push({
        icon: Lightbulb,
        type: 'info',
        message: `Your fiber intake is ${percentBelow}% below goal. Add more veggies, fruits, and whole grains!`
      });
    }

    // Meal timing insight (heaviest meal)
    const totalMealsByType: { [key: string]: number } = {};
    daysData.forEach(d => {
      Object.entries(d.mealsByType).forEach(([type, cals]) => {
        totalMealsByType[type] = (totalMealsByType[type] || 0) + cals;
      });
    });

    const heaviestMeal = Object.entries(totalMealsByType).sort((a, b) => b[1] - a[1])[0];
    if (heaviestMeal) {
      const [mealType, cals] = heaviestMeal;
      const percentage = Math.round((cals / daysData.reduce((sum, d) => sum + d.calories, 0)) * 100);
      if (percentage > 40) {
        insights.push({
          icon: TrendingUp,
          type: 'info',
          message: `Your ${mealType} meals are ${percentage}% of daily calories. Consider redistributing for better energy levels.`
        });
      }
    }

    // Consistency insight
    if (daysCount >= 6) {
      insights.push({
        icon: Award,
        type: 'success',
        message: `Amazing! You tracked ${daysCount} out of 7 days this week. Consistency is key! 🎉`
      });
    }

    return insights;
  }, [mealLogs, calorieGoal, proteinGoal, fiberGoal]);

  if (insights.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="backdrop-blur-xl bg-white/5 border-white/10 p-6">
        <h2 className="text-xl text-white font-semibold mb-4">
          AI Insights
        </h2>

        <div className="space-y-3">
          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            const bgColor = {
              success: 'bg-secondary/10 border-secondary/20',
              warning: 'bg-destructive/10 border-destructive/20',
              info: 'bg-accent/10 border-accent/20'
            }[insight.type];

            const iconColor = {
              success: 'text-secondary',
              warning: 'text-destructive',
              info: 'text-accent'
            }[insight.type];

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 rounded-lg border ${bgColor}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                  <p className="text-sm text-foreground flex-1">
                    {insight.message}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
};