import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useModularOnboarding } from "@/hooks/useModularOnboarding";

interface HouseholdOnboardingFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const HouseholdOnboardingForm = ({ onComplete, onCancel }: HouseholdOnboardingFormProps) => {
  const [memberName, setMemberName] = useState("");
  const [memberType, setMemberType] = useState("");
  const [age, setAge] = useState("");
  const [allergies, setAllergies] = useState("");
  const [loading, setLoading] = useState(false);
  const { completeModule } = useModularOnboarding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const allergyList = allergies.split(',').map(a => a.trim()).filter(Boolean);

      const { error } = await supabase
        .from("household_members")
        .insert({
          user_id: user.id,
          name: memberName,
          member_type: memberType,
          age: age ? parseInt(age) : null,
          allergies: allergyList,
        });

      if (error) throw error;

      await completeModule('household');
      toast.success("Household member added!");
      onComplete();
    } catch (error) {
      console.error("Error saving household member:", error);
      toast.error("Failed to save household member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="memberName">Name</Label>
        <Input
          id="memberName"
          value={memberName}
          onChange={(e) => setMemberName(e.target.value)}
          placeholder="Family member name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="memberType">Type</Label>
        <Select value={memberType} onValueChange={setMemberType} required>
          <SelectTrigger>
            <SelectValue placeholder="Select member type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="adult">Adult</SelectItem>
            <SelectItem value="child">Child</SelectItem>
            <SelectItem value="toddler">Toddler</SelectItem>
            <SelectItem value="elderly">Elderly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">Age (optional)</Label>
        <Input
          id="age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="25"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="allergies">Allergies (comma-separated, optional)</Label>
        <Input
          id="allergies"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="peanuts, shellfish"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !memberName || !memberType} className="flex-1">
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};
