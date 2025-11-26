import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ROUTE_ORDER_EXPORT } from "@/hooks/useSwipeNavigation";

interface PageIndicatorProps {
  className?: string;
}

export const PageIndicator = ({ className }: PageIndicatorProps) => {
  const location = useLocation();
  const currentIndex = ROUTE_ORDER_EXPORT.indexOf(location.pathname);

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {ROUTE_ORDER_EXPORT.map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            index === currentIndex 
              ? "w-6 bg-primary" 
              : "w-1.5 bg-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
};
