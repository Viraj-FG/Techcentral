import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  /** Enable haptic feedback on check/uncheck */
  haptic?: boolean;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, haptic = true, onCheckedChange, ...props }, ref) => {
  const handleCheckedChange = (checked: CheckboxPrimitive.CheckedState) => {
    if (haptic) {
      haptics.selection();
    }
    onCheckedChange?.(checked);
  };

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        // Base size with 44px touch target area (via padding)
        "peer h-6 w-6 shrink-0 rounded-lg",
        // Border and background
        "border-2 border-white/30 bg-white/5",
        // Checked state
        "data-[state=checked]:bg-secondary data-[state=checked]:border-secondary data-[state=checked]:text-secondary-foreground",
        // Focus and disabled
        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Transition
        "transition-all duration-200",
        className,
      )}
      onCheckedChange={handleCheckedChange}
      {...props}
    >
      <CheckboxPrimitive.Indicator 
        className={cn(
          "flex items-center justify-center text-current",
          // Animated checkmark
          "data-[state=checked]:animate-in data-[state=checked]:zoom-in-50 data-[state=checked]:duration-200"
        )}
      >
        <Check className="h-4 w-4 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
