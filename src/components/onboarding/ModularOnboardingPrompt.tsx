import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingModule } from "@/hooks/useModularOnboarding";

interface ModularOnboardingPromptProps {
  open: boolean;
  module: OnboardingModule;
  message: string;
  onStart: () => void;
  onDismiss: () => void;
}

export const ModularOnboardingPrompt = ({
  open,
  module,
  message,
  onStart,
  onDismiss,
}: ModularOnboardingPromptProps) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md"
        >
          <div className="relative bg-background/95 backdrop-blur-xl border border-primary/20 rounded-2xl p-5 shadow-lg shadow-primary/10">
            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>

              <div className="flex-1 space-y-3">
                <p className="text-sm text-foreground/90">{message}</p>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={onStart}
                    size="sm"
                    className="bg-primary text-background hover:bg-primary/90"
                  >
                    Let's Go! (30s)
                  </Button>
                  <Button
                    onClick={onDismiss}
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
