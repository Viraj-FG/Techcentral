import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceSubtitlesProps {
  userText: string;
  aiText: string;
}

const VoiceSubtitles = ({ userText, aiText }: VoiceSubtitlesProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (userText) {
      setDisplayedText(userText);
      setIsTyping(false);
    } else if (aiText) {
      // Typewriter effect for AI text
      setIsTyping(true);
      let currentIndex = 0;
      setDisplayedText("");

      const typeInterval = setInterval(() => {
        if (currentIndex < aiText.length) {
          setDisplayedText(aiText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typeInterval);
        }
      }, 30);

      return () => clearInterval(typeInterval);
    }
  }, [userText, aiText]);

  const hasContent = userText || aiText;

  return (
    <AnimatePresence>
      {hasContent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-3xl px-8"
        >
          <div className="glass-card p-6 text-center backdrop-blur-xl bg-white/5 border border-white/10">
            <p
              className={`text-base leading-relaxed ${
                userText ? "text-emerald-300" : "text-white"
              }`}
            >
              {displayedText}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block ml-1"
                >
                  ▋
                </motion.span>
              )}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoiceSubtitles;
