import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Camera, PackageOpen, Utensils, Sparkles, PawPrint, Zap } from 'lucide-react';
import type { CaptureMode } from './ModeSelector';
import type { IntentPreset } from './IntentPresetPicker';

interface CaptureButtonProps {
  mode: CaptureMode;
  intentPreset: IntentPreset;
  isRecording?: boolean;
  isScanning?: boolean;
  onPress: () => void;
  onLongPressStart?: () => void;
  onLongPressEnd?: () => void;
}

export const CaptureButton = ({ 
  mode,
  intentPreset,
  isRecording, 
  isScanning,
  onPress,
  onLongPressStart,
  onLongPressEnd 
}: CaptureButtonProps) => {
  const getModeIcon = (preset: IntentPreset) => {
    switch (preset) {
      case 'inventory': return PackageOpen;
      case 'nutrition': return Utensils;
      case 'beauty': return Sparkles;
      case 'pets': return PawPrint;
      case 'appliances': return Zap;
      default: return Camera;
    }
  };

  const ModeIcon = getModeIcon(intentPreset);

  const handleTouchStart = () => {
    if (mode === 'video' && onLongPressStart) {
      onLongPressStart();
    }
  };

  const handleTouchEnd = () => {
    if (mode === 'video' && isRecording && onLongPressEnd) {
      onLongPressEnd();
    } else if (mode !== 'video') {
      onPress();
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Ring */}
      <motion.div
        animate={{
          scale: isRecording ? 1.1 : 1,
          opacity: isScanning ? 0.5 : 1,
        }}
        className={cn(
          "w-20 h-20 rounded-full border-4 transition-colors",
          isRecording ? "border-red-500" : "border-white"
        )}
      />
      
      {/* Inner Button */}
      <motion.button
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        whileTap={{ scale: 0.9 }}
        disabled={isScanning}
        className={cn(
          "absolute w-16 h-16 rounded-full transition-all duration-200 flex items-center justify-center",
          mode === 'photo' && "bg-white",
          mode === 'video' && (isRecording ? "bg-red-500" : "bg-white"),
          mode === 'barcode' && "bg-white",
          mode === 'auto' && "bg-white",
          isScanning && "opacity-50"
        )}
      >
        {mode === 'barcode' && !isRecording ? (
          <div className="w-8 h-8 border-2 border-background rounded" />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={intentPreset || 'scan'}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ModeIcon size={28} strokeWidth={1.5} className="text-background" />
            </motion.div>
          </AnimatePresence>
        )}
      </motion.button>

      {/* Recording Pulse */}
      {isRecording && (
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-20 h-20 rounded-full bg-red-500/30"
        />
      )}
    </div>
  );
};
