import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // New variants for Kaeva
        warning: "border-transparent bg-amber-500/20 text-amber-400 border-amber-500/30",
        success: "border-transparent bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        info: "border-transparent bg-accent/20 text-accent border-accent/30",
        // Glass variant for dark theme
        glass: "border-white/20 bg-white/10 text-white backdrop-blur-sm",
      },
      // Pulse animation for urgent items
      pulse: {
        true: "animate-pulse",
        urgent: "animate-[pulse_1s_ease-in-out_infinite] shadow-lg",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      pulse: false,
    },
  },
);

export interface BadgeProps 
  extends React.HTMLAttributes<HTMLDivElement>, 
    VariantProps<typeof badgeVariants> {
  /** Add a pulsing glow effect for urgent items (e.g., expiring soon) */
  pulse?: boolean | 'urgent';
}

function Badge({ className, variant, pulse, ...props }: BadgeProps) {
  // Add glow effect for urgent pulse
  const urgentGlow = pulse === 'urgent' && variant === 'warning' 
    ? 'shadow-amber-500/50' 
    : pulse === 'urgent' && variant === 'destructive'
    ? 'shadow-destructive/50'
    : '';
    
  return (
    <div 
      className={cn(badgeVariants({ variant, pulse: pulse === true ? 'true' : pulse === 'urgent' ? 'urgent' : 'false' }), urgentGlow, className)} 
      {...props} 
    />
  );
}

export { Badge, badgeVariants };
