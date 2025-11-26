import { Camera, Mic, ShoppingCart, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
}

interface QuickActionsProps {
  onScan: () => void;
  onVoice: () => void;
  onRestock: () => void;
  onPlanWeek: () => void;
}

export const QuickActions = ({ onScan, onVoice, onRestock, onPlanWeek }: QuickActionsProps) => {
  const actions: QuickAction[] = [
    { icon: Camera, label: 'Scan', onClick: onScan, variant: 'primary' },
    { icon: Mic, label: 'Ask Kaeva', onClick: onVoice, variant: 'secondary' },
    { icon: ShoppingCart, label: 'Restock', onClick: onRestock, variant: 'accent' },
    { icon: Calendar, label: 'Plan Week', onClick: onPlanWeek, variant: 'default' }
  ];

  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary';
      case 'secondary':
        return 'bg-secondary/10 border-secondary/20 hover:bg-secondary/20 text-secondary';
      case 'accent':
        return 'bg-accent/10 border-accent/20 hover:bg-accent/20 text-accent';
      default:
        return 'bg-card/40 border-border/50 hover:bg-card/60 text-foreground';
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.label}
            onClick={action.onClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
              getVariantStyles(action.variant)
            )}
          >
            <Icon className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-xs font-medium">{action.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};