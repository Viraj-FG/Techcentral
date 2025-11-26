import { motion } from 'framer-motion';
import { ChefHat, Clock, Utensils } from 'lucide-react';
import type { Recipe } from '../ScanResults';

interface DetectedItem {
  name: string;
  category: 'fridge' | 'pantry' | 'beauty' | 'pets' | 'appliance' | 'meal';
}

const ApplianceScanResult = ({ 
  items, 
  unlockedRecipes 
}: { 
  items: DetectedItem[];
  unlockedRecipes?: Recipe[];
}) => {
  const appliances = items.filter(i => i.category === 'appliance');

  return (
    <div className="space-y-6">
      {/* Appliance Cards */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Detected Appliances</h3>
        {appliances.map((appliance, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-2xl border border-orange-500/30"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-orange-500/10 blur-2xl rounded-2xl" />
            
            <div className="relative flex items-center gap-4">
              <ChefHat className="w-10 h-10 text-orange-400" />
              <div>
                <h4 className="text-xl font-bold text-white">{appliance.name}</h4>
                <span className="inline-block mt-1 px-2 py-0.5 bg-secondary/20 text-secondary text-xs font-semibold rounded-full">
                  NEW
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Unlocked Recipes */}
      {unlockedRecipes && unlockedRecipes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">🎉 Unlocked Recipes</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
            {unlockedRecipes.map((recipe, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 w-64 p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 hover:border-secondary/50 transition-colors cursor-pointer"
              >
                <div className="w-full h-32 bg-slate-700 rounded-lg mb-3 flex items-center justify-center">
                  <Utensils className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="font-semibold text-white mb-1">{recipe.name}</h4>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>{recipe.cookingTime} min</span>
                  <span>•</span>
                  <span className="capitalize">{recipe.difficulty}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplianceScanResult;
