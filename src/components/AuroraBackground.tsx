import { motion } from "framer-motion";

interface AuroraBackgroundProps {
  atmosphereColor?: string;
}

const AuroraBackground = ({ atmosphereColor = "#70E098" }: AuroraBackgroundProps) => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Primary Orb */}
      <motion.div
        className="absolute w-96 h-96 rounded-full blur-3xl"
        animate={{
          backgroundColor: atmosphereColor,
          x: ["-20%", "120%"],
          y: ["20%", "80%"]
        }}
        transition={{
          backgroundColor: { duration: 1.5, ease: "easeInOut" },
          x: { duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
          y: { duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
        }}
        style={{ opacity: 0.3 }}
      />
      
      {/* Secondary Orb */}
      <motion.div
        className="absolute w-80 h-80 rounded-full blur-3xl"
        animate={{
          backgroundColor: atmosphereColor,
          x: ["100%", "-20%"],
          y: ["60%", "10%"]
        }}
        transition={{
          backgroundColor: { duration: 1.5, ease: "easeInOut" },
          x: { duration: 25, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
          y: { duration: 25, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
        }}
        style={{ opacity: 0.2 }}
      />
      
      {/* Tertiary Small Orb */}
      <motion.div
        className="absolute w-64 h-64 rounded-full blur-2xl"
        animate={{
          backgroundColor: atmosphereColor,
          x: ["50%", "50%"],
          y: ["-10%", "110%"]
        }}
        transition={{
          backgroundColor: { duration: 1.5, ease: "easeInOut" },
          x: { duration: 18, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
          y: { duration: 18, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
        }}
        style={{ opacity: 0.15 }}
      />
    </div>
  );
};

export default AuroraBackground;
