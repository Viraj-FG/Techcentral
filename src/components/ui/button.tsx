import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-500 ease-kaeva focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Seattle Solstice Primary (The "Do It" Button)
        primary: "bg-emerald-400 text-slate-900 hover:bg-emerald-500 rounded-full font-semibold shadow-lg shadow-emerald-400/20",
        
        // Seattle Solstice Glass (The "Option" Button)
        glass: "bg-white/10 border-2 border-white/20 text-white hover:bg-white/15 rounded-full backdrop-blur-xl",
        
        // Legacy variants for compatibility
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-full",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full",
        outline: "border-2 border-white/20 bg-transparent hover:bg-white/10 text-white rounded-full",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full",
        ghost: "hover:bg-white/10 text-white rounded-full",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // All sizes enforce 44px minimum touch target (iOS/Android accessibility)
        default: "h-12 px-6 py-3 min-h-[44px] min-w-[44px]",
        sm: "h-11 px-4 min-h-[44px] min-w-[44px]",
        lg: "h-14 px-8 min-h-[44px] min-w-[44px]",
        icon: "h-12 w-12 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Enable haptic feedback on press. Defaults to true for primary/destructive variants */
  haptic?: boolean | 'success' | 'warning' | 'selection';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, haptic, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Determine haptic type based on variant if not explicitly set
    const getHapticType = () => {
      if (haptic === false) return null;
      if (typeof haptic === 'string') return haptic;
      if (haptic === true) return 'selection';
      // Default haptics based on variant
      if (variant === 'destructive') return 'warning';
      if (variant === 'primary' || variant === 'default') return 'success';
      return null;
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const hapticType = getHapticType();
      if (hapticType) {
        haptics[hapticType]?.();
      }
      onClick?.(e);
    };

    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        onClick={handleClick}
        {...props} 
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
