import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useVoiceManager } from "@/hooks/useVoiceManager";
import SleepingIndicator from "./SleepingIndicator";
import ConversationOverlay from "./ConversationOverlay";

interface VoiceAssistantProps {
  userProfile: any;
  onProfileUpdate?: (profile: any) => void;
}

const VoiceAssistant = ({ userProfile, onProfileUpdate }: VoiceAssistantProps) => {
  const {
    voiceState,
    apertureState,
    audioAmplitude,
    userTranscript,
    aiTranscript,
    showConversation,
    isWakeWordActive,
    endConversation
  } = useVoiceManager({ userProfile, onProfileUpdate });

  // Handle ESC key to close conversation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showConversation) {
        endConversation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showConversation, endConversation]);

  return (
    <>
      {/* Always visible sleeping indicator */}
      {voiceState === "sleeping" && (
        <SleepingIndicator isActive={isWakeWordActive} />
      )}

      {/* Conversation overlay */}
      <AnimatePresence>
        {showConversation && (
          <ConversationOverlay
            isOpen={showConversation}
            apertureState={apertureState}
            audioAmplitude={audioAmplitude}
            userTranscript={userTranscript}
            aiTranscript={aiTranscript}
            onClose={endConversation}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceAssistant;
