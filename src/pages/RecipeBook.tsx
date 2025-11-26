import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppShell from '@/components/layout/AppShell';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeDetail } from '@/components/recipes/RecipeDetail';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChefHat, Filter, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { PageTransition } from '@/components/layout/PageTransition';

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
  cached_at: string | null;
}

const RecipeBook = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'ready' | 'wishlist'>('all');

  // Enable swipe navigation and get swipe state
  const swipeState = useSwipeNavigation();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('cached_at', { ascending: false });

    if (!error && data) {
      setRecipes(data);
    } else if (error) {
      toast.error('Failed to load recipes');
    }
    setLoading(false);
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchScore = recipe.match_score || 0;
    if (filterTab === 'ready') return matchScore >= 80;
    if (filterTab === 'wishlist') return matchScore < 80;
    return true;
  });

  const handleRecipeDeleted = () => {
    setSelectedRecipe(null);
    fetchRecipes();
  };

  return (
    <AppShell onScan={() => navigate('/')}>
      <PageTransition 
        swipeProgress={swipeState.progress}
        swipeDirection={swipeState.direction}
      >
        <div className="container mx-auto px-4 py-8 max-w-7xl pb-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <ChefHat className="w-10 h-10 text-primary" />
                Recipe Book
              </h1>
              <p className="text-muted-foreground">Your personalized recipe collection</p>
            </div>
            <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Import Recipe
            </Button>
          </div>

          {/* Filters */}
          <Tabs value={filterTab} onValueChange={(val) => setFilterTab(val as typeof filterTab)} className="mb-6">
            <TabsList className="bg-card/50 backdrop-blur-sm border border-border/50">
              <TabsTrigger value="all" className="gap-2">
                <Filter className="w-4 h-4" />
                All Recipes ({recipes.length})
              </TabsTrigger>
              <TabsTrigger value="ready" className="gap-2">
                ✅ Cook Now ({recipes.filter(r => (r.match_score || 0) >= 80).length})
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="gap-2">
                🛒 Wishlist ({recipes.filter(r => (r.match_score || 0) < 80).length})
              </TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-64 bg-card/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <TabsContent value={filterTab} className="mt-6">
                {filteredRecipes.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground mb-4">
                      {filterTab === 'ready' ? 'No recipes ready to cook yet' : 
                       filterTab === 'wishlist' ? 'No wishlist recipes yet' : 
                       'No recipes saved yet'}
                    </p>
                    <Button onClick={() => navigate('/')} variant="default">
                      Import Your First Recipe
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.05 }
                      }
                    }}
                  >
                    {filteredRecipes.map((recipe) => (
                      <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        onClick={() => setSelectedRecipe(recipe)}
                      />
                    ))}
                  </motion.div>
                )}
              </TabsContent>
            )}
          </Tabs>

          {/* Recipe Detail Modal */}
          {selectedRecipe && (
            <RecipeDetail
              recipe={selectedRecipe}
              open={!!selectedRecipe}
              onClose={() => setSelectedRecipe(null)}
              onRecipeDeleted={handleRecipeDeleted}
            />
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
};

export default RecipeBook;
