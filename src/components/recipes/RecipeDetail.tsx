import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CookingMode } from './CookingMode';
import { 
  Clock, 
  Users, 
  ChefHat, 
  ShoppingCart, 
  Play,
  Trash2,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Recipe {
  id: string;
  user_id: string;
  name: string;
  ingredients: any;
  instructions: any;
  servings: number | null;
  cooking_time: number | null;
  difficulty: string | null;
  match_score: number | null;
  estimated_calories: number | null;
  required_appliances: string[] | null;
}

interface Props {
  recipe: Recipe;
  open: boolean;
  onClose: () => void;
  onRecipeDeleted: () => void;
}

export const RecipeDetail = ({ recipe, open, onClose, onRecipeDeleted }: Props) => {
  const [showCookingMode, setShowCookingMode] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      fetchInventory();
    }
  }, [open]);

  const fetchInventory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch user's household_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.current_household_id) return;

    const inventoryTable = supabase.from('inventory') as any;
    const { data } = await inventoryTable
      .select('*')
      .eq('household_id', profile.current_household_id);

    if (data) setInventory(data);
  };

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const missingIngredients = ingredients.filter((ing: any) => {
    const hasItem = inventory.some(item => 
      item.name.toLowerCase().includes(ing.item?.toLowerCase() || ing.name?.toLowerCase() || '')
    );
    return !hasItem;
  });

  const handleAddMissingToCart = async () => {
    if (missingIngredients.length === 0) {
      toast.info('All ingredients are in your inventory!');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.current_household_id) return;

    const cartItems = missingIngredients.map((ing: any) => ({
      household_id: profile.current_household_id,
      item_name: ing.item || ing.name || 'Unknown',
      quantity: parseFloat(ing.quantity) || 1,
      unit: ing.unit || '',
      source: 'recipe',
      priority: 'normal',
      status: 'pending'
    }));

    const { error } = await supabase
      .from('shopping_list')
      .insert(cartItems);

    if (!error) {
      toast.success(`${missingIngredients.length} items added to shopping list`);
    } else {
      toast.error('Failed to add items to cart');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${recipe.name}"?`)) return;

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipe.id);

    if (!error) {
      toast.success('Recipe deleted');
      onRecipeDeleted();
    } else {
      toast.error('Failed to delete recipe');
    }
  };

  const matchScore = recipe.match_score || 0;

  if (showCookingMode) {
    return (
      <CookingMode
        recipe={recipe}
        onComplete={() => {
          setShowCookingMode(false);
          onClose();
        }}
        onBack={() => setShowCookingMode(false)}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-primary" />
            {recipe.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stats Bar */}
          <div className="flex flex-wrap gap-4">
            <Badge 
              variant="outline" 
              className={cn(
                "text-sm",
                matchScore >= 80 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                matchScore >= 50 ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                "bg-destructive/10 text-destructive border-destructive/20"
              )}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              {matchScore}% Match
            </Badge>
            
            {recipe.cooking_time && (
              <Badge variant="outline" className="gap-2">
                <Clock className="w-4 h-4" />
                {recipe.cooking_time} min
              </Badge>
            )}
            
            {recipe.servings && (
              <Badge variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                {recipe.servings} servings
              </Badge>
            )}
            
            {recipe.difficulty && (
              <Badge variant="outline" className="capitalize">
                {recipe.difficulty}
              </Badge>
            )}

            {recipe.estimated_calories && (
              <Badge variant="outline">
                {recipe.estimated_calories} cal
              </Badge>
            )}
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Ingredients</h3>
              {missingIngredients.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddMissingToCart}
                  className="gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add {missingIngredients.length} Missing to Cart
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ingredients.map((ing: any, idx: number) => {
                const hasItem = inventory.some(item => 
                  item.name.toLowerCase().includes(ing.item?.toLowerCase() || ing.name?.toLowerCase() || '')
                );

                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      hasItem ? "bg-emerald-500/5 border-emerald-500/20" : "bg-destructive/5 border-destructive/20"
                    )}
                  >
                    <Checkbox
                      checked={checkedIngredients.has(idx)}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(checkedIngredients);
                        if (checked) {
                          newSet.add(idx);
                        } else {
                          newSet.delete(idx);
                        }
                        setCheckedIngredients(newSet);
                      }}
                    />
                    <div className="flex-1">
                      <span className={cn("font-medium", checkedIngredients.has(idx) && "line-through opacity-50")}>
                        {ing.item || ing.name || 'Unknown'}
                      </span>
                      {(ing.quantity || ing.amount) && (
                        <span className="text-sm text-muted-foreground ml-2">
                          {ing.quantity || ing.amount} {ing.unit || ''}
                        </span>
                      )}
                    </div>
                    <Badge variant={hasItem ? "default" : "destructive"} className="text-xs">
                      {hasItem ? '✓ Have' : '✗ Need'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Required Appliances */}
          {recipe.required_appliances && recipe.required_appliances.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3">Required Appliances</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.required_appliances.map((appliance, idx) => (
                  <Badge key={idx} variant="outline" className="capitalize">
                    {appliance}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => setShowCookingMode(true)}
              className="flex-1 gap-2 text-lg py-6"
              size="lg"
            >
              <Play className="w-5 h-5" />
              Start Cooking
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
