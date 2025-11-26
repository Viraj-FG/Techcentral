import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Scrollable by default for mobile - no overflow hidden
      "inline-flex h-12 items-center gap-1 rounded-full bg-slate-800/50 p-1 text-muted-foreground",
      // Enable horizontal scroll on mobile, hide scrollbar
      "w-full overflow-x-auto no-scrollbar",
      // Mask edges to indicate more content (optional visual cue)
      "[mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)]",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base styles with 44px min touch target
      "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium",
      "min-h-[44px] min-w-[44px] flex-shrink-0",
      // Ring and transitions
      "ring-offset-background transition-all duration-300",
      // Active state - glass effect
      "data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm",
      // Inactive state
      "data-[state=inactive]:text-white/60 data-[state=inactive]:hover:text-white/80 data-[state=inactive]:hover:bg-white/5",
      // Focus and disabled
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      // Animation for tab content
      "animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
