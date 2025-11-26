import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useModularOnboarding } from "@/hooks/useModularOnboarding";

interface BeautyOnboardingFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const BeautyOnboardingForm = ({ onComplete, onCancel }: BeautyOnboardingFormProps) => {
  const [skinType, setSkinType] = useState("");
  const [hairType, setHairType] = useState("");
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
          beauty_profile: {
            skinType: skinType || null,
            hairType: hairType || null,
          },
        })
        .eq("id", user.id);

      if (error) throw error;

      await completeModule('beauty');
      toast.success("Beauty profile saved!");
      onComplete();
    } catch (error) {
      console.error("Error saving beauty profile:", error);
      toast.error("Failed to save beauty profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="skin">Skin Type</Label>
        <Select value={skinType} onValueChange={setSkinType}>
          <SelectTrigger>
            <SelectValue placeholder="Select your skin type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dry">Dry</SelectItem>
            <SelectItem value="oily">Oily</SelectItem>
            <SelectItem value="combination">Combination</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="sensitive">Sensitive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hair">Hair Type</Label>
        <Select value={hairType} onValueChange={setHairType}>
          <SelectTrigger>
            <SelectValue placeholder="Select your hair type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="straight">Straight</SelectItem>
            <SelectItem value="wavy">Wavy</SelectItem>
            <SelectItem value="curly">Curly</SelectItem>
            <SelectItem value="coily">Coily</SelectItem>
          </SelectContent>
        </Select>
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
