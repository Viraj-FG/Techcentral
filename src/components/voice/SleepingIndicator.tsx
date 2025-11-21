import { motion } from "framer-motion";

interface SleepingIndicatorProps {
  isActive: boolean;
}

const SleepingIndicator = ({ isActive }: SleepingIndicatorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed top-6 right-6 z-40"
    >
      <div className="relative">
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-kaeva-sage/20 blur-xl"
          animate={{
            scale: isActive ? [1, 1.2, 1] : 1,
            opacity: isActive ? [0.3, 0.6, 0.3] : 0.2
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Core indicator */}
        <motion.div
          className="relative w-12 h-12 rounded-full bg-gradient-to-br from-kaeva-sage/40 to-kaeva-teal/40 border-2 border-kaeva-sage/50 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          animate={{
            scale: isActive ? [1, 1.05, 1] : 1
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <motion.div
            className="w-6 h-6 rounded-full bg-kaeva-sage/60"
            animate={{
              opacity: isActive ? [0.4, 0.8, 0.4] : 0.3
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 right-0 bg-kaeva-void/90 backdrop-blur-sm border border-kaeva-sage/30 rounded-lg px-3 py-2 text-xs text-kaeva-sage whitespace-nowrap pointer-events-none"
        >
          Say "Kaeva" to wake
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SleepingIndicator;
