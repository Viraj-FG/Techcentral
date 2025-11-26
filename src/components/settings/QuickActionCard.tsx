import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { kaevaPressVariants } from "@/hooks/useKaevaMotion";

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  onClick: () => void;
}

export const QuickActionCard = ({
  icon: Icon,
  label,
  value,
  onClick,
}: QuickActionCardProps) => {
  return (
    <motion.button
      onClick={onClick}
      className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-secondary/5 transition-colors flex-1"
      variants={kaevaPressVariants}
      whileTap="tap"
    >
      <Icon className="w-8 h-8 text-secondary" strokeWidth={1.5} />
      <div className="text-center">
        <p className="text-sm font-medium text-secondary">{label}</p>
        {value && (
          <p className="text-lg font-semibold text-primary mt-1">{value}</p>
        )}
      </div>
    </motion.button>
  );
};
