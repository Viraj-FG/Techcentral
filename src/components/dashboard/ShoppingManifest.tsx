import { motion } from "framer-motion";
import { Package, ChefHat, ShoppingCart, Shield } from "lucide-react";
import { kaevaEntranceVariants } from "@/hooks/useKaevaMotion";

interface ShoppingItem {
  id: string;
  name: string;
  source: 'auto_refill' | 'recipe' | 'manual';
  priority: 'high' | 'normal' | 'low';
  reason?: string;
  recipeName?: string;
  safetySwap?: {
    originalItem: string;
    allergen: string;
  };
  quantity?: number;
  unit?: string;
}

interface ShoppingManifestProps {
  items: ShoppingItem[];
}

const ShoppingManifest = ({ items }: ShoppingManifestProps) => {
  const groupedItems = {
    auto_refill: items.filter(i => i.source === 'auto_refill'),
    recipe: items.filter(i => i.source === 'recipe'),
    manual: items.filter(i => i.source === 'manual')
  };

  const renderItemGroup = (title: string, icon: React.ReactNode, groupItems: ShoppingItem[]) => {
    if (groupItems.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase">{title}</h4>
          <span className="text-xs text-slate-500">({groupItems.length})</span>
        </div>
        
        <div className="space-y-2">
          {groupItems.map((item, idx) => (
            <motion.div
              key={item.id}
              variants={kaevaEntranceVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: idx * 0.05 }}
              className={`p-3 rounded-lg border ${
                item.safetySwap 
                  ? 'bg-yellow-500/10 border-yellow-500/30' 
                  : 'bg-slate-800/40 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm truncate">{item.name}</span>
                    {item.safetySwap && (
                      <Shield size={14} className="text-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  {/* Reason/Context */}
                  {item.source === 'auto_refill' && item.reason && (
                    <p className="text-xs text-slate-400 mt-1">
                      {item.reason}
                    </p>
                  )}
                  
                  {item.source === 'recipe' && item.recipeName && (
                    <p className="text-xs text-accent mt-1 truncate">
                      For "{item.recipeName}"
                    </p>
                  )}

                  {/* Safety Swap Notice */}
                  {item.safetySwap && (
                    <p className="text-xs text-yellow-500 mt-1 font-medium">
                      Swapped for {item.safetySwap.allergen} Safety
                    </p>
                  )}
                </div>

                <div className="text-right flex-shrink-0 ml-3">
                  <span className="text-xs text-slate-400">
                    {item.quantity} {item.unit || 'unit'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderItemGroup(
        'Auto-Refill',
        <Package size={14} className="text-destructive" />,
        groupedItems.auto_refill
      )}
      
      {renderItemGroup(
        'Recipe Ingredients',
        <ChefHat size={14} className="text-accent" />,
        groupedItems.recipe
      )}
      
      {renderItemGroup(
        'Manual Additions',
        <ShoppingCart size={14} className="text-secondary" />,
        groupedItems.manual
      )}
    </div>
  );
};

export default ShoppingManifest;
