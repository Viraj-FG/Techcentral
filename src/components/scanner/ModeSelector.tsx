import { motion } from 'framer-motion';
import { Camera, Video, ScanLine, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CaptureMode = 'photo' | 'video' | 'barcode' | 'auto';

interface ModeSelectorProps {
  mode: CaptureMode;
  onChange: (mode: CaptureMode) => void;
}

const modes: { value: CaptureMode; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'photo', label: 'Photo', icon: Camera },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'barcode', label: 'Barcode', icon: ScanLine },
  { value: 'auto', label: 'Auto', icon: Sparkles },
];

export const ModeSelector = ({ mode, onChange }: ModeSelectorProps) => {
  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.value;
        
        return (
          <motion.button
            key={m.value}
            onClick={() => onChange(m.value)}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors",
              isActive 
                ? "bg-secondary/20 border border-secondary" 
                : "bg-white/10"
            )}
          >
            <Icon className={cn(
              "w-5 h-5",
              isActive ? "text-secondary" : "text-white"
            )} />
          </motion.button>
        );
      })}
    </div>
  );
};
