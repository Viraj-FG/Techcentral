import { motion } from "framer-motion";
import { RefreshCw, LucideIcon, ChefHat } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { differenceInDays } from "date-fns";

interface InventoryItem {
  id?: string;
  name: string;
  fillLevel: number;
  unit: string;
  status: string;
  autoOrdering: boolean;
  expiry_date?: string | null;
  category?: string;
}

interface InventoryCardProps {
  title: string;
  icon: LucideIcon;
  items: InventoryItem[];
  status?: 'good' | 'warning' | 'normal';
  onRefill?: (item: InventoryItem) => void;
  onCookNow?: (ingredients: string[]) => void;
}

const InventoryCard = ({ title, icon: Icon, items, status = 'normal', onRefill, onCookNow }: InventoryCardProps) => {
  const [shouldFlash, setShouldFlash] = useState(false);
  const { trigger: triggerHaptic } = useHapticFeedback();

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

  // Get expiring items (within 3 days)
  const expiringItems = items.filter(item => {
    if (!item.expiry_date) return false;
    const daysUntilExpiry = differenceInDays(new Date(item.expiry_date), new Date());
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 3;
  }).sort((a, b) => {
    const daysA = differenceInDays(new Date(a.expiry_date!), new Date());
    const daysB = differenceInDays(new Date(b.expiry_date!), new Date());
    return daysA - daysB;
  });

  // Get low stock items
  const lowStockItems = items.filter(item => item.fillLevel < 20);

  // Status-based styling
  const statusColor = status === 'good' ? 'text-emerald-400' : status === 'warning' ? 'text-[#D97757]' : 'text-slate-400';
  const statusBg = status === 'good' ? 'bg-emerald-400/10' : status === 'warning' ? 'bg-[#D97757]/10' : 'bg-white/5';

  const getFillGradient = (level: number) => {
    if (level <= 20) return "bg-gradient-to-r from-red-400 to-red-500";
    if (level <= 50) return "bg-gradient-to-r from-amber-400 to-amber-500";
    return "bg-gradient-to-r from-emerald-400 to-emerald-500";
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
      className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all"
    >
      {/* Header: Icon & Action Buttons */}
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-lg ${statusBg}`}>
          <Icon className={statusColor} size={20} strokeWidth={1.5} />
        </div>
        <div className="flex gap-1">
          {status === 'warning' && (
            <div className="w-2 h-2 rounded-full bg-[#D97757] animate-pulse" />
          )}
        </div>
      </div>
      
      {/* Title & Subtitle */}
      <div className="mb-3">
        <h3 className="text-base font-medium text-slate-200 mb-1">
          {title}
        </h3>
        <p className="text-xs text-slate-400">
          {status === 'good' ? 'Stock Good' : status === 'warning' ? `${items[0]?.name || 'Item'} Low` : 'Routine Active'}
        </p>
      </div>

      {/* Expiring Items Alert */}
      {expiringItems.length > 0 && (
        <div className="mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-amber-400">⚠️ USE FIRST</span>
          </div>
          {expiringItems.slice(0, 2).map((item, idx) => {
            const daysLeft = differenceInDays(new Date(item.expiry_date!), new Date());
            return (
              <div key={idx} className="flex items-center justify-between text-xs text-white/70 mt-1">
                <span className="truncate flex-1">{item.name}</span>
                <span className="text-amber-400 ml-2">{daysLeft}d</span>
              </div>
            );
          })}
          {onCookNow && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                triggerHaptic('medium');
                onCookNow(expiringItems.map(i => i.name));
              }}
              className="w-full mt-2 h-7 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs"
            >
              <ChefHat className="w-3 h-3 mr-1" />
              Cook Now
            </Button>
          )}
        </div>
      )}

      {/* Low Stock Items */}
      {lowStockItems.length > 0 && (
        <div className="space-y-2 mb-3">
          {lowStockItems.slice(0, 2).map((item, idx) => (
            <div key={idx} className="relative">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-white/70 truncate flex-1">{item.name}</span>
                <span className="text-white/50">{item.fillLevel}%</span>
              </div>
              {/* Visual Fill Bar */}
              <div className="h-1 w-full bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                  layoutId={`fillBar-${item.id}`}
                  className={`h-full ${getFillGradient(item.fillLevel)} ${item.fillLevel <= 20 ? 'animate-pulse' : ''}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.fillLevel}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              {item.fillLevel < 20 && onRefill && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    triggerHaptic('light');
                    onRefill(item);
                  }}
                  className="absolute -top-1 right-0 h-6 px-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refill
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Overall Status Fill Bar */}
      <div className="h-1 w-full bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div 
          className={getFillGradient(avgFillLevel)}
          initial={{ width: 0 }}
          animate={{ width: `${avgFillLevel}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
};

export default InventoryCard;
