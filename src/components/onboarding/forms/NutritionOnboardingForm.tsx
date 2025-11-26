import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useModularOnboarding } from "@/hooks/useModularOnboarding";
import { calculateTDEE } from "@/lib/tdeeCalculator";

interface NutritionOnboardingFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const NutritionOnboardingForm = ({ onComplete, onCancel }: NutritionOnboardingFormProps) => {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [allergies, setAllergies] = useState("");
  const [dietary, setDietary] = useState("");
  const [loading, setLoading] = useState(false);
  const { completeModule } = useModularOnboarding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const tdee = calculateTDEE({
        age: parseInt(age),
        weight: parseFloat(weight),
        height: parseFloat(height),
        gender: gender as 'male' | 'female' | 'other',
        activityLevel: activityLevel as any,
      });

      const allergyList = allergies.split(',').map(a => a.trim()).filter(Boolean);
      const dietaryList = dietary.split(',').map(d => d.trim()).filter(Boolean);

      const { error } = await supabase
        .from("profiles")
        .update({
          user_age: parseInt(age),
          user_gender: gender,
          user_weight: parseFloat(weight),
          user_height: parseFloat(height),
          user_activity_level: activityLevel,
          calculated_tdee: tdee,
          allergies: allergyList,
          dietary_preferences: dietaryList,
        })
        .eq("id", user.id);

      if (error) throw error;

      await completeModule('nutrition');
      toast.success("Nutrition profile saved!");
      onComplete();
    } catch (error) {
      console.error("Error saving nutrition profile:", error);
      toast.error("Failed to save nutrition profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="25"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={gender} onValueChange={setGender} required>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="70"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="175"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="activity">Activity Level</Label>
        <Select value={activityLevel} onValueChange={setActivityLevel} required>
          <SelectTrigger>
            <SelectValue placeholder="Select activity level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
            <SelectItem value="light">Light (1-3 days/week)</SelectItem>
            <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
            <SelectItem value="active">Active (6-7 days/week)</SelectItem>
            <SelectItem value="very_active">Very Active (2x/day)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="allergies">Allergies (comma-separated)</Label>
        <Input
          id="allergies"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="peanuts, shellfish"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dietary">Dietary Preferences (comma-separated)</Label>
        <Input
          id="dietary"
          value={dietary}
          onChange={(e) => setDietary(e.target.value)}
          placeholder="vegetarian, gluten-free"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};
