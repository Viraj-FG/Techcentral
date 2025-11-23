import { motion, AnimatePresence } from "framer-motion";
import { Leaf, PawPrint, Sparkles } from "lucide-react";

interface KeywordFeedbackProps {
  detectedKeywords: string[];
}

const KeywordFeedback = ({ detectedKeywords }: KeywordFeedbackProps) => {
  if (detectedKeywords.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mt-8 flex gap-4"
      >
        {detectedKeywords.includes("vegan") && (
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 0.6 }}
            className="p-3 rounded-full bg-emerald-400/20 backdrop-blur-sm border border-emerald-400/30"
          >
            <Leaf className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
          </motion.div>
        )}
        
        {(detectedKeywords.includes("dog") || detectedKeywords.includes("cat")) && (
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 0.6 }}
            className="p-3 rounded-full bg-sky-400/20 backdrop-blur-sm border border-sky-400/30"
          >
            <PawPrint className="w-6 h-6 text-sky-400" strokeWidth={1.5} />
          </motion.div>
        )}
        
        {detectedKeywords.includes("beauty") && (
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 0.6 }}
            className="p-3 rounded-full bg-orange-400/20 backdrop-blur-sm border border-orange-400/30"
          >
            <Sparkles className="w-6 h-6 text-orange-400" strokeWidth={1.5} />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default KeywordFeedback;
