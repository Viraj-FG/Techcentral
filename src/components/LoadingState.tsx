import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  timeout?: number;
  onTimeout?: () => void;
  showProgress?: boolean;
  className?: string;
}

const LoadingState = ({
  message = "Loading...",
  timeout,
  onTimeout,
  showProgress = false,
  className,
}: LoadingStateProps) => {
  const [progress, setProgress] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!timeout) return;

    const timeoutId = setTimeout(() => {
      setTimedOut(true);
      if (onTimeout) {
        onTimeout();
      }
    }, timeout);

    // Update progress if showing progress bar
    if (showProgress) {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + (100 / (timeout / 100)), 95));
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        clearInterval(interval);
      };
    }

    return () => clearTimeout(timeoutId);
  }, [timeout, onTimeout, showProgress]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "flex flex-col items-center justify-center p-8",
        className
      )}
    >
      {/* Animated Kaeva Logo/Spinner */}
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
        className="mb-6"
      >
        <svg
          width="60"
          height="60"
          viewBox="0 0 100 100"
          className="w-12 h-12 sm:w-15 sm:h-15"
        >
          {/* K Shape with Viewfinder Aesthetic */}
          <path
            d="M 20 20 L 20 80 M 20 50 L 60 20 M 20 50 L 60 80 M 15 15 L 15 25 M 15 15 L 25 15 M 15 85 L 15 75 M 15 85 L 25 85 M 85 15 L 85 25 M 85 15 L 75 15 M 85 85 L 85 75 M 85 85 L 75 85"
            stroke="hsl(var(--kaeva-sage))"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Focus Dot */}
          <circle
            cx="50"
            cy="50"
            r="3"
            fill="hsl(var(--kaeva-sage))"
          />
        </svg>
      </motion.div>

      {/* Loading Message */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-white/80 text-sm mb-4"
      >
        {timedOut ? "This is taking longer than expected..." : message}
      </motion.p>

      {/* Progress Bar */}
      {showProgress && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.3 }}
          className="w-48 h-1 bg-white/10 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-kaeva-sage"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </motion.div>
      )}

      {/* Pulsing Dots */}
      <div className="flex gap-1 mt-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-kaeva-sage/50"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default LoadingState;
