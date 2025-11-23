import { useState } from "react";
import { Link2, Sparkles, Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SocialImportProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onItemsAdded?: () => void;
}

const SocialImport = ({ open, onClose, userId, onItemsAdded }: SocialImportProps) => {
  const [socialUrl, setSocialUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    missing: string[];
    total: number;
    match_percent: string;
  } | null>(null);

  const handleExtract = async () => {
    if (!socialUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-social-recipe', {
        body: { url: socialUrl, user_id: userId }
      });

      if (error) throw error;

      setExtractedData(data);
      
      toast.success('Recipe Extracted!', {
        description: `Found ${data.total} ingredients. You have ${data.match_percent}% in your pantry.`
      });
    } catch (error) {
      console.error('Extract error:', error);
      toast.error('Failed to extract recipe', {
        description: 'Make sure the URL is from Instagram or TikTok'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!extractedData || extractedData.missing.length === 0) {
      toast.info('No missing ingredients');
      return;
    }

    try {
      const items = extractedData.missing.map(ing => ({
        item_name: ing,
        user_id: userId,
        source: 'social_import',
        priority: 'normal',
        quantity: 1
      }));

      await supabase.from('shopping_list').insert(items);
      
      toast.success('Added to cart!', {
        description: `${extractedData.missing.length} missing ingredients added`
      });
      
      onItemsAdded?.();
      handleClose();
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleClose = () => {
    setSocialUrl('');
    setExtractedData(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-slate-900/95 border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Link2 className="w-5 h-5 text-kaeva-electric-sky" strokeWidth={1.5} />
            Import from Social Media
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Paste an Instagram or TikTok recipe URL to extract ingredients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="https://instagram.com/p/... or https://tiktok.com/@..."
              value={socialUrl}
              onChange={(e) => setSocialUrl(e.target.value)}
              className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/40"
              disabled={loading}
            />

            <Button 
              onClick={handleExtract} 
              disabled={loading || !socialUrl.trim()}
              className="w-full bg-kaeva-electric-sky hover:bg-kaeva-electric-sky/80"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Extract Ingredients
                </>
              )}
            </Button>
          </div>

          {/* Extracted Results */}
          {extractedData && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Recipe Match</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {extractedData.match_percent}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/70">Total Ingredients</p>
                  <p className="text-2xl font-bold text-white">
                    {extractedData.total}
                  </p>
                </div>
              </div>

              {extractedData.missing.length > 0 && (
                <>
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-xs font-medium text-amber-400 mb-2">
                      Missing Ingredients ({extractedData.missing.length}):
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {extractedData.missing.map((ing, idx) => (
                        <div key={idx} className="text-sm text-white/70 flex items-center gap-2">
                          <span className="text-amber-400">•</span>
                          <span>{ing}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    className="w-full bg-emerald-400 hover:bg-emerald-500 text-kaeva-void font-semibold"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Add Missing to Cart
                  </Button>
                </>
              )}

              {extractedData.missing.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-emerald-400 text-sm font-medium">
                    ✨ You have everything!
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    All ingredients are in your pantry
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Examples */}
          <div className="text-xs text-white/40 space-y-1">
            <p>Examples:</p>
            <p>• instagram.com/p/ABC123...</p>
            <p>• tiktok.com/@chef/video/123...</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SocialImport;