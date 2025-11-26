import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AuroraBackground from "@/components/AuroraBackground";
import { CalendarView } from "@/components/analytics/CalendarView";
import { MacroChart } from "@/components/analytics/MacroChart";
import { CalorieChart } from "@/components/analytics/CalorieChart";
import { DayDetailModal } from "@/components/analytics/DayDetailModal";
import { exportMealLogsToCSV } from "@/lib/exportUtils";
import { kaevaTransition } from "@/hooks/useKaevaMotion";
import { format, subMonths, addMonths, startOfMonth, endOfMonth, subDays } from "date-fns";

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

      // Fetch user's TDEE
      const { data: profile } = await supabase
        .from('profiles')
        .select('calculated_tdee')
        .eq('id', session.user.id)
        .single();

      if (profile?.calculated_tdee) {
        setTdee(profile.calculated_tdee);
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

  // Calculate last 7 days macro data
  const last7DaysMacros = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 6);
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
  }, [mealLogs]);

  // Calculate last 7 days calorie data
  const last7DaysCalories = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 6);
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
  }, [mealLogs]);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <AuroraBackground vertical="food" />
      
      <div className="relative z-10 p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={kaevaTransition}
          className="max-w-6xl mx-auto pb-16"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate(-1)} variant="glass" size="icon">
                <ArrowLeft size={20} strokeWidth={1.5} />
              </Button>
              <div>
                <h1 className="text-display text-3xl text-white">ANALYTICS</h1>
                <p className="text-body text-white/60 mt-1">
                  Your quantified self
                </p>
              </div>
            </div>
            
            <Button 
              onClick={handleExport}
              variant="outline"
              className="gap-2"
              disabled={mealLogs.length === 0}
            >
              <Download size={18} />
              Export CSV
            </Button>
          </div>

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

          {/* Trend Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Macro Split */}
            <Card className="backdrop-blur-xl bg-white/5 border-white/10 p-6">
              <h2 className="text-xl text-white font-semibold mb-4">
                Macro Split (Last 7 Days)
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
              <Button onClick={() => navigate('/')} variant="default">
                Go to Dashboard
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Day Detail Modal */}
      <DayDetailModal 
        dayData={selectedDay}
        tdee={tdee}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default Analytics;
