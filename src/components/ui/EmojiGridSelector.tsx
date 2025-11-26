import { cn } from '@/lib/utils';

interface Mood {
  emoji: string;
  label: string;
  value: string;
}

interface EmojiGridSelectorProps {
  moods: Mood[];
  selectedMood: string | null;
  onSelect: (value: string) => void;
  columns?: number;
}

export const EmojiGridSelector = ({ 
  moods, 
  selectedMood, 
  onSelect,
  columns = 4 
}: EmojiGridSelectorProps) => {
  return (
    <div 
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {moods.map(mood => (
        <button
          key={mood.value}
          onClick={() => onSelect(selectedMood === mood.value ? '' : mood.value)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            "hover:scale-105 active:scale-95",
            selectedMood === mood.value
              ? "border-primary bg-primary/10"
              : "border-border bg-card/50 hover:border-primary/50"
          )}
        >
          <span className="text-3xl">{mood.emoji}</span>
          <span className={cn(
            "text-xs font-medium",
            selectedMood === mood.value ? "text-primary" : "text-muted-foreground"
          )}>
            {mood.label}
          </span>
        </button>
      ))}
    </div>
  );
};