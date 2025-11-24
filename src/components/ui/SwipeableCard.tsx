import { ReactNode, useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Trash2, Edit, Archive, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface SwipeAction {
  icon: typeof Trash2;
  label: string;
  color: string;
  bgColor: string;
  onAction: () => void;
}

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = {
    icon: Trash2,
    label: 'Delete',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    onAction: () => onSwipeLeft?.()
  },
  rightAction = {
    icon: Edit,
    label: 'Edit',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    onAction: () => onSwipeRight?.()
  },
  threshold = 100,
  className,
  disabled = false
}: SwipeableCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const { trigger: triggerHaptic } = useHapticFeedback();

  const leftActionOpacity = useTransform(x, [-threshold, 0], [1, 0]);
  const rightActionOpacity = useTransform(x, [0, threshold], [0, 1]);

  const handleDragStart = () => {
    if (!disabled) {
      setIsDragging(true);
      triggerHaptic('selection');
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    const offset = info.offset.x;

    if (Math.abs(offset) > threshold) {
      triggerHaptic('medium');
      
      if (offset < 0) {
        leftAction.onAction();
      } else {
        rightAction.onAction();
      }
    }

    // Reset position
    x.set(0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left Action (Swipe Left to Reveal) */}
      <motion.div
        style={{ opacity: leftActionOpacity }}
        className={cn(
          'absolute inset-y-0 right-0 flex items-center justify-end px-6',
          leftAction.bgColor
        )}
      >
        <div className="flex flex-col items-center gap-1">
          <leftAction.icon className={cn('w-6 h-6', leftAction.color)} />
          <span className={cn('text-xs font-medium', leftAction.color)}>
            {leftAction.label}
          </span>
        </div>
      </motion.div>

      {/* Right Action (Swipe Right to Reveal) */}
      <motion.div
        style={{ opacity: rightActionOpacity }}
        className={cn(
          'absolute inset-y-0 left-0 flex items-center justify-start px-6',
          rightAction.bgColor
        )}
      >
        <div className="flex flex-col items-center gap-1">
          <rightAction.icon className={cn('w-6 h-6', rightAction.color)} />
          <span className={cn('text-xs font-medium', rightAction.color)}>
            {rightAction.label}
          </span>
        </div>
      </motion.div>

      {/* Swipeable Content */}
      <motion.div
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn(
          'relative bg-slate-900',
          isDragging && 'cursor-grabbing',
          !disabled && 'cursor-grab',
          className
        )}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SwipeableCard;
