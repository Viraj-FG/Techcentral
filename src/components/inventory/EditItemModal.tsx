import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Save } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InventoryItem {
  id: string;
  name: string;
  brand_name: string | null;
  category: 'fridge' | 'pantry' | 'beauty' | 'pets';
  quantity: number | null;
  unit: string | null;
  expiry_date: string | null;
  auto_order_enabled: boolean;
  reorder_threshold: number | null;
}

interface Props {
  item: InventoryItem;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const EditItemModal = ({ item, open, onClose, onSave }: Props) => {
  const [formData, setFormData] = useState<{
    name: string;
    brand: string;
    category: 'fridge' | 'pantry' | 'beauty' | 'pets';
    quantity: number;
    unit: string;
    expiryDate: Date | null;
    autoOrder: boolean;
    threshold: number;
  }>({
    name: '',
    brand: '',
    category: 'fridge',
    quantity: 0,
    unit: '',
    expiryDate: null,
    autoOrder: false,
    threshold: 20
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item && open) {
      setFormData({
        name: item.name,
        brand: item.brand_name || '',
        category: item.category,
        quantity: item.quantity || 0,
        unit: item.unit || '',
        expiryDate: item.expiry_date ? new Date(item.expiry_date) : null,
        autoOrder: item.auto_order_enabled,
        threshold: item.reorder_threshold || 20
      });
    }
  }, [item, open]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    if (formData.quantity < 0) {
      toast.error('Quantity cannot be negative');
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('inventory')
      .update({
        name: formData.name.trim(),
        brand_name: formData.brand.trim() || null,
        category: formData.category,
        quantity: formData.quantity,
        unit: formData.unit || null,
        expiry_date: formData.expiryDate ? formData.expiryDate.toISOString().split('T')[0] : null,
        auto_order_enabled: formData.autoOrder,
        reorder_threshold: formData.threshold,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    setSaving(false);

    if (!error) {
      toast.success('Item updated successfully');
      onSave();
      onClose();
    } else {
      toast.error('Failed to update item');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Item Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter item name"
            />
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
              placeholder="Enter brand name"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as 'fridge' | 'pantry' | 'beauty' | 'pets' }))}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fridge">Fridge</SelectItem>
                <SelectItem value="pantry">Pantry</SelectItem>
                <SelectItem value="beauty">Beauty</SelectItem>
                <SelectItem value="pets">Pets</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
              >
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oz">oz</SelectItem>
                  <SelectItem value="lb">lb</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="count">count</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label>Expiry Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.expiryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.expiryDate ? format(formData.expiryDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.expiryDate || undefined}
                  onSelect={(date) => setFormData(prev => ({ ...prev, expiryDate: date || null }))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Auto-Order Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-order">Auto-Order</Label>
              <p className="text-sm text-muted-foreground">
                Automatically add to shopping list when low
              </p>
            </div>
            <Switch
              id="auto-order"
              checked={formData.autoOrder}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoOrder: checked }))}
            />
          </div>

          {/* Reorder Threshold */}
          {formData.autoOrder && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Reorder Threshold</Label>
                <span className="text-sm text-muted-foreground">{formData.threshold}%</span>
              </div>
              <Slider
                value={[formData.threshold]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, threshold: value[0] }))}
                min={0}
                max={100}
                step={5}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
