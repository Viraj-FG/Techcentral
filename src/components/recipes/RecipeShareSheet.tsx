import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Copy, Share2, X, Check } from "lucide-react";

interface RecipeShareSheetProps {
  open: boolean;
  onClose: () => void;
  recipeId: string;
  recipeName: string;
  isPublic: boolean;
  shareToken?: string;
}

export const RecipeShareSheet = ({
  open,
  onClose,
  recipeId,
  recipeName,
  isPublic: initialIsPublic,
  shareToken: initialShareToken,
}: RecipeShareSheetProps) => {
  const { toast } = useToast();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [shareToken, setShareToken] = useState(initialShareToken);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateShareToken = () => {
    return `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleTogglePublic = async (checked: boolean) => {
    setLoading(true);
    const newToken = checked && !shareToken ? generateShareToken() : shareToken;

    const { error } = await supabase
      .from('recipes')
      .update({
        is_public: checked,
        share_token: newToken,
        shared_at: checked ? new Date().toISOString() : null,
      })
      .eq('id', recipeId);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update recipe sharing settings",
        variant: "destructive",
      });
    } else {
      setIsPublic(checked);
      setShareToken(newToken);
      toast({
        title: checked ? "Recipe Published" : "Recipe Unpublished",
        description: checked
          ? "Your recipe is now publicly accessible"
          : "Your recipe is now private",
      });
    }
  };

  const shareUrl = shareToken
    ? `${window.location.origin}/recipe/${shareToken}`
    : '';

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Recipe link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share && shareUrl) {
      try {
        await navigator.share({
          title: recipeName,
          text: `Check out this recipe: ${recipeName}`,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[60vh]">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-border/10 pb-4">
          <SheetTitle className="text-xl font-semibold text-foreground">
            Share Recipe
          </SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground font-medium">Make Public</Label>
                <p className="text-sm text-muted-foreground">
                  Allow anyone with the link to view this recipe
                </p>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={handleTogglePublic}
                disabled={loading}
              />
            </div>
          </div>

          {isPublic && shareUrl && (
            <>
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-muted/50"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="icon"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-secondary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {navigator.share && (
                <Button
                  onClick={handleNativeShare}
                  className="w-full"
                  variant="outline"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share via...
                </Button>
              )}

              <div className="glass-card p-4 bg-accent/5">
                <p className="text-xs text-muted-foreground">
                  Anyone with this link can view the recipe, but they won't be able to edit or delete it.
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
