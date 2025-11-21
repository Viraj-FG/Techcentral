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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-display text-3xl sm:text-4xl text-white">
            {getGreeting()}, {profile.user_name || "User"}
          </h1>
        </div>

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
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                stroke="hsl(var(--kaeva-sage))"
                strokeWidth="8"
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
              <span className="text-data text-2xl text-kaeva-sage">{healthScore}%</span>
            </div>
          </div>

          <div>
            <p className="text-micro text-kaeva-oatmeal">Household Health</p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-2xl bg-kaeva-teal/10 border-2 border-kaeva-teal/30">
        <p className="text-kaeva-teal flex items-center gap-2 text-body">
          <Sparkles size={20} strokeWidth={1.5} />
          Your sodium intake is low this week. Great job!
        </p>
      </div>
    </motion.div>
  );
};

export default PulseHeader;
