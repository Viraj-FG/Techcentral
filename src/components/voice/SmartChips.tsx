import { motion } from "framer-motion";
import { kaevaTransition } from "@/hooks/useKaevaMotion";

interface SmartChipsProps {
  chips: string[];
  onChipClick: (chip: string) => void;
}

export const SmartChips = ({ chips, onChipClick }: SmartChipsProps) => {
  if (chips.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={kaevaTransition}
      className="flex flex-wrap gap-2 justify-center mt-6"
    >
      {chips.map((chip, index) => (
        <motion.button
          key={chip}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...kaevaTransition, delay: index * 0.1 }}
          onClick={() => onChipClick(chip)}
          className="glass-chip text-sm"
        >
          {chip}
        </motion.button>
      ))}
    </motion.div>
  );
};
