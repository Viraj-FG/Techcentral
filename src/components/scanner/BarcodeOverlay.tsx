import { motion } from 'framer-motion';

export const BarcodeOverlay = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Targeting Frame */}
      <div className="relative w-64 h-40 border-2 border-primary rounded-lg">
        {/* Corner Accents */}
        <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
        <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg" />
        
        {/* Scanning Line Animation */}
        <motion.div
          animate={{
            y: [-80, 80],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
        />

        {/* Instruction Text */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center">
          <p className="text-sm text-white font-medium">Align barcode within frame</p>
        </div>
      </div>
    </div>
  );
};
