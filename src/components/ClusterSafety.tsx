import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useState } from "react";

interface ClusterSafetyProps {
  onSubmit: (data: { values: string[]; allergies: string[] }) => void;
}

const dietaryValues = [
  { id: "halal", label: "Halal", icon: "🕌" },
  { id: "kosher", label: "Kosher", icon: "✡️" },
  { id: "vegan", label: "Vegan", icon: "🌱" },
  { id: "vegetarian", label: "Vegetarian", icon: "🥗" },
  { id: "pescatarian", label: "Pescatarian", icon: "🐟" }
];

const allergies = [
  { id: "nut-free", label: "Nut-Free", icon: "🥜" },
  { id: "gluten-free", label: "Gluten-Free", icon: "🌾" },
  { id: "shellfish-free", label: "Shellfish-Free", icon: "🦐" },
  { id: "dairy-free", label: "Dairy-Free", icon: "🥛" },
  { id: "soy-free", label: "Soy-Free", icon: "🫘" }
];

const springTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20
};

const ClusterSafety = ({ onSubmit }: ClusterSafetyProps) => {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);

  const toggleValue = (id: string) => {
    setSelectedValues(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const toggleAllergy = (id: string) => {
    setSelectedAllergies(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    onSubmit({ values: selectedValues, allergies: selectedAllergies });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl tracking-premium text-secondary">
          SAFETY PARAMETERS
        </h2>
        <div className="w-32 h-0.5 bg-secondary/50 mx-auto" />
      </div>

      {/* Dietary Values */}
      <div className="space-y-4">
        <h3 className="text-lg tracking-wide text-muted-foreground/70">Dietary Focus</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {dietaryValues.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => toggleValue(item.id)}
              className={`glass-chip ${
                selectedValues.includes(item.id) ? 'glass-chip-active' : ''
              } flex-col py-4`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={springTransition}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs tracking-wide">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div className="space-y-4">
        <h3 className="text-lg tracking-wide text-muted-foreground/70">Allergies & Restrictions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {allergies.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => toggleAllergy(item.id)}
              className={`glass-chip ${
                selectedAllergies.includes(item.id) ? 'glass-chip-active' : ''
              } flex-col py-4`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={springTransition}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs tracking-wide">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Shield Indicator */}
      {(selectedValues.length > 0 || selectedAllergies.length > 0) && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center justify-center gap-2 text-secondary"
        >
          <Shield className="w-6 h-6" style={{
            filter: 'drop-shadow(0 0 20px rgba(112, 224, 152, 0.6))'
          }} />
          <span className="text-sm tracking-wide">Safety Protocols Active</span>
        </motion.div>
      )}

      {/* Continue Button */}
      <motion.button
        onClick={handleContinue}
        className="w-full py-4 bg-secondary/20 border border-secondary rounded-full
                   hover:bg-secondary/30 transition-all tracking-wider text-secondary"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={springTransition}
      >
        CONTINUE
      </motion.button>
    </div>
  );
};

export default ClusterSafety;
