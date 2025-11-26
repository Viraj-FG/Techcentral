import { motion } from "framer-motion";

export const HeroHeaderBanner = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-background via-primary/5 to-secondary/10 p-8 lg:p-12"
    >
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left side: Text content */}
        <div className="flex-1 space-y-3 text-center lg:text-left">
          <h2 className="text-3xl lg:text-4xl font-light text-secondary">
            Managing your household
          </h2>
          <p className="text-base text-muted-foreground max-w-md">
            Track members, preferences, and safety settings in one place
          </p>
        </div>

        {/* Right side: Abstract family illustration */}
        <div className="relative w-48 h-48 lg:w-56 lg:h-56 flex-shrink-0">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Large circle - Adult 1 */}
            <circle
              cx="70"
              cy="100"
              r="45"
              fill="url(#gradient-primary)"
              opacity="0.9"
            />
            {/* Medium circle - Adult 2 */}
            <circle
              cx="130"
              cy="100"
              r="42"
              fill="url(#gradient-secondary)"
              opacity="0.85"
            />
            {/* Small circle - Child */}
            <circle
              cx="100"
              cy="140"
              r="28"
              fill="url(#gradient-accent)"
              opacity="0.8"
            />
            
            {/* Gradients */}
            <defs>
              <linearGradient id="gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="gradient-secondary" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--secondary))" />
                <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="gradient-accent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--accent))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </motion.div>
  );
};
