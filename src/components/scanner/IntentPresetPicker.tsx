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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-32 left-0 right-0 px-8"
        >
          <ScanModeCarousel preset={preset} onChange={onChange} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
