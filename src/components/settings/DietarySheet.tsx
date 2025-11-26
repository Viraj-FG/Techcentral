import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DietarySheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentDietaryValues: string;
  currentAllergies: string;
  onSave: () => void;
}

export const DietarySheet = ({
  open,
  onClose,
  userId,
  currentDietaryValues,
  currentAllergies,
  onSave,
}: DietarySheetProps) => {
  const { toast } = useToast();
  const [dietaryValues, setDietaryValues] = useState(currentDietaryValues);
  const [allergies, setAllergies] = useState(currentAllergies);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDietaryValues(currentDietaryValues);
    setAllergies(currentAllergies);
  }, [currentDietaryValues, currentAllergies]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          dietary_preferences: dietaryValues
            .split(",")
            .map(v => v.trim())
            .filter(v => v.length > 0),
          allergies: allergies
            .split(",")
            .map(v => v.trim())
            .filter(v => v.length > 0),
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Dietary Preferences Updated",
        description: "Your preferences have been saved successfully",
      });
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving dietary preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
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
          <SheetTitle className="text-xl font-semibold text-secondary">Dietary Preferences</SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <Label htmlFor="dietaryValues" className="text-foreground">Dietary Values</Label>
            <Input
              id="dietaryValues"
              value={dietaryValues}
              onChange={(e) => setDietaryValues(e.target.value)}
              className="mt-2"
              placeholder="e.g., Vegan, Halal, Kosher (comma-separated)"
            />
          </div>

          <div>
            <Label htmlFor="allergies" className="text-foreground">Food Allergies</Label>
            <Input
              id="allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className="mt-2"
              placeholder="e.g., Nuts, Gluten, Dairy (comma-separated)"
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
