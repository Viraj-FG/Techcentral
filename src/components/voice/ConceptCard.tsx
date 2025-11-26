import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { kaevaTransition } from "@/hooks/useKaevaMotion";

interface ConceptCardProps {
  icon: string;
  label: string;
  value: string;
  onDismiss?: () => void;
}

export const ConceptCard = ({ icon, label, value, onDismiss }: ConceptCardProps) => {
  // Auto-dismiss after 2 seconds
  if (onDismiss) {
    setTimeout(onDismiss, 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.8 }}
      transition={kaevaTransition}
      className="fixed right-6 top-1/3 z-50 pointer-events-none"
    >
      <div className="glass-card p-4 min-w-[200px] border-secondary/50 overflow-hidden">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-2xl flex-shrink-0">
            {icon}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-micro text-secondary mb-1 truncate">{label}</p>
            <p className="text-body text-white truncate">{value}</p>
          </div>

          {/* Check Mark */}
          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
            <Check size={14} className="text-background" strokeWidth={3} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
