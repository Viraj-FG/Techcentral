import { motion } from "framer-motion";
import { Heart, Utensils, Package, Sparkles, PawPrint, Users, LucideIcon } from "lucide-react";
import { haptics } from "@/lib/haptics";

export type DashboardViewMode = 'pulse' | 'fuel' | 'pantry' | 'glow' | 'pets' | 'home';

export const DASHBOARD_VIEWS = [
  { id: 'pulse', label: 'Wellness', icon: Heart, color: 'text-secondary' },
  { id: 'fuel', label: 'Nutrition', icon: Utensils, color: 'text-accent' },
  { id: 'pantry', label: 'Pantry', icon: Package, color: 'text-destructive' },
  { id: 'glow', label: 'Beauty', icon: Sparkles, color: 'text-primary' },
  { id: 'pets', label: 'Pets', icon: PawPrint, color: 'text-secondary' },
  { id: 'home', label: 'Household', icon: Users, color: 'text-foreground' },
] as const;

interface DashboardViewIndicatorProps {
  currentView: DashboardViewMode;
  onViewChange: (view: DashboardViewMode) => void;
}

export const DashboardViewIndicator = ({ currentView, onViewChange }: DashboardViewIndicatorProps) => {
  const currentViewConfig = DASHBOARD_VIEWS.find(v => v.id === currentView);
  const CurrentIcon = currentViewConfig?.icon || Heart;

  // Domain-specific dot colors
  const getDotColor = (viewId: string) => {
    switch (viewId) {
      case 'pulse': return 'bg-secondary';
      case 'fuel': return 'bg-accent';
      case 'pantry': return 'bg-destructive';
      case 'glow': return 'bg-primary';
      case 'pets': return 'bg-secondary';
      case 'home': return 'bg-foreground/50';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 mb-6">
      {/* Current View Label */}
      <motion.div
        key={currentView}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-4 py-2 rounded-full glass-card"
      >
        <CurrentIcon className={`w-4 h-4 ${currentViewConfig?.color}`} strokeWidth={1.5} />
        <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">
          {currentViewConfig?.label}
        </span>
      </motion.div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2">
        {DASHBOARD_VIEWS.map((view) => {
          const isActive = currentView === view.id;
          const dotColor = getDotColor(view.id);
          
          return (
            <motion.button
              key={view.id}
              onClick={() => {
                haptics.selection();
                onViewChange(view.id as DashboardViewMode);
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-full transition-all relative group ${
                isActive
                  ? `${dotColor} w-6 h-2`
                  : 'bg-slate-700 w-2 h-2 hover:bg-slate-600'
              }`}
              aria-label={`${view.label} view`}
            >
              {/* Pulse animation on active dot */}
              {isActive && (
                <motion.span
                  className={`absolute inset-0 rounded-full ${dotColor} opacity-50`}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              
              {/* Tooltip */}
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {view.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
