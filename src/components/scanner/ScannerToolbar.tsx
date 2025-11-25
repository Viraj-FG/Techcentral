import { motion, AnimatePresence } from 'framer-motion';
import { FlipHorizontal, Zap, ZapOff, Image as ImageIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ScannerToolbarProps {
  isFlashOn: boolean;
  onFlashToggle: () => void;
  onFlipCamera: () => void;
  onGalleryOpen: () => void;
  lastScanThumbnail?: string | null;
  onLastScanClick?: () => void;
}

interface ToolItem {
  icon: typeof ImageIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  thumbnail?: string;
}

export const ScannerToolbar = ({ 
  isFlashOn, 
  onFlashToggle, 
  onFlipCamera,
  onGalleryOpen,
  lastScanThumbnail,
  onLastScanClick
}: ScannerToolbarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const tools: ToolItem[] = [
    { 
      icon: FlipHorizontal, 
      label: 'Flip', 
      onClick: onFlipCamera 
    },
    { 
      icon: isFlashOn ? Zap : ZapOff, 
      label: 'Flash', 
      onClick: onFlashToggle,
      active: isFlashOn 
    },
    { 
      icon: ImageIcon, 
      label: 'Gallery', 
      onClick: onGalleryOpen 
    },
  ];

  // Add last scan button if available
  if (lastScanThumbnail && onLastScanClick) {
    tools.unshift({
      icon: ImageIcon,
      label: 'LastScan',
      onClick: onLastScanClick,
      thumbnail: lastScanThumbnail
    });
  }

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
      {/* Expand/Collapse Toggle */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center"
        whileTap={{ scale: 0.9 }}
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-white" />
        ) : (
          <ChevronUp className="w-5 h-5 text-white" />
        )}
      </motion.button>

      {/* Toolbar Items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-3"
          >
            {tools.map((tool: any) => {
              const Icon = tool.icon;
              return (
                <motion.button
                  key={tool.label}
                  onClick={tool.onClick}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors overflow-hidden",
                    tool.active 
                      ? "bg-kaeva-sage/20 border border-kaeva-sage" 
                      : "bg-white/10"
                  )}
                >
                  {tool.thumbnail ? (
                    <img src={tool.thumbnail} alt="Last scan" className="w-full h-full object-cover" />
                  ) : (
                    <Icon className={cn(
                      "w-5 h-5",
                      tool.active ? "text-kaeva-sage" : "text-white"
                    )} />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
