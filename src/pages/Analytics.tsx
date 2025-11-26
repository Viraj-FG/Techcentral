import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AuroraBackground from "@/components/AuroraBackground";
import { CalendarView } from "@/components/analytics/CalendarView";
import { MacroChart } from "@/components/analytics/MacroChart";
import { CalorieChart } from "@/components/analytics/CalorieChart";
import { DayDetailModal } from "@/components/analytics/DayDetailModal";
import { BMIGaugeCard } from "@/components/analytics/BMIGaugeCard";
import { WeeklyReportCard } from "@/components/analytics/WeeklyReportCard";
import { NutritionInsights } from "@/components/analytics/NutritionInsights";
import { exportMealLogsToCSV } from "@/lib/exportUtils";
import { kaevaTransition } from "@/hooks/useKaevaMotion";
import { format, subMonths, addMonths, startOfMonth, endOfMonth, subDays } from "date-fns";
import UniversalShell from "@/components/layout/UniversalShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { PageTransition } from "@/components/layout/PageTransition";

interface MealLog {
  id: string;
  logged_at: string;
  meal_type: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  image_url: string | null;
  items: any;
}

interface DayData {
  date: Date;
  totalCalories: number;
  targetMet: boolean;
  meals: MealLog[];
}

const Analytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [tdee, setTdee] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [timePeriod, setTimePeriod] = useState<"thisWeek" | "lastWeek" | "2weeksAgo" | "3weeksAgo">("thisWeek");
  const [nutritionGoals, setNutritionGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65
  });

  // Enable swipe navigation and get swipe state
  const swipeState = useSwipeNavigation();

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      setUserId(session.user.id);

      // Fetch user's TDEE and nutrition goals
      const { data: profile } = await supabase
        .from('profiles')
        .select('calculated_tdee, daily_calorie_goal, daily_protein_goal, daily_carbs_goal, daily_fat_goal')
        .eq('id', session.user.id)
        .single();

      if (profile?.calculated_tdee) {
        setTdee(profile.calculated_tdee);
      }
      
      if (profile?.daily_calorie_goal) {
        setNutritionGoals({
          calories: profile.daily_calorie_goal,
          protein: profile.daily_protein_goal || 150,
          carbs: profile.daily_carbs_goal || 200,
          fat: profile.daily_fat_goal || 65
        });
      }

      // Fetch meal logs for selected month
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);

      const { data: meals, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('logged_at', monthStart.toISOString())
        .lte('logged_at', monthEnd.toISOString())
        .order('logged_at', { ascending: true });

      if (error) throw error;

      setMealLogs(meals || []);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate period start date based on selected time period
  const getPeriodStartDate = () => {
    const today = new Date();
    switch (timePeriod) {
      case "thisWeek":
        return subDays(today, 6);
      case "lastWeek":
        return subDays(today, 13);
      case "2weeksAgo":
        return subDays(today, 20);
      case "3weeksAgo":
        return subDays(today, 27);
      default:
        return subDays(today, 6);
    }
  };

  // Calculate last 7 days macro data
  const last7DaysMacros = useMemo(() => {
    const sevenDaysAgo = getPeriodStartDate();
    const recentMeals = mealLogs.filter(m => 
      new Date(m.logged_at) >= sevenDaysAgo
    );

    // Group by day
    const dailyData: { [key: string]: { protein: number; carbs: number; fat: number } } = {};
    
    recentMeals.forEach(meal => {
      const day = format(new Date(meal.logged_at), 'MMM dd');
      if (!dailyData[day]) {
        dailyData[day] = { protein: 0, carbs: 0, fat: 0 };
      }
      dailyData[day].protein += meal.protein || 0;
      dailyData[day].carbs += meal.carbs || 0;
      dailyData[day].fat += meal.fat || 0;
    });

    return Object.entries(dailyData).map(([date, macros]) => ({
      date,
      ...macros
    }));
  }, [mealLogs, timePeriod]);

  // Calculate last 7 days calorie data
  const last7DaysCalories = useMemo(() => {
    const sevenDaysAgo = getPeriodStartDate();
    const recentMeals = mealLogs.filter(m => 
      new Date(m.logged_at) >= sevenDaysAgo
    );

    // Group by day
    const dailyData: { [key: string]: number } = {};
    
    recentMeals.forEach(meal => {
      const day = format(new Date(meal.logged_at), 'MMM dd');
      if (!dailyData[day]) {
        dailyData[day] = 0;
      }
      dailyData[day] += meal.calories || 0;
    });

    return Object.entries(dailyData).map(([date, calories]) => ({
      date,
      calories
    }));
  }, [mealLogs, timePeriod]);

  const handleDayClick = (dayData: DayData) => {
    setSelectedDay(dayData);
    setModalOpen(true);
  };

  const handleExport = () => {
    if (mealLogs.length === 0) {
      toast({
        title: "No Data",
        description: "No meal logs to export",
        variant: "destructive"
      });
      return;
    }

    try {
      exportMealLogsToCSV(mealLogs);
      toast({
        title: "Export Successful",
        description: `Exported ${mealLogs.length} meal logs`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <UniversalShell>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      </UniversalShell>
    );
  }

  return (
    <UniversalShell>
      <AuroraBackground vertical="food" />
      
      <PageHeader 
        title="Analytics" 
        showHomeButton
        rightAction={
          <Button 
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={mealLogs.length === 0}
          >
            <Download size={18} />
            Export
          </Button>
        }
      />

      <PageTransition 
        swipeProgress={swipeState.progress}
        swipeDirection={swipeState.direction}
      >
        <div className="relative z-10 p-4 sm:p-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={kaevaTransition}
          className="max-w-6xl mx-auto space-y-6"
        >
          {/* Page Description */}
          <div>
            <p className="text-body text-foreground/60">
              Your quantified self
            </p>
          </div>

          {/* BMI Gauge Card */}
          {userId && <BMIGaugeCard userId={userId} />}

          {/* Weekly Report */}
          <WeeklyReportCard 
            mealLogs={mealLogs}
            calorieGoal={nutritionGoals.calories}
            proteinGoal={nutritionGoals.protein}
            carbsGoal={nutritionGoals.carbs}
            fatGoal={nutritionGoals.fat}
          />

          {/* AI Insights */}
          <NutritionInsights 
            mealLogs={mealLogs}
            calorieGoal={nutritionGoals.calories}
            proteinGoal={nutritionGoals.protein}
          />

          {/* Calendar View */}
          <Card className="backdrop-blur-xl bg-white/5 border-white/10 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-white font-semibold">Monthly Overview</h2>
              <div className="flex gap-2 items-center">
                <Button 
                  variant="glass" 
                  size="icon"
                  onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                >
                  <ChevronLeft size={20} />
                </Button>
                <span className="text-white px-4 py-2 min-w-[150px] text-center">
                  {format(selectedMonth, 'MMMM yyyy')}
                </span>
                <Button 
                  variant="glass" 
                  size="icon"
                  onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                  disabled={addMonths(selectedMonth, 1) > new Date()}
                >
                  <ChevronRight size={20} />
                </Button>
              </div>
            </div>
            
            <CalendarView 
              month={selectedMonth.getMonth()}
              year={selectedMonth.getFullYear()}
              mealLogs={mealLogs}
              tdee={tdee}
              onDayClick={handleDayClick}
            />
            
            {/* Legend */}
            <div className="flex gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Hit Goal (±10%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-muted-foreground">Missed Goal</span>
              </div>
            </div>
          </Card>

          {/* Time Period Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: "thisWeek", label: "This week" },
              { id: "lastWeek", label: "Last week" },
              { id: "2weeksAgo", label: "2 wks. ago" },
              { id: "3weeksAgo", label: "3 wks. ago" },
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => setTimePeriod(period.id as any)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  timePeriod === period.id
                    ? "bg-primary text-background"
                    : "backdrop-blur-xl bg-white/5 border border-white/10 text-foreground hover:bg-white/10"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Trend Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Macro Split */}
            <Card className="backdrop-blur-xl bg-white/5 border-white/10 p-6">
              <h2 className="text-xl text-white font-semibold mb-4">
                Macro Split
              </h2>
              <MacroChart data={last7DaysMacros} />
            </Card>

            {/* Calorie Burn */}
            <Card className="backdrop-blur-xl bg-white/5 border-white/10 p-6">
              <h2 className="text-xl text-white font-semibold mb-4">
                Calories vs Goal
              </h2>
              <CalorieChart data={last7DaysCalories} tdee={tdee} />
            </Card>
          </div>

          {/* Empty State */}
          {mealLogs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground mb-4">
                No meal logs for this month. Start logging to see your trends!
              </p>
              <Button onClick={() => navigate('/app')} variant="default">
                Go to Dashboard
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
      </PageTransition>

      <BottomTabBar />

      {/* Day Detail Modal */}
      <DayDetailModal 
        dayData={selectedDay}
        tdee={tdee}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </UniversalShell>
  );
};

export default Analytics;
