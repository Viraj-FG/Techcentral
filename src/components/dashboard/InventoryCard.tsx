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
}

const InventoryCard = ({ title, icon: Icon, items }: InventoryCardProps) => {
  const [shouldFlash, setShouldFlash] = useState(false);

  // Flash animation when items change
  useEffect(() => {
    setShouldFlash(true);
    const timer = setTimeout(() => setShouldFlash(false), 1500);
    return () => clearTimeout(timer);
  }, [items.length]);

  const getIconBg = (title: string) => {
    switch(title) {
      case "Fridge": return "bg-emerald-400/10";
      case "Pantry": return "bg-emerald-400/10";
      case "Beauty": return "bg-orange-400/10";
      case "Pets": return "bg-sky-400/10";
      default: return "bg-white/10";
    }
  };

  const getIconColor = (title: string) => {
    switch(title) {
      case "Beauty": return "text-orange-400";
      case "Pets": return "text-sky-400";
      default: return "text-emerald-400";
    }
  };

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
      className="group relative overflow-hidden rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-colors"
    >
      {/* Icon with contextual color */}
      <div className={`p-3 rounded-lg mb-4 ${getIconBg(title)}`}>
        <Icon className={getIconColor(title)} size={24} strokeWidth={1.5} />
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-light tracking-wider text-white/90 mb-4">
        {title}
      </h3>
      
      {/* Fill Level Bars */}
      <div className="space-y-3">
        {items.slice(0, 3).map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/70">{item.name}</span>
              <span className="text-white/50">{item.fillLevel}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.fillLevel}%` }}
                transition={{ duration: 1, delay: idx * 0.1 }}
                className={`h-full ${getFillColor(item.fillLevel)}`}
              />
            </div>
            
            {/* Auto-ordering Indicator */}
            {item.autoOrdering && (
              <motion.p
                className="text-xs text-emerald-400 mt-1 flex items-center gap-1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <RefreshCw size={12} className="animate-spin" />
                Auto-ordering...
              </motion.p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default InventoryCard;
