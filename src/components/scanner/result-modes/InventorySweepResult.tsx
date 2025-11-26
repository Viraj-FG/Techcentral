import { useState } from 'react';
import { motion } from 'framer-motion';
import { PackageOpen, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DetectedItem {
  name: string;
  brand?: string;
  category: 'fridge' | 'pantry' | 'beauty' | 'pets' | 'appliance' | 'meal';
  confidence: number;
  product_image_url?: string;
  metadata?: {
    estimated_shelf_life_days?: number;
  };
  nutrition?: {
    calories?: number;
    protein?: number;
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

  const handleAddToCart = async (item: EditableItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.current_household_id) {
      toast.error('No household found');
      return;
    }

    const { error } = await supabase
      .from('shopping_list')
      .insert({
        household_id: profile.current_household_id,
        item_name: item.name,
        quantity: item.quantity,
        unit: 'units',
        source: 'scan',
        priority: 'normal',
        status: 'pending'
      });

    if (!error) {
      toast.success(`${item.name} added to cart`);
    } else {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Found <span className="font-bold text-foreground">{items.length}</span> items
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
            className="flex items-center gap-3 p-3 bg-card/40 rounded-xl border border-border/50"
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={item.selected}
              onChange={() => toggleItem(index)}
              className="w-5 h-5 rounded accent-secondary"
            />

            {/* Thumbnail */}
            <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              {item.product_image_url ? (
                <img src={item.product_image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <PackageOpen className="w-6 h-6 text-muted-foreground" />
              )}
            </div>

            {/* Name & badges */}
            <div className="flex-1 min-w-0 space-y-2">
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateName(index, e.target.value)}
                className="w-full bg-transparent text-foreground font-medium outline-none"
              />
              {item.brand && (
                <p className="text-xs text-muted-foreground">{item.brand}</p>
              )}
              
              {/* Nutrition Preview Badge */}
              {item.nutrition && (item.nutrition.calories || item.nutrition.protein) && (
                <Badge variant="outline" className="text-xs">
                  {item.nutrition.calories && `${item.nutrition.calories} cal`}
                  {item.nutrition.calories && item.nutrition.protein && ' | '}
                  {item.nutrition.protein && `${item.nutrition.protein}g protein`}
                </Badge>
              )}
              
              <div className="flex gap-2">
                {item.isExpired && (
                  <span className="text-xs px-2 py-0.5 bg-destructive/20 text-destructive rounded-full border border-destructive/30">
                    Expired
                  </span>
                )}
                {item.isExpiringSoon && !item.isExpired && (
                  <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full border border-primary/30">
                    Expiring Soon
                  </span>
                )}
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleAddToCart(item)}
              className="flex-shrink-0"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>

            {/* Quantity stepper */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => decrementQuantity(index)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-semibold text-foreground">{item.quantity}</span>
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
