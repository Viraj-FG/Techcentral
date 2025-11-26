import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ScannerHUDProps {
  mode: 'inventory' | 'nutrition' | 'beauty' | 'pets' | 'appliances';
  isScanning: boolean;
}

export const ScannerHUD = ({ mode, isScanning }: ScannerHUDProps) => {
  const [showHint, setShowHint] = useState(true);

  // Hide hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const scanLineColor = mode === 'inventory' ? 'bg-kaeva-sage' : 'bg-kaeva-teal';
  const glowColor = mode === 'inventory' 
    ? 'shadow-[0_0_20px_rgba(112,224,152,0.6)]' 
    : 'shadow-[0_0_20px_rgba(56,189,248,0.6)]';

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Corner Brackets */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Top Left */}
        <path d="M 5,20 L 5,5 L 20,5" stroke="rgba(112,224,152,0.6)" strokeWidth="0.3" fill="none" />
        {/* Top Right */}
        <path d="M 80,5 L 95,5 L 95,20" stroke="rgba(112,224,152,0.6)" strokeWidth="0.3" fill="none" />
        {/* Bottom Left */}
        <path d="M 5,80 L 5,95 L 20,95" stroke="rgba(112,224,152,0.6)" strokeWidth="0.3" fill="none" />
        {/* Bottom Right */}
        <path d="M 80,95 L 95,95 L 95,80" stroke="rgba(112,224,152,0.6)" strokeWidth="0.3" fill="none" />
      </svg>

      {/* Grid Overlay (Subtle) */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(112, 224, 152, .05) 25%, rgba(112, 224, 152, .05) 26%, transparent 27%, transparent 74%, rgba(112, 224, 152, .05) 75%, rgba(112, 224, 152, .05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(112, 224, 152, .05) 25%, rgba(112, 224, 152, .05) 26%, transparent 27%, transparent 74%, rgba(112, 224, 152, .05) 75%, rgba(112, 224, 152, .05) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Animated Scan Line */}
      {isScanning && (
        <motion.div
          className={`absolute left-0 right-0 h-0.5 ${scanLineColor} ${glowColor}`}
          initial={{ top: '10%' }}
          animate={{ top: ['10%', '90%', '10%'] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* Fleeting Hint Text */}
      {showHint && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-8 left-0 right-0 text-center"
        >
          <div className="inline-block px-4 py-2 rounded-full bg-kaeva-void/80 backdrop-blur-md border border-kaeva-sage/30">
            <p className="text-kaeva-sage text-xs text-body">
              Point at a product, barcode, or shelf
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
