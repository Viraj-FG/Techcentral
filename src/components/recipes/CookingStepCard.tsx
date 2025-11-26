import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TimerPill } from './TimerPill';
import { cn } from '@/lib/utils';

interface CookingStepCardProps {
  stepNumber: number;
  instruction: string;
  isCompleted: boolean;
  isActive: boolean;
  onSetTimer?: (minutes: number) => void;
  onClick?: () => void;
}

export const CookingStepCard = ({
  stepNumber,
  instruction,
  isCompleted,
  isActive,
  onSetTimer,
  onClick
}: CookingStepCardProps) => {
  // Parse timer duration from instruction text
  const timerMatch = instruction.match(/(\d+)\s*(?:minute|min|minutes)/i);
  const timerMinutes = timerMatch ? parseInt(timerMatch[1]) : null;

  // Highlight numbers and temperatures
  const highlightText = (text: string) => {
    return text.replace(/(\d+(?:\.\d+)?)\s*(°[CF]|degrees|cups?|tbsp|tsp|oz|lb|g|kg|ml|L)/gi, 
      '<strong class="text-accent font-semibold">$1$2</strong>');
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-4 cursor-pointer transition-all",
        isActive && "border-primary bg-primary/5",
        isCompleted && "opacity-60"
      )}
    >
      <div className="flex gap-4">
        {/* Step Number */}
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold",
          isCompleted 
            ? "bg-secondary text-secondary-foreground" 
            : isActive
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}>
          {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p 
              className={cn(
                "text-base leading-relaxed",
                isActive ? "text-foreground font-medium" : "text-muted-foreground"
              )}
              dangerouslySetInnerHTML={{ __html: highlightText(instruction) }}
            />
            {isCompleted && (
              <Badge variant="outline" className="bg-secondary/20">
                Done
              </Badge>
            )}
          </div>

          {/* Timer Button */}
          {timerMinutes && onSetTimer && !isCompleted && (
            <TimerPill 
              minutes={timerMinutes} 
              onSetTimer={() => onSetTimer(timerMinutes)}
            />
          )}
        </div>
      </div>
    </Card>
  );
};