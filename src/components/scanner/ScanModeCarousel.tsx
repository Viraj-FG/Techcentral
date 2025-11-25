import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import { Camera, PackageOpen, Utensils, Sparkles, PawPrint, Zap, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IntentPreset } from './IntentPresetPicker';

interface ScanModeCarouselProps {
  preset: IntentPreset;
  onChange: (preset: IntentPreset) => void;
}

const modes: { value: IntentPreset; label: string; icon: LucideIcon }[] = [
  { value: null, label: 'Scan', icon: Camera },
  { value: 'inventory', label: 'Inventory', icon: PackageOpen },
  { value: 'nutrition', label: 'Nutrition', icon: Utensils },
  { value: 'beauty', label: 'Beauty', icon: Sparkles },
  { value: 'pets', label: 'Pets', icon: PawPrint },
  { value: 'appliances', label: 'Appliances', icon: Zap },
];

export const ScanModeCarousel = ({ preset, onChange }: ScanModeCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: true,
    skipSnaps: false,
    dragFree: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Find initial index based on preset
  useEffect(() => {
    const index = modes.findIndex((m) => m.value === preset);
    if (index !== -1 && emblaApi) {
      emblaApi.scrollTo(index, true);
      setSelectedIndex(index);
    }
  }, [preset, emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    onChange(modes[index].value);
  }, [emblaApi, onChange]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="w-full overflow-hidden" ref={emblaRef}>
      <div className="flex touch-pan-y">
        {modes.map((mode, index) => {
          const isActive = index === selectedIndex;
          
          return (
            <motion.div
              key={mode.value || 'scan'}
              className="flex-[0_0_33.33%] min-w-0 flex items-center justify-center"
              animate={{
                scale: isActive ? 1 : 0.75,
                opacity: isActive ? 1 : 0.4,
              }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => emblaApi?.scrollTo(index)}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "text-kaeva-sage"
                    : "text-white/60"
                )}
              >
                <mode.icon 
                  size={isActive ? 24 : 20} 
                  strokeWidth={1.5}
                />
                {mode.label}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
