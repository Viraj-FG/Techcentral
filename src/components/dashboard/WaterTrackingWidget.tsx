import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Droplets, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const WaterTrackingWidget = ({ userId }: { userId: string }) => {
  const [todayIntake, setTodayIntake] = useState(0);
  const [goalMl, setGoalMl] = useState(2000);
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWaterData();
  }, [userId]);

  const fetchWaterData = async () => {
    try {
      // Fetch user's water goal
      const { data: profile } = await supabase
        .from("profiles")
        .select("water_goal_ml")
        .eq("id", userId)
        .single();

      if (profile?.water_goal_ml) {
        setGoalMl(profile.water_goal_ml);
      }

      // Fetch today's water logs
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: logs } = await supabase
        .from("water_logs")
        .select("amount_ml")
        .eq("user_id", userId)
        .gte("logged_at", today.toISOString());

      if (logs) {
        const total = logs.reduce((sum, log) => sum + log.amount_ml, 0);
        setTodayIntake(total);
      }
    } catch (error) {
      console.error("Error fetching water data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logWater = async (amount: number) => {
    try {
      const { error } = await supabase.from("water_logs").insert({
        user_id: userId,
        amount_ml: amount,
        logged_at: new Date().toISOString(),
      });

      if (error) throw error;

      setTodayIntake((prev) => prev + amount);
      toast.success(`Added ${amount}ml water`);
    } catch (error) {
      console.error("Error logging water:", error);
      toast.error("Failed to log water");
    }
  };

  const handleCustomAmount = () => {
    const amount = parseInt(customAmount);
    if (amount > 0 && amount <= 5000) {
      logWater(amount);
      setCustomAmount("");
    }
  };

  const progress = Math.min((todayIntake / goalMl) * 100, 100);
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-accent" />
            Water Intake
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-accent" />
            Water Intake
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Circular Progress Ring */}
          <div className="flex justify-center">
            <div className="relative w-40 h-40">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="60"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-accent transition-all duration-500"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">
                  {todayIntake}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {goalMl} ml
                </span>
              </div>
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => logWater(150)}
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1"
            >
              <Droplets className="w-4 h-4" />
              <span className="text-xs">+150ml</span>
            </Button>
            <Button
              onClick={() => logWater(250)}
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1"
            >
              <Droplets className="w-4 h-4" />
              <span className="text-xs">+250ml</span>
            </Button>
            <Button
              onClick={() => logWater(500)}
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1"
            >
              <Droplets className="w-4 h-4" />
              <span className="text-xs">+500ml</span>
            </Button>
          </div>

          {/* Custom Amount */}
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Custom amount (ml)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="flex-1"
              min="1"
              max="5000"
            />
            <Button onClick={handleCustomAmount} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
