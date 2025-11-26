import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BeautySheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentSkinType: string;
  currentHairType: string;
  onSave: () => void;
}

export const BeautySheet = ({
  open,
  onClose,
  userId,
  currentSkinType,
  currentHairType,
  onSave,
}: BeautySheetProps) => {
  const { toast } = useToast();
  const [skinType, setSkinType] = useState(currentSkinType);
  const [hairType, setHairType] = useState(currentHairType);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSkinType(currentSkinType);
    setHairType(currentHairType);
  }, [currentSkinType, currentHairType]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          beauty_profile: {
            skinType: skinType || null,
            hairType: hairType || null,
          },
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Beauty Profile Updated",
        description: "Your preferences have been saved successfully",
      });
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving beauty profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
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
          <SheetTitle className="text-xl font-semibold text-secondary">Beauty Profile</SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <Label htmlFor="skinType" className="text-foreground">Skin Type</Label>
            <Input
              id="skinType"
              value={skinType}
              onChange={(e) => setSkinType(e.target.value)}
              className="mt-2"
              placeholder="e.g., Dry, Oily, Combination, Sensitive"
            />
          </div>

          <div>
            <Label htmlFor="hairType" className="text-foreground">Hair Type</Label>
            <Input
              id="hairType"
              value={hairType}
              onChange={(e) => setHairType(e.target.value)}
              className="mt-2"
              placeholder="e.g., Straight, Wavy, Curly, Coily"
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
