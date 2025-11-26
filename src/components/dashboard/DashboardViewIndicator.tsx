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

  return (
    <div className="flex flex-col items-center gap-3 mb-4">
      {/* Current View Label */}
      <motion.div
        key={currentView}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <CurrentIcon className={`w-4 h-4 ${currentViewConfig?.color}`} strokeWidth={1.5} />
        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          {currentViewConfig?.label}
        </span>
      </motion.div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2">
        {DASHBOARD_VIEWS.map((view) => (
          <button
            key={view.id}
            onClick={() => {
              haptics.selection();
              onViewChange(view.id as DashboardViewMode);
            }}
            className={`rounded-full transition-all ${
              currentView === view.id
                ? 'bg-primary w-6 h-2'
                : 'bg-slate-600 w-2 h-2 hover:bg-slate-500'
            }`}
            aria-label={`${view.label} view`}
          />
        ))}
      </div>
    </div>
  );
};
