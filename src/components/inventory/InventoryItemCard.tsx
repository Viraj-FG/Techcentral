import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditItemModal } from './EditItemModal';
import { 
  MoreVertical, 
  Minus, 
  Plus, 
  ShoppingCart, 
  Edit, 
  AlertTriangle, 
  Trash2,
  Package,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InventoryItem {
  id: string;
  household_id: string;
  name: string;
  brand_name: string | null;
  category: 'fridge' | 'pantry' | 'beauty' | 'pets';
  quantity: number | null;
  unit: string | null;
  fill_level: number | null;
  expiry_date: string | null;
  status: string | null;
  auto_order_enabled: boolean;
  reorder_threshold: number | null;
  product_image_url: string | null;
}

interface Props {
  item: InventoryItem;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: () => void;
  onLongPress: () => void;
  onRefresh: () => void;
}

export const InventoryItemCard = ({
  item,
  isSelectionMode,
  isSelected,
  onToggleSelection,
  onLongPress,
  onRefresh
}: Props) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const fillLevel = item.fill_level || 50;
  const quantity = item.quantity || 0;
  
  // Calculate days until expiry
  const daysUntilExpiry = item.expiry_date 
    ? Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const getFillLevelColor = (level: number) => {
    if (level <= 20) return 'bg-destructive';
    if (level <= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const updateQuantity = useCallback(async (newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setIsUpdating(true);
    
    const newFillLevel = item.quantity && item.quantity > 0 
      ? Math.round((newQuantity / item.quantity) * 100)
      : 50;

    const { error } = await supabase
      .from('inventory')
      .update({ 
        quantity: newQuantity,
        fill_level: newFillLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    setIsUpdating(false);

    if (error) {
      toast.error('Failed to update quantity');
    }
  }, [item.id, item.quantity]);

  const handleMoveToCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.current_household_id) return;

    const { error: cartError } = await supabase
      .from('shopping_list')
      .insert({
        item_name: item.name,
        household_id: profile.current_household_id,
        source: 'manual',
        priority: 'normal',
        quantity: 1,
        unit: item.unit,
        inventory_id: item.id
      });

    if (!cartError) {
      await supabase
        .from('inventory')
        .update({ status: 'out_of_stock', fill_level: 0 })
        .eq('id', item.id);

      toast.success(`${item.name} moved to shopping list`);
    } else {
      toast.error('Failed to move item');
    }
  };

  const handleMarkSpoiled = async () => {
    const { error } = await supabase
      .from('inventory')
      .update({ 
        status: 'likely_spoiled', 
        fill_level: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    if (!error) {
      toast.warning('Item marked as spoiled');
    } else {
      toast.error('Failed to mark as spoiled');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${item.name}?`)) return;

    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', item.id);

    if (!error) {
      toast.success('Item deleted');
    } else {
      toast.error('Failed to delete item');
    }
  };

  const handleMouseDown = () => {
    const timer = setTimeout(() => {
      onLongPress();
    }, 500);
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0 }
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        className={cn(
          "relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:bg-card/70 transition-all cursor-pointer",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={() => isSelectionMode && onToggleSelection()}
      >
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <div className="absolute top-3 right-3 z-10">
            <Checkbox checked={isSelected} onCheckedChange={onToggleSelection} />
          </div>
        )}

        {/* Product Image / Icon */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            {item.product_image_url ? (
              <img 
                src={item.product_image_url} 
                alt={item.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Package className="w-6 h-6 text-primary" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
            {item.brand_name && (
              <p className="text-sm text-muted-foreground truncate">{item.brand_name}</p>
            )}
          </div>

          {!isSelectionMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleMoveToCart}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Move to Shopping List
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleMarkSpoiled}>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Mark as Spoiled
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Item
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry >= 0 && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
              Expires in {daysUntilExpiry}d
            </Badge>
          )}
          {item.auto_order_enabled && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <RefreshCw className="w-3 h-3 mr-1" />
              Auto-order
            </Badge>
          )}
        </div>

        {/* Fill Level Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Fill Level</span>
            <span>{fillLevel}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillLevel}%` }}
              className={cn(
                "h-full rounded-full transition-all duration-300",
                getFillLevelColor(fillLevel),
                fillLevel <= 20 && "animate-pulse"
              )}
            />
          </div>
        </div>

        {/* Quantity Stepper */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                updateQuantity(quantity - 1);
              }}
              disabled={isUpdating || quantity <= 0}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {isUpdating ? '...' : `${quantity} ${item.unit || ''}`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                updateQuantity(quantity + 1);
              }}
              disabled={isUpdating}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <Badge 
            variant="outline" 
            className={cn(
              "capitalize",
              item.status === 'likely_spoiled' && "bg-destructive/10 text-destructive border-destructive/20",
              item.status === 'low' && "bg-amber-500/10 text-amber-600 border-amber-500/20"
            )}
          >
            {item.status || 'sufficient'}
          </Badge>
        </div>
      </motion.div>

      <EditItemModal
        item={item}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={onRefresh}
      />
    </>
  );
};
