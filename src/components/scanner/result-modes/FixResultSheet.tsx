import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface FixResultSheetProps {
  onSubmit: (correction: string) => void;
}

export const FixResultSheet = ({ onSubmit }: FixResultSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [correction, setCorrection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!correction.trim()) {
      toast.error("Please describe what needs to be fixed");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(correction);
      toast.success("Re-analyzing with your correction...");
      setCorrection("");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to process correction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Fix Issue
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="glass-card border-t border-white/10">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            What needs to be fixed?
          </SheetTitle>
          <SheetDescription>
            Describe what's incorrect and we'll re-analyze the meal
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <Textarea
            placeholder="e.g., My salad had no tomatoes"
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            className="min-h-[100px]"
          />

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Processing..." : "Re-analyze Meal"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
