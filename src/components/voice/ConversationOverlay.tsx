import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import KaevaAperture from "../KaevaAperture";
import { Button } from "../ui/button";

interface ConversationOverlayProps {
  isOpen: boolean;
  apertureState: "idle" | "wakeword" | "listening" | "thinking" | "speaking" | "acknowledged";
  audioAmplitude: number;
  userTranscript: string;
  aiTranscript: string;
  onClose: () => void;
}

const ConversationOverlay = ({
  isOpen,
  apertureState,
  audioAmplitude,
  userTranscript,
  aiTranscript,
  onClose
}: ConversationOverlayProps) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-lg"
      onClick={onClose}
    >
      {/* Content wrapper - prevent click propagation */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full h-full flex flex-col items-center justify-center p-8"
      >
        {/* Close button - 44px touch target */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-6 right-6 text-secondary hover:text-accent hover:bg-secondary/10 min-w-[44px] min-h-[44px]"
          aria-label="Close conversation"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Aperture */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          role="status"
          aria-live="polite"
          aria-label={`Voice assistant is ${apertureState}`}
        >
          <KaevaAperture
            state={apertureState}
            size="lg"
            audioAmplitude={audioAmplitude}
            audioElement={null}
            isDetectingSound={false}
          />
        </motion.div>

        {/* State indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center"
        >
          <p className="text-secondary text-sm font-medium tracking-wide uppercase">
            {apertureState === "listening" && "Listening..."}
            {apertureState === "thinking" && "Processing..."}
            {apertureState === "speaking" && "Speaking..."}
          </p>
        </motion.div>

        {/* Transcripts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 max-w-2xl w-full space-y-4"
        >
          <AnimatePresence mode="wait">
            {userTranscript && (
              <motion.div
                key="user"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-secondary/10 border border-secondary/20 rounded-lg p-4"
              >
                <p className="text-xs text-secondary/60 mb-1">You</p>
                <p className="text-foreground/90 text-sm">{userTranscript}</p>
              </motion.div>
            )}

            {aiTranscript && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-accent/10 border border-accent/20 rounded-lg p-4"
              >
                <p className="text-xs text-accent/60 mb-1">Kaeva</p>
                <p className="text-foreground/90 text-sm">{aiTranscript}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Hint text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-8 text-secondary/60 text-sm text-center"
        >
          Click anywhere or press ESC to close
        </motion.p>
      </div>
    </motion.div>
  );
};

export default ConversationOverlay;
