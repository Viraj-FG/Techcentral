import { useState } from "react";
import { motion } from "framer-motion";
import { ChefHat, Clock, Flame, ShoppingCart, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Recipe {
  name: string;
  cooking_time: number;
  difficulty: string;
  required_appliances: string[];
  instructions: string[];
  estimated_calories: number;
  servings: number;
  missing_ingredients?: string[];
  match_score?: number;
}

interface RecipeFeedProps {
  userInventory: any;
  userProfile: any;
}

const RecipeFeed = ({ userInventory, userProfile }: RecipeFeedProps) => {
  const [mode, setMode] = useState<'pantry' | 'explore'>('pantry');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [applianceFilter, setApplianceFilter] = useState<string>('');
  const [healthFilter, setHealthFilter] = useState<string>('');

  // Get user's appliances
  const userAppliances = (userProfile?.lifestyle_goals as any)?.appliances || [];
  
  // Get all inventory items as ingredients
  const allIngredients = [
    ...(userInventory?.fridge || []),
    ...(userInventory?.pantry || []),
    ...(userInventory?.beauty || []),
    ...(userInventory?.pets || [])
  ].map(item => item.name);

  const loadRecipes = async (forceMode?: 'pantry' | 'explore') => {
    const activeMode = forceMode || mode;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('suggest-recipes', {
        body: {
          ingredients: allIngredients,
          appliances: applianceFilter ? [applianceFilter] : userAppliances,
          dietary_preferences: userProfile?.dietary_preferences || {},
          inventory_match: activeMode === 'pantry',
          user_id: userProfile?.id,
          health_goal: healthFilter || undefined
        }
      });

      if (error) throw error;

      setRecipes(data || []);
      
      if (data.length === 0) {
        toast.info('No recipes found', {
          description: activeMode === 'pantry' 
            ? 'Try adding more items to your inventory' 
            : 'Adjust your filters and try again'
        });
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode as 'pantry' | 'explore');
    setRecipes([]);
  };

  const addMissingToCart = async (ingredients: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get household_id from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', user.id)
        .single();

      if (!profileData?.current_household_id) {
        toast.error('No household found');
        return;
      }

      const items = ingredients.map(ing => ({
        item_name: ing,
        household_id: profileData.current_household_id,
        source: 'recipe',
        priority: 'normal',
        quantity: 1
      }));

      await supabase.from('shopping_list').insert(items);
      
      toast.success('Added to shopping list', {
        description: `${ingredients.length} ingredients added`
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add ingredients');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-emerald-400';
      case 'medium': return 'text-amber-400';
      case 'hard': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-white/10">
          <TabsTrigger 
            value="pantry" 
            className="data-[state=active]:bg-kaeva-sage data-[state=active]:text-white relative"
          >
            {mode === 'pantry' && (
              <motion.div
                layoutId="activeMode"
                className="absolute inset-0 bg-kaeva-sage rounded-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">🏠 Cook My Pantry</span>
          </TabsTrigger>
          <TabsTrigger 
            value="explore"
            className="data-[state=active]:bg-kaeva-electric-sky data-[state=active]:text-white relative"
          >
            {mode === 'explore' && (
              <motion.div
                layoutId="activeMode"
                className="absolute inset-0 bg-kaeva-electric-sky rounded-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">🌍 Explore World</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pantry" className="mt-4">
          <div className="mb-4 p-3 rounded-lg bg-kaeva-sage/10 border border-kaeva-sage/30">
            <p className="text-sm text-white/70">
              Recipes you can make with items in your kitchen (80%+ match)
            </p>
          </div>
          
          <Button 
            onClick={() => loadRecipes('pantry')} 
            disabled={loading}
            className="w-full bg-kaeva-sage hover:bg-kaeva-sage/80 mb-4"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Finding Recipes...
              </>
            ) : (
              <>
                <ChefHat className="mr-2" size={16} />
                Find Recipes
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="explore" className="mt-4">
          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <Select value={applianceFilter} onValueChange={setApplianceFilter}>
              <SelectTrigger className="flex-1 bg-slate-800/50 border-white/10">
                <SelectValue placeholder="Filter by Appliance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Appliances</SelectItem>
                {userAppliances.map((appliance: string) => (
                  <SelectItem key={appliance} value={appliance}>
                    {appliance}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={healthFilter} onValueChange={setHealthFilter}>
              <SelectTrigger className="flex-1 bg-slate-800/50 border-white/10">
                <SelectValue placeholder="Health Goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Filter</SelectItem>
                <SelectItem value="low-sodium">Low Sodium</SelectItem>
                <SelectItem value="low-carb">Low Carb</SelectItem>
                <SelectItem value="high-protein">High Protein</SelectItem>
                <SelectItem value="keto">Keto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={() => loadRecipes('explore')} 
            disabled={loading}
            className="w-full bg-kaeva-electric-sky hover:bg-kaeva-electric-sky/80 mb-4"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Exploring...
              </>
            ) : (
              <>
                <Sparkles className="mr-2" size={16} />
                Explore Recipes
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Recipe Results */}
      {recipes.length > 0 && (
        <div className="space-y-3">
          {recipes.map((recipe, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-colors overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white mb-1 truncate">{recipe.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <span className="flex items-center gap-1">
                        <Clock size={14} strokeWidth={1.5} />
                        {recipe.cooking_time} min
                      </span>
                      <span className={`flex items-center gap-1 ${getDifficultyColor(recipe.difficulty)}`}>
                        <Flame size={14} strokeWidth={1.5} />
                        {recipe.difficulty}
                      </span>
                      <span className="flex items-center gap-1">
                        {recipe.estimated_calories} cal
                      </span>
                    </div>
                  </div>
                  {mode === 'pantry' && recipe.match_score && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">
                        {recipe.match_score}%
                      </div>
                      <div className="text-xs text-white/50">match</div>
                    </div>
                  )}
                </div>

                {/* Missing Ingredients */}
                {recipe.missing_ingredients && recipe.missing_ingredients.length > 0 && (
                  <div className="mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-xs text-amber-400 mb-2">Missing Ingredients:</p>
                    <div className="flex flex-wrap gap-2">
                      {recipe.missing_ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs">
                          <span className="text-amber-400">• {ing}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addMissingToCart(recipe.missing_ingredients!)}
                      className="w-full mt-2 h-7 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Add Missing to Cart
                    </Button>
                  </div>
                )}

                {/* Required Appliances */}
                {recipe.required_appliances && recipe.required_appliances.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {recipe.required_appliances.map((app, i) => (
                      <span 
                        key={i}
                        className="text-xs px-2 py-1 rounded-full bg-kaeva-electric-sky/20 text-kaeva-electric-sky border border-kaeva-electric-sky/30"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                )}

                {/* Instructions Preview */}
                <div className="text-sm text-white/70">
                  <p className="font-medium text-white mb-1">Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    {recipe.instructions.slice(0, 3).map((step, i) => (
                      <li key={i} className="text-xs">{step}</li>
                    ))}
                    {recipe.instructions.length > 3 && (
                      <li className="text-xs text-white/50">
                        +{recipe.instructions.length - 3} more steps...
                      </li>
                    )}
                  </ol>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipeFeed;