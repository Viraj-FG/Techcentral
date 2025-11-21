import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashProps {
  onComplete: () => void;
}

const Splash = ({ onComplete }: SplashProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    setShowSplash(false);
    setTimeout(onComplete, 800);
  };

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "-100%" }}
          transition={{ duration: 0.8, ease: "easeIn" }}
          className="fixed inset-0 bg-kaeva-void overflow-hidden flex items-center justify-center z-50"
        >
          {/* Atmospheric Orb 1 - Top-Left Sage Green */}
          <motion.div
            className="absolute -top-40 -left-40 w-80 h-80 bg-kaeva-sage rounded-full blur-[100px]"
            animate={{
              x: [-20, 20, -20],
              y: [-20, 20, -20],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              x: { duration: 8, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            }}
          />

          {/* Atmospheric Orb 2 - Bottom-Right Teal */}
          <motion.div
            className="absolute -bottom-40 -right-40 w-96 h-96 bg-kaeva-teal rounded-full blur-[100px]"
            animate={{
              x: [20, -20, 20],
              y: [20, -20, 20],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              x: { duration: 10, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 10, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }}
          />

          {/* Main Content Container */}
          <div className="relative z-10 flex flex-col items-center gap-16">
            {/* Logo Construction */}
            <div className="flex flex-col items-center gap-8">
              <svg
                width="120"
                height="120"
                viewBox="0 0 100 100"
                className="sm:w-[140px] sm:h-[140px]"
              >
                {/* K Shape with Viewfinder Aesthetic */}
                <motion.path
                  d="M 20 20 L 20 80 M 20 50 L 60 20 M 20 50 L 60 80 M 15 15 L 15 25 M 15 15 L 25 15 M 15 85 L 15 75 M 15 85 L 25 85 M 85 15 L 85 25 M 85 15 L 75 15 M 85 85 L 85 75 M 85 85 L 75 85"
                  stroke="hsl(var(--kaeva-sage))"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                
                {/* Focus Dot */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="3"
                  fill="hsl(var(--kaeva-sage))"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    delay: 1.6, 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 15 
                  }}
                />
              </svg>

              {/* KAEVA Typography */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.6 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="flex">
                  {["K", "A", "E", "V", "A"].map((letter, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: 1.8 + index * 0.1, 
                        duration: 0.4 
                      }}
                      className="text-5xl sm:text-6xl font-bold text-white tracking-premium"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </div>

                {/* Subtitle */}
                <div className="flex gap-2 text-kaeva-slate-400 text-sm tracking-ultra-wide">
                  {["SCAN.", "PLAN.", "LIVE."].map((word, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.3 + index * 0.3, duration: 0.4 }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Initialize Button */}
            {!isLoading && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                onClick={handleGetStarted}
                className="group relative px-8 py-3 bg-white/5 border border-white/10 backdrop-blur-md rounded-full text-white tracking-wide text-sm font-medium overflow-hidden transition-all hover:bg-white/10"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "200%" }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
                <span className="relative z-10">Get Started</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Splash;
