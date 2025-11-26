import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MealLogCardProps {
  mealType: string;
  loggedAt: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
  items?: any;
}

export const MealLogCard = ({
  mealType,
  loggedAt,
  calories,
  protein,
  carbs,
  fat,
  imageUrl,
  items,
}: MealLogCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(loggedAt), { addSuffix: true });

  // Get first item name or use meal type
  const displayName = items?.[0]?.name || mealType;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-4 flex gap-3 overflow-hidden"
    >
      {/* Optional Thumbnail */}
      {imageUrl && (
        <div className="flex-shrink-0">
          <img
            src={imageUrl}
            alt={displayName}
            className="w-16 h-16 rounded-lg object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-foreground truncate capitalize">
            {displayName}
          </h4>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo}
          </span>
        </div>

        {/* Calories */}
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-primary" />
          <span className="text-2xl font-bold text-foreground">
            {calories}
          </span>
          <span className="text-sm text-muted-foreground">cal</span>
        </div>

        {/* Macros Row */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">{protein}g P</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-secondary" />
            <span className="text-muted-foreground">{carbs}g C</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-muted-foreground">{fat}g F</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
