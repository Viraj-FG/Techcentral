import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useModularOnboarding } from "@/hooks/useModularOnboarding";

interface CoreOnboardingFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const CoreOnboardingForm = ({ onComplete, onCancel }: CoreOnboardingFormProps) => {
  const [name, setName] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const { completeModule } = useModularOnboarding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          user_name: name,
          health_goals: primaryGoal ? [primaryGoal] : [],
        })
        .eq("id", user.id);

      if (error) throw error;

      await completeModule('core');
      toast.success("Profile updated!");
      onComplete();
    } catch (error) {
      console.error("Error saving core profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">What's your name?</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal">What brings you to Kaeva?</Label>
        <Select value={primaryGoal} onValueChange={setPrimaryGoal}>
          <SelectTrigger>
            <SelectValue placeholder="Select your primary goal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weight_loss">Lose weight</SelectItem>
            <SelectItem value="muscle_gain">Build muscle</SelectItem>
            <SelectItem value="healthy_eating">Eat healthier</SelectItem>
            <SelectItem value="meal_planning">Simplify meal planning</SelectItem>
            <SelectItem value="reduce_waste">Reduce food waste</SelectItem>
            <SelectItem value="save_money">Save money on groceries</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !name} className="flex-1">
          {loading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </form>
  );
};
