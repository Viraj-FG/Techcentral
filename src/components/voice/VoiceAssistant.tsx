import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useVoiceManager } from "@/hooks/useVoiceManager";
import ConversationOverlay from "./ConversationOverlay";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

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
      {/* Floating Action Button - Talk to Kaeva */}
      {!showConversation && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          <Button
            onClick={startConversation}
            size="lg"
            className="rounded-full w-16 h-16 shadow-lg bg-gradient-to-br from-kaeva-mint to-kaeva-electric-sky hover:scale-110 transition-transform"
          >
            <Mic className="w-6 h-6" />
          </Button>
        </motion.div>
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
