import { motion, AnimatePresence } from 'framer-motion';
import { ScanModeCarousel } from './ScanModeCarousel';

export type IntentPreset = 'inventory' | 'nutrition' | 'beauty' | 'pets' | 'appliances' | null;

interface IntentPresetPickerProps {
  preset: IntentPreset;
  onChange: (preset: IntentPreset) => void;
  isVisible: boolean;
}

export const IntentPresetPicker = ({ preset, onChange, isVisible }: IntentPresetPickerProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="w-full"
        >
          <ScanModeCarousel preset={preset} onChange={onChange} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
