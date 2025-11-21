import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface KaevaApertureProps {
  state: "idle" | "wakeword" | "listening" | "thinking" | "speaking";
  size?: "sm" | "md" | "lg";
  audioElement?: HTMLAudioElement | null;
}

const KaevaAperture = ({ state, size = "md", audioElement }: KaevaApertureProps) => {
  const [audioPulse, setAudioPulse] = useState(false);

  const sizeClasses = {
    sm: "w-20 h-20 sm:w-24 sm:h-24",
    md: "w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40",
    lg: "w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56"
  };

  // Sync pulse with audio playback
  useEffect(() => {
    if (state !== 'speaking' || !audioElement) {
      setAudioPulse(false);
      return;
    }

    const pulseInterval = setInterval(() => {
      setAudioPulse(prev => !prev);
    }, 300);

    const handleEnded = () => {
      clearInterval(pulseInterval);
      setAudioPulse(false);
    };

    audioElement.addEventListener('ended', handleEnded);

    return () => {
      clearInterval(pulseInterval);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [state, audioElement]);

  return (
    <div className={`relative ${sizeClasses[size]} mx-auto`} style={{ willChange: 'transform', transform: 'translateZ(0)' }}>
      {/* Inner glow */}
      <div className="absolute inset-0 rounded-full bg-kaeva-sage/20 blur-lg sm:blur-xl md:blur-2xl" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-kaeva-sage/40 to-kaeva-teal/40" />
      
      {/* IDLE: Slow breathing */}
      {state === 'idle' && (
        <motion.div
          className="absolute inset-0 rounded-full border-3 sm:border-4 border-kaeva-sage"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* WAKE WORD: Subtle waiting pulse */}
      {state === 'wakeword' && (
        <motion.div
          className="absolute inset-0 rounded-full border-3 sm:border-4 border-kaeva-sage"
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            filter: 'drop-shadow(0 0 15px rgb(112 224 152 / 0.3))'
          }}
        />
      )}
      
      {/* LISTENING: Expanded glow */}
      {state === 'listening' && (
        <motion.div
          className="absolute inset-0 rounded-full border-3 sm:border-4 border-kaeva-sage"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 0.9, 0.7],
            rotate: [0, 360]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            filter: 'drop-shadow(0 0 20px rgb(112 224 152 / 0.6))'
          }}
        />
      )}
      
      {/* THINKING: Rapid pulsing with rotation */}
      {state === 'thinking' && (
        <motion.div
          className="absolute inset-0 rounded-full border-3 sm:border-4 border-kaeva-sage"
          animate={{
            scale: [1, 1.15, 1, 1.1, 1],
            rotate: [0, 5, -5, 3, 0],
            opacity: [0.8, 1, 0.8, 1, 0.8]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity
          }}
        />
      )}
      
      {/* SPEAKING: Rapid vibration synced to audio */}
      {state === 'speaking' && (
        <motion.div
          className="absolute inset-0 rounded-full border-3 sm:border-4 border-kaeva-sage"
          animate={{
            scale: audioPulse ? 1.2 : 1,
            opacity: audioPulse ? 1 : 0.7
          }}
          transition={{
            duration: 0.15
          }}
        />
      )}
      
      {/* Center core */}
      <div className="absolute inset-[30%] rounded-full bg-kaeva-void border-2 border-kaeva-sage/50" />
    </div>
  );
};

export default KaevaAperture;
