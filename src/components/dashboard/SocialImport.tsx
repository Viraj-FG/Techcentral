import { useState, useRef } from "react";
import { Link2, Sparkles, Loader2, ShoppingCart, Upload, Camera, ChefHat, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SocialImportProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onItemsAdded?: () => void;
}

interface Ingredient {
  item: string;
  quantity: string;
  category?: string;
  in_pantry?: boolean;
  estimated_cost?: number;
  inventory_id?: string;
}

interface RecipeData {
  recipe: {
    title: string;
    servings?: number;
    prep_time?: number;
    cook_time?: number;
    instructions?: string[];
  };
  ingredients: {
    in_pantry: Ingredient[];
    missing: Ingredient[];
  };
  match_percent: number;
  total_ingredients: number;
  estimated_total_cost?: number;
}

const SocialImport = ({ open, onClose, userId, onItemsAdded }: SocialImportProps) => {
  const [activeTab, setActiveTab] = useState<"link" | "image">("link");
  const [socialUrl, setSocialUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<RecipeData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      if (data.code === 'LINK_PROTECTED') {
        toast.error('Content Protected', {
          description: 'This link is protected. Try uploading a screenshot instead!'
        });
        setActiveTab('image');
        return;
      }

      setExtractedData(data);
      
      toast.success('Recipe Extracted!', {
        description: `Found ${data.recipe.title}. ${data.match_percent}% match with your pantry.`
      });
    } catch (error) {
      console.error('Extract error:', error);
      toast.error('Failed to extract recipe', {
        description: 'Make sure the URL is from Instagram, TikTok, or YouTube'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (file: File) => {
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('Unsupported format', {
        description: 'Please use JPG or PNG images'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large', {
        description: 'Maximum file size is 5MB'
      });
      return;
    }

    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;

    setLoading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        const { data, error } = await supabase.functions.invoke('extract-social-recipe', {
          body: { image: base64, user_id: userId }
        });

        if (error) throw error;

        setExtractedData(data);
        
        toast.success('Recipe Extracted!', {
          description: `Found ${data.recipe.title}. ${data.match_percent}% match with your pantry.`
        });
      };
      reader.readAsDataURL(selectedImage);
    } catch (error) {
      console.error('Analyze error:', error);
      toast.error('Failed to analyze image', {
        description: 'Make sure the screenshot shows a recipe clearly'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!extractedData || extractedData.ingredients.missing.length === 0) {
      toast.info('No missing ingredients');
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', userId)
        .single();

      if (!profile?.current_household_id) return;

      const items = extractedData.ingredients.missing.map(ing => ({
        item_name: ing.item,
        household_id: profile.current_household_id,
        source: 'social_import',
        priority: 'normal',
        quantity: parseFloat(ing.quantity.match(/\d+\.?\d*/)?.[0] || '1'),
        unit: ing.quantity.replace(/\d+\.?\d*\s*/, '')
      }));

      await supabase.from('shopping_list').insert(items);
      
      toast.success('Added to cart!', {
        description: `${extractedData.ingredients.missing.length} ingredients added · Est. $${extractedData.estimated_total_cost?.toFixed(2) || '0.00'}`
      });
      
      onItemsAdded?.();
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleCookNow = async () => {
    if (!extractedData) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', userId)
        .single();

      if (!profile?.current_household_id) return;

      const recipeData = {
        user_id: userId,
        household_id: profile.current_household_id,
        name: extractedData.recipe.title,
        ingredients: JSON.parse(JSON.stringify([
          ...extractedData.ingredients.in_pantry,
          ...extractedData.ingredients.missing
        ])),
        instructions: JSON.parse(JSON.stringify(extractedData.recipe.instructions || [])),
        servings: extractedData.recipe.servings,
        cooking_time: (extractedData.recipe.prep_time || 0) + (extractedData.recipe.cook_time || 0),
        match_score: extractedData.match_percent,
        difficulty: 'medium',
        cached_at: new Date().toISOString()
      };

      await supabase.from('recipes').insert([recipeData]);
      
      toast.success('Recipe saved!', {
        description: 'Find it in your Recipe Book'
      });
      
      handleClose();
    } catch (error) {
      console.error('Save recipe error:', error);
      toast.error('Failed to save recipe');
    }
  };

  const handleClose = () => {
    setSocialUrl('');
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedData(null);
    setActiveTab('link');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-slate-900/95 backdrop-blur-xl border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-kaeva-electric-sky animate-pulse" strokeWidth={1.5} />
            Social Recipe Import
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Import recipes from social media via link or screenshot
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "link" | "image")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
            <TabsTrigger value="link" className="data-[state=active]:bg-kaeva-electric-sky/20">
              <Link2 className="w-4 h-4 mr-2" />
              Paste Link
            </TabsTrigger>
            <TabsTrigger value="image" className="data-[state=active]:bg-kaeva-electric-sky/20">
              <Camera className="w-4 h-4 mr-2" />
              Upload Screenshot
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 mt-4">
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
                    Analyzing Recipe...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Extract Recipe
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-white/40 space-y-1">
              <p className="font-medium">Supported platforms:</p>
              <p>• Instagram Reels & Posts</p>
              <p>• TikTok Videos</p>
              <p>• YouTube Shorts</p>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4 mt-4">
            {!imagePreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  "border-white/20 hover:border-kaeva-electric-sky/50 bg-slate-800/30 hover:bg-slate-800/50"
                )}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-white/40" />
                <p className="text-white/70 mb-2">Drop screenshot here or click to browse</p>
                <p className="text-xs text-white/40">JPG, PNG • Max 5MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border border-white/10">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500/80 rounded-full hover:bg-red-500"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                <Button 
                  onClick={handleAnalyzeImage} 
                  disabled={loading}
                  className="w-full bg-kaeva-electric-sky hover:bg-kaeva-electric-sky/80"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Screenshot...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      Analyze Recipe
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Enhanced Results Display */}
        {extractedData && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            {/* Recipe Title */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{extractedData.recipe.title}</h3>
              <div className="text-right">
                <p className="text-xs text-white/50">Match Score</p>
                <p className="text-2xl font-bold text-emerald-400">{extractedData.match_percent}%</p>
              </div>
            </div>

            {/* Match Progress Bar */}
            <div className="space-y-1">
              <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-kaeva-electric-sky transition-all duration-500"
                  style={{ width: `${extractedData.match_percent}%` }}
                />
              </div>
              <p className="text-xs text-white/40 text-center">
                {extractedData.ingredients.in_pantry.length} in pantry · {extractedData.ingredients.missing.length} to buy
              </p>
            </div>

            {/* Two-Column Layout */}
            <div className="grid grid-cols-2 gap-3">
              {/* In Pantry */}
              <div className="p-3 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
                <p className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  In Your Pantry ({extractedData.ingredients.in_pantry.length})
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {extractedData.ingredients.in_pantry.map((ing, idx) => (
                    <div key={idx} className="text-xs text-white/70 line-through">
                      {ing.item} <span className="text-white/40">({ing.quantity})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shopping List */}
              <div className="p-3 rounded-lg bg-amber-400/10 border border-amber-400/20">
                <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" />
                  Shopping List ({extractedData.ingredients.missing.length})
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {extractedData.ingredients.missing.map((ing, idx) => (
                    <div key={idx} className="text-xs text-white/90 flex justify-between">
                      <span>{ing.item}</span>
                      <span className="text-white/50">{ing.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cost Estimation */}
            {extractedData.estimated_total_cost && extractedData.estimated_total_cost > 0 && (
              <div className="p-3 rounded-lg bg-kaeva-electric-sky/10 border border-kaeva-electric-sky/20 flex items-center justify-between">
                <p className="text-sm text-white/70">Estimated Cost</p>
                <p className="text-lg font-bold text-kaeva-electric-sky">
                  ${extractedData.estimated_total_cost.toFixed(2)}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleCookNow}
                variant="outline"
                className="border-white/20 hover:bg-white/5"
              >
                <ChefHat className="w-4 h-4 mr-2" />
                Cook Now
              </Button>
              
              <Button
                onClick={handleAddToCart}
                disabled={extractedData.ingredients.missing.length === 0}
                className="bg-emerald-400 hover:bg-emerald-500 text-kaeva-void font-semibold"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
                {extractedData.estimated_total_cost && ` • $${extractedData.estimated_total_cost.toFixed(2)}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SocialImport;
