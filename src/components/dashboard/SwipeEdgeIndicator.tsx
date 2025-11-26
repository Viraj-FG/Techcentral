import { motion, useTransform, MotionValue } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DASHBOARD_VIEWS, DashboardViewMode } from "./DashboardViewIndicator";

interface SwipeEdgeIndicatorProps {
  dragX: MotionValue<number>;
  currentView: DashboardViewMode;
}

export const SwipeEdgeIndicator = ({ dragX, currentView }: SwipeEdgeIndicatorProps) => {
  const currentIndex = DASHBOARD_VIEWS.findIndex(v => v.id === currentView);
  const prevIndex = currentIndex === 0 ? DASHBOARD_VIEWS.length - 1 : currentIndex - 1;
  const nextIndex = (currentIndex + 1) % DASHBOARD_VIEWS.length;
  
  const prevView = DASHBOARD_VIEWS[prevIndex];
  const nextView = DASHBOARD_VIEWS[nextIndex];

  // Transform dragX into opacity values for edge indicators
  const leftOpacity = useTransform(dragX, [0, 100], [0, 0.7]);
  const rightOpacity = useTransform(dragX, [0, -100], [0, 0.7]);

  return (
    <>
      {/* Left Edge Indicator (Previous View) */}
      <motion.div
        style={{ opacity: leftOpacity }}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
      >
        <div className="flex items-center gap-2 pl-4 pr-6 py-3 bg-gradient-to-r from-background/80 to-transparent backdrop-blur-sm">
          <ChevronLeft className="w-5 h-5 text-primary" strokeWidth={2} />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              {prevView.label}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Right Edge Indicator (Next View) */}
      <motion.div
        style={{ opacity: rightOpacity }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
      >
        <div className="flex items-center gap-2 pr-4 pl-6 py-3 bg-gradient-to-l from-background/80 to-transparent backdrop-blur-sm">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              {nextView.label}
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-primary" strokeWidth={2} />
        </div>
      </motion.div>
    </>
  );
};
