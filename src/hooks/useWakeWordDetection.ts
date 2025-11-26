import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWakeWordDetectionOptions {
  keywords?: string[];
  onActivated?: () => void;
  enabled?: boolean;
  threshold?: number;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const useWakeWordDetection = ({
  keywords = ['kaeva', 'hey kaeva', 'hi kaeva', 'ok kaeva'],
  onActivated,
  enabled = true,
  threshold = 0.7,
}: UseWakeWordDetectionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [lastDetectedAt, setLastDetectedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const lastActivationRef = useRef<number>(0);
  const DEBOUNCE_MS = 3000;

  const levenshteinDistance = (a: string, b: string): number => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  const similarity = (a: string, b: string): number => {
    const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
    const maxLength = Math.max(a.length, b.length);
    return 1 - distance / maxLength;
  };

  const checkForWakeWord = useCallback((transcript: string) => {
    const now = Date.now();
    if (now - lastActivationRef.current < DEBOUNCE_MS) {
      return false;
    }

    const transcriptLower = transcript.toLowerCase();
    
    for (const keyword of keywords) {
      if (transcriptLower.includes(keyword)) {
        return true;
      }
      
      // Fuzzy matching
      const sim = similarity(transcriptLower, keyword);
      if (sim >= threshold) {
        return true;
      }
    }
    
    return false;
  }, [keywords, threshold]);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Speech recognition not supported');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        
        if (checkForWakeWord(transcript)) {
          setIsActivated(true);
          setLastDetectedAt(new Date());
          lastActivationRef.current = Date.now();
          
          if (onActivated) {
            onActivated();
          }

          // Reset after activation
          setTimeout(() => setIsActivated(false), 2000);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setError('Microphone access denied');
          setIsListening(false);
        } else if (event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Auto-restart if still enabled
        if (enabled) {
          setTimeout(() => {
            if (recognitionRef.current && enabled) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error('Failed to restart recognition:', e);
              }
            }
          }, 100);
        }
      };

      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting wake word detection:', err);
      setError('Failed to start wake word detection');
    }
  }, [enabled, checkForWakeWord, onActivated]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [enabled, startListening, stopListening]);

  return {
    isListening,
    isActivated,
    lastDetectedAt,
    error,
    startListening,
    stopListening,
  };
};
