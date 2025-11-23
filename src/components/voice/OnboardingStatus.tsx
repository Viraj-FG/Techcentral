import { motion, AnimatePresence } from "framer-motion";
import { Mic, Brain, Volume2 } from "lucide-react";

type ApertureState = "idle" | "wakeword" | "listening" | "thinking" | "speaking";

interface OnboardingStatusProps {
  apertureState: ApertureState;
}

const OnboardingStatus = ({ apertureState }: OnboardingStatusProps) => {
  return (
    <AnimatePresence mode="wait">
      {apertureState === "listening" && (
        <motion.div
          key="listening"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mt-6 sm:mt-8 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-3 rounded-full bg-primary/20"
          >
            <Mic className="w-5 h-5 text-primary" />
          </motion.div>
          <p className="text-primary text-xs sm:text-sm tracking-widest font-medium">
            LISTENING
          </p>
          <p className="text-muted-foreground text-xs">Speak now...</p>
        </motion.div>
      )}
      
      {apertureState === "thinking" && (
        <motion.div
          key="thinking"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mt-6 sm:mt-8 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="p-3 rounded-full bg-accent/20"
          >
            <Brain className="w-5 h-5 text-accent" />
          </motion.div>
          <p className="text-accent text-xs sm:text-sm tracking-widest font-medium">
            PROCESSING
          </p>
          <p className="text-muted-foreground text-xs">Analyzing your response...</p>
        </motion.div>
      )}
      
      {apertureState === "speaking" && (
        <motion.div
          key="speaking"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mt-6 sm:mt-8 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="p-3 rounded-full bg-secondary/20"
          >
            <Volume2 className="w-5 h-5 text-secondary-foreground" />
          </motion.div>
          <p className="text-secondary-foreground text-xs sm:text-sm tracking-widest font-medium">
            SPEAKING
          </p>
          <p className="text-muted-foreground text-xs">Kaeva is responding...</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingStatus;
