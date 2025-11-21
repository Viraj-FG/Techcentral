import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { convertPCMtoWAV, playAudio } from "@/lib/audioEngine";
import KaevaAperture from "./KaevaAperture";
import VoiceSubtitles from "./VoiceSubtitles";
import DigitalTwinCard from "./DigitalTwinCard";
import AuroraBackground from "./AuroraBackground";
import VolumeControl from "./VolumeControl";
import PermissionRequest from "./PermissionRequest";
import { useToast } from "@/hooks/use-toast";
interface ConversationState {
  userName: string | null;
  dietaryValues: string[];
  allergies: string[];
  household: {
    adults: number;
    kids: number;
    dogs: number;
    cats: number;
  } | null;
  healthGoals: string[];
  lifestyleGoals: string[];
  isComplete: boolean;
}
interface VoiceOnboardingProps {
  onComplete: (profile: any) => void;
}
type ApertureState = "idle" | "wakeword" | "listening" | "thinking" | "speaking";
const VoiceOnboarding = ({
  onComplete
}: VoiceOnboardingProps) => {
  const {
    toast
  } = useToast();
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [apertureState, setApertureState] = useState<ApertureState>("idle");
  const [isDetectingSound, setIsDetectingSound] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [showSummary, setShowSummary] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({
    userName: null,
    dietaryValues: [],
    allergies: [],
    household: null,
    healthGoals: [],
    lifestyleGoals: [],
    isComplete: false
  });
  const conversationHistory = useRef<Array<{
    role: "user" | "assistant";
    content: string;
  }>>([]);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isProcessingRef = useRef(false);
  const shouldListenRef = useRef(false);
  const isWakeWordModeRef = useRef(true);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const soundDetectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTranscriptRef = useRef("");

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Voice Mode Unavailable",
        description: "Your browser doesn't support voice input. Please use a modern browser.",
        variant: "destructive"
      });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }
      const fullTranscript = finalTranscript || interimTranscript;
      
      // Check for wake word when in wake word mode
      if (isWakeWordModeRef.current) {
        // Show visual feedback that sound is being detected
        if (fullTranscript.trim()) {
          setIsDetectingSound(true);
          
          // Clear previous timer
          if (soundDetectionTimerRef.current) {
            clearTimeout(soundDetectionTimerRef.current);
          }
          
          // Reset detection state after 500ms of no new speech
          soundDetectionTimerRef.current = setTimeout(() => {
            setIsDetectingSound(false);
          }, 500);
        }
        
        const lowerTranscript = fullTranscript.toLowerCase();
        if (lowerTranscript.includes("hey kaeva") || 
            lowerTranscript.includes("hey kava") || 
            lowerTranscript.includes("hey keva") ||
            lowerTranscript.includes("hi kaeva")) {
          console.log("Wake word detected!");
          setIsDetectingSound(false);
          isWakeWordModeRef.current = false;
          shouldListenRef.current = true;
          setApertureState("listening");
          setUserTranscript("");
          currentTranscriptRef.current = "";
          toast({
            title: "Kaeva Activated",
            description: "I'm listening...",
          });
          return;
        }
        return; // Don't process anything else in wake word mode
      }

      // Normal listening mode
      if (!shouldListenRef.current) return;

      currentTranscriptRef.current = fullTranscript;
      setUserTranscript(fullTranscript);
      setShowSubtitles(true);

      // Reset silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Only trigger AI response on final transcript and if there's meaningful content
      if (finalTranscript.trim() && !isProcessingRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          handleUserFinishedSpeaking(currentTranscriptRef.current.trim());
        }, 800);
      }
    };
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        // User stopped speaking, continue listening
        if (apertureState === "listening" || apertureState === "wakeword") {
          recognition.start();
        }
      }
    };
    recognition.onend = () => {
      // Automatically restart if we're in wake word or listening mode
      if ((apertureState === "listening" || apertureState === "wakeword") && !isProcessingRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.log("Recognition restart prevented:", e);
        }
      }
    };
    recognitionRef.current = recognition;
    return () => {
      shouldListenRef.current = false;
      isWakeWordModeRef.current = false;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (soundDetectionTimerRef.current) {
        clearTimeout(soundDetectionTimerRef.current);
      }
      recognition.stop();
    };
  }, [toast]);

  // Start conversation on mount
  useEffect(() => {
    if (!permissionsGranted) return;

    const startConversation = async () => {
      try {
        setApertureState("thinking");
        isWakeWordModeRef.current = false;

        // Start recognition immediately
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.log("Recognition already started:", e);
          }
        }

        // Get initial greeting from AI
        const {
          data,
          error
        } = await supabase.functions.invoke("interview-ai", {
          body: {
            cluster: "voice-intro",
            userProfile: conversationState,
            conversationHistory: []
          }
        });
        if (error) throw error;
        conversationHistory.current.push({
          role: "assistant",
          content: data.message
        });

        // Speak the greeting
        await speakResponse(data.message);
      } catch (error) {
        console.error("Error starting conversation:", error);
        toast({
          title: "Connection Error",
          description: "Failed to start voice conversation. Please try again.",
          variant: "destructive"
        });
      }
    };
    startConversation();
  }, [permissionsGranted]);
  const handleUserFinishedSpeaking = async (transcript: string) => {
    if (!transcript || isProcessingRef.current || !shouldListenRef.current) return;
    isProcessingRef.current = true;
    shouldListenRef.current = false;
    setApertureState("thinking");
    setShowSubtitles(false);
    try {
      // Add user message to history
      conversationHistory.current.push({
        role: "user",
        content: transcript
      });

      // Call AI
      const {
        data,
        error
      } = await supabase.functions.invoke("interview-ai", {
        body: {
          cluster: "voice-conversation",
          userProfile: conversationState,
          conversationHistory: conversationHistory.current
        }
      });
      if (error) throw error;

      // Parse response
      const {
        message,
        extracted,
        isComplete
      } = data;

      // Update conversation state
      if (extracted) {
        setConversationState(prev => ({
          ...prev,
          ...extracted,
          isComplete: isComplete || false
        }));
      }

      // Add AI response to history
      conversationHistory.current.push({
        role: "assistant",
        content: message
      });
      if (isComplete) {
        // Show summary
        setShowSummary(true);
        setApertureState("idle");
        shouldListenRef.current = false;
      } else {
        // Continue conversation
        await speakResponse(message);
      }
    } catch (error) {
      console.error("Error processing speech:", error);
      toast({
        title: "Processing Error",
        description: "I didn't catch that. Could you try again?"
      });

      // Resume listening
      setApertureState("listening");
      shouldListenRef.current = true;
    } finally {
      isProcessingRef.current = false;
      currentTranscriptRef.current = "";
    }
  };
  const speakResponse = async (text: string) => {
    try {
      setAiTranscript(text);
      setShowSubtitles(true);
      setApertureState("speaking");
      const {
        data,
        error
      } = await supabase.functions.invoke("kaeva-tts", {
        body: {
          text
        }
      });
      if (error) throw error;
      const wavBlob = convertPCMtoWAV(data.audioData, data.mimeType);
      const audio = await playAudio(wavBlob, volume);
      audioRef.current = audio;
      audio.onended = () => {
        setShowSubtitles(false);
        
        // Resume listening after AI finishes speaking
        if (!showSummary) {
          shouldListenRef.current = true;
          setApertureState("listening");
          
          // After 10 seconds of no input, go back to wake word mode
          setTimeout(() => {
            if (shouldListenRef.current && !isProcessingRef.current) {
              shouldListenRef.current = false;
              isWakeWordModeRef.current = true;
              setApertureState("wakeword");
              toast({
                title: "Wake Word Mode",
                description: "Say 'Hey Kaeva' to activate",
              });
            }
          }, 10000);
        }
      };
    } catch (error) {
      console.error("Error speaking response:", error);
      // Fallback to continuing without audio
      setShowSubtitles(false);
      setApertureState("listening");
      shouldListenRef.current = true;
    }
  };
  const handleProfileUpdate = async () => {
    setShowSummary(false);
    setConversationState(prev => ({
      ...prev,
      isComplete: false
    }));
    shouldListenRef.current = false;
    const updateMessage = "What would you like to update?";
    await speakResponse(updateMessage);
  };
  const handleEnterKaeva = () => {
    // Stop all audio/recognition
    shouldListenRef.current = false;
    isWakeWordModeRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Build final profile
    const profile = {
      language: "English",
      // Default to English for voice mode
      userName: conversationState.userName,
      dietaryRestrictions: conversationState.dietaryValues,
      allergies: conversationState.allergies,
      household: conversationState.household,
      medicalGoals: conversationState.healthGoals,
      lifestyleGoals: conversationState.lifestyleGoals,
      enableToxicFoodWarnings: (conversationState.household?.dogs || 0) > 0 || (conversationState.household?.cats || 0) > 0
    };

    // Save to localStorage
    localStorage.setItem("kaeva_user_profile", JSON.stringify(profile));
    localStorage.setItem("kaeva_onboarding_complete", "true");
    onComplete(profile);
  };

  if (!permissionsGranted) {
    return <PermissionRequest onPermissionsGranted={() => setPermissionsGranted(true)} />;
  }

  return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }} className="fixed inset-0 bg-kaeva-void overflow-hidden">
      <AuroraBackground />

      <div className="relative z-10 h-full flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {!showSummary ? <motion.div key="conversation" initial={{
          scale: 0.8,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.8,
          opacity: 0
        }} className="flex flex-col items-center">
              <KaevaAperture 
                state={apertureState} 
                size="lg" 
                audioElement={audioRef.current}
                isDetectingSound={isDetectingSound}
              />

              <motion.p initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.3
          }} className="mt-6 sm:mt-8 text-kaeva-sage text-xs sm:text-sm tracking-widest">
                {apertureState === "wakeword" && "SAY 'HEY KAEVA'"}
                {apertureState === "listening" && "LISTENING"}
                {apertureState === "thinking" && "PROCESSING"}
                {apertureState === "speaking" && "SPEAKING"}
              </motion.p>
            </motion.div> : <DigitalTwinCard key="summary" profile={conversationState} onUpdate={handleProfileUpdate} onComplete={handleEnterKaeva} />}
        </AnimatePresence>

        {showSubtitles && !showSummary && <VoiceSubtitles userText={apertureState === "thinking" ? userTranscript : ""} aiText={apertureState === "speaking" ? aiTranscript : ""} />}

        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8">
          
        </div>
      </div>
    </motion.div>;
};
export default VoiceOnboarding;