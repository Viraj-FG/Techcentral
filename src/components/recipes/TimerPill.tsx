import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimerPillProps {
  minutes: number;
  onSetTimer: () => void;
}

export const TimerPill = ({ minutes, onSetTimer }: TimerPillProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        onSetTimer();
      }}
      className="gap-2 h-8 text-xs"
    >
      <Clock className="w-3 h-3" />
      {minutes} min timer
    </Button>
  );
};