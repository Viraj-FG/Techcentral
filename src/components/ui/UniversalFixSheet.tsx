import { useState } from "react";
import { Sparkles, Package, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HintCard } from "@/components/ui/HintCard";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

interface UniversalFixSheetProps {
  domain: 'nutrition' | 'product' | 'pet' | 'beauty';
  onSubmit: (correction: string) => void;
  currentData?: any;
  triggerLabel?: string;
}

const domainConfig = {
  nutrition: {
    title: "Fix this meal",
    hint: "e.g., My salad had no tomatoes",
    icon: Sparkles,
    placeholder: "What needs to be corrected?"
  },
  product: {
    title: "Fix product info",
    hint: "e.g., This is almond milk, not regular milk",
    icon: Package,
    placeholder: "What's incorrect about this product?"
  },
  pet: {
    title: "Fix pet details",
    hint: "e.g., She's a Golden Retriever, not a Lab",
    icon: PawPrint,
    placeholder: "What needs to be corrected?"
  },
  beauty: {
    title: "Fix product details",
    hint: "e.g., This is the mini size, not full size",
    icon: Sparkles,
    placeholder: "What's incorrect about this product?"
  }
};

export const UniversalFixSheet = ({
  domain,
  onSubmit,
  currentData,
  triggerLabel = "Fix Issue"
}: UniversalFixSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [correction, setCorrection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = domainConfig[domain];

  const handleSubmit = async () => {
    if (!correction.trim()) {
      toast.error("Please describe what needs to be fixed");
      return;
    }

    setIsSubmitting(true);
    haptics.impact();

    try {
      await onSubmit(correction);
      toast.success("Re-analyzing with your corrections...");
      setCorrection("");
      setIsOpen(false);
      haptics.success();
    } catch (error) {
      console.error("Fix submission error:", error);
      toast.error("Failed to submit correction");
      haptics.warning();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          {triggerLabel}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <config.icon size={20} className="text-primary" />
            {config.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Textarea
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            placeholder={config.placeholder}
            className="min-h-[120px] resize-none"
            autoFocus
          />

          <HintCard
            icon={config.icon}
            example={config.hint}
          />

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !correction.trim()}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? "Updating..." : "Update"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
