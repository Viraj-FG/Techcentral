import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetectedItem {
  name: string;
  brand?: string;
  product_image_url?: string;
  metadata?: {
    pao_symbol?: string;
  };
}

const VanitySweepResult = ({ items }: { items: DetectedItem[] }) => {
  return (
    <div className="space-y-4">
      <p className="text-slate-300">
        Found <span className="font-bold text-white">{items.length}</span> beauty products
      </p>

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
                  ? "bg-red-500/10 border-red-500/50" 
                  : isExpiringSoon 
                  ? "bg-yellow-500/10 border-yellow-500/50"
                  : "bg-slate-800/40 border-slate-700/50"
              )}
            >
              {/* Product image */}
              <div className="w-full aspect-square bg-slate-700 rounded-lg mb-2 overflow-hidden">
                {item.product_image_url ? (
                  <img src={item.product_image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>

              {/* Product info */}
              <h4 className="font-semibold text-white text-sm leading-tight mb-1">{item.name}</h4>
              {item.brand && (
                <p className="text-xs text-slate-400 mb-2">{item.brand}</p>
              )}

              {/* Expiry info */}
              <div className="space-y-1">
                {item.metadata?.pao_symbol && (
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <span>PAO: {item.metadata.pao_symbol}</span>
                  </div>
                )}
                {isExpired ? (
                  <span className="inline-block px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                    Expired
                  </span>
                ) : isExpiringSoon ? (
                  <span className="inline-block px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                    {daysUntilExpiry} days left
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 bg-kaeva-sage/20 text-kaeva-sage text-xs rounded-full">
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
