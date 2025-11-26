import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface HintCardProps {
  icon: LucideIcon;
  example: string;
  variant?: 'default' | 'muted';
  className?: string;
}

export const HintCard = ({ 
  icon: Icon, 
  example, 
  variant = 'default',
  className 
}: HintCardProps) => {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-xl border",
      "bg-background/40 backdrop-blur-xl",
      variant === 'default' ? "border-primary/20" : "border-border/20",
      className
    )}>
      <Icon size={16} className={cn(
        "shrink-0",
        variant === 'default' ? "text-primary" : "text-muted-foreground"
      )} />
      <span className="text-xs text-muted-foreground italic">{example}</span>
    </div>
  );
};
