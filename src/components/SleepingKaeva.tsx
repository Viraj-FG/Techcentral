import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import KaevaAperture from "./KaevaAperture";

interface SleepingKaevaProps {
  onWake: () => void;
}

const SleepingKaeva = ({ onWake }: SleepingKaevaProps) => {
  const [isDetectingSound, setIsDetectingSound] = useState(false);
  const [recognitionRef, setRecognitionRef] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser");
      // Fallback: auto-wake after 3 seconds
      const timeout = setTimeout(onWake, 3000);
      return () => clearTimeout(timeout);
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('👂 Wake word detection started');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      console.log('🎤 Heard:', transcript);
      
      setIsDetectingSound(true);
      
      // Match both wake words
      if (transcript.includes('kaeva') || transcript.includes('hey kaeva')) {
        console.log('✨ Wake word detected! Stopping recognition...');
        setIsDetectingSound(false);
        try {
          recognition.stop();
        } catch (error) {
          console.error('Error stopping recognition:', error);
        }
        // Small delay to ensure cleanup before waking
        setTimeout(() => {
          onWake();
        }, 100);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('🔴 Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      console.log('👂 Wake word detection ended');
      setIsDetectingSound(false);
    };

    try {
      recognition.start();
      setRecognitionRef(recognition);
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }

    // Cleanup function
    return () => {
      console.log('🧹 Cleanup: Stopping wake word detection');
      setIsDetectingSound(false);
      try {
        if (recognition) {
          recognition.stop();
        }
      } catch (error) {
        console.error('Error stopping recognition on unmount:', error);
      }
    };
  }, [onWake]);

  return (
    <motion.div
      className="min-h-screen bg-kaeva-void flex flex-col items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <KaevaAperture state="wakeword" size="lg" isDetectingSound={isDetectingSound} />
      
      <motion.p
        className="mt-12 text-kaeva-slate-400 text-lg sm:text-xl tracking-wide text-center max-w-md"
        animate={{
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        Say "Kaeva" or "Hey Kaeva" to wake me
      </motion.p>
    </motion.div>
  );
};

export default SleepingKaeva;
