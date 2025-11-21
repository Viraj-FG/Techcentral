import { useState } from "react";
import { motion } from "framer-motion";

interface ClusterBeautyProps {
  onSubmit: (data: { skinProfile: string[] }) => void;
}

const skinTypes = [
  { id: "dry", label: "Dry", icon: "🏜️" },
  { id: "oily", label: "Oily", icon: "💧" },
  { id: "sensitive", label: "Sensitive", icon: "🌸" },
  { id: "acne-prone", label: "Acne Prone", icon: "🔴" },
  { id: "combination", label: "Combination", icon: "🌓" }
];

const springTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20
};

const ClusterBeauty = ({ onSubmit }: ClusterBeautyProps) => {
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);

  const toggleSkinType = (id: string) => {
    setSelectedSkinTypes(prev => 
      prev.includes(id) 
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
  };

  const handleContinue = () => {
    onSubmit({ skinProfile: selectedSkinTypes });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl tracking-premium text-kaeva-terracotta">
          YOUR SKIN PROFILE
        </h2>
        <div className="w-32 h-0.5 bg-kaeva-terracotta/50 mx-auto" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {skinTypes.map((type) => (
          <motion.button
            key={type.id}
            onClick={() => toggleSkinType(type.id)}
            className={`glass-chip ${
              selectedSkinTypes.includes(type.id) ? 'glass-chip-active' : ''
            } flex-col py-4`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springTransition}
          >
            <span className="text-3xl mb-1">{type.icon}</span>
            <span className="text-sm tracking-wide">{type.label}</span>
          </motion.button>
        ))}
      </div>

      <motion.button
        onClick={handleContinue}
        className="w-full py-4 bg-kaeva-terracotta/20 border border-kaeva-terracotta rounded-full
                   hover:bg-kaeva-terracotta/30 transition-all tracking-wider text-kaeva-terracotta"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={springTransition}
      >
        CONTINUE
      </motion.button>
    </div>
  );
};

export default ClusterBeauty;
