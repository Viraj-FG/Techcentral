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
    <div className="flex items-center justify-center gap-6 px-4 py-3 bg-kaeva-void/80 backdrop-blur-lg">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.value;
        
        return (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={cn(
              "relative flex flex-col items-center gap-1 transition-opacity",
              isActive ? "opacity-100" : "opacity-50"
            )}
          >
            <Icon className={cn(
              "w-6 h-6 transition-colors",
              isActive ? "text-kaeva-sage" : "text-white"
            )} />
            <span className={cn(
              "text-xs font-medium transition-colors",
              isActive ? "text-kaeva-sage" : "text-white"
            )}>
              {m.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="mode-indicator"
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-kaeva-sage rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
