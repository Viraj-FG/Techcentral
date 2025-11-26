import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UniversalLibrary } from '@/components/ui/UniversalLibrary';
import type { LibraryFilter } from '@/components/ui/UniversalLibrary';
import {
  UtensilsCrossed,
  Package,
  ChefHat,
  PawPrint,
  Sparkles,
  Clock,
  Bookmark,
  AlertCircle,
  Apple,
  BookOpen,
  Dumbbell,
  Leaf,
  ShieldAlert,
  TrendingDown,
  Zap,
  Dog,
  Cat,
  Heart,
  Shield,
  Box,
  Calendar,
  Star,
  Palette,
  Droplet,
} from 'lucide-react';
import { toast } from 'sonner';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DomainType = 'nutrition' | 'inventory' | 'recipes' | 'pets' | 'beauty';

// Helper functions for beauty product categorization
const SKINCARE_KEYWORDS = ['serum', 'moisturizer', 'cleanser', 'toner', 'sunscreen', 'eye cream', 'mask', 'retinol', 'cream', 'lotion', 'facial'];
const HAIRCARE_KEYWORDS = ['shampoo', 'conditioner', 'hair oil', 'styling', 'treatment', 'hair mask', 'hair spray', 'gel', 'hair'];
const MAKEUP_KEYWORDS = ['lipstick', 'foundation', 'mascara', 'eyeshadow', 'blush', 'concealer', 'primer', 'makeup', 'cosmetic', 'eyeliner', 'lip'];

const isProductType = (name: string, keywords: string[]) => {
  const lowerName = name.toLowerCase();
  return keywords.some(keyword => lowerName.includes(keyword));
};

// Domain-specific filter configurations
const nutritionFilters: LibraryFilter[] = [
  {
    id: 'meals',
    label: 'My Meals',
    icon: BookOpen,
    query: (items) => items.filter((item: any) => item.is_template === true)
  },
  {
    id: 'recent',
    label: 'Recent',
    icon: Clock,
    query: (items) => items.slice().sort((a: any, b: any) => 
      new Date(b.last_used_at || b.created_at).getTime() - 
      new Date(a.last_used_at || a.created_at).getTime()
    ).slice(0, 20)
  },
  {
    id: 'bookmarked',
    label: 'Saved',
    icon: Bookmark,
    query: (items) => items.filter((item: any) => item.is_bookmarked === true)
  },
  {
    id: 'high_protein',
    label: 'High Protein',
    icon: Dumbbell,
    query: (items) => items.filter((item: any) => {
      const protein = item.nutrition_data?.protein || 0;
      return protein > 15;
    }).sort((a: any, b: any) => 
      (b.nutrition_data?.protein || 0) - (a.nutrition_data?.protein || 0)
    )
  },
  {
    id: 'vegan',
    label: 'Vegan',
    icon: Leaf,
    query: (items) => items.filter((item: any) => {
      const dietaryFlags = item.dietary_flags || [];
      const allergens = item.allergens || [];
      return dietaryFlags.includes('vegan') || 
             (dietaryFlags.includes('vegetarian') && 
              !allergens.some((a: string) => ['milk', 'eggs', 'honey'].includes(a.toLowerCase())));
    })
  },
  {
    id: 'allergen_free',
    label: 'Allergen-Free',
    icon: ShieldAlert,
    query: (items) => items.filter((item: any) => {
      const allergens = item.allergens || [];
      const commonAllergens = ['milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 'wheat', 'soybeans'];
      return !allergens.some((a: string) => 
        commonAllergens.some(common => a.toLowerCase().includes(common))
      );
    })
  }
];

const inventoryFilters: LibraryFilter[] = [
  {
    id: 'expiring',
    label: 'Expiring',
    icon: AlertCircle,
    query: (items) => {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      return items.filter((item: any) => 
        item.expiry_date && new Date(item.expiry_date) <= sevenDaysFromNow
      ).sort((a: any, b: any) => 
        new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
      );
    }
  },
  {
    id: 'low_stock',
    label: 'Low Stock',
    icon: TrendingDown,
    query: (items) => items.filter((item: any) => 
      item.fill_level !== null && item.fill_level <= 20
    ).sort((a: any, b: any) => (a.fill_level || 0) - (b.fill_level || 0))
  },
  {
    id: 'fridge',
    label: 'Fridge',
    icon: Package,
    query: (items) => items.filter((item: any) => item.category === 'fridge')
  },
  {
    id: 'pantry',
    label: 'Pantry',
    icon: Package,
    query: (items) => items.filter((item: any) => item.category === 'pantry')
  }
];

const recipeFilters: LibraryFilter[] = [
  {
    id: 'my_recipes',
    label: 'My Recipes',
    icon: Sparkles,
    query: (items) => items.filter((item: any) => item.user_created === true)
  },
  {
    id: 'bookmarked',
    label: 'Saved',
    icon: Bookmark,
    query: (items) => items.filter((item: any) => item.is_bookmarked === true)
  },
  {
    id: 'ready',
    label: 'Ready to Cook',
    icon: AlertCircle,
    query: (items) => items.filter((item: any) => 
      item.match_score !== null && item.match_score >= 80
    ).sort((a: any, b: any) => (b.match_score || 0) - (a.match_score || 0))
  },
  {
    id: 'quick',
    label: 'Quick (<30min)',
    icon: Zap,
    query: (items) => items.filter((item: any) => 
      item.cooking_time !== null && item.cooking_time < 30
    ).sort((a: any, b: any) => (a.cooking_time || 0) - (b.cooking_time || 0))
  }
];

const petFilters: LibraryFilter[] = [
  {
    id: 'dogs',
    label: 'Dogs',
    icon: Dog,
    query: (items) => items.filter((item: any) => 
      item.species?.toLowerCase() === 'dog'
    )
  },
  {
    id: 'cats',
    label: 'Cats',
    icon: Cat,
    query: (items) => items.filter((item: any) => 
      item.species?.toLowerCase() === 'cat'
    )
  },
  {
    id: 'senior',
    label: 'Senior Pets',
    icon: Heart,
    query: (items) => items.filter((item: any) => {
      const species = item.species?.toLowerCase();
      const age = item.age || 0;
      return (species === 'dog' && age >= 7) || (species === 'cat' && age >= 11);
    })
  },
  {
    id: 'toxic_monitoring',
    label: 'Toxic Monitoring',
    icon: Shield,
    query: (items) => items.filter((item: any) => 
      item.toxic_flags_enabled === true
    )
  },
  {
    id: 'supplies',
    label: 'Pet Supplies',
    icon: Box,
    query: (items) => items.filter((item: any) => 
      item.category === 'pets'
    )
  },
  {
    id: 'low_stock_supplies',
    label: 'Low Stock',
    icon: TrendingDown,
    query: (items) => items.filter((item: any) => 
      item.category === 'pets' && item.fill_level !== null && item.fill_level <= 20
    ).sort((a: any, b: any) => (a.fill_level || 0) - (b.fill_level || 0))
  },
  {
    id: 'expiring_food',
    label: 'Expiring Food',
    icon: AlertCircle,
    query: (items) => items.filter((item: any) => {
      if (!item.expiry_date || item.category !== 'pets') return false;
      const expiryDate = new Date(item.expiry_date);
      const fourteenDaysFromNow = new Date();
      fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
      return expiryDate <= fourteenDaysFromNow && expiryDate >= new Date();
    }).sort((a: any, b: any) => 
      new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
    )
  }
];

const beautyFilters: LibraryFilter[] = [
  {
    id: 'expiring_soon',
    label: 'Expiring Soon',
    icon: AlertCircle,
    query: (items) => items.filter((item: any) => {
      if (!item.expiry_date) return false;
      const expiryDate = new Date(item.expiry_date);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
    }).sort((a: any, b: any) => 
      new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
    )
  },
  {
    id: 'expired',
    label: 'Expired',
    icon: Calendar,
    query: (items) => items.filter((item: any) => {
      if (!item.expiry_date) return false;
      return new Date(item.expiry_date) < new Date();
    }).sort((a: any, b: any) => 
      new Date(b.expiry_date).getTime() - new Date(a.expiry_date).getTime()
    )
  },
  {
    id: 'low_stock',
    label: 'Low Stock',
    icon: TrendingDown,
    query: (items) => items.filter((item: any) => 
      item.fill_level !== null && item.fill_level <= 20
    ).sort((a: any, b: any) => (a.fill_level || 0) - (b.fill_level || 0))
  },
  {
    id: 'fresh',
    label: 'Fresh',
    icon: Star,
    query: (items) => items.filter((item: any) => {
      if (!item.created_at) return false;
      const createdDate = new Date(item.created_at);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      return createdDate >= fourteenDaysAgo;
    }).sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  },
  {
    id: 'skincare',
    label: 'Skincare',
    icon: Droplet,
    query: (items) => items.filter((item: any) => 
      isProductType(item.name, SKINCARE_KEYWORDS)
    )
  },
  {
    id: 'haircare',
    label: 'Haircare',
    icon: Sparkles,
    query: (items) => items.filter((item: any) => 
      isProductType(item.name, HAIRCARE_KEYWORDS)
    )
  },
  {
    id: 'makeup',
    label: 'Makeup',
    icon: Palette,
    query: (items) => items.filter((item: any) => 
      isProductType(item.name, MAKEUP_KEYWORDS)
    )
  },
  {
    id: 'allergen_free',
    label: 'Allergen-Free',
    icon: ShieldAlert,
    query: (items) => items.filter((item: any) => {
      const allergens = item.allergens || [];
      return allergens.length === 0 || (Array.isArray(allergens) && allergens.every((a: any) => !a));
    })
  },
  {
    id: 'repurchase',
    label: 'Repurchase',
    icon: Bookmark,
    query: (items) => items.filter((item: any) => 
      item.is_bookmarked === true
    )
  }
];

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

    const [savedFoodsRes, inventoryRes, recipesRes, petsRes, petSuppliesRes] = await Promise.all([
      supabase.from('saved_foods').select('*').eq('user_id', user.id),
      householdId ? supabase.from('inventory').select('*').eq('household_id', householdId) : Promise.resolve({ data: [] }),
      householdId ? supabase.from('recipes').select('*').eq('household_id', householdId) : Promise.resolve({ data: [] }),
      supabase.from('pets').select('*').eq('user_id', user.id),
      householdId ? supabase.from('inventory').select('*').eq('household_id', householdId).eq('category', 'pets') : Promise.resolve({ data: [] }),
    ]);

    if (savedFoodsRes.data) setNutritionItems(savedFoodsRes.data);
    if (inventoryRes.data) {
      setInventory(inventoryRes.data);
      // Beauty items from inventory
      setBeautyItems(inventoryRes.data.filter(item => item.category === 'beauty'));
    }
    if (recipesRes.data) setRecipes(recipesRes.data);
    // Combine actual pets and pet supplies for unified pet domain
    if (petsRes.data || petSuppliesRes.data) {
      setPets([...(petsRes.data || []), ...(petSuppliesRes.data || [])]);
    }
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
                filters={nutritionFilters}
                standalone={false}
              />
            </TabsContent>

            <TabsContent value="inventory" className="h-full m-0 p-4">
              <UniversalLibrary
                domain="inventory"
                items={inventory}
                onSelect={handleInventorySelect}
                placeholder="Search inventory..."
                filters={inventoryFilters}
                standalone={false}
              />
            </TabsContent>

            <TabsContent value="recipes" className="h-full m-0 p-4">
              <UniversalLibrary
                domain="recipes"
                items={recipes}
                onSelect={handleRecipeSelect}
                placeholder="Search recipes..."
                filters={recipeFilters}
                standalone={false}
              />
            </TabsContent>

            <TabsContent value="pets" className="h-full m-0 p-4">
              <UniversalLibrary
                domain="pets"
                items={pets}
                onSelect={handlePetSelect}
                placeholder="Search pet items..."
                filters={petFilters}
                standalone={false}
              />
            </TabsContent>

            <TabsContent value="beauty" className="h-full m-0 p-4">
              <UniversalLibrary
                domain="beauty"
                items={beautyItems}
                onSelect={handleBeautySelect}
                placeholder="Search beauty products..."
                filters={beautyFilters}
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
