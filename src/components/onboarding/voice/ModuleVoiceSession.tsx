import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { OnboardingModule } from "@/hooks/useModularOnboarding";
import { useOnboardingVoice } from "@/hooks/useOnboardingVoice";
import KaevaAperture from "@/components/KaevaAperture";

interface ModuleVoiceSessionProps {
  module: OnboardingModule;
  onComplete: () => void;
  onSwitchToForm: () => void;
}

const MODULE_PROMPTS: Record<OnboardingModule, string> = {
  core: "Quick 30-second intro: Get their name and primary goal (weight loss, muscle gain, healthy eating, meal planning, reduce waste, or save money). Be warm and brief.",
  nutrition: "Quick 30-second nutrition setup: Get age, gender, weight (kg), height (cm), activity level, any allergies, and dietary preferences. Calculate TDEE for them. Be efficient.",
  pantry: "Quick 30-second pantry setup: Ask about their preferred grocery store, ZIP code for local options, and if they prefer organic products. Keep it brief.",
  beauty: "Quick 30-second beauty profile: Ask about their skin type (dry/oily/combination/normal/sensitive) and hair type (straight/wavy/curly/coily). That's it.",
  pets: "Quick 30-second pet intro: Get pet name, species (dog/cat/bird/rabbit/other), optional breed, optional age, and confirm if they want toxic food alerts. Be friendly.",
  household: "Quick 30-second family member add: Get their name, type (adult/child/toddler/elderly), optional age, and any allergies. Keep it simple.",
};

export const ModuleVoiceSession = ({
  module,
  onComplete,
  onSwitchToForm,
}: ModuleVoiceSessionProps) => {
  const {
    apertureState,
    audioAmplitude,
    userTranscript,
    aiTranscript,
    showConversation,
    startConversation,
    endConversation,
  } = useOnboardingVoice({
    onComplete,
  });

  useEffect(() => {
    // Start conversation when mounted
    startConversation();

    return () => {
      endConversation();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <KaevaAperture
          state={apertureState}
          audioAmplitude={audioAmplitude}
          size="lg"
        />

        <div className="mt-8 space-y-4 w-full max-w-md">
          {userTranscript && (
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm text-foreground/90">{userTranscript}</p>
            </div>
          )}

          {aiTranscript && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-foreground/90">{aiTranscript}</p>
            </div>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        onClick={onSwitchToForm}
        className="w-full"
      >
        <FileText className="w-4 h-4 mr-2" />
        Switch to form instead
      </Button>
    </div>
  );
};
