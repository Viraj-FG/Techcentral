import { motion, AnimatePresence } from 'framer-motion';
import { PackageOpen, Utensils, Sparkles, PawPrint, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';

export type IntentPreset = 'inventory' | 'nutrition' | 'beauty' | 'pets' | 'appliances' | null;

interface IntentPresetPickerProps {
  preset: IntentPreset;
  onChange: (preset: IntentPreset) => void;
  isVisible: boolean;
}

const presets: { value: Exclude<IntentPreset, null>; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'inventory', label: 'Inventory', icon: PackageOpen },
  { value: 'nutrition', label: 'Nutrition', icon: Utensils },
  { value: 'beauty', label: 'Beauty', icon: Sparkles },
  { value: 'pets', label: 'Pets', icon: PawPrint },
  { value: 'appliances', label: 'Appliances', icon: Tv },
];

export const IntentPresetPicker = ({ preset, onChange, isVisible }: IntentPresetPickerProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-48 left-0 right-0 flex justify-center px-4"
        >
          <div className="flex gap-2 p-2 bg-kaeva-void/80 backdrop-blur-lg rounded-full">
            {presets.map((p) => {
              const Icon = p.icon;
              const isActive = preset === p.value;
              
              return (
                <motion.button
                  key={p.value}
                  onClick={() => onChange(isActive ? null : p.value)}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-full transition-all",
                    isActive 
                      ? "bg-kaeva-sage/20 border border-kaeva-sage" 
                      : "bg-transparent"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-kaeva-sage" : "text-white"
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    isActive ? "text-kaeva-sage" : "text-white"
                  )}>
                    {p.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
