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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 w-80"
          >
            <div className="glass-card p-4 space-y-3">
              {/* Voice Option */}
              <button
                onClick={handleVoice}
                className="w-full glass-chip !rounded-2xl !px-6 !py-5 group hover:bg-secondary/10 hover:border-secondary/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center group-hover:bg-secondary/30 transition-all">
                    <Mic size={24} className="text-secondary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-display text-sm font-medium text-foreground">
                      Talk to Kaeva
                    </div>
                    <div className="text-body text-xs text-slate-400">
                      Voice conversation
                    </div>
                  </div>
                </div>
              </button>

              {/* Scan Option */}
              <button
                onClick={handleScan}
                className="w-full glass-chip !rounded-2xl !px-6 !py-5 group hover:bg-accent/10 hover:border-accent/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-all">
                    <Scan size={24} className="text-accent" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-display text-sm font-medium text-foreground">
                      Scan Something
                    </div>
                    <div className="text-body text-xs text-slate-400">
                      Camera & vision analysis
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ActionPickerDialog;
