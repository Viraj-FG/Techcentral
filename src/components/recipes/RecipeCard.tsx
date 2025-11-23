import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, TrendingUp, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Recipe {
  id: string;
  name: string;
  match_score: number | null;
  cooking_time: number | null;
  servings: number | null;
  difficulty: string | null;
  estimated_calories: number | null;
}

interface Props {
  recipe: Recipe;
  onClick: () => void;
}

export const RecipeCard = ({ recipe, onClick }: Props) => {
  const matchScore = recipe.match_score || 0;
  
  const getMatchColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (score >= 50) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-emerald-500/10 text-emerald-600';
      case 'medium': return 'bg-amber-500/10 text-amber-600';
      case 'hard': return 'bg-red-500/10 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:bg-card/70 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
            {recipe.name}
          </h3>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <ChefHat className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Match Score */}
      <div className="mb-4">
        <Badge variant="outline" className={cn("text-sm font-medium", getMatchColor(matchScore))}>
          <TrendingUp className="w-3 h-3 mr-1" />
          {matchScore}% Match
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {recipe.cooking_time && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{recipe.cooking_time}m</span>
          </div>
        )}
        {recipe.servings && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{recipe.servings}</span>
          </div>
        )}
        {recipe.estimated_calories && (
          <div className="text-sm text-muted-foreground">
            {recipe.estimated_calories} cal
          </div>
        )}
      </div>

      {/* Difficulty */}
      {recipe.difficulty && (
        <Badge variant="outline" className={cn("capitalize", getDifficultyColor(recipe.difficulty))}>
          {recipe.difficulty}
        </Badge>
      )}
    </motion.div>
  );
};
