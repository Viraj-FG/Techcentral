import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import type { Recipe } from '../ScanResults';

interface DetectedItem {
  name: string;
}

interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

const NutritionTrackResult = ({
  subtype,
  items,
  macros,
  recipes
}: {
  subtype?: 'raw' | 'cooked';
  items: DetectedItem[];
  macros?: Macros;
  recipes?: Recipe[];
}) => {
  if (subtype === 'raw' && recipes) {
    // Recipe suggestions view
    return (
      <div className="space-y-4">
        <p className="text-slate-300">
          Found <span className="font-bold text-white">{recipes.length}</span> recipes using your ingredients
        </p>
        <div className="space-y-3">
          {recipes.map((recipe, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 hover:border-kaeva-sage/50 transition-colors cursor-pointer"
            >
              <h4 className="text-lg font-semibold text-white mb-2">{recipe.name}</h4>
              <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{recipe.cookingTime} min</span>
                </div>
                <span className="capitalize px-2 py-0.5 bg-slate-700 rounded-full">{recipe.difficulty}</span>
                <span>{recipe.calories} cal</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recipe.requiredAppliances.map(appliance => (
                  <span key={appliance} className="text-xs px-2 py-1 bg-kaeva-sage/20 text-kaeva-sage rounded-full">
                    {appliance}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (subtype === 'cooked' && macros) {
    // Macro analysis view
    const proteinPercent = (macros.protein * 4 / macros.calories) * 100;
    const carbsPercent = (macros.carbs * 4 / macros.calories) * 100;
    const fatPercent = (macros.fat * 9 / macros.calories) * 100;

    return (
      <div className="space-y-6">
        {/* Calorie display */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="inline-block"
          >
            <div className="text-6xl font-bold text-white">{macros.calories}</div>
            <div className="text-slate-400 text-sm uppercase tracking-wide">Calories</div>
          </motion.div>
        </div>

        {/* Macro ring chart */}
        <div className="relative w-48 h-48 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgba(148, 163, 184, 0.1)"
              strokeWidth="12"
            />
            {/* Protein arc */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#10b981"
              strokeWidth="12"
              strokeDasharray={`${proteinPercent * 2.51} ${251 - proteinPercent * 2.51}`}
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 251" }}
              animate={{ strokeDasharray: `${proteinPercent * 2.51} ${251 - proteinPercent * 2.51}` }}
              transition={{ duration: 1, delay: 0.2 }}
            />
            {/* Carbs arc */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="12"
              strokeDasharray={`${carbsPercent * 2.51} ${251 - carbsPercent * 2.51}`}
              strokeDashoffset={-proteinPercent * 2.51}
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 251" }}
              animate={{ strokeDasharray: `${carbsPercent * 2.51} ${251 - carbsPercent * 2.51}` }}
              transition={{ duration: 1, delay: 0.4 }}
            />
            {/* Fat arc */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="12"
              strokeDasharray={`${fatPercent * 2.51} ${251 - fatPercent * 2.51}`}
              strokeDashoffset={-(proteinPercent + carbsPercent) * 2.51}
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 251" }}
              animate={{ strokeDasharray: `${fatPercent * 2.51} ${251 - fatPercent * 2.51}` }}
              transition={{ duration: 1, delay: 0.6 }}
            />
          </svg>
        </div>

        {/* Macro breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-white font-medium">Protein</span>
            </div>
            <span className="text-white font-bold">{macros.protein}g</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-white font-medium">Carbs</span>
            </div>
            <span className="text-white font-bold">{macros.carbs}g</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-white font-medium">Fat</span>
            </div>
            <span className="text-white font-bold">{macros.fat}g</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default NutritionTrackResult;
