import { useState } from 'react';
import { motion } from 'framer-motion';
import { PackageOpen, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DetectedItem {
  name: string;
  brand?: string;
  category: 'fridge' | 'pantry' | 'beauty' | 'pets' | 'appliance' | 'meal';
  confidence: number;
  product_image_url?: string;
  metadata?: {
    estimated_shelf_life_days?: number;
  };
}

interface EditableItem extends DetectedItem {
  quantity: number;
  selected: boolean;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

const InventorySweepResult = ({ items }: { items: DetectedItem[] }) => {
  const [editableItems, setEditableItems] = useState<EditableItem[]>(
    items.map(item => ({
      ...item,
      quantity: 1,
      selected: true,
      isExpiringSoon: (item.metadata?.estimated_shelf_life_days || 30) < 14,
      isExpired: (item.metadata?.estimated_shelf_life_days || 30) < 0
    }))
  );

  const toggleItem = (index: number) => {
    setEditableItems(prev => prev.map((item, i) =>
      i === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const updateName = (index: number, newName: string) => {
    setEditableItems(prev => prev.map((item, i) =>
      i === index ? { ...item, name: newName } : item
    ));
  };

  const incrementQuantity = (index: number) => {
    setEditableItems(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const decrementQuantity = (index: number) => {
    setEditableItems(prev => prev.map((item, i) =>
      i === index && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
    ));
  };

  const selectAll = () => {
    setEditableItems(prev => prev.map(item => ({ ...item, selected: true })));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-300">
          Found <span className="font-bold text-white">{items.length}</span> items
        </p>
        <Button variant="ghost" size="sm" onClick={selectAll} className="text-secondary">
          Select All
        </Button>
      </div>

      <div className="space-y-3">
        {editableItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50"
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={item.selected}
              onChange={() => toggleItem(index)}
              className="w-5 h-5 rounded accent-secondary"
            />

            {/* Thumbnail */}
            <div className="w-14 h-14 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
              {item.product_image_url ? (
                <img src={item.product_image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <PackageOpen className="w-6 h-6 text-slate-400" />
              )}
            </div>

            {/* Name & badges */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateName(index, e.target.value)}
                className="w-full bg-transparent text-white font-medium outline-none"
              />
              {item.brand && (
                <p className="text-xs text-slate-400 mt-0.5">{item.brand}</p>
              )}
              <div className="flex gap-2 mt-1">
                {item.isExpired && (
                  <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                    Expired
                  </span>
                )}
                {item.isExpiringSoon && !item.isExpired && (
                  <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
                    Expiring Soon
                  </span>
                )}
              </div>
            </div>

            {/* Quantity stepper */}
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => decrementQuantity(index)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-semibold text-white">{item.quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => incrementQuantity(index)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default InventorySweepResult;
