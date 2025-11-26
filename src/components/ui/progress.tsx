import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

export interface ProgressProps 
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Animate the progress bar when it enters the viewport */
  animateOnView?: boolean;
  /** Color variant for the progress indicator */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'gradient';
  /** Show percentage label inside or outside */
  showLabel?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, animateOnView = true, variant = 'default', showLabel = false, ...props }, ref) => {
  const [isInView, setIsInView] = React.useState(!animateOnView);
  const [hasAnimated, setHasAnimated] = React.useState(!animateOnView);
  const progressRef = React.useRef<HTMLDivElement>(null);

  // Intersection Observer for animate-on-view
  React.useEffect(() => {
    if (!animateOnView || hasAnimated) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (progressRef.current) {
      observer.observe(progressRef.current);
    }

    return () => observer.disconnect();
  }, [animateOnView, hasAnimated]);

  // Variant colors
  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-destructive',
    gradient: 'bg-gradient-to-r from-emerald-500 via-primary to-accent',
  };

  // Dynamic color based on value
  const getAutoColor = (val: number) => {
    if (val >= 70) return variantClasses.success;
    if (val >= 40) return variantClasses.warning;
    return variantClasses.danger;
  };

  const indicatorClass = variant === 'default' && value !== undefined
    ? getAutoColor(value)
    : variantClasses[variant];

  const displayValue = isInView ? (value || 0) : 0;

  return (
    <div ref={progressRef} className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-3 w-full overflow-hidden rounded-full bg-slate-800/50",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 rounded-full",
            indicatorClass,
            // Smooth animation on value change
            "transition-transform duration-700 ease-out"
          )}
          style={{ transform: `translateX(-${100 - displayValue}%)` }}
        />
      </ProgressPrimitive.Root>
      
      {showLabel && (
        <span className="absolute right-0 -top-6 text-xs font-medium text-muted-foreground">
          {Math.round(value || 0)}%
        </span>
      )}
    </div>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
