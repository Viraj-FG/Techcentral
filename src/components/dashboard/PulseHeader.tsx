import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { kaevaTransition } from "@/hooks/useKaevaMotion";

interface PulseHeaderProps {
  profile: any;
}

const PulseHeader = ({ profile }: PulseHeaderProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const healthScore = 85; // Mock data for now
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <motion.div
      className="glass-card p-6 sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={kaevaTransition}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-display text-2xl sm:text-3xl text-white mb-2">
            {getGreeting()}, {profile.user_name || "User"}
          </h1>
        </div>

        {/* Compact Health Ring with Inline Insight */}
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24">
            <svg
              className="transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="hsl(var(--kaeva-slate-800))"
                strokeWidth="6"
                fill="none"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                stroke="hsl(var(--kaeva-sage))"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{
                  strokeDasharray: circumference,
                  filter: 'drop-shadow(0 0 10px rgba(112, 224, 152, 0.5))'
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-data text-xl text-kaeva-sage">{healthScore}%</span>
            </div>
          </div>

          <div className="max-w-[200px]">
            <p className="text-micro text-kaeva-oatmeal mb-1">Household Health</p>
            <p className="text-kaeva-teal flex items-center gap-2 text-xs">
              <Sparkles size={14} strokeWidth={1.5} />
              Sodium low this week
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PulseHeader;
