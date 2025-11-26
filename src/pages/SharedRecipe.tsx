import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicShell } from '@/components/layout/PublicShell';
import { Clock, Users, ChefHat, ArrowLeft, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Recipe {
  id: string;
  name: string;
  ingredients: any;
  instructions: any;
  servings: number | null;
  cooking_time: number | null;
  difficulty: string | null;
  match_score: number | null;
  estimated_calories: number | null;
  required_appliances: string[] | null;
  view_count: number;
}

export default function SharedRecipe() {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shareToken) {
      fetchSharedRecipe();
    }
  }, [shareToken]);

  const fetchSharedRecipe = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_public', true)
        .single();

      if (error) throw error;

      if (data) {
        setRecipe(data);
        // Increment view count
        await supabase
          .from('recipes')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', data.id);
      }
    } catch (error) {
      console.error('Error fetching shared recipe:', error);
      toast.error('Recipe not found or is no longer public');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PublicShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-muted-foreground">Loading recipe...</div>
        </div>
      </PublicShell>
    );
  }

  if (!recipe) {
    return (
      <PublicShell>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <ChefHat className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Recipe Not Found</h1>
          <p className="text-muted-foreground">This recipe may have been removed or is no longer public.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </PublicShell>
    );
  }

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];
  const matchScore = recipe.match_score || 0;

  return (
    <PublicShell>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ChefHat className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{recipe.name}</h1>
              <p className="text-muted-foreground">Shared from KAEVA</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-4">
            {matchScore > 0 && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-sm",
                  matchScore >= 80 ? "bg-secondary/10 text-secondary border-secondary/20" :
                  matchScore >= 50 ? "bg-primary/10 text-primary border-primary/20" :
                  "bg-destructive/10 text-destructive border-destructive/20"
                )}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                {matchScore}% Match
              </Badge>
            )}
            
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
        </div>

        {/* Ingredients */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Ingredients</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ingredients.map((ing: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50"
              >
                <div className="flex-1">
                  <span className="font-medium">
                    {ing.item || ing.name || 'Unknown'}
                  </span>
                  {(ing.quantity || ing.amount) && (
                    <span className="text-sm text-muted-foreground ml-2">
                      {ing.quantity || ing.amount} {ing.unit || ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Required Appliances */}
        {recipe.required_appliances && recipe.required_appliances.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Required Appliances</h2>
            <div className="flex flex-wrap gap-2">
              {recipe.required_appliances.map((appliance, idx) => (
                <Badge key={idx} variant="outline" className="capitalize">
                  {appliance}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Instructions</h2>
          <ol className="space-y-4">
            {instructions.map((step: any, idx: number) => (
              <li key={idx} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {idx + 1}
                </div>
                <p className="flex-1 pt-1 text-foreground/90">
                  {step.step || step.instruction || step}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 p-6 rounded-xl border border-border bg-card/30 text-center">
          <p className="text-muted-foreground mb-4">
            Like this recipe? Get personalized recipe suggestions based on your pantry with KAEVA.
          </p>
          <Button onClick={() => navigate('/auth')} size="lg" className="gap-2">
            <ChefHat className="w-5 h-5" />
            Try KAEVA Free
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}
