import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: ReactNode;
  className?: string;
  iconColor?: string;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  illustration,
  className,
  iconColor = 'text-kaeva-sage',
  secondaryAction
}: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className
      )}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        illustration
      ) : (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.1
          }}
          className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center mb-6',
            'bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl',
            'border border-white/10 shadow-2xl'
          )}
        >
          <Icon className={cn('w-12 h-12', iconColor)} strokeWidth={1.5} />
        </motion.div>
      )}

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-light text-white mb-3 tracking-wide"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-white/60 mb-6 max-w-md leading-relaxed"
      >
        {description}
      </motion.p>

      {/* Actions */}
      {(actionLabel || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3"
        >
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              size="lg"
              className="bg-kaeva-sage text-kaeva-void hover:bg-kaeva-sage/90 font-medium"
            >
              {actionLabel}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}

      {/* Decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-kaeva-sage/10 rounded-full blur-3xl"
        />
      </div>
    </motion.div>
  );
};

export default EmptyState;
