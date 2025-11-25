import { motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToxicityAlertProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  warnings: Array<{
    type: "pet" | "human";
    name: string;
    allergen: string;
  }>;
}

const ToxicityAlert = ({ isOpen, onClose, productName, warnings }: ToxicityAlertProps) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-red-950/95 backdrop-blur-md flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative w-full max-w-md bg-red-900/50 border-4 border-red-500 rounded-3xl p-8 text-center"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Pulsing warning icon */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center"
        >
          <AlertTriangle size={48} className="text-red-400" strokeWidth={2.5} />
        </motion.div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-white mb-3">
          DANGER DETECTED
        </h2>

        {/* Product name */}
        <p className="text-xl text-red-200 mb-6 font-semibold">
          {productName}
        </p>

        {/* Warnings list */}
        <div className="space-y-3 mb-8 text-left">
          {warnings.map((warning, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-red-950/50 border border-red-500/30 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {warning.type === "pet" ? "🐾" : "👤"}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">
                    {warning.type === "pet" ? "TOXIC TO PET" : "ALLERGEN DETECTED"}
                  </p>
                  <p className="text-red-200 text-sm mt-1">
                    <span className="font-medium">{warning.name}</span> is{" "}
                    {warning.type === "pet" ? "toxic to" : "allergic to"}{" "}
                    <span className="font-bold">{warning.allergen}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action button */}
        <Button
          onClick={onClose}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 rounded-xl text-lg border-2 border-red-400"
        >
          I Understand
        </Button>

        {/* Footer warning */}
        <p className="text-red-300 text-xs mt-4 font-medium">
          Do not add this item to your household
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ToxicityAlert;
