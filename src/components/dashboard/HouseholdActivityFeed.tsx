import { motion } from 'framer-motion';
import { UserPlus, Package, Edit, Trash, ChefHat } from 'lucide-react';
import { useHouseholdActivity } from '@/hooks/useHouseholdActivity';
import { formatDistanceToNow } from 'date-fns';

interface HouseholdActivityFeedProps {
  householdId: string | null;
  maxItems?: number;
}

const getActivityIcon = (activityType: string) => {
  switch (activityType) {
    case 'member_joined':
      return <UserPlus className="w-5 h-5 text-primary" />;
    case 'inventory_added':
      return <Package className="w-5 h-5 text-green-500" />;
    case 'inventory_updated':
      return <Edit className="w-5 h-5 text-blue-500" />;
    case 'inventory_removed':
      return <Trash className="w-5 h-5 text-red-500" />;
    case 'recipe_added':
      return <ChefHat className="w-5 h-5 text-orange-500" />;
    default:
      return <Package className="w-5 h-5 text-muted-foreground" />;
  }
};

const getActivityDescription = (
  activityType: string,
  actorName: string | null,
  entityName: string | null,
  metadata: Record<string, any>
) => {
  const actor = actorName || 'Someone';
  const entity = entityName || 'an item';

  switch (activityType) {
    case 'member_joined':
      return `${actor} joined the household`;
    case 'inventory_added':
      return `${actor} added "${entity}" to ${metadata.category || 'inventory'}`;
    case 'inventory_updated':
      return `${actor} updated "${entity}"`;
    case 'inventory_removed':
      return `${actor} removed "${entity}" from ${metadata.category || 'inventory'}`;
    case 'recipe_added':
      return `${actor} added recipe "${entity}"`;
    default:
      return `${actor} performed an action`;
  }
};

export const HouseholdActivityFeed = ({ householdId, maxItems = 10 }: HouseholdActivityFeedProps) => {
  const { activities, isLoading } = useHouseholdActivity(householdId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No household activity yet</p>
      </div>
    );
  }

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="space-y-4">
      {displayedActivities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            {getActivityIcon(activity.activity_type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">
              {getActivityDescription(
                activity.activity_type,
                activity.actor_name,
                activity.entity_name,
                activity.metadata
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
