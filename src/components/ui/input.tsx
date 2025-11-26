import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  /** 
   * Hint for mobile keyboard type. Auto-detected from type prop if not set.
   * - 'numeric': Number pad (for integers like age, quantity)
   * - 'decimal': Number pad with decimal (for weight, price)
   * - 'tel': Phone keypad
   * - 'email': Email keyboard with @ and .com
   * - 'url': URL keyboard with / and .com
   * - 'search': Search keyboard with search button
   */
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputMode, ...props }, ref) => {
    // Auto-detect inputMode from type if not explicitly set
    const resolvedInputMode = inputMode ?? (() => {
      switch (type) {
        case 'number': return 'decimal';
        case 'tel': return 'tel';
        case 'email': return 'email';
        case 'url': return 'url';
        case 'search': return 'search';
        default: return undefined;
      }
    })();

    return (
      <input
        type={type}
        inputMode={resolvedInputMode}
        className={cn(
          "flex h-14 w-full rounded-full border-2 border-white/20 bg-slate-800/50 px-6 py-4 text-base text-white placeholder:text-white/50 backdrop-blur-xl transition-all duration-500 ease-kaeva focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] min-h-[44px]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
