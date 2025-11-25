import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SpoiledItem {
  id: string;
  name: string;
  days_old: number;
  category: string;
}

interface SpoilageReviewProps {
  items: SpoiledItem[];
  onComplete: () => void;
}

export const SpoilageReview = ({ items, onComplete }: SpoilageReviewProps) => {
  const [reviewedItems, setReviewedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const handleKeep = async (itemId: string) => {
    try {
      // Update last_activity_at to reset spoilage timer
      const { error } = await supabase
        .from('inventory')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) throw error;

      setReviewedItems(prev => new Set([...prev, itemId]));
      toast.success("Item marked as fresh");
    } catch (error) {
      console.error('Error keeping item:', error);
      toast.error("Failed to update item");
    }
  };

  const handleDiscard = async (item: SpoiledItem) => {
    try {
      setLoading(true);

      // Mark as out of stock
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          quantity: 0,
          status: 'out_of_stock'
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      // Add to shopping list
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('shopping_list')
          .insert({
            user_id: user.id,
            item_name: item.name,
            quantity: 1,
            source: 'spoilage',
            priority: 'normal',
            inventory_id: item.id
          });
      }

      setReviewedItems(prev => new Set([...prev, item.id]));
      toast.success(`${item.name} discarded and added to shopping list`);
    } catch (error) {
      console.error('Error discarding item:', error);
      toast.error("Failed to discard item");
    } finally {
      setLoading(false);
    }
  };

  const unreviewed = items.filter(item => !reviewedItems.has(item.id));

  if (unreviewed.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-warning/10 to-destructive/10 border-warning/30">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Spoilage Alert</h3>
          <p className="text-sm text-muted-foreground">
            Check these {unreviewed.length} item{unreviewed.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {unreviewed.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-background/60 backdrop-blur-sm rounded-lg p-3 border border-border/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.days_old} days old • {item.category}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleKeep(item.id)}
                  disabled={loading}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Still Good
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDiscard(item)}
                  disabled={loading}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Discard
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {reviewedItems.size > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3"
          onClick={onComplete}
        >
          <X className="w-4 h-4 mr-2" />
          Done Reviewing
        </Button>
      )}
    </Card>
  );
};