import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ProductTruthData } from '../ScanResults';

// Better Alternative Card Component with Instacart swap
const BetterAlternativeCard = ({ alternative }: { alternative: { name: string; brand?: string; reason: string; instacartLink?: string } }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleShopAlternative = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('instacart-service', {
        body: {
          action: 'swap_product',
          userId: user.id,
          swapData: {
            productName: alternative.name,
            brand: alternative.brand
          }
        }
      });

      if (error) throw error;

      window.open(data.productsLink, '_blank');
      
      toast({
        title: "Better Choice!",
        description: "Opening healthier alternative on Instacart with your dietary filters applied..."
      });
    } catch (error) {
      console.error('Error creating swap link:', error);
      toast({
        title: "Error",
        description: "Failed to create shopping link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl border border-secondary/30 overflow-hidden">
      <h4 className="text-sm font-semibold text-secondary uppercase tracking-wide mb-2">
        ✨ Better Alternative
      </h4>
      <p className="text-white font-semibold mb-1 truncate">
        {alternative.name}
        {alternative.brand && <span className="text-slate-400 font-normal ml-2">by {alternative.brand}</span>}
      </p>
      <p className="text-sm text-slate-300 mb-3 truncate">{alternative.reason}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={handleShopAlternative}
        disabled={loading}
        className="w-full border-secondary/50 text-secondary hover:bg-secondary/10 gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Creating Link...
          </>
        ) : (
          <>
            <ExternalLink size={16} />
            Shop Better Alternative
          </>
        )}
      </Button>
    </div>
  );
};

const ProductAnalysisResult = ({ data }: { data?: ProductTruthData }) => {
  if (!data) return null;

  const getScoreColor = (score: number) => {
    if (score >= 71) return { color: 'emerald', label: 'Clean' };
    if (score >= 41) return { color: 'yellow', label: 'Caution' };
    return { color: 'red', label: 'Deceptive' };
  };

  const scoreInfo = getScoreColor(data.truthScore);

  return (
    <div className="space-y-6">
      {/* Product header */}
      <div className="flex items-center gap-4">
        {data.image_url && (
          <div className="w-20 h-20 bg-slate-700 rounded-xl overflow-hidden flex-shrink-0">
            <img src={data.image_url} alt={data.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <h3 className="text-xl font-bold text-white">{data.name}</h3>
          {data.brand && <p className="text-slate-400">{data.brand}</p>}
        </div>
      </div>

      {/* Truth Score Ring */}
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(148, 163, 184, 0.1)"
            strokeWidth="10"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={`rgb(${scoreInfo.color === 'emerald' ? '16, 185, 129' : scoreInfo.color === 'yellow' ? '245, 158, 11' : '239, 68, 68'})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${data.truthScore * 2.51} ${251 - data.truthScore * 2.51}`}
            initial={{ strokeDasharray: "0 251" }}
            animate={{ strokeDasharray: `${data.truthScore * 2.51} ${251 - data.truthScore * 2.51}` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="text-5xl font-bold text-white"
          >
            {data.truthScore}
          </motion.div>
          <div className={cn(
            "text-sm font-semibold uppercase tracking-wide",
            scoreInfo.color === 'emerald' && "text-emerald-400",
            scoreInfo.color === 'yellow' && "text-yellow-400",
            scoreInfo.color === 'red' && "text-red-400"
          )}>
            {scoreInfo.label}
          </div>
        </div>
      </div>

      {/* Allergen Warnings */}
      {data.allergenWarnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wide">⚠️ Allergen Warnings</h4>
          {data.allergenWarnings.map((warning, index) => (
            <div
              key={index}
              className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-red-400">{warning.allergen}</span>
                <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-300 rounded-full uppercase">
                  {warning.severity}
                </span>
              </div>
              <p className="text-sm text-red-300/80">{warning.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Deception Flags */}
      {data.deceptionFlags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wide">🚨 Deception Detected</h4>
          {data.deceptionFlags.map((flag, index) => (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg border",
                flag.severity === 'critical' 
                  ? "bg-red-500/10 border-red-500/30" 
                  : "bg-yellow-500/10 border-yellow-500/30"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-white">"{flag.detected}"</span>
                <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">
                  Actually: {flag.actualTerm}
                </span>
              </div>
              <p className="text-sm text-slate-300">{flag.reason}</p>
            </div>
          ))}
        </div>
      )}

      {/* Better Alternative */}
      {data.betterAlternative && (
        <BetterAlternativeCard alternative={data.betterAlternative} />
      )}
    </div>
  );
};

export default ProductAnalysisResult;
