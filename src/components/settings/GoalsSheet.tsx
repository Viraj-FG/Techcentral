import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GoalsSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentHealthGoals: string;
  currentLifestyleGoals: string;
  onSave: () => void;
}

export const GoalsSheet = ({
  open,
  onClose,
  userId,
  currentHealthGoals,
  currentLifestyleGoals,
  onSave,
}: GoalsSheetProps) => {
  const { toast } = useToast();
  const [healthGoals, setHealthGoals] = useState(currentHealthGoals);
  const [lifestyleGoals, setLifestyleGoals] = useState(currentLifestyleGoals);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setHealthGoals(currentHealthGoals);
    setLifestyleGoals(currentLifestyleGoals);
  }, [currentHealthGoals, currentLifestyleGoals]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          health_goals: healthGoals
            .split(",")
            .map(v => v.trim())
            .filter(v => v.length > 0),
          lifestyle_goals: lifestyleGoals
            .split(",")
            .map(v => v.trim())
            .filter(v => v.length > 0),
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Goals Updated",
        description: "Your goals have been saved successfully",
      });
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving goals:", error);
      toast({
        title: "Error",
        description: "Failed to save goals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-secondary/10 pb-4">
          <SheetTitle className="text-xl font-semibold text-secondary">Health & Lifestyle Goals</SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <Label htmlFor="healthGoals" className="text-foreground">Health Goals</Label>
            <Input
              id="healthGoals"
              value={healthGoals}
              onChange={(e) => setHealthGoals(e.target.value)}
              className="mt-2"
              placeholder="e.g., Lose weight, Build muscle, Improve sleep (comma-separated)"
            />
          </div>

          <div>
            <Label htmlFor="lifestyleGoals" className="text-foreground">Lifestyle Goals</Label>
            <Input
              id="lifestyleGoals"
              value={lifestyleGoals}
              onChange={(e) => setLifestyleGoals(e.target.value)}
              className="mt-2"
              placeholder="e.g., Reduce stress, Eat healthier, Exercise more (comma-separated)"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
