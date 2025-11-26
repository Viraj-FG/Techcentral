import { Trash2, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MealPlanCardProps {
  meal: {
    id: string;
    meal_type: string;
    recipes: {
      name: string;
      estimated_calories: number | null;
    };
  };
  onDelete: () => void;
}

export const MealPlanCard = ({ meal, onDelete }: MealPlanCardProps) => {
  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <Utensils className="w-3 h-3 text-primary flex-shrink-0" />
          <span className="text-xs text-muted-foreground capitalize truncate">
            {meal.meal_type}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      <p className="text-xs font-medium text-foreground line-clamp-2">
        {meal.recipes?.name || 'Unnamed Recipe'}
      </p>
      {meal.recipes?.estimated_calories && (
        <p className="text-xs text-muted-foreground">
          {meal.recipes.estimated_calories} cal
        </p>
      )}
    </div>
  );
};
