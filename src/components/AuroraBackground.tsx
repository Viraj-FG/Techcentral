import { motion } from "framer-motion";

interface AuroraBackgroundProps {
  atmosphereColor?: string;
  vertical?: "food" | "beauty" | "pets" | null;
}

const AuroraBackground = ({ atmosphereColor, vertical }: AuroraBackgroundProps) => {
  // Map vertical to atmosphere color
  const getAtmosphereColor = () => {
    if (vertical === "food") return "rgb(112, 224, 152)";      // Sage Green
    if (vertical === "beauty") return "rgb(194, 65, 12)";      // Terracotta
    if (vertical === "pets") return "rgb(56, 189, 248)";       // Electric Sky
    return atmosphereColor || "rgb(112, 224, 152)";            // Default Sage
  };

  const color = getAtmosphereColor();
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Primary Orb */}
      <motion.div
        className="absolute w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full blur-xl sm:blur-2xl md:blur-3xl"
        style={{ willChange: 'transform', transform: 'translateZ(0)', opacity: 0.3 }}
        animate={{
          backgroundColor: color,
          x: ["10%", "80%"],
          y: ["20%", "80%"]
        }}
        transition={{
          backgroundColor: { duration: 1.5, ease: "easeInOut" },
          x: { duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
          y: { duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
        }}
      />
      
      {/* Secondary Orb */}
      <motion.div
        className="absolute w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full blur-xl sm:blur-2xl md:blur-3xl"
        style={{ willChange: 'transform', transform: 'translateZ(0)', opacity: 0.2 }}
        animate={{
          backgroundColor: color,
          x: ["80%", "10%"],
          y: ["50%", "20%"]
        }}
        transition={{
          backgroundColor: { duration: 1.5, ease: "easeInOut" },
          x: { duration: 25, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
          y: { duration: 25, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
        }}
      />
      
      {/* Tertiary Small Orb */}
      <motion.div
        className="absolute w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full blur-lg sm:blur-xl md:blur-2xl"
        style={{ willChange: 'transform', transform: 'translateZ(0)', opacity: 0.15 }}
        animate={{
          backgroundColor: color,
          x: ["50%", "50%"],
          y: ["10%", "90%"]
        }}
        transition={{
          backgroundColor: { duration: 1.5, ease: "easeInOut" },
          x: { duration: 18, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
          y: { duration: 18, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
        }}
      />
    </div>
  );
};

export default AuroraBackground;
