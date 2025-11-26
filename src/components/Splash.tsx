import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ValuePropCarousel from "./ValuePropCarousel";

interface SplashProps {
  onComplete: () => void;
}

const Splash = ({ onComplete }: SplashProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [showValueProps, setShowValueProps] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    setShowSplash(false);
    setTimeout(() => setShowValueProps(true), 800);
  };

  const handleValuePropsComplete = () => {
    setShowValueProps(false);
    setTimeout(onComplete, 300);
  };

  return (
    <>
      {showValueProps && <ValuePropCarousel onComplete={handleValuePropsComplete} />}
      
      <AnimatePresence>
        {showSplash && (
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "-100%" }}
          transition={{ duration: 0.8, ease: "easeIn" }}
          className="fixed inset-0 bg-background overflow-hidden flex items-center justify-center z-50 pb-safe pt-safe"
        >
          {/* Atmospheric Orb 1 - Top-Left Sage Green */}
          <motion.div
            className="absolute -top-10 -left-10 sm:-top-24 sm:-left-24 md:-top-32 md:-left-32 lg:-top-40 lg:-left-40 w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 bg-secondary rounded-full blur-[50px] sm:blur-[60px] md:blur-[80px] lg:blur-[100px]"
            animate={{
              x: [-10, 10, -10],
              y: [-10, 10, -10],
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
            className="absolute -bottom-10 -right-10 sm:-bottom-24 sm:-right-24 md:-bottom-32 md:-right-32 lg:-bottom-40 lg:-right-40 w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-accent rounded-full blur-[50px] sm:blur-[60px] md:blur-[80px] lg:blur-[100px]"
            animate={{
              x: [10, -10, 10],
              y: [10, -10, 10],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              x: { duration: 10, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 10, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }}
          />

          {/* Main Content Container */}
          <div className="relative z-10 flex flex-col items-center gap-10 sm:gap-12 md:gap-16">
            {/* Logo Construction */}
            <div className="flex flex-col items-center gap-8">
              <svg
                width="100"
                height="100"
                viewBox="0 0 100 100"
                className="sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] lg:w-[160px] lg:h-[160px]"
              >
                {/* K Shape with Viewfinder Aesthetic */}
                <motion.path
                  d="M 20 20 L 20 80 M 20 50 L 60 20 M 20 50 L 60 80 M 15 15 L 15 25 M 15 15 L 25 15 M 15 85 L 15 75 M 15 85 L 25 85 M 85 15 L 85 25 M 85 15 L 75 15 M 85 85 L 85 75 M 85 85 L 75 85"
                  stroke="hsl(var(--secondary))"
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
                  fill="hsl(var(--secondary))"
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
                      className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-premium"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </div>

                {/* Subtitle */}
                <div className="flex gap-2 text-muted-foreground text-xs sm:text-sm md:text-base tracking-ultra-wide">
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
                className="group relative px-10 py-4 sm:px-12 sm:py-5 bg-secondary/90 border-2 border-secondary backdrop-blur-md rounded-full text-background tracking-wide text-base sm:text-lg font-bold overflow-hidden transition-all hover:bg-secondary hover:scale-105 shadow-lg shadow-secondary/50 min-h-[48px]"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
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
    </>
  );
};

export default Splash;
