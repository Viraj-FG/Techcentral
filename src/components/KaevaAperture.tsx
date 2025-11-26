import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface KaevaApertureProps {
  state: "idle" | "wakeword" | "listening" | "thinking" | "speaking" | "acknowledged";
  size?: "sm" | "md" | "lg";
  audioAmplitude?: number;
  audioElement?: HTMLAudioElement | null;
  isDetectingSound?: boolean;
}

const KaevaAperture = ({ state, size = "md", audioAmplitude = 0, audioElement, isDetectingSound = false }: KaevaApertureProps) => {
  const [audioPulse, setAudioPulse] = useState(false);

  const sizeClasses = {
    sm: "w-16 h-16 sm:w-18 sm:h-18",
    md: "w-20 h-20 sm:w-24 sm:h-24",
    lg: "w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32"
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
    <div className={`relative ${sizeClasses[size]} mx-auto aspect-square`} style={{ willChange: 'transform', transform: 'translateZ(0)' }}>
      {/* Outer ambient glow */}
      <div className="absolute -inset-2 rounded-full bg-primary/10 blur-xl" />
      
      {/* Secondary glow layer */}
      <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/30 via-transparent to-primary/20 blur-lg" />
      
      {/* Main gradient background */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-primary/15 to-primary/25" />
      
      {/* Rotating accent ring (always visible, subtle) */}
      <motion.div
        className="absolute -inset-1 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(214, 158, 46, 0.3) 25%, transparent 50%, rgba(214, 158, 46, 0.2) 75%, transparent 100%)',
        }}
      />
      
      {/* IDLE: Slow breathing with double ring */}
      {state === 'idle' && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              border: '3px solid transparent',
              backgroundImage: 'linear-gradient(hsl(222 47% 11%), hsl(222 47% 11%)), linear-gradient(135deg, hsl(40 66% 51%) 0%, hsl(40 66% 61%) 50%, hsl(40 66% 41%) 100%)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              filter: 'drop-shadow(0 0 20px rgba(214, 158, 46, 0.4)) drop-shadow(0 0 40px rgba(214, 158, 46, 0.2))'
            }}
          />
          {/* Inner accent ring */}
          <motion.div
            className="absolute inset-[8%] rounded-full border border-primary/30"
            animate={{
              scale: [1, 1.02, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
        </>
      )}
      
      {/* WAKE WORD: Subtle waiting pulse */}
      {state === 'wakeword' && !isDetectingSound && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full"
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
              border: '3px solid transparent',
              backgroundImage: 'linear-gradient(hsl(222 47% 11%), hsl(222 47% 11%)), linear-gradient(135deg, hsl(40 66% 51%) 0%, hsl(40 66% 51%) 100%)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              filter: 'drop-shadow(0 0 15px rgba(214, 158, 46, 0.3))'
            }}
          />
          <motion.div
            className="absolute inset-[8%] rounded-full border border-primary/20"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3
            }}
          />
        </>
      )}
      
      {/* WAKE WORD + SOUND DETECTED: Active pulse with particles effect */}
      {state === 'wakeword' && isDetectingSound && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              scale: [1, 1.15, 1.05],
              opacity: [0.6, 1, 0.8]
            }}
            transition={{
              duration: 0.4,
              repeat: Infinity,
              ease: "easeOut"
            }}
            style={{
              border: '4px solid transparent',
              backgroundImage: 'linear-gradient(hsl(222 47% 11%), hsl(222 47% 11%)), linear-gradient(135deg, hsl(40 66% 61%) 0%, hsl(40 80% 55%) 50%, hsl(40 66% 51%) 100%)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              filter: 'drop-shadow(0 0 25px rgba(214, 158, 46, 0.8)) drop-shadow(0 0 50px rgba(214, 158, 46, 0.4))'
            }}
          />
          {/* Ripple effect */}
          <motion.div
            className="absolute -inset-2 rounded-full border-2 border-primary/50"
            animate={{
              scale: [1, 1.3],
              opacity: [0.5, 0]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        </>
      )}
      
      {/* LISTENING: Reactive to user voice amplitude with dynamic rings */}
      {state === 'listening' && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              scale: [1, 1 + (audioAmplitude / 200), 1],
              opacity: [0.6, 0.8 + (audioAmplitude / 500), 0.6]
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut"
            }}
            style={{
              border: '4px solid transparent',
              backgroundImage: 'linear-gradient(hsl(222 47% 11%), hsl(222 47% 11%)), linear-gradient(135deg, hsl(40 66% 51%) 0%, hsl(142 70% 66%) 50%, hsl(40 66% 51%) 100%)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              filter: `drop-shadow(0 0 ${Math.max(15, audioAmplitude / 3)}px rgba(214, 158, 46, ${Math.min(0.9, 0.4 + audioAmplitude / 500)})) drop-shadow(0 0 ${Math.max(30, audioAmplitude / 2)}px rgba(214, 158, 46, 0.3))`
            }}
          />
          {/* Audio reactive inner ring */}
          <motion.div
            className="absolute inset-[6%] rounded-full"
            animate={{
              scale: [1, 1 + (audioAmplitude / 300), 1],
              opacity: [0.3, 0.5 + (audioAmplitude / 400), 0.3]
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut"
            }}
            style={{
              border: '2px solid rgba(214, 158, 46, 0.4)',
            }}
          />
          {/* Rotating indicator */}
          <motion.div
            className="absolute -inset-1 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, rgba(142, 205, 170, 0.6) 10%, transparent 20%)',
            }}
          />
        </>
      )}
      
      {/* THINKING: Rapid pulsing with multi-layer rotation */}
      {state === 'thinking' && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              scale: [1, 1.15, 1, 1.1, 1],
              opacity: [0.8, 1, 0.8, 1, 0.8]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity
            }}
            style={{
              border: '4px solid transparent',
              backgroundImage: 'linear-gradient(hsl(222 47% 11%), hsl(222 47% 11%)), linear-gradient(135deg, hsl(40 66% 51%) 0%, hsl(199 95% 60%) 50%, hsl(40 66% 51%) 100%)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              filter: 'drop-shadow(0 0 20px rgba(214, 158, 46, 0.6)) drop-shadow(0 0 40px rgba(83, 189, 235, 0.3))'
            }}
          />
          {/* Fast spinning indicator */}
          <motion.div
            className="absolute -inset-1 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, rgba(83, 189, 235, 0.8) 15%, transparent 30%, rgba(214, 158, 46, 0.8) 45%, transparent 60%)',
            }}
          />
          {/* Inner pulsing ring */}
          <motion.div
            className="absolute inset-[8%] rounded-full border-2 border-accent/40"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity
            }}
          />
        </>
      )}
      
      {/* ACKNOWLEDGED: Quick pulse with flash effect */}
      {state === 'acknowledged' && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{
              duration: 0.2,
              ease: "easeOut"
            }}
            style={{
              border: '4px solid transparent',
              backgroundImage: 'linear-gradient(hsl(222 47% 11%), hsl(222 47% 11%)), linear-gradient(135deg, hsl(40 66% 61%) 0%, hsl(40 80% 65%) 50%, hsl(40 66% 51%) 100%)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              filter: 'drop-shadow(0 0 25px rgba(214, 158, 46, 0.8)) drop-shadow(0 0 50px rgba(214, 158, 46, 0.5))'
            }}
          />
          {/* Flash ring */}
          <motion.div
            className="absolute -inset-3 rounded-full border-2 border-primary"
            initial={{ scale: 0.9, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{
              duration: 0.4,
              ease: "easeOut"
            }}
          />
        </>
      )}

      {/* SPEAKING: Energetic pulse with wave rings */}
      {state === 'speaking' && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              scale: [1, 1.2, 1.08, 1.25, 1],
              opacity: [0.8, 1, 0.9, 1, 0.8]
            }}
            transition={{
              duration: 0.4,
              repeat: Infinity,
              ease: "easeOut"
            }}
            style={{
              border: '4px solid transparent',
              backgroundImage: 'linear-gradient(hsl(222 47% 11%), hsl(222 47% 11%)), linear-gradient(135deg, hsl(40 80% 55%) 0%, hsl(40 90% 60%) 50%, hsl(40 70% 50%) 100%)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              filter: 'drop-shadow(0 0 30px rgba(214, 158, 46, 0.9)) drop-shadow(0 0 60px rgba(214, 158, 46, 0.5))'
            }}
          />
          {/* Voice wave rings */}
          <motion.div
            className="absolute -inset-2 rounded-full border border-primary/60"
            animate={{
              scale: [1, 1.4],
              opacity: [0.6, 0]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
          <motion.div
            className="absolute -inset-2 rounded-full border border-primary/40"
            animate={{
              scale: [1, 1.4],
              opacity: [0.4, 0]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.2
            }}
          />
          {/* Inner energy ring */}
          <motion.div
            className="absolute inset-[6%] rounded-full border-2 border-primary/50"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 0.3,
              repeat: Infinity
            }}
          />
        </>
      )}
      
      {/* Center core with gradient */}
      <div 
        className="absolute inset-[28%] rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, hsl(222 47% 15%), hsl(222 47% 11%) 60%, hsl(222 47% 8%))',
          border: '2px solid rgba(214, 158, 46, 0.4)',
          boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5), inset 0 -2px 10px rgba(214, 158, 46, 0.1)'
        }}
      />
      
      {/* Center highlight dot */}
      <motion.div 
        className="absolute inset-[42%] rounded-full bg-primary/20"
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};

export default KaevaAperture;
