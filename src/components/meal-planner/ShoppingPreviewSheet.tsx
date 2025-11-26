import { useState, useEffect } from 'react';
import { ShoppingCart, Check, Package } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Recipe {
  id: string;
  name: string;
  ingredients: Array<{
    item: string;
    quantity?: string;
    unit?: string;
  }>;
}

interface GroupedIngredient {
  item: string;
  quantity: string;
  recipes: string[];
  inInventory: boolean;
}

interface ShoppingPreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: Recipe[];
}

export const ShoppingPreviewSheet = ({
  open,
  onOpenChange,
  recipes,
}: ShoppingPreviewSheetProps) => {
  const { toast } = useToast();
  const [groupedIngredients, setGroupedIngredients] = useState<GroupedIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchInventory();
      groupIngredients();
    }
  }, [open, recipes]);

  const fetchInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', user.id)
        .single();

      if (!profileData?.current_household_id) return;

      const { data, error } = await supabase
        .from('inventory')
        .select('name')
        .eq('household_id', profileData.current_household_id);

      if (error) throw error;
      setInventoryItems(data.map(item => item.name.toLowerCase()));
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const groupIngredients = () => {
    const ingredientMap = new Map<string, { quantity: string; recipes: string[] }>();

    recipes.forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
        const key = ingredient.item.toLowerCase();
        const quantity = ingredient.quantity && ingredient.unit
          ? `${ingredient.quantity} ${ingredient.unit}`
          : ingredient.quantity || '1';

        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          existing.recipes.push(recipe.name);
          // Simple deduplication - in production, you'd want to sum quantities
          if (!existing.quantity.includes('×')) {
            existing.quantity = `${quantity} × ${existing.recipes.length}`;
          } else {
            existing.quantity = existing.quantity.replace(/× \d+/, `× ${existing.recipes.length}`);
          }
        } else {
          ingredientMap.set(key, {
            quantity,
            recipes: [recipe.name],
          });
        }
      });
    });

    const grouped = Array.from(ingredientMap.entries()).map(([item, data]) => ({
      item,
      quantity: data.quantity,
      recipes: data.recipes,
      inInventory: inventoryItems.includes(item),
    }));

    setGroupedIngredients(grouped);
  };

  const handleAddToShoppingList = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', user.id)
        .single();

      if (!profileData?.current_household_id) {
        toast({
          title: 'Error',
          description: 'No household found',
          variant: 'destructive',
        });
        return;
      }

      // Only add items not in inventory
      const itemsToAdd = groupedIngredients
        .filter(ingredient => !ingredient.inInventory)
        .map(ingredient => ({
          item_name: ingredient.item,
          household_id: profileData.current_household_id,
          source: 'meal_plan',
          priority: 'normal',
          quantity: 1,
        }));

      if (itemsToAdd.length === 0) {
        toast({
          title: 'All Set!',
          description: 'You already have all ingredients in your inventory',
        });
        onOpenChange(false);
        return;
      }

      const { error } = await supabase
        .from('shopping_list')
        .insert(itemsToAdd);

      if (error) throw error;

      toast({
        title: 'Added to Shopping List',
        description: `${itemsToAdd.length} items added to your cart`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error adding to shopping list:', error);
      toast({
        title: 'Error',
        description: 'Failed to add items to shopping list',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalItems = groupedIngredients.length;
  const itemsInInventory = groupedIngredients.filter(i => i.inInventory).length;
  const itemsNeeded = totalItems - itemsInInventory;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] bg-background/95 backdrop-blur-xl border-t border-white/10">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Shopping List Preview
          </SheetTitle>
          <SheetDescription>
            {itemsNeeded} items needed • {itemsInInventory} already in inventory
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-24 overflow-y-auto max-h-[calc(85vh-200px)]">
          {recipes.map((recipe) => {
            const recipeIngredients = groupedIngredients.filter(ing =>
              ing.recipes.includes(recipe.name)
            );

            return (
              <div key={recipe.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-white">{recipe.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {recipeIngredients.length} items
                  </Badge>
                </div>
                <div className="space-y-1 pl-6">
                  {recipeIngredients.map((ingredient) => (
                    <div
                      key={ingredient.item}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        ingredient.inInventory
                          ? 'bg-secondary/10 text-secondary'
                          : 'bg-white/5 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {ingredient.inInventory && (
                          <Check className="w-4 h-4 text-secondary" />
                        )}
                        <span className="text-sm capitalize">{ingredient.item}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {ingredient.quantity}
                        </span>
                        {ingredient.recipes.length > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            Used in {ingredient.recipes.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-background/95 backdrop-blur-xl border-t border-white/10">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2 bg-primary text-background hover:bg-primary/90"
              onClick={handleAddToShoppingList}
              disabled={isLoading || itemsNeeded === 0}
            >
              <ShoppingCart className="w-4 h-4" />
              Add {itemsNeeded} Items
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
