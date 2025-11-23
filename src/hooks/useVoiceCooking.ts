import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceCookingCallbacks {
  onNext: () => void;
  onPrevious: () => void;
  onRepeat: () => void;
  onTimer: (minutes: number) => void;
}

export const useVoiceCooking = ({
  onNext,
  onPrevious,
  onRepeat,
  onTimer,
}: VoiceCookingCallbacks) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.toLowerCase().trim();
        
        console.log('Voice command:', transcript);
        handleVoiceCommand(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Restart if no speech detected
          if (isListening && recognitionRef.current) {
            recognitionRef.current.start();
          }
        }
      };

      recognitionRef.current.onend = () => {
        // Auto-restart if still supposed to be listening
        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Error restarting recognition:', e);
          }
        }
      };
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleVoiceCommand = (transcript: string) => {
    // Next step
    if (transcript.includes('next') || transcript.includes('continue')) {
      onNext();
      return;
    }

    // Previous step
    if (transcript.includes('previous') || transcript.includes('back') || transcript.includes('go back')) {
      onPrevious();
      return;
    }

    // Repeat
    if (transcript.includes('repeat') || transcript.includes('again') || transcript.includes('say that again')) {
      onRepeat();
      return;
    }

    // Timer commands
    const timerMatch = transcript.match(/timer\s+(\d+)/i) || 
                       transcript.match(/set\s+timer\s+(\d+)/i) ||
                       transcript.match(/(\d+)\s+minute/i);
    
    if (timerMatch && timerMatch[1]) {
      const minutes = parseInt(timerMatch[1], 10);
      if (!isNaN(minutes) && minutes > 0 && minutes <= 120) {
        onTimer(minutes);
      }
      return;
    }
  };

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Error starting recognition:', e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const speak = useCallback((text: string) => {
    if (synthRef.current) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      synthRef.current.speak(utterance);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
};
