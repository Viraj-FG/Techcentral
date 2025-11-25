import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVoiceCooking } from '@/hooks/useVoiceCooking';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Clock,
  Mic,
  MicOff,
  Timer as TimerIcon,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Recipe {
  id: string;
  user_id: string;
  name: string;
  ingredients: any;
  instructions: any;
}

interface Props {
  recipe: Recipe;
  onComplete: () => void;
  onBack: () => void;
}

export const CookingMode = ({ recipe, onComplete, onBack }: Props) => {
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [timer, setTimer] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);

  const { 
    isListening, 
    startListening, 
    stopListening,
    speak,
    stopSpeaking
  } = useVoiceCooking({
    onNext: handleNext,
    onPrevious: handlePrevious,
    onRepeat: handleRepeat,
    onTimer: handleSetTimer,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timer !== null && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev === null || prev <= 1) {
            setTimerActive(false);
            toast.success('Timer completed!', { duration: 5000 });
            if (speechEnabled) speak('Timer is done!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer, speechEnabled]);

  useEffect(() => {
    // Auto-read current step when it changes
    if (speechEnabled && instructions[currentStep]) {
      const stepText = instructions[currentStep].instruction || instructions[currentStep].text || '';
      speak(`Step ${currentStep + 1}. ${stepText}`);
    }
  }, [currentStep, speechEnabled]);

  function handleNext() {
    if (currentStep < instructions.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
    }
  }

  function handlePrevious() {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }

  function handleRepeat() {
    if (instructions[currentStep]) {
      const stepText = instructions[currentStep].instruction || instructions[currentStep].text || '';
      speak(`Step ${currentStep + 1}. ${stepText}`);
    }
  }

  function handleSetTimer(minutes: number) {
    setTimer(minutes * 60);
    setTimerActive(true);
    toast.success(`Timer set for ${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (speechEnabled) speak(`Timer set for ${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }

  const handleFinishCooking = async () => {
    if (!confirm('Mark this recipe as cooked? This will deduct ingredients from your inventory.')) {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's household_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.current_household_id) return;

    // Deduct ingredients from inventory
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    
    for (const ing of ingredients) {
      const itemName = ing.item || ing.name || '';
      const quantity = parseFloat(ing.quantity || ing.amount || '0');

      if (!itemName || quantity <= 0) continue;

      // Find matching inventory item
      const { data: inventoryItems } = await supabase
        .from('inventory')
        .select('*')
        .eq('household_id', profile.current_household_id)
        .ilike('name', `%${itemName}%`);

      if (inventoryItems && inventoryItems.length > 0) {
        const item = inventoryItems[0];
        const newQuantity = Math.max(0, (item.quantity || 0) - quantity);
        const newFillLevel = item.original_quantity 
          ? Math.round((newQuantity / item.original_quantity) * 100)
          : 50;

        await supabase
          .from('inventory')
          .update({ 
            quantity: newQuantity,
            fill_level: newFillLevel,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
      }
    }

    toast.success('Ingredients deducted from inventory!');
    onComplete();
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      stopListening();
      setVoiceEnabled(false);
    } else {
      startListening();
      setVoiceEnabled(true);
    }
  };

  const toggleSpeech = () => {
    if (speechEnabled) {
      stopSpeaking();
      setSpeechEnabled(false);
    } else {
      setSpeechEnabled(true);
      handleRepeat();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentInstruction = instructions[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-5 h-5" />
            Exit
          </Button>
          
          <div className="flex items-center gap-4">
            <Button
              variant={speechEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleSpeech}
              className="gap-2"
            >
              {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {speechEnabled ? 'Speech On' : 'Speech Off'}
            </Button>
            
            <Button
              variant={voiceEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleVoice}
              className="gap-2"
            >
              {voiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              {voiceEnabled ? 'Listening' : 'Voice Control'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-80px)] overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Progress */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {instructions.length}
              </span>
              <span className="text-sm font-medium">
                {Math.round(((completedSteps.size) / instructions.length) * 100)}% Complete
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((completedSteps.size) / instructions.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Timer */}
          {timer !== null && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-card rounded-xl border border-border"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TimerIcon className={cn(
                    "w-6 h-6",
                    timerActive && "animate-pulse text-primary"
                  )} />
                  <span className="text-3xl font-bold font-mono">
                    {formatTime(timer)}
                  </span>
                </div>
                <Button
                  variant={timerActive ? "outline" : "default"}
                  onClick={() => setTimerActive(!timerActive)}
                >
                  {timerActive ? 'Pause' : 'Start'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Current Step */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mb-12"
            >
              <Badge variant="outline" className="mb-6 text-lg px-4 py-2">
                Step {currentStep + 1}
              </Badge>
              
              <p className="text-5xl md:text-6xl font-bold leading-tight text-foreground mb-8">
                {currentInstruction?.instruction || currentInstruction?.text || currentInstruction}
              </p>

              {currentInstruction?.duration && (
                <Button
                  variant="outline"
                  onClick={() => handleSetTimer(parseInt(currentInstruction.duration))}
                  className="gap-2 mb-6"
                >
                  <Clock className="w-4 h-4" />
                  Set Timer: {currentInstruction.duration} min
                </Button>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex-1 gap-2 text-lg py-8"
            >
              <ArrowLeft className="w-5 h-5" />
              Previous
            </Button>

            {currentStep === instructions.length - 1 ? (
              <Button
                size="lg"
                onClick={handleFinishCooking}
                className="flex-1 gap-2 text-lg py-8"
              >
                <Check className="w-5 h-5" />
                Finish Cooking
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleNext}
                className="flex-1 gap-2 text-lg py-8"
              >
                Next Step
                <ArrowRight className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Voice Commands Helper */}
          {voiceEnabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 p-4 bg-card rounded-lg border border-border"
            >
              <p className="text-sm text-muted-foreground mb-2 font-medium">Voice Commands:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <Badge variant="outline">"Next"</Badge>
                <Badge variant="outline">"Previous" or "Back"</Badge>
                <Badge variant="outline">"Repeat"</Badge>
                <Badge variant="outline">"Timer [minutes]"</Badge>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
