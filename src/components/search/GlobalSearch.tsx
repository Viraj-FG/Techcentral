import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  Package,
  ChefHat,
  PawPrint,
  Flame,
  TrendingDown,
  Dumbbell,
  Leaf,
  Sparkles,
  Scan,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FilterType = 'all' | 'expiring' | 'low-stock' | 'high-protein' | 'vegan' | 'beauty';

const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Data state
  const [inventory, setInventory] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);

  // Fetch all data on mount
  useEffect(() => {
    if (open) {
      fetchAllData();
    }
  }, [open]);

  const fetchAllData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [inventoryRes, recipesRes, petsRes] = await Promise.all([
      supabase.from('inventory').select('*').eq('user_id', user.id),
      supabase.from('recipes').select('*').eq('user_id', user.id),
      supabase.from('pets').select('*').eq('user_id', user.id),
    ]);

    if (inventoryRes.data) setInventory(inventoryRes.data);
    if (recipesRes.data) setRecipes(recipesRes.data);
    if (petsRes.data) setPets(petsRes.data);
    setIsLoading(false);
  };

  // Filter logic
  const filteredResults = useMemo(() => {
    const query = debouncedQuery.toLowerCase();
    let filteredInventory = inventory;

    // Apply smart filters
    if (activeFilter === 'expiring') {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      filteredInventory = inventory.filter(
        (item) => item.expiry_date && new Date(item.expiry_date) <= threeDaysFromNow
      );
    } else if (activeFilter === 'low-stock') {
      filteredInventory = inventory.filter(
        (item) => item.fill_level !== null && item.fill_level <= 20
      );
    } else if (activeFilter === 'high-protein') {
      filteredInventory = inventory.filter(
        (item) => item.nutrition_data?.protein > 15
      );
    } else if (activeFilter === 'vegan') {
      filteredInventory = inventory.filter(
        (item) =>
          item.dietary_flags?.includes('vegan') ||
          !item.allergens?.some((a: string) =>
            ['milk', 'eggs', 'fish', 'shellfish'].includes(a)
          )
      );
    } else if (activeFilter === 'beauty') {
      filteredInventory = inventory.filter((item) => item.category === 'beauty');
    }

    // Apply search query
    if (query.length >= 2) {
      filteredInventory = filteredInventory.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.brand_name?.toLowerCase().includes(query)
      );
    }

    const filteredRecipes = recipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(query) ||
        JSON.stringify(recipe.ingredients).toLowerCase().includes(query)
    );

    const filteredPets = pets.filter(
      (pet) =>
        pet.name.toLowerCase().includes(query) ||
        pet.breed?.toLowerCase().includes(query)
    );

    return {
      inventory: filteredInventory.slice(0, 10),
      recipes: filteredRecipes.slice(0, 10),
      pets: filteredPets.slice(0, 5),
    };
  }, [debouncedQuery, inventory, recipes, pets, activeFilter]);

  const handleSelect = (type: 'inventory' | 'recipe' | 'pet', item: any) => {
    onOpenChange(false);
    setSearchQuery('');
    setActiveFilter('all');

    if (type === 'inventory') {
      navigate('/inventory', { state: { highlightItemId: item.id } });
    } else if (type === 'recipe') {
      navigate('/recipes');
    } else if (type === 'pet') {
      navigate('/household');
    }
  };

  const filterChips: Array<{
    id: FilterType;
    label: string;
    icon: any;
    count?: number;
  }> = [
    { id: 'all', label: 'All', icon: Package },
    {
      id: 'expiring',
      label: 'Expiring Soon',
      icon: Flame,
      count: inventory.filter((item) => {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        return item.expiry_date && new Date(item.expiry_date) <= threeDaysFromNow;
      }).length,
    },
    {
      id: 'low-stock',
      label: 'Low Stock',
      icon: TrendingDown,
      count: inventory.filter((item) => item.fill_level !== null && item.fill_level <= 20)
        .length,
    },
    {
      id: 'high-protein',
      label: 'High Protein',
      icon: Dumbbell,
      count: inventory.filter((item) => item.nutrition_data?.protein > 15).length,
    },
    {
      id: 'vegan',
      label: 'Vegan',
      icon: Leaf,
      count: inventory.filter(
        (item) =>
          item.dietary_flags?.includes('vegan') ||
          !item.allergens?.some((a: string) =>
            ['milk', 'eggs', 'fish', 'shellfish'].includes(a)
          )
      ).length,
    },
    {
      id: 'beauty',
      label: 'Beauty',
      icon: Sparkles,
      count: inventory.filter((item) => item.category === 'beauty').length,
    },
  ];

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

  const totalResults =
    filteredResults.inventory.length +
    filteredResults.recipes.length +
    filteredResults.pets.length;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search inventory, recipes, pets..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />

      {/* Smart Filter Chips */}
      <div className="flex gap-2 px-3 py-2 overflow-x-auto scrollbar-hide border-b border-border/50">
        <AnimatePresence>
          {filterChips.map((chip, index) => {
            const Icon = chip.icon;
            const isActive = activeFilter === chip.id;
            return (
              <motion.button
                key={chip.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => setActiveFilter(chip.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {chip.label}
                {chip.count !== undefined && chip.count > 0 && (
                  <span
                    className={cn(
                      'ml-1 px-1.5 py-0.5 rounded-full text-[10px]',
                      isActive ? 'bg-primary-foreground/20' : 'bg-background/50'
                    )}
                  >
                    {chip.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      <CommandList>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : totalResults === 0 ? (
          <CommandEmpty>
            <div className="py-8 text-center">
              <Package className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No items found</p>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  navigate('/');
                }}
                size="sm"
                className="gap-2"
              >
                <Scan className="w-4 h-4" />
                Scan to Add
              </Button>
            </div>
          </CommandEmpty>
        ) : (
          <>
            {/* Inventory Results */}
            {filteredResults.inventory.length > 0 && (
              <CommandGroup heading="🥫 Pantry & Fridge">
                {filteredResults.inventory.map((item) => {
                  const isLowStock = item.fill_level !== null && item.fill_level <= 20;
                  const isExpiring = item.expiry_date && new Date(item.expiry_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <CommandItem
                      key={item.id}
                      onSelect={() => handleSelect('inventory', item)}
                      className="flex items-center gap-3 py-3"
                    >
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{item.name}</span>
                          {item.brand_name && (
                            <span className="text-xs text-muted-foreground truncate">
                              {item.brand_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {isLowStock && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Low
                          </Badge>
                        )}
                        {isExpiring && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-500/20 text-amber-500">
                            Expiring
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* Recipe Results */}
            {filteredResults.recipes.length > 0 && (
              <CommandGroup heading="🍳 Recipes">
                {filteredResults.recipes.map((recipe) => (
                  <CommandItem
                    key={recipe.id}
                    onSelect={() => handleSelect('recipe', recipe)}
                    className="flex items-center gap-3 py-3"
                  >
                    <ChefHat className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate">{recipe.name}</span>
                      {recipe.match_score >= 80 && (
                        <Badge variant="default" className="ml-2 text-[10px] px-1.5 py-0 bg-green-500/20 text-green-500">
                          Ready to Cook
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Pet Results */}
            {filteredResults.pets.length > 0 && (
              <CommandGroup heading="🐾 Pets">
                {filteredResults.pets.map((pet) => (
                  <CommandItem
                    key={pet.id}
                    onSelect={() => handleSelect('pet', pet)}
                    className="flex items-center gap-3 py-3"
                  >
                    <PawPrint className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate">{pet.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({pet.species})
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
