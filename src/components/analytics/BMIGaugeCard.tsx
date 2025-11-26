import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const BMIGaugeCard = ({ userId }: { userId: string }) => {
  const [bmi, setBmi] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBMI();
  }, [userId]);

  const fetchBMI = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_weight, user_height")
        .eq("id", userId)
        .single();

      if (profile?.user_weight && profile?.user_height) {
        // BMI = weight(kg) / (height(m))^2
        const heightInMeters = profile.user_height / 100;
        const calculatedBMI = profile.user_weight / (heightInMeters * heightInMeters);
        setBmi(parseFloat(calculatedBMI.toFixed(1)));
      }
    } catch (error) {
      console.error("Error fetching BMI:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-accent" };
    if (bmi < 25) return { label: "Healthy", color: "text-secondary" };
    if (bmi < 30) return { label: "Overweight", color: "text-primary" };
    return { label: "Obese", color: "text-destructive" };
  };

  const getBMIPosition = (bmi: number) => {
    // Map BMI to position on gauge (15-35 BMI range)
    const min = 15;
    const max = 35;
    const clampedBMI = Math.max(min, Math.min(max, bmi));
    return ((clampedBMI - min) / (max - min)) * 100;
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Body Mass Index
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bmi) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Body Mass Index
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add your weight and height in Settings to see your BMI
          </p>
        </CardContent>
      </Card>
    );
  }

  const category = getBMICategory(bmi);
  const position = getBMIPosition(bmi);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Body Mass Index
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* BMI Number and Category */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold text-foreground">{bmi}</div>
              <Badge variant="outline" className={`mt-2 ${category.color}`}>
                {category.label}
              </Badge>
            </div>
          </div>

          {/* Horizontal Gradient Gauge */}
          <div className="space-y-2">
            <div className="relative h-8 rounded-full overflow-hidden">
              {/* Gradient Background */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to right, hsl(var(--accent)), hsl(var(--secondary)), hsl(var(--primary)), hsl(var(--destructive)))",
                }}
              />
              {/* Position Marker */}
              <motion.div
                className="absolute top-0 bottom-0 w-1 bg-foreground shadow-lg"
                style={{ left: `${position}%` }}
                initial={{ left: "0%" }}
                animate={{ left: `${position}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>

            {/* Legend */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Underweight</span>
              <span>Healthy</span>
              <span>Overweight</span>
              <span>Obese</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
