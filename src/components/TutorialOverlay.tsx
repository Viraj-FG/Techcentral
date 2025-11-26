import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Mic, Sparkles, Volume2 } from "lucide-react";

interface TutorialOverlayProps {
  isOpen: boolean;
  onDismiss: () => void;
}

const TutorialOverlay = ({ isOpen, onDismiss }: TutorialOverlayProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative max-w-lg w-full bg-gradient-to-br from-background to-background/80 border border-secondary/20 rounded-2xl p-6 sm:p-8 shadow-2xl"
          >
            {/* Decorative glow */}
            <div className="absolute inset-0 rounded-2xl bg-secondary/5 blur-xl" />
            
            <div className="relative z-10">
              {/* Header */}
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="p-3 bg-secondary/10 rounded-full">
                  <Sparkles className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-secondary">
                  Welcome to Kaeva
                </h2>
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-4 mb-8"
              >
                <p className="text-secondary/80 text-sm sm:text-base leading-relaxed">
                  Kaeva is your voice-powered AI companion. Here's how to interact:
                </p>

                <div className="space-y-3">
                  {/* Wake Word */}
                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-start gap-3 p-3 bg-secondary/5 rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <Mic className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-secondary font-semibold text-sm sm:text-base mb-1">
                        Wake Word Activation
                      </h3>
                      <p className="text-secondary/70 text-xs sm:text-sm">
                        Say <span className="font-bold text-secondary">"Hey Kaeva"</span> to activate. 
                        Kaeva will pulse when she hears you.
                      </p>
                    </div>
                  </motion.div>

                  {/* Always Listening */}
                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-start gap-3 p-3 bg-secondary/5 rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <Volume2 className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-secondary font-semibold text-sm sm:text-base mb-1">
                        Always Listening
                      </h3>
                      <p className="text-secondary/70 text-xs sm:text-sm">
                        After activation, Kaeva stays active for your conversation. 
                        After 10 seconds of silence, she returns to wake word mode.
                      </p>
                    </div>
                  </motion.div>
                </div>

                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-secondary/60 text-xs sm:text-sm italic pt-2"
                >
                  Tip: Speak naturally and pause briefly when you're done speaking.
                </motion.p>
              </motion.div>

              {/* Button */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  onClick={onDismiss}
                  className="w-full bg-secondary hover:bg-secondary/90 text-background font-semibold py-3 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  Got it!
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TutorialOverlay;
