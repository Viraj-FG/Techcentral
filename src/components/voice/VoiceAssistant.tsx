import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useVoiceManager } from "@/hooks/useVoiceManager";
import ConversationOverlay from "./ConversationOverlay";

interface VoiceAssistantProps {
  userProfile: any;
  onProfileUpdate?: (profile: any) => void;
}

const VoiceAssistant = ({ userProfile, onProfileUpdate }: VoiceAssistantProps) => {
  const {
    apertureState,
    audioAmplitude,
    userTranscript,
    aiTranscript,
    showConversation,
    startConversation,
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

// Export hook for external components to trigger voice
export const useVoiceAssistant = ({ userProfile, onProfileUpdate }: VoiceAssistantProps) => {
  return useVoiceManager({ userProfile, onProfileUpdate });
};

export default VoiceAssistant;
