import { useEffect, forwardRef, useImperativeHandle } from "react";
import { AnimatePresence } from "framer-motion";
import { useAssistantVoice } from "@/hooks/useAssistantVoice";
import ConversationOverlay from "./ConversationOverlay";

interface VoiceAssistantProps {
  userProfile: any;
  onProfileUpdate?: (profile: any) => void;
}

export interface VoiceAssistantRef {
  startConversation: () => Promise<void>;
  sendContextualUpdate?: (context: string) => void;
}

const VoiceAssistant = forwardRef<VoiceAssistantRef, VoiceAssistantProps>(
  ({ userProfile, onProfileUpdate }, ref) => {
    const {
      apertureState,
      audioAmplitude,
      userTranscript,
      aiTranscript,
      showConversation,
      startConversation,
      endConversation,
      sendContextualUpdate
    } = useAssistantVoice({ userProfile });

    // Expose startConversation and sendContextualUpdate to parent via ref
    useImperativeHandle(ref, () => ({
      startConversation,
      sendContextualUpdate
    }), [startConversation, sendContextualUpdate]);

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
  }
);

VoiceAssistant.displayName = "VoiceAssistant";

export default VoiceAssistant;
