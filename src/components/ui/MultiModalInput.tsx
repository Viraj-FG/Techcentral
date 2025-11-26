import { useState, useRef } from "react";
import { Mic, MicOff, Type, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HintCard } from "@/components/ui/HintCard";
import { useVoiceMealLog } from "@/hooks/useVoiceMealLog";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";

interface MultiModalInputProps {
  mode?: 'text' | 'voice' | 'both';
  placeholder: string;
  onSubmit: (text: string) => void;
  domain: 'nutrition' | 'inventory' | 'recipes' | 'pets' | 'beauty';
  showHint?: boolean;
  className?: string;
}

const domainExamples = {
  nutrition: { icon: Type, text: "e.g., I had 2 eggs and toast for breakfast" },
  inventory: { icon: Type, text: "e.g., Add 2 liters of milk to the fridge" },
  recipes: { icon: Type, text: "e.g., Show me chicken pasta recipes" },
  pets: { icon: Type, text: "e.g., My dog weighs 25 pounds" },
  beauty: { icon: Type, text: "e.g., Moisturizer, opened today" }
};

export const MultiModalInput = ({
  mode = 'both',
  placeholder,
  onSubmit,
  domain,
  showHint = true,
  className
}: MultiModalInputProps) => {
  const [inputMode, setInputMode] = useState<'text' | 'voice'>(mode === 'voice' ? 'voice' : 'text');
  const [textValue, setTextValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    reset
  } = useVoiceMealLog();

  const handleVoiceToggle = async () => {
    haptics.selection();
    if (isListening) {
      stopListening();
      if (transcript) {
        onSubmit(transcript);
        reset();
      }
    } else {
      await startListening();
    }
  };

  const handleTextSubmit = () => {
    if (textValue.trim()) {
      haptics.selection();
      onSubmit(textValue);
      setTextValue("");
    }
  };

  const handleModeSwitch = (newMode: 'text' | 'voice') => {
    haptics.selection();
    setInputMode(newMode);
    if (newMode === 'text') {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Mode selector (only show if mode is 'both') */}
      {mode === 'both' && (
        <div className="flex gap-2">
          <Button
            variant={inputMode === 'text' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handleModeSwitch('text')}
            className="flex-1"
          >
            <Type size={16} />
            Type
          </Button>
          <Button
            variant={inputMode === 'voice' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handleModeSwitch('voice')}
            className="flex-1"
          >
            <Mic size={16} />
            Speak
          </Button>
        </div>
      )}

      {/* Text input mode */}
      {(mode === 'text' || (mode === 'both' && inputMode === 'text')) && (
        <div className="space-y-2">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={placeholder}
              className="min-h-[100px] pr-12 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTextSubmit();
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleTextSubmit}
              disabled={!textValue.trim()}
              className="absolute bottom-2 right-2"
            >
              <Send size={18} />
            </Button>
          </div>
          {showHint && (
            <HintCard
              icon={domainExamples[domain].icon}
              example={domainExamples[domain].text}
              variant="muted"
            />
          )}
        </div>
      )}

      {/* Voice input mode */}
      {(mode === 'voice' || (mode === 'both' && inputMode === 'voice')) && (
        <div className="space-y-3">
          <Button
            variant={isListening ? 'destructive' : 'primary'}
            onClick={handleVoiceToggle}
            className="w-full h-24"
          >
            {isListening ? (
              <>
                <MicOff size={24} />
                <span className="ml-2">Stop & Submit</span>
              </>
            ) : (
              <>
                <Mic size={24} />
                <span className="ml-2">Tap to Speak</span>
              </>
            )}
          </Button>

          {isListening && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
              <div className="w-2 h-2 bg-destructive rounded-full" />
              Listening...
            </div>
          )}

          {transcript && (
            <div className="p-4 rounded-xl bg-background/60 backdrop-blur-xl border border-border/20">
              <p className="text-sm text-foreground">{transcript}</p>
            </div>
          )}

          {showHint && !transcript && (
            <HintCard
              icon={domainExamples[domain].icon}
              example={domainExamples[domain].text}
              variant="muted"
            />
          )}
        </div>
      )}
    </div>
  );
};
