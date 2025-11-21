import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface KaevaApertureProps {
  state: "idle" | "thinking" | "speaking";
  size?: "sm" | "md" | "lg";
  audioElement?: HTMLAudioElement | null;
}

const KaevaAperture = ({ state, size = "md", audioElement }: KaevaApertureProps) => {
  const [audioPulse, setAudioPulse] = useState(false);

  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32 sm:w-40 sm:h-40",
    lg: "w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56"
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
    <div className={`relative ${sizeClasses[size]} mx-auto`}>
      {/* Inner glow */}
      <div className="absolute inset-0 rounded-full bg-kaeva-sage/20 blur-2xl" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-kaeva-sage/40 to-kaeva-teal/40" />
      
      {/* IDLE: Slow breathing */}
      {state === 'idle' && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-kaeva-sage"
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
      
      {/* THINKING: Rapid pulsing with rotation */}
      {state === 'thinking' && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-kaeva-sage"
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
          className="absolute inset-0 rounded-full border-4 border-kaeva-sage"
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
