import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Droplets, 
  Zap, 
  ShieldAlert, 
  ScanFace, 
  Clock,
  Wind,
  Waves,
  TrendingDown,
  Snowflake,
  User,
  Microscope,
  Activity
} from "lucide-react";

interface ClusterBeautyProps {
  onSubmit: (data: { skinProfile: string[] }) => void;
}

// Skin Conditions (Scientific/Clinical)
const skinConditions = [
  { id: "dry", label: "Dry / Dehydrated", icon: Droplets },
  { id: "oily", label: "Oily / Active", icon: Zap },
  { id: "sensitive", label: "Sensitive / Razor Burn", icon: ShieldAlert },
  { id: "acne", label: "Acne / Blemish Prone", icon: ScanFace },
  { id: "aging", label: "Aging / Maintenance", icon: Clock }
];

// Hair/Scalp Profile (Universal Concerns)
const hairScalpProfile = [
  { id: "straight", label: "Straight", icon: Wind },
  { id: "curly", label: "Curly / Textured", icon: Waves },
  { id: "thinning", label: "Thinning / Loss Prevention", icon: TrendingDown },
  { id: "dandruff", label: "Dandruff / Scalp Care", icon: Snowflake },
  { id: "beard", label: "Beard / Facial Hair", icon: User }
];

const springTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20
};

const ClusterBeauty = ({ onSubmit }: ClusterBeautyProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedOptions(prev => 
      prev.includes(id) 
        ? prev.filter(option => option !== id)
        : [...prev, id]
    );
  };

  const handleContinue = () => {
    onSubmit({ skinProfile: selectedOptions });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl tracking-premium" style={{ color: "#C2410C" }}>
          PERSONAL CARE PROFILE
        </h2>
        <div className="w-32 h-0.5 mx-auto" style={{ backgroundColor: "rgba(194, 65, 12, 0.5)" }} />
        <p className="text-sm text-kaeva-slate-400 mt-2">
          To track products and effectiveness, I need to know your profile.
        </p>
      </div>

      {/* Skin Conditions Section */}
      <div>
        <h3 className="text-sm uppercase tracking-wider text-kaeva-slate-400 mb-3 flex items-center gap-2">
          <Microscope size={16} />
          Skin Conditions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {skinConditions.map((condition) => {
            const Icon = condition.icon;
            return (
              <motion.button
                key={condition.id}
                onClick={() => toggleSelection(condition.id)}
                className={`glass-chip ${
                  selectedOptions.includes(condition.id) 
                    ? 'glass-chip-active' 
                    : ''
                } flex-col py-4`}
                style={selectedOptions.includes(condition.id) ? { borderColor: "#C2410C" } : {}}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={springTransition}
              >
                <Icon 
                  className="w-8 h-8 mb-2" 
                  strokeWidth={1.5}
                  style={selectedOptions.includes(condition.id) ? { color: "#C2410C" } : {}}
                />
                <span className="text-xs sm:text-sm tracking-wide text-center">
                  {condition.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Hair/Scalp Section */}
      <div>
        <h3 className="text-sm uppercase tracking-wider text-kaeva-slate-400 mb-3 flex items-center gap-2">
          <Activity size={16} />
          Hair / Scalp Profile
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {hairScalpProfile.map((profile) => {
            const Icon = profile.icon;
            return (
              <motion.button
                key={profile.id}
                onClick={() => toggleSelection(profile.id)}
                className={`glass-chip ${
                  selectedOptions.includes(profile.id) 
                    ? 'glass-chip-active' 
                    : ''
                } flex-col py-4`}
                style={selectedOptions.includes(profile.id) ? { borderColor: "#C2410C" } : {}}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={springTransition}
              >
                <Icon 
                  className="w-8 h-8 mb-2" 
                  strokeWidth={1.5}
                  style={selectedOptions.includes(profile.id) ? { color: "#C2410C" } : {}}
                />
                <span className="text-xs sm:text-sm tracking-wide text-center">
                  {profile.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Continue Button */}
      <motion.button
        onClick={handleContinue}
        className="w-full py-4 rounded-full border transition-all tracking-wider"
        style={{ 
          backgroundColor: "rgba(194, 65, 12, 0.2)",
          borderColor: "#C2410C",
          color: "#C2410C"
        }}
        whileHover={{ scale: 1.02, backgroundColor: "rgba(194, 65, 12, 0.3)" }}
        whileTap={{ scale: 0.98 }}
        transition={springTransition}
      >
        CONTINUE
      </motion.button>
    </div>
  );
};

export default ClusterBeauty;
