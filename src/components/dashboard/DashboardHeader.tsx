import { motion } from "framer-motion";
import { Search } from "lucide-react";

interface DashboardHeaderProps {
  onSearchOpen: () => void;
}

export const DashboardHeader = ({ onSearchOpen }: DashboardHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-white/10 -mx-6 px-6 py-4 mb-4"
    >
      <div
        onClick={onSearchOpen}
        className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-slate-900/60 transition-all"
      >
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <span className="text-slate-400 text-sm flex-1">
            Search inventory, recipes, pets...
          </span>
          <kbd className="px-2 py-1 bg-slate-800/50 border border-white/10 rounded text-xs text-slate-400">
            ⌘K
          </kbd>
        </div>
      </div>
    </motion.div>
  );
};
