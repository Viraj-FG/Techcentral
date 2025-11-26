import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

interface BookmarkButtonProps {
  itemId: string;
  itemType: 'food' | 'recipe' | 'product' | 'pet_food' | 'beauty_product';
  isBookmarked?: boolean;
  onToggle?: (bookmarked: boolean) => void;
  variant?: 'default' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
}

export const BookmarkButton = ({
  itemId,
  itemType,
  isBookmarked: initialBookmarked = false,
  onToggle,
  variant = 'ghost',
  size = 'icon'
}: BookmarkButtonProps) => {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    haptics.selection();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', itemId)
          .eq('item_type', itemType);

        if (error) throw error;

        setIsBookmarked(false);
        onToggle?.(false);
        toast.success("Bookmark removed");
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            item_id: itemId,
            item_type: itemType
          });

        if (error) throw error;

        setIsBookmarked(true);
        onToggle?.(true);
        toast.success("Bookmarked");
        haptics.success();
      }
    } catch (error) {
      console.error("Bookmark error:", error);
      toast.error("Failed to update bookmark");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className="transition-all duration-300"
    >
      <Bookmark
        size={20}
        className={isBookmarked ? "fill-primary text-primary" : "text-muted-foreground"}
      />
    </Button>
  );
};
