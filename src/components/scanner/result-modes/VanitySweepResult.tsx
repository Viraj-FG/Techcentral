import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UniversalFixSheet } from '@/components/ui/UniversalFixSheet';
import { BookmarkButton } from '@/components/ui/BookmarkButton';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';

// Inline skin compatibility analyzer to avoid import issues
const analyzeSkinCompatibility = (ingredients: string, skinType: string) => {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  
  const lowerIngredients = ingredients.toLowerCase();
  
  if (skinType.toLowerCase() === 'oily') {
    if (lowerIngredients.includes('coconut oil') || lowerIngredients.includes('mineral oil')) {
      warnings.push('Contains comedogenic oils that may clog pores');
      score -= 20;
    }
    recommendations.push('Look for oil-free, non-comedogenic products');
  } else if (skinType.toLowerCase() === 'dry') {
    if (lowerIngredients.includes('alcohol') || lowerIngredients.includes('sulfate')) {
      warnings.push('Contains drying ingredients');
      score -= 20;
    }
    recommendations.push('Look for hydrating ingredients like hyaluronic acid');
  } else if (skinType.toLowerCase() === 'sensitive') {
    if (lowerIngredients.includes('fragrance') || lowerIngredients.includes('parfum')) {
      warnings.push('Contains potential irritants');
      score -= 25;
    }
    recommendations.push('Choose fragrance-free formulas');
  }
  
  return { score: Math.max(0, score), warnings, recommendations };
};

interface BeautyWarning {
  ingredient: string;
  category: 'harmful' | 'irritant' | 'comedogenic' | 'allergen';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface DetectedItem {
  name: string;
  brand?: string;
  product_image_url?: string;
  metadata?: {
    pao_symbol?: string;
    ingredients?: string;
  };
  beauty_warnings?: BeautyWarning[];
  has_harmful_ingredients?: boolean;
}

const VanitySweepResult = ({ items }: { items: DetectedItem[] }) => {
  const [userSkinType, setUserSkinType] = useState<string>('');

  useEffect(() => {
    fetchUserSkinType();
  }, []);

  const fetchUserSkinType = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('beauty_profile')
      .eq('id', user.id)
      .single();

    if (data?.beauty_profile) {
      const beautyProfile = data.beauty_profile as any;
      setUserSkinType(beautyProfile.skinType || '');
    }
  };

  const handleFixProduct = async (correction: string) => {
    console.log("Re-analyzing beauty products with correction:", correction);
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'bg-secondary/10 text-secondary border-secondary/20';
    if (score >= 50) return 'bg-primary/10 text-primary border-primary/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Found <span className="font-bold text-foreground">{items.length}</span> beauty products
      </p>

      {/* Fix Products Info */}
      <UniversalFixSheet
        domain="beauty"
        onSubmit={handleFixProduct}
        triggerLabel="Fix Products Info"
      />

      <div className="grid grid-cols-2 gap-3">
        {items.map((item, index) => {
          const paoMonths = item.metadata?.pao_symbol 
            ? parseInt(item.metadata.pao_symbol.replace('M', '')) 
            : 12;
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + paoMonths);
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const isExpired = daysUntilExpiry < 0;
          const isExpiringSoon = daysUntilExpiry < 30 && !isExpired;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "p-3 rounded-xl border",
                isExpired 
                  ? "bg-destructive/10 border-destructive/50" 
                  : isExpiringSoon 
                  ? "bg-primary/10 border-primary/50"
                  : "bg-card/40 border-border/50"
              )}
            >
              {/* Product image */}
              <div className="w-full aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                {item.product_image_url ? (
                  <img src={item.product_image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-foreground text-sm leading-tight flex-1">{item.name}</h4>
                  <BookmarkButton itemId={item.name} itemType="beauty_product" size="sm" />
                </div>
                
                {item.brand && (
                  <p className="text-xs text-muted-foreground">{item.brand}</p>
                )}
              </div>

              {/* Beauty Warnings */}
              {item.beauty_warnings && item.beauty_warnings.length > 0 && (
                <div className="space-y-1 mt-2">
                  {item.has_harmful_ingredients && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Harmful ingredients
                    </Badge>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {item.beauty_warnings.slice(0, 2).map((warning, idx) => (
                      <Badge
                        key={idx}
                        variant={warning.severity === 'high' ? 'destructive' : 'secondary'}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {warning.ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Skin Compatibility */}
              {userSkinType && item.metadata?.ingredients && (
                (() => {
                  const compatibility = analyzeSkinCompatibility(item.metadata.ingredients, userSkinType);
                  return (
                    <Collapsible className="mt-2">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-2 rounded-lg border border-border bg-card/30 hover:bg-card/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3 text-accent" />
                            <span className="text-xs font-medium">Skin Compatibility</span>
                          </div>
                          <Badge variant="outline" className={cn("text-[10px]", getCompatibilityColor(compatibility.score))}>
                            {compatibility.score}%
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-1 space-y-1">
                        {compatibility.warnings.map((warning, idx) => (
                          <div key={idx} className="flex items-start gap-1 p-1.5 rounded-lg bg-muted/30 text-[10px]">
                            <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0 mt-0.5 text-primary" />
                            <p className="text-muted-foreground">{warning}</p>
                          </div>
                        ))}
                        {compatibility.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-1 p-1.5 rounded-lg bg-secondary/5 text-[10px]">
                            <Sparkles className="w-2.5 h-2.5 flex-shrink-0 mt-0.5 text-secondary" />
                            <p className="text-muted-foreground">{rec}</p>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })()
              )}

              {/* Expiry info */}
              <div className="space-y-1 mt-2">
                {item.metadata?.pao_symbol && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>PAO: {item.metadata.pao_symbol}</span>
                  </div>
                )}
                {isExpired ? (
                  <span className="inline-block px-2 py-0.5 bg-destructive/20 text-destructive text-xs rounded-full">
                    Expired
                  </span>
                ) : isExpiringSoon ? (
                  <span className="inline-block px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                    {daysUntilExpiry} days left
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 bg-secondary/20 text-secondary text-xs rounded-full">
                    <Shield className="w-3 h-3 inline mr-1" />
                    Fresh
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default VanitySweepResult;
