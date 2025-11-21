import { motion } from "framer-motion";

const AuroraBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Primary Sage Orb */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-kaeva-sage/30 blur-3xl"
        animate={{
          x: ["-20%", "120%"],
          y: ["20%", "80%"]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
      
      {/* Secondary Teal Orb */}
      <motion.div
        className="absolute w-80 h-80 rounded-full bg-kaeva-teal/20 blur-3xl"
        animate={{
          x: ["100%", "-20%"],
          y: ["60%", "10%"]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
      
      {/* Tertiary Small Orb */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-kaeva-sage/15 blur-2xl"
        animate={{
          x: ["50%", "50%"],
          y: ["-10%", "110%"]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
    </div>
  );
};

export default AuroraBackground;
