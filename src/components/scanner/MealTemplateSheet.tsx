import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookmarkPlus, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";

interface MealTemplate {
  id: string;
  template_name: string;
  items: any[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  created_at: string;
}

interface MealTemplateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onLoadTemplate: (template: MealTemplate) => void;
}

export const MealTemplateSheet = ({
  open,
  onOpenChange,
  userId,
  onLoadTemplate,
}: MealTemplateSheetProps) => {
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("meal_templates")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates((data as MealTemplate[]) || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from("meal_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;
      toast.success("Template deleted");
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const handleLoadTemplate = (template: MealTemplate) => {
    onLoadTemplate(template);
    onOpenChange(false);
    toast.success(`Loaded "${template.template_name}"`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-primary" />
            Meal Templates
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3 mt-6">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <BookmarkPlus className="w-12 h-12 text-muted-foreground/50 mx-auto" />
              <p className="text-muted-foreground">No saved templates yet</p>
              <p className="text-sm text-muted-foreground">
                Save frequently eaten meals for quick logging
              </p>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="glass-card p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{template.template_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(template.created_at), "MMM d, yyyy")}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span>{Math.round(template.total_calories)} cal</span>
                  <span className="text-secondary">{Math.round(template.total_protein)}g P</span>
                  <span className="text-accent">{Math.round(template.total_carbs)}g C</span>
                  <span className="text-primary">{Math.round(template.total_fat)}g F</span>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => handleLoadTemplate(template)}
                >
                  Load Template
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
