import { motion } from "framer-motion";
import { RefreshCw, LucideIcon } from "lucide-react";

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
  const getFillBarColor = (level: number) => {
    if (level <= 20) return 'bg-kaeva-terracotta';
    if (level <= 50) return 'bg-yellow-500';
    return 'bg-kaeva-sage';
  };

  const getFillLevelColor = (level: number) => {
    if (level <= 20) return 'text-kaeva-terracotta';
    if (level <= 50) return 'text-yellow-500';
    return 'text-kaeva-sage';
  };

  return (
    <motion.div
      className="glass-card p-5"
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <Icon className="text-kaeva-sage" size={28} />
        <h3 className="text-lg font-semibold text-kaeva-slate-200">{title}</h3>
      </div>

      <div className="space-y-4">
        {items.slice(0, 3).map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-kaeva-slate-300">{item.name}</span>
              <span className={`text-sm font-semibold ${getFillLevelColor(item.fillLevel)}`}>
                {item.fillLevel}%
              </span>
            </div>

            {/* Fill Level Bar */}
            <div className="h-2 bg-kaeva-void rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${getFillBarColor(item.fillLevel)}`}
                initial={{ width: 0 }}
                animate={{ width: `${item.fillLevel}%` }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
              />
            </div>

            {/* Auto-ordering Indicator */}
            {item.autoOrdering && (
              <motion.p
                className="text-xs text-kaeva-teal mt-1 flex items-center gap-1"
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
