import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Scan } from 'lucide-react';

interface ActionPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoiceActivate: () => void;
  onScanActivate: () => void;
}

const ActionPickerDialog = ({ 
  open, 
  onOpenChange, 
  onVoiceActivate, 
  onScanActivate 
}: ActionPickerDialogProps) => {
  
  const handleVoice = () => {
    onOpenChange(false);
    onVoiceActivate();
  };

  const handleScan = () => {
    onOpenChange(false);
    onScanActivate();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop - tap to dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Floating Action Buttons Container */}
          <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] inset-x-0 z-50 flex justify-center pointer-events-none">
            <div className="relative w-full max-w-[320px] h-[72px]">
              
              {/* Left FAB - Voice */}
              <motion.button
                initial={{ x: 40, opacity: 0, scale: 0.5 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: 40, opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.05 }}
                onClick={handleVoice}
                className="pointer-events-auto absolute left-0 -top-16 group"
                aria-label="Start voice conversation with Kaeva"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-secondary blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                
                {/* Button */}
                <div className="relative w-14 h-14 rounded-full bg-secondary/20 border border-secondary/40 backdrop-blur-xl flex items-center justify-center group-hover:bg-secondary/30 group-hover:border-secondary/60 transition-all shadow-lg">
                  <Mic size={22} className="text-secondary" />
                </div>
                
                {/* Label */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
                >
                  <span className="text-xs font-medium text-secondary bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full border border-secondary/20">
                    Voice
                  </span>
                </motion.div>
              </motion.button>

              {/* Right FAB - Scan */}
              <motion.button
                initial={{ x: -40, opacity: 0, scale: 0.5 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -40, opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
                onClick={handleScan}
                className="pointer-events-auto absolute right-0 -top-16 group"
                aria-label="Open camera scanner for product analysis"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-accent blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                
                {/* Button */}
                <div className="relative w-14 h-14 rounded-full bg-accent/20 border border-accent/40 backdrop-blur-xl flex items-center justify-center group-hover:bg-accent/30 group-hover:border-accent/60 transition-all shadow-lg">
                  <Scan size={22} className="text-accent" />
                </div>
                
                {/* Label */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
                >
                  <span className="text-xs font-medium text-accent bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full border border-accent/20">
                    Scan
                  </span>
                </motion.div>
              </motion.button>

            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ActionPickerDialog;
