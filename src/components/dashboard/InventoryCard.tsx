import { motion } from "framer-motion";
import { RefreshCw, LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";

interface InventoryItem {
  name: string;
  fillLevel: number;
  unit: string;
  status: string;
  autoOrdering: boolean;
}

interface InventoryCardProps {
  title: string;
  icon: LucideIcon;
  items: InventoryItem[];
  status?: 'good' | 'warning' | 'normal';
}

const InventoryCard = ({ title, icon: Icon, items, status = 'normal' }: InventoryCardProps) => {
  const [shouldFlash, setShouldFlash] = useState(false);

  // Flash animation when items change
  useEffect(() => {
    setShouldFlash(true);
    const timer = setTimeout(() => setShouldFlash(false), 1500);
    return () => clearTimeout(timer);
  }, [items.length]);

  // Calculate average fill level for status bar
  const avgFillLevel = items.length > 0 
    ? Math.round(items.reduce((acc, item) => acc + item.fillLevel, 0) / items.length)
    : 50;

  // Status-based styling
  const statusColor = status === 'good' ? 'text-emerald-400' : status === 'warning' ? 'text-[#D97757]' : 'text-slate-400';
  const statusBg = status === 'good' ? 'bg-emerald-400/10' : status === 'warning' ? 'bg-[#D97757]/10' : 'bg-white/5';
  const barColor = status === 'good' ? 'bg-emerald-500' : status === 'warning' ? 'bg-[#D97757]' : 'bg-slate-600';
  const barWidth = status === 'good' ? 'w-[80%]' : status === 'warning' ? 'w-[20%]' : 'w-[50%]';

  const getFillColor = (level: number) => {
    if (level <= 20) return "bg-red-400";
    if (level <= 50) return "bg-amber-400";
    return "bg-emerald-400";
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={cardVariants}
      animate={shouldFlash ? {
        boxShadow: [
          "0 0 0px rgba(112,224,152,0)",
          "0 0 40px rgba(112,224,152,0.8)",
          "0 0 0px rgba(112,224,152,0)"
        ]
      } : {}}
      transition={{ duration: 1.5 }}
      className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all cursor-pointer aspect-square flex flex-col justify-between"
    >
      {/* Header: Icon & Warning Dot */}
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg ${statusBg}`}>
          <Icon className={statusColor} size={20} strokeWidth={1.5} />
        </div>
        {status === 'warning' && (
          <div className="w-2 h-2 rounded-full bg-[#D97757] animate-pulse" />
        )}
      </div>
      
      {/* Title & Subtitle */}
      <div>
        <h3 className="text-base font-medium text-slate-200 mb-1">
          {title}
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          {status === 'good' ? 'Stock Good' : status === 'warning' ? `${items[0]?.name || 'Item'} Low` : 'Routine Active'}
        </p>
        
        {/* Status Fill Bar */}
        <div className="h-1 w-full bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${barColor} ${barWidth} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: barWidth }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default InventoryCard;
