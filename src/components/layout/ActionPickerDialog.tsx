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
                className="w-full glass-chip !rounded-2xl !px-6 !py-5 group hover:bg-kaeva-sage/10 hover:border-kaeva-sage/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-kaeva-sage/20 flex items-center justify-center group-hover:bg-kaeva-sage/30 transition-all">
                    <Mic size={24} className="text-kaeva-sage" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-display text-sm font-medium text-kaeva-oatmeal">
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
                className="w-full glass-chip !rounded-2xl !px-6 !py-5 group hover:bg-kaeva-electric-sky/10 hover:border-kaeva-electric-sky/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-kaeva-electric-sky/20 flex items-center justify-center group-hover:bg-kaeva-electric-sky/30 transition-all">
                    <Scan size={24} className="text-kaeva-electric-sky" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-display text-sm font-medium text-kaeva-oatmeal">
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
