import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';
import VoiceAssistant, { VoiceAssistantRef } from '@/components/voice/VoiceAssistant';

interface VoiceAssistantContextType {
  startConversation: (context?: string) => void;
  isActive: boolean;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType | null>(null);

export const useVoiceAssistant = () => {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error('useVoiceAssistant must be used within VoiceAssistantProvider');
  }
  return context;
};

interface VoiceAssistantProviderProps {
  children: ReactNode;
  userProfile?: any;
}

export const VoiceAssistantProvider = ({ children, userProfile }: VoiceAssistantProviderProps) => {
  const voiceAssistantRef = useRef<VoiceAssistantRef>(null);
  const [isActive, setIsActive] = useState(false);

  const startConversation = (context?: string) => {
    // Send context before starting if provided
    if (context && voiceAssistantRef.current?.sendContextualUpdate) {
      try {
        voiceAssistantRef.current.sendContextualUpdate(context);
      } catch (error) {
        console.error('Failed to send context:', error);
      }
    }
    voiceAssistantRef.current?.startConversation();
    setIsActive(true);
  };

  return (
    <VoiceAssistantContext.Provider value={{ startConversation, isActive }}>
      <VoiceAssistant 
        ref={voiceAssistantRef} 
        userProfile={userProfile}
        onProfileUpdate={() => {}}
      />
      {children}
    </VoiceAssistantContext.Provider>
  );
};
