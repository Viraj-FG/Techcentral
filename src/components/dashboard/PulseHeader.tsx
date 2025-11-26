import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { kaevaTransition } from "@/hooks/useKaevaMotion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PulseHeaderProps {
  profile: any;
}

const PulseHeader = ({ profile }: PulseHeaderProps) => {
  const [healthScore, setHealthScore] = useState(85);
  const [healthInsight, setHealthInsight] = useState("Low sodium");
  const [trendIcon, setTrendIcon] = useState<"up" | "down" | "stable">("stable");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Calculate dynamic health score based on inventory freshness + nutrition adherence
  useEffect(() => {
    const calculateHealthScore = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get household inventory
        const { data: profileData } = await supabase
          .from('profiles')
          .select('current_household_id, calculated_tdee')
          .eq('id', user.id)
          .single();

        if (!profileData?.current_household_id) return;

        const { data: inventory } = await supabase
          .from('inventory')
          .select('status, expiry_date, category')
          .eq('household_id', profileData.current_household_id);

        // Get recent meal logs (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: mealLogs } = await supabase
          .from('meal_logs')
          .select('calories, logged_at')
          .eq('user_id', user.id)
          .gte('logged_at', sevenDaysAgo.toISOString());

        // Calculate inventory freshness score (0-50 points)
        let freshnessScore = 50;
        if (inventory && inventory.length > 0) {
          const spoiledItems = inventory.filter(i => i.status === 'likely_spoiled').length;
          const expiringItems = inventory.filter(i => {
            if (!i.expiry_date) return false;
            const daysUntilExpiry = Math.floor(
              (new Date(i.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
          }).length;
          
          const totalItems = inventory.length;
          const problemPercentage = (spoiledItems * 2 + expiringItems) / totalItems;
          freshnessScore = Math.max(0, 50 - (problemPercentage * 50));
        }

        // Calculate nutrition adherence score (0-50 points)
        let nutritionScore = 50;
        if (mealLogs && mealLogs.length > 0 && profileData.calculated_tdee) {
          const avgCalories = mealLogs.reduce((sum, log) => sum + (log.calories || 0), 0) / mealLogs.length;
          const tdee = profileData.calculated_tdee;
          const adherencePercentage = Math.abs(1 - (avgCalories / tdee));
          nutritionScore = Math.max(0, 50 - (adherencePercentage * 50));
        }

        const totalScore = Math.round(freshnessScore + nutritionScore);
        setHealthScore(totalScore);

        // Generate insight based on scores
        if (freshnessScore < 25) {
          setHealthInsight("High spoilage");
          setTrendIcon("down");
        } else if (nutritionScore < 25) {
          setHealthInsight("Off track");
          setTrendIcon("down");
        } else if (totalScore >= 90) {
          setHealthInsight("Excellent!");
          setTrendIcon("up");
        } else if (totalScore >= 75) {
          setHealthInsight("Good balance");
          setTrendIcon("up");
        } else {
          setHealthInsight("Room for improvement");
          setTrendIcon("stable");
        }
      } catch (error) {
        console.error('Failed to calculate health score:', error);
      }
    };

    calculateHealthScore();
  }, []);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  const TrendIconComponent = trendIcon === "up" ? TrendingUp : trendIcon === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      className="glass-card p-4 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={kaevaTransition}
    >
      <div className="flex flex-row items-center justify-between gap-4">
        {/* Left: Greeting */}
        <div className="flex-1 min-w-0">
          <h1 className="text-display text-xl text-white truncate">
            {getGreeting()}, {profile.user_name || "User"}
          </h1>
        </div>

        {/* Right: Compact Health Score */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Smaller Ring (64x64 instead of 96x96) */}
          <div className="relative w-16 h-16">
            <svg className="transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
              <motion.circle
                cx="50" cy="50" r="45"
                stroke="hsl(var(--accent))"
                strokeWidth="8" fill="none" strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{
                  strokeDasharray: circumference,
                  filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.4))'
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-data text-sm text-accent truncate">{healthScore}%</span>
            </div>
          </div>

          {/* Inline Insight (Next to Ring) */}
          <div className="max-w-[140px]">
            <p className="text-micro text-foreground text-[10px] mb-0.5 truncate">Health</p>
            <p className={`flex items-center gap-1 text-[11px] truncate ${
              trendIcon === "up" ? "text-secondary" : 
              trendIcon === "down" ? "text-destructive" : 
              "text-accent"
            }`}>
              <TrendIconComponent size={12} strokeWidth={1.5} className="flex-shrink-0" />
              <span className="truncate">{healthInsight}</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PulseHeader;
