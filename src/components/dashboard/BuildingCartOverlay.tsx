import { motion } from "framer-motion";
import { Loader2, Truck } from "lucide-react";
import { kaevaTransition } from "@/hooks/useKaevaMotion";

interface BuildingCartOverlayProps {
  isOpen: boolean;
}

export const BuildingCartOverlay = ({ isOpen }: BuildingCartOverlayProps) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={kaevaTransition}
      className="fixed inset-0 bg-kaeva-void/95 backdrop-blur-xl z-[100] flex items-center justify-center"
    >
      <div className="text-center">
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-kaeva-sage/20 flex items-center justify-center"
        >
          <Truck size={48} className="text-kaeva-sage" strokeWidth={1.5} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl text-display text-white mb-2"
        >
          Building Cart...
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-body text-slate-400"
        >
          Applying your dietary preferences
        </motion.p>

        <motion.div
          className="flex items-center justify-center gap-2 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Loader2 size={16} className="animate-spin text-kaeva-sage" />
          <span className="text-xs text-data text-slate-500">Processing...</span>
        </motion.div>
      </div>
    </motion.div>
  );
};
