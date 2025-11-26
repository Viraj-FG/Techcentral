import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UniversalLibrary } from '@/components/ui/UniversalLibrary';
import {
  UtensilsCrossed,
  Package,
  ChefHat,
  PawPrint,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DomainType = 'nutrition' | 'inventory' | 'recipes' | 'pets' | 'beauty';

const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const [activeDomain, setActiveDomain] = useState<DomainType>('nutrition');
  
  // Data state
  const [nutritionItems, setNutritionItems] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [beautyItems, setBeautyItems] = useState<any[]>([]);

  // Fetch all data on mount
  useEffect(() => {
    if (open) {
      fetchAllData();
    }
  }, [open]);

  const fetchAllData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get household_id from profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('current_household_id')
      .eq('id', user.id)
      .single();

    const householdId = profileData?.current_household_id;

    const [savedFoodsRes, inventoryRes, recipesRes, petsRes] = await Promise.all([
      supabase.from('saved_foods').select('*').eq('user_id', user.id),
      householdId ? supabase.from('inventory').select('*').eq('household_id', householdId) : Promise.resolve({ data: [] }),
      householdId ? supabase.from('recipes').select('*').eq('household_id', householdId) : Promise.resolve({ data: [] }),
      supabase.from('pets').select('*').eq('user_id', user.id),
    ]);

    if (savedFoodsRes.data) setNutritionItems(savedFoodsRes.data);
    if (inventoryRes.data) {
      setInventory(inventoryRes.data);
      setBeautyItems(inventoryRes.data.filter(item => item.category === 'beauty'));
    }
    if (recipesRes.data) setRecipes(recipesRes.data);
    if (petsRes.data) setPets(petsRes.data);
  };

  const handleNutritionSelect = (item: any) => {
    toast.success(`Selected: ${item.food_name}`);
    onOpenChange(false);
  };

  const handleInventorySelect = (item: any) => {
    navigate('/inventory', { state: { highlightItemId: item.id } });
    onOpenChange(false);
  };

  const handleRecipeSelect = (item: any) => {
    navigate('/recipes', { state: { highlightRecipeId: item.id } });
    onOpenChange(false);
  };

  const handlePetSelect = (item: any) => {
    navigate('/household');
    onOpenChange(false);
  };

  const handleBeautySelect = (item: any) => {
    navigate('/inventory', { state: { highlightItemId: item.id } });
    onOpenChange(false);
  };

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border/50">
          <DialogTitle>Search Everything</DialogTitle>
        </DialogHeader>

        <Tabs value={activeDomain} onValueChange={(v) => setActiveDomain(v as DomainType)} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-transparent px-6">
            <TabsTrigger value="nutrition" className="gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              Nutrition
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <Package className="w-4 h-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="recipes" className="gap-2">
              <ChefHat className="w-4 h-4" />
              Recipes
            </TabsTrigger>
            <TabsTrigger value="pets" className="gap-2">
              <PawPrint className="w-4 h-4" />
              Pets
            </TabsTrigger>
            <TabsTrigger value="beauty" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Beauty
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="nutrition" className="h-full m-0 p-4">
              <UniversalLibrary
                domain="nutrition"
                items={nutritionItems}
                onSelect={handleNutritionSelect}
                placeholder="Search foods..."
                standalone={false}
              />
            </TabsContent>

            <TabsContent value="inventory" className="h-full m-0 p-4">
              <UniversalLibrary
                domain="inventory"
                items={inventory}
                onSelect={handleInventorySelect}
                placeholder="Search inventory..."
                standalone={false}
              />
            </TabsContent>

            <TabsContent value="recipes" className="h-full m-0 p-4">
              <UniversalLibrary
                domain="recipes"
                items={recipes}
                onSelect={handleRecipeSelect}
                placeholder="Search recipes..."
                standalone={false}
              />
            </TabsContent>

            <TabsContent value="pets" className="h-full m-0 p-4">
              <UniversalLibrary
                domain="pets"
                items={pets}
                onSelect={handlePetSelect}
                placeholder="Search pet items..."
                standalone={false}
              />
            </TabsContent>

            <TabsContent value="beauty" className="h-full m-0 p-4">
              <UniversalLibrary
                domain="beauty"
                items={beautyItems}
                onSelect={handleBeautySelect}
                placeholder="Search beauty products..."
                standalone={false}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
