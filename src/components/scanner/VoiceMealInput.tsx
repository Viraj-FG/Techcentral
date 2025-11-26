import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceMealLog } from "@/hooks/useVoiceMealLog";
import { haptics } from "@/lib/haptics";

interface VoiceMealInputProps {
  onTranscript: (text: string) => void;
  onComplete: () => void;
  disabled?: boolean;
}

export const VoiceMealInput = ({ onTranscript, onComplete, disabled }: VoiceMealInputProps) => {
  const { isListening, transcript, startListening, stopListening, reset } = useVoiceMealLog();

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  const handleToggle = () => {
    if (disabled) return;
    
    if (isListening) {
      stopListening();
      haptics.selection();
      if (transcript) {
        onComplete();
      }
    } else {
      startListening();
      haptics.impact();
    }
  };

  const handleReset = () => {
    reset();
    haptics.selection();
  };

  return (
    <div className="space-y-4">
      {/* Voice Button */}
      <div className="flex items-center justify-center gap-3">
        <Button
          size="lg"
          onClick={handleToggle}
          disabled={disabled}
          className={`relative ${
            isListening
              ? "bg-destructive hover:bg-destructive/90"
              : "bg-primary hover:bg-primary/90"
          }`}
        >
          <motion.div
            animate={isListening ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </motion.div>
          <span className="ml-2">
            {isListening ? "Stop Listening" : "Voice Input"}
          </span>
        </Button>

        {transcript && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Listening Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <Loader2 className="w-4 h-4 animate-spin text-destructive" />
            <span>Listening...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript Display */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4"
          >
            <p className="text-sm text-muted-foreground mb-2">You said:</p>
            <p className="text-foreground">{transcript}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Suggestions */}
      {!isListening && !transcript && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-xs text-muted-foreground mb-2">Try saying:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "I ate eggs and toast",
              "Log breakfast",
              "Add 500 calories",
            ].map((suggestion, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-muted-foreground"
              >
                "{suggestion}"
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};