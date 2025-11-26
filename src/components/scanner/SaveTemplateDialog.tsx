import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookmarkPlus } from "lucide-react";

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  items: any[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
}

export const SaveTemplateDialog = ({
  open,
  onOpenChange,
  userId,
  items,
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  totalFiber,
}: SaveTemplateDialogProps) => {
  const [templateName, setTemplateName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("meal_templates").insert({
        user_id: userId,
        template_name: templateName,
        items,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        total_fiber: totalFiber,
      });

      if (error) throw error;
      toast.success("Template saved successfully");
      setTemplateName("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-primary" />
            Save as Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              placeholder="e.g., Breakfast Bowl, Protein Shake"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>

          <div className="glass-card p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items:</span>
              <span>{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Calories:</span>
              <span>{Math.round(totalCalories)} kcal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Macros:</span>
              <span>
                {Math.round(totalProtein)}g P • {Math.round(totalCarbs)}g C • {Math.round(totalFat)}g F
              </span>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving || !templateName.trim()}
            className="w-full"
          >
            {isSaving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
