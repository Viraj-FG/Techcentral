import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useModularOnboarding } from "@/hooks/useModularOnboarding";

interface PetsOnboardingFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const PetsOnboardingForm = ({ onComplete, onCancel }: PetsOnboardingFormProps) => {
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [toxicMonitoring, setToxicMonitoring] = useState(true);
  const [loading, setLoading] = useState(false);
  const { completeModule } = useModularOnboarding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("pets")
        .insert({
          user_id: user.id,
          name: petName,
          species: species,
          breed: breed || null,
          age: age ? parseInt(age) : null,
          toxic_flags_enabled: toxicMonitoring,
        });

      if (error) throw error;

      await completeModule('pets');
      toast.success("Pet profile created!");
      onComplete();
    } catch (error) {
      console.error("Error saving pet profile:", error);
      toast.error("Failed to save pet profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="petName">Pet Name</Label>
        <Input
          id="petName"
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          placeholder="Buddy"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="species">Species</Label>
        <Select value={species} onValueChange={setSpecies} required>
          <SelectTrigger>
            <SelectValue placeholder="Select species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dog">Dog</SelectItem>
            <SelectItem value="cat">Cat</SelectItem>
            <SelectItem value="bird">Bird</SelectItem>
            <SelectItem value="rabbit">Rabbit</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="breed">Breed (optional)</Label>
        <Input
          id="breed"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          placeholder="Golden Retriever"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">Age (years, optional)</Label>
        <Input
          id="age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="3"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Toxic Food Monitoring</Label>
          <p className="text-xs text-muted-foreground">
            Get alerts when scanning toxic foods
          </p>
        </div>
        <Switch
          checked={toxicMonitoring}
          onCheckedChange={setToxicMonitoring}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !petName || !species} className="flex-1">
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};
