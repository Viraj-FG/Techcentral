import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useModularOnboarding } from "@/hooks/useModularOnboarding";

interface PantryOnboardingFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const PantryOnboardingForm = ({ onComplete, onCancel }: PantryOnboardingFormProps) => {
  const [preferredStore, setPreferredStore] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [organicPreference, setOrganicPreference] = useState(false);
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
          preferred_retailer_name: preferredStore || null,
          user_zip_code: zipCode || null,
          lifestyle_goals: organicPreference ? ['organic_preference'] : [],
        })
        .eq("id", user.id);

      if (error) throw error;

      await completeModule('pantry');
      toast.success("Pantry preferences saved!");
      onComplete();
    } catch (error) {
      console.error("Error saving pantry preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="store">Preferred Store</Label>
        <Select value={preferredStore} onValueChange={setPreferredStore}>
          <SelectTrigger>
            <SelectValue placeholder="Select your preferred store" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Whole Foods">Whole Foods</SelectItem>
            <SelectItem value="Trader Joe's">Trader Joe's</SelectItem>
            <SelectItem value="Safeway">Safeway</SelectItem>
            <SelectItem value="Kroger">Kroger</SelectItem>
            <SelectItem value="Target">Target</SelectItem>
            <SelectItem value="Walmart">Walmart</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zipCode">ZIP Code</Label>
        <Input
          id="zipCode"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
          placeholder="12345"
          maxLength={5}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Prefer Organic Products</Label>
          <p className="text-xs text-muted-foreground">
            We'll prioritize organic options when available
          </p>
        </div>
        <Switch
          checked={organicPreference}
          onCheckedChange={setOrganicPreference}
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
