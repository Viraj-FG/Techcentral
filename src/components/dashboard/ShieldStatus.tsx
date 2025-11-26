import { motion } from "framer-motion";
import { Shield, CheckCircle2 } from "lucide-react";

interface ShieldStatusProps {
  profile: any;
}

const ShieldStatus = ({ profile }: ShieldStatusProps) => {
  const getActiveFilters = () => {
    const filters: string[] = [];

    // Dietary values
    if (profile.dietaryValues && Array.isArray(profile.dietaryValues)) {
      filters.push(...profile.dietaryValues);
    }

    // Allergies (convert to X-Free format)
    if (profile.allergies && Array.isArray(profile.allergies)) {
      filters.push(...profile.allergies.map((a: string) => `${a}-Free`));
    }

    // Health goals/conditions
    if (profile.healthGoals && Array.isArray(profile.healthGoals)) {
      filters.push(...profile.healthGoals);
    }

    return filters;
  };

  const activeFilters = getActiveFilters();

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="glass-card p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.75 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Shield className="text-accent" size={22} />
        <h3 className="text-lg font-semibold text-foreground/90">
          Active Protection
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {activeFilters.map((filter, idx) => (
          <motion.div
            key={filter}
            className="glass-chip px-3 py-1.5 text-sm flex items-center gap-2 border border-secondary/30"
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 0 0px rgba(112, 224, 152, 0)',
                '0 0 10px rgba(112, 224, 152, 0.3)',
                '0 0 0px rgba(112, 224, 152, 0)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: idx * 0.3
            }}
          >
            <CheckCircle2 size={14} className="text-secondary" />
            <span className="text-muted-foreground/70">{filter}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ShieldStatus;
