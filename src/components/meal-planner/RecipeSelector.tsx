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
import { Search, ChefHat } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmojiGridSelector } from '@/components/ui/EmojiGridSelector';

const FOOD_MOODS = [
  { emoji: '🥗', label: 'Light', value: 'light' },
  { emoji: '🍕', label: 'Comfort', value: 'comfort' },
  { emoji: '💪', label: 'Protein', value: 'protein' },
  { emoji: '🌱', label: 'Veggie', value: 'veggie' },
];

interface Recipe {
  id: string;
  name: string;
  estimated_calories: number | null;
  cooking_time: number | null;
  difficulty: string | null;
}

interface RecipeSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (recipeId: string) => void;
  mealType: string;
}

export const RecipeSelector = ({ open, onClose, onSelect, mealType }: RecipeSelectorProps) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchRecipes();
    }
  }, [open]);

  useEffect(() => {
    let filtered = recipes;

    // Filter by mood
    if (selectedMood) {
      filtered = filtered.filter(recipe => {
        const name = recipe.name.toLowerCase();
        switch (selectedMood) {
          case 'light':
            return (recipe.estimated_calories || 0) < 400;
          case 'comfort':
            return name.includes('pasta') || name.includes('pizza') || name.includes('burger');
          case 'protein':
            return (recipe.estimated_calories || 0) > 300 && name.includes('chicken');
          case 'veggie':
            return name.includes('salad') || name.includes('vegetable');
          default:
            return true;
        }
      });
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipe => 
        recipe.name.toLowerCase().includes(query)
      );
    }

    setFilteredRecipes(filtered);
  }, [searchQuery, selectedMood, recipes]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', user.id)
        .single();

      if (!profile?.current_household_id) return;

      const { data, error } = await supabase
        .from('recipes')
        .select('id, name, estimated_calories, cooking_time, difficulty')
        .eq('household_id', profile.current_household_id)
        .order('name', { ascending: true });

      if (error) throw error;
      setRecipes(data || []);
      setFilteredRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (recipeId: string) => {
    onSelect(recipeId);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            Choose Recipe for {mealType}
          </DialogTitle>
        </DialogHeader>

        {/* Food Mood Selector */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">What are you craving?</p>
          <EmojiGridSelector
            moods={FOOD_MOODS}
            selectedMood={selectedMood}
            onSelect={setSelectedMood}
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Recipe List */}
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-card/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{searchQuery ? 'No recipes found' : 'No recipes saved yet'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRecipes.map(recipe => (
                <Button
                  key={recipe.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => handleSelect(recipe.id)}
                >
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{recipe.name}</p>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      {recipe.estimated_calories && (
                        <span>{recipe.estimated_calories} cal</span>
                      )}
                      {recipe.cooking_time && (
                        <span>{recipe.cooking_time} min</span>
                      )}
                      {recipe.difficulty && (
                        <span className="capitalize">{recipe.difficulty}</span>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
