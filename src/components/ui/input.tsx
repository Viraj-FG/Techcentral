import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-14 w-full rounded-full border-2 border-white/20 bg-slate-800/50 px-6 py-4 text-base text-white placeholder:text-white/50 backdrop-blur-xl transition-all duration-500 ease-kaeva focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kaeva-sage focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]",
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
