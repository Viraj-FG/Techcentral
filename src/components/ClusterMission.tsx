import { motion } from "framer-motion";
import { useState } from "react";

interface ClusterMissionProps {
  onSubmit: (data: { medical: string[]; lifestyle: string[] }) => void;
}

const medicalGoals = [
  { id: "hypertension", label: "Manage Hypertension", icon: "❤️" },
  { id: "diabetes", label: "Manage Diabetes", icon: "🩺" },
  { id: "cholesterol", label: "Lower Cholesterol", icon: "📉" },
  { id: "weight", label: "Weight Management", icon: "⚖️" }
];

const lifestyleGoals = [
  { id: "save-money", label: "Save Money", icon: "💰" },
  { id: "save-time", label: "Save Time", icon: "⏱️" },
  { id: "track-macros", label: "Track Macros", icon: "📊" },
  { id: "meal-prep", label: "Meal Prep Optimization", icon: "📦" }
];

const springTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20
};

const ClusterMission = ({ onSubmit }: ClusterMissionProps) => {
  const [selectedMedical, setSelectedMedical] = useState<string[]>([]);
  const [selectedLifestyle, setSelectedLifestyle] = useState<string[]>([]);

  const toggleMedical = (id: string) => {
    setSelectedMedical(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const toggleLifestyle = (id: string) => {
    setSelectedLifestyle(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    onSubmit({ medical: selectedMedical, lifestyle: selectedLifestyle });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl tracking-premium text-kaeva-sage">
          MISSION CALIBRATION
        </h2>
        <div className="w-32 h-0.5 bg-kaeva-sage/50 mx-auto" />
        <p className="text-sm text-kaeva-slate-400 tracking-wide">
          Define your primary objectives
        </p>
      </div>

      {/* Medical Goals */}
      <div className="space-y-4">
        <h3 className="text-lg tracking-wide text-kaeva-slate-300">Health Objectives</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {medicalGoals.map((goal) => (
            <motion.button
              key={goal.id}
              onClick={() => toggleMedical(goal.id)}
              className={`glass-chip ${
                selectedMedical.includes(goal.id) ? 'glass-chip-active' : ''
              } py-4 justify-start`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={springTransition}
            >
              <span className="text-xl mr-2">{goal.icon}</span>
              <span className="text-sm tracking-wide">{goal.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lifestyle Goals */}
      <div className="space-y-4">
        <h3 className="text-lg tracking-wide text-kaeva-slate-300">Lifestyle Priorities</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lifestyleGoals.map((goal) => (
            <motion.button
              key={goal.id}
              onClick={() => toggleLifestyle(goal.id)}
              className={`glass-chip ${
                selectedLifestyle.includes(goal.id) ? 'glass-chip-active' : ''
              } py-4 justify-start`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={springTransition}
            >
              <span className="text-xl mr-2">{goal.icon}</span>
              <span className="text-sm tracking-wide">{goal.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <motion.button
        onClick={handleContinue}
        className="w-full py-4 bg-kaeva-sage/20 border border-kaeva-sage rounded-full
                   hover:bg-kaeva-sage/30 transition-all tracking-wider text-kaeva-sage"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={springTransition}
      >
        FINALIZE CALIBRATION
      </motion.button>
    </div>
  );
};

export default ClusterMission;
