import { motion, AnimatePresence } from "framer-motion";

interface WakeWordIndicatorProps {
  isListening: boolean;
  isActivated: boolean;
}

export const WakeWordIndicator = ({ isListening, isActivated }: WakeWordIndicatorProps) => {
  return (
    <AnimatePresence>
      {isListening && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-24 right-4 z-40"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur border border-primary/20">
            <motion.div
              animate={{
                scale: isActivated ? [1, 1.5, 1] : 1,
                backgroundColor: isActivated ? "hsl(var(--primary))" : "hsl(var(--primary))",
              }}
              transition={{
                duration: 0.3,
              }}
              className="w-2 h-2 rounded-full bg-primary"
              style={{
                animation: !isActivated ? "pulse 2s ease-in-out infinite" : "none",
              }}
            />
            <span className="text-xs text-muted-foreground">
              {isActivated ? "Activated!" : 'Say "Kaeva"'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
