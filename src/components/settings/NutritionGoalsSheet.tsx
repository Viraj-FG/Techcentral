import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Target, Flame, Drumstick, Wheat, Droplet, Sparkles } from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { calculateNutritionGoals } from "@/lib/goalCalculators";

interface NutritionGoalsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentGoals: {
    daily_calorie_goal: number;
    daily_protein_goal: number;
    daily_carbs_goal: number;
    daily_fat_goal: number;
  };
  userId: string;
}

export const NutritionGoalsSheet = ({ open, onOpenChange, currentGoals, userId }: NutritionGoalsSheetProps) => {
  const [calorieGoal, setCalorieGoal] = useState(currentGoals.daily_calorie_goal);
  const [proteinGoal, setProteinGoal] = useState(currentGoals.daily_protein_goal);
  const [carbsGoal, setCarbsGoal] = useState(currentGoals.daily_carbs_goal);
  const [fatGoal, setFatGoal] = useState(currentGoals.daily_fat_goal);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCalorieGoal(currentGoals.daily_calorie_goal);
    setProteinGoal(currentGoals.daily_protein_goal);
    setCarbsGoal(currentGoals.daily_carbs_goal);
    setFatGoal(currentGoals.daily_fat_goal);
  }, [currentGoals]);

  const handleAutoCalculate = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_age, user_weight, user_height, user_gender, user_activity_level")
        .eq("id", userId)
        .single();

      if (!profile || !profile.user_age || !profile.user_weight || !profile.user_height) {
        toast.error("Please complete your profile biometrics first");
        return;
      }

      const goals = calculateNutritionGoals({
        age: profile.user_age,
        weight: profile.user_weight,
        height: profile.user_height,
        gender: profile.user_gender as 'male' | 'female',
        activityLevel: (profile.user_activity_level || 'moderate') as any
      });

      setCalorieGoal(goals.calories);
      setProteinGoal(goals.protein);
      setCarbsGoal(goals.carbs);
      setFatGoal(goals.fat);
      toast.success("Goals calculated based on your profile");
    } catch (error) {
      console.error("Auto-calculate error:", error);
      toast.error("Failed to calculate goals");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          daily_calorie_goal: calorieGoal,
          daily_protein_goal: proteinGoal,
          daily_carbs_goal: carbsGoal,
          daily_fat_goal: fatGoal,
        })
        .eq("id", userId);

      if (error) throw error;
      toast.success("Nutrition goals updated");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating goals:", error);
      toast.error("Failed to update goals");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Nutrition Goals
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Auto-Calculate Button */}
          <Button
            onClick={handleAutoCalculate}
            variant="outline"
            className="w-full"
          >
            <Sparkles size={18} className="mr-2" />
            Auto-calculate based on profile
          </Button>

          {/* Progress Rings Preview */}
          <div className="grid grid-cols-3 gap-4">
            <ProgressRing
              value={proteinGoal}
              max={proteinGoal}
              label="Protein"
              color="hsl(var(--secondary))"
              size="sm"
              unit="g"
            />
            <ProgressRing
              value={carbsGoal}
              max={carbsGoal}
              label="Carbs"
              color="hsl(var(--accent))"
              size="sm"
              unit="g"
            />
            <ProgressRing
              value={fatGoal}
              max={fatGoal}
              label="Fat"
              color="hsl(var(--primary))"
              size="sm"
              unit="g"
            />
          </div>

          {/* Daily Calorie Goal */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-destructive" />
              <Label htmlFor="calories" className="text-base">Daily Calorie Target</Label>
            </div>
            <div className="flex items-center gap-3">
              <Input
                id="calories"
                type="number"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-muted-foreground">kcal</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your daily calorie intake target
            </p>
          </div>

          {/* Macro Goals */}
          <div className="glass-card p-4 space-y-4">
            <h3 className="font-medium">Macro Targets</h3>

            {/* Protein */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Drumstick className="w-4 h-4 text-secondary" />
                <Label htmlFor="protein" className="text-sm">Protein</Label>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  id="protein"
                  type="number"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-muted-foreground text-sm">g</span>
              </div>
            </div>

            {/* Carbs */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wheat className="w-4 h-4 text-accent" />
                <Label htmlFor="carbs" className="text-sm">Carbohydrates</Label>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  id="carbs"
                  type="number"
                  value={carbsGoal}
                  onChange={(e) => setCarbsGoal(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-muted-foreground text-sm">g</span>
              </div>
            </div>

            {/* Fat */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-primary" />
                <Label htmlFor="fat" className="text-sm">Fat</Label>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  id="fat"
                  type="number"
                  value={fatGoal}
                  onChange={(e) => setFatGoal(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-muted-foreground text-sm">g</span>
              </div>
            </div>
          </div>

          {/* Recommended Macros Info */}
          <div className="glass-card p-4 bg-accent/10">
            <p className="text-sm text-muted-foreground">
              <strong>Tip:</strong> A balanced diet typically consists of 30% protein, 40% carbs, and 30% fat. 
              Adjust based on your specific health goals.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12"
          >
            {isSaving ? "Saving..." : "Save Goals"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
