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
          className="fixed bottom-28 left-4 right-4 z-40 max-w-md mx-auto"
        >
          <div className="relative bg-background/95 backdrop-blur-xl border border-primary/20 rounded-2xl p-4 shadow-lg shadow-primary/10">
            <button
              onClick={onDismiss}
              className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3 pr-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm text-foreground/90 leading-snug">{message}</p>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={onStart}
                    size="sm"
                    className="bg-primary text-background hover:bg-primary/90 text-xs px-3 h-8"
                  >
                    Let's Go! (30s)
                  </Button>
                  <Button
                    onClick={onDismiss}
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground text-xs px-3 h-8"
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
