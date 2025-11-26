import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Mic, FileText } from "lucide-react";
import { OnboardingModule } from "@/hooks/useModularOnboarding";
import { CoreOnboardingForm } from "./forms/CoreOnboardingForm";
import { NutritionOnboardingForm } from "./forms/NutritionOnboardingForm";
import { PantryOnboardingForm } from "./forms/PantryOnboardingForm";
import { BeautyOnboardingForm } from "./forms/BeautyOnboardingForm";
import { PetsOnboardingForm } from "./forms/PetsOnboardingForm";
import { HouseholdOnboardingForm } from "./forms/HouseholdOnboardingForm";
import { ModuleVoiceSession } from "./voice/ModuleVoiceSession";

interface OnboardingModuleSheetProps {
  open: boolean;
  module: OnboardingModule;
  onClose: () => void;
  onComplete: () => void;
}

type InputMode = 'choose' | 'form' | 'voice';

const MODULE_TITLES: Record<OnboardingModule, string> = {
  core: 'Welcome to Kaeva',
  nutrition: 'Nutrition Profile',
  pantry: 'Pantry Preferences',
  beauty: 'Beauty Profile',
  pets: 'Meet Your Pets',
  household: 'Household Members',
};

export const OnboardingModuleSheet = ({
  open,
  module,
  onClose,
  onComplete,
}: OnboardingModuleSheetProps) => {
  const [mode, setMode] = useState<InputMode>('choose');

  // Reset mode when sheet opens
  useEffect(() => {
    if (open) {
      const lastMode = localStorage.getItem('preferred_onboarding_mode') as InputMode;
      setMode(lastMode || 'choose');
    }
  }, [open]);

  const handleModeSelect = (selectedMode: 'form' | 'voice') => {
    localStorage.setItem('preferred_onboarding_mode', selectedMode);
    setMode(selectedMode);
  };

  const handleComplete = () => {
    onComplete();
    onClose();
    setMode('choose');
  };

  const renderForm = () => {
    const formProps = {
      onComplete: handleComplete,
      onCancel: onClose,
    };

    switch (module) {
      case 'core':
        return <CoreOnboardingForm {...formProps} />;
      case 'nutrition':
        return <NutritionOnboardingForm {...formProps} />;
      case 'pantry':
        return <PantryOnboardingForm {...formProps} />;
      case 'beauty':
        return <BeautyOnboardingForm {...formProps} />;
      case 'pets':
        return <PetsOnboardingForm {...formProps} />;
      case 'household':
        return <HouseholdOnboardingForm {...formProps} />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{MODULE_TITLES[module]}</SheetTitle>
        </SheetHeader>

        {mode === 'choose' && (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Choose how you'd like to complete this
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleModeSelect('form')}
                className="p-6 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors"
              >
                <FileText className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-medium text-sm mb-1">Type It</p>
                <p className="text-xs text-muted-foreground">Fill out a quick form</p>
              </button>

              <button
                onClick={() => handleModeSelect('voice')}
                className="p-6 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors"
              >
                <Mic className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-medium text-sm mb-1">Talk to Kaeva</p>
                <p className="text-xs text-muted-foreground">30-second conversation</p>
              </button>
            </div>

            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-muted-foreground"
            >
              Skip for now
            </Button>
          </div>
        )}

        {mode === 'form' && (
          <div className="mt-6">
            {renderForm()}
            <Button
              variant="ghost"
              onClick={() => setMode('choose')}
              className="w-full mt-4 text-muted-foreground"
            >
              Switch to voice instead
            </Button>
          </div>
        )}

        {mode === 'voice' && (
          <div className="mt-6">
            <ModuleVoiceSession
              module={module}
              onComplete={handleComplete}
              onSwitchToForm={() => setMode('form')}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
