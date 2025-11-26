import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ShoppingCart, Loader2, Check, Pencil, Search, MoreVertical, Trash2, Flag, Download, Undo, Redo, BookmarkPlus, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FixResultSheet } from './FixResultSheet';
import { PhotoEditModal } from '../PhotoEditModal';
import { MealTemplateSheet } from '../MealTemplateSheet';
import { SaveTemplateDialog } from '../SaveTemplateDialog';
import type { Recipe } from '../ScanResults';

interface DetectedItem {
  name: string;
  quantity?: string;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
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
  recipes,
  imageUrl,
  onMealLogged
}: {
  subtype?: 'raw' | 'cooked';
  items: DetectedItem[];
  macros?: Macros;
  recipes?: Recipe[];
  imageUrl?: string;
  onMealLogged?: () => void;
}) => {
  const [orderingRecipe, setOrderingRecipe] = useState<string | null>(null);
  const [cookingRecipe, setCookingRecipe] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [logging, setLogging] = useState(false);
  const [editedItems, setEditedItems] = useState<DetectedItem[]>(items);
  const [servingUnit, setServingUnit] = useState<'serving' | 'package' | 'grams'>('serving');
  const [servingCount, setServingCount] = useState(1);
  const [editingServingCount, setEditingServingCount] = useState(false);
  const [editedImage, setEditedImage] = useState<string | undefined>(imageUrl);
  const [showPhotoEdit, setShowPhotoEdit] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [history, setHistory] = useState<DetectedItem[][]>([items]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [userId, setUserId] = useState<string>("");
  const { toast } = useToast();

  // Fetch user ID on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  // Save to history
  const saveToHistory = (newItems: DetectedItem[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newItems);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setEditedItems(newItems);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditedItems(history[newIndex]);
      toast({ title: "Undone" });
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEditedItems(history[newIndex]);
      toast({ title: "Redone" });
    }
  };

  // Load template
  const handleLoadTemplate = (template: any) => {
    saveToHistory(template.items);
    toast({ title: `Loaded "${template.template_name}"` });
  };

  const handleFixIssue = async (correction: string) => {
    // Placeholder for AI re-analysis
    toast({
      title: "Re-analyzing...",
      description: "AI will re-analyze your meal with the correction",
    });
  };

  const handleDeleteFood = (index: number) => {
    const newItems = editedItems.filter((_, i) => i !== index);
    saveToHistory(newItems);
    toast({
      title: "Item removed",
      description: "Food item deleted from meal",
    });
  };

  const handleSaveImage = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `meal-${Date.now()}.jpg`;
      link.click();
      toast({ title: "Image saved" });
    }
  };

  const handleReportFood = () => {
    toast({
      title: "Report submitted",
      description: "Thank you for helping us improve accuracy",
    });
  };

  const getMealType = (hour: number): string => {
    if (hour < 11) return 'breakfast';
    if (hour < 16) return 'lunch';
    if (hour < 20) return 'dinner';
    return 'snack';
  };

  const handleLogMeal = async () => {
    setLogging(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Apply serving multiplier
      const multiplier = servingCount * (servingUnit === 'package' ? 2 : servingUnit === 'grams' ? 1.5 : 1);

      // Recalculate totals from edited items with multiplier
      const totals = editedItems.reduce((sum, item) => ({
        calories: sum.calories + (item.nutrition?.calories || 0) * multiplier,
        protein: sum.protein + (item.nutrition?.protein || 0) * multiplier,
        carbs: sum.carbs + (item.nutrition?.carbs || 0) * multiplier,
        fat: sum.fat + (item.nutrition?.fat || 0) * multiplier,
        fiber: sum.fiber + (item.nutrition?.fiber || 0) * multiplier
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

      const { error } = await supabase.from('meal_logs').insert({
        user_id: user.id,
        meal_type: getMealType(new Date().getHours()),
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        fiber: totals.fiber,
        image_url: imageUrl,
        items: editedItems.map(i => ({ 
          name: i.name, 
          quantity: i.quantity,
          nutrition: i.nutrition 
        })),
        logged_at: new Date().toISOString()
      });

      if (error) throw error;

      toast({
        title: "Meal Logged!",
        description: `${totals.calories} calories tracked successfully`
      });

      onMealLogged?.();
    } catch (error) {
      console.error('Error logging meal:', error);
      toast({
        title: "Error",
        description: "Failed to log meal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLogging(false);
    }
  };

  const handleEditItem = (index: number) => {
    setEditingIndex(index);
    setSearchQuery(editedItems[index].name);
    setSearchResults([]);
  };

  const searchFatSecretFromClient = async (query: string) => {
    if (query.length < 2) return;

    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-product', {
        body: { name: query, category: 'fridge' }
      });

      if (error) throw error;

      if (data && data.nutrition) {
        setSearchResults([{
          name: data.name,
          calories: data.nutrition.calories,
          protein: data.nutrition.protein,
          carbs: data.nutrition.carbs,
          fat: data.nutrition.fat,
          fiber: data.nutrition.fiber
        }]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching food:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for food",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const replaceItem = (index: number, newItem: any) => {
    const updated = [...editedItems];
    updated[index] = {
      name: newItem.name,
      quantity: editedItems[index].quantity,
      nutrition: {
        calories: newItem.calories,
        protein: newItem.protein,
        carbs: newItem.carbs,
        fat: newItem.fat,
        fiber: newItem.fiber
      }
    };
    saveToHistory(updated);
    setEditingIndex(null);
    toast({
      title: "Item Updated",
      description: `Replaced with ${newItem.name}`
    });
  };

  const handleCookRecipe = async (recipe: Recipe) => {
    setCookingRecipe(true);
    try {
      const { data, error } = await supabase.functions.invoke('cook-recipe', {
        body: {
          recipe: {
            name: recipe.name,
            ingredients: items.map(item => ({
              name: item.name,
              quantity: 1,
              unit: 'item'
            }))
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Recipe logged!",
        description: data.message
      });
    } catch (error) {
      console.error('Error logging recipe:', error);
      toast({
        title: "Error",
        description: "Failed to log recipe ingredients",
        variant: "destructive"
      });
    } finally {
      setCookingRecipe(false);
    }
  };

  const handleOrderIngredients = async (recipe: Recipe) => {
    setOrderingRecipe(recipe.name);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const ingredients = items.map(item => ({
        name: item.name,
        quantity: '1',
        unit: 'item'
      }));

      const { data, error } = await supabase.functions.invoke('instacart-service', {
        body: {
          action: 'create_recipe',
          userId: user.id,
          recipeData: {
            name: recipe.name,
            ingredients,
            servings: 4,
            description: `${recipe.cookingTime} min • ${recipe.difficulty}`
          }
        }
      });

      if (error) throw error;

      window.open(data.recipeLink, '_blank');
      
      toast({
        title: "Recipe Cart Ready!",
        description: "Opening Instacart with ingredients (pantry items excluded)..."
      });
    } catch (error) {
      console.error('Error creating recipe cart:', error);
      toast({
        title: "Error",
        description: "Failed to create recipe cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setOrderingRecipe(null);
    }
  };

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
              className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 hover:border-secondary/50 transition-colors cursor-pointer"
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
              <div className="flex flex-wrap gap-2 mb-3">
                {recipe.requiredAppliances.map(appliance => (
                  <span key={appliance} className="text-xs px-2 py-1 bg-secondary/20 text-secondary rounded-full">
                    {appliance}
                  </span>
                ))}
              </div>
              <Button
                onClick={() => handleOrderIngredients(recipe)}
                disabled={orderingRecipe === recipe.name}
                className="w-full bg-secondary hover:bg-secondary/90 text-background font-semibold gap-2"
                size="sm"
              >
                {orderingRecipe === recipe.name ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Creating Cart...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    Order Ingredients
                  </>
                )}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

    if (subtype === 'cooked' && editedItems.length > 0) {
    // Apply serving multiplier
    const multiplier = servingCount * (servingUnit === 'package' ? 2 : servingUnit === 'grams' ? 1.5 : 1);

    // Recalculate totals from edited items
    const currentTotals = editedItems.reduce((sum, item) => ({
      calories: sum.calories + (item.nutrition?.calories || 0) * multiplier,
      protein: sum.protein + (item.nutrition?.protein || 0) * multiplier,
      carbs: sum.carbs + (item.nutrition?.carbs || 0) * multiplier,
      fat: sum.fat + (item.nutrition?.fat || 0) * multiplier,
      fiber: sum.fiber + (item.nutrition?.fiber || 0) * multiplier
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    const proteinPercent = (currentTotals.protein * 4 / currentTotals.calories) * 100 || 0;
    const carbsPercent = (currentTotals.carbs * 4 / currentTotals.calories) * 100 || 0;
    const fatPercent = (currentTotals.fat * 9 / currentTotals.calories) * 100 || 0;

    return (
      <div className="space-y-6">
        {/* Captured Photo */}
        {editedImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="relative overflow-hidden rounded-xl"
          >
            <img 
              src={editedImage} 
              alt="Meal" 
              className="w-full h-48 object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setShowPhotoEdit(true)}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Edit Photo
            </Button>
          </motion.div>
        )}

        {/* Serving Controls & Actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Undo/Redo Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex === 0}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          {/* Serving Unit Toggle */}
          <div className="flex gap-2">
            {['serving', 'package', 'grams'].map((unit) => (
              <button
                key={unit}
                onClick={() => setServingUnit(unit as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  servingUnit === unit
                    ? 'bg-primary text-background'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                }`}
              >
                {unit.charAt(0).toUpperCase() + unit.slice(1)}
              </button>
            ))}
          </div>

          {/* Template Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(true)}
            >
              <BookmarkPlus className="w-4 h-4 mr-2" />
              Load
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveTemplate(true)}
            >
              <BookmarkPlus className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>

          {/* Fix Issue & 3-Dot Menu */}
          <div className="flex gap-2">
            <FixResultSheet onSubmit={handleFixIssue} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card border-white/10">
                <DropdownMenuItem onClick={handleReportFood}>
                  <Flag className="w-4 h-4 mr-2" />
                  Report Food
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSaveImage}>
                  <Download className="w-4 h-4 mr-2" />
                  Save Image
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Calorie display */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="inline-block"
          >
            <div className="flex items-center justify-center gap-2">
              <div className="text-6xl font-bold text-white">{Math.round(currentTotals.calories)}</div>
              {/* Editable Serving Count */}
              {editingServingCount ? (
                <Input
                  type="number"
                  value={servingCount}
                  onChange={(e) => setServingCount(parseFloat(e.target.value) || 1)}
                  onBlur={() => setEditingServingCount(false)}
                  className="w-16 h-12 text-2xl text-center"
                  step="0.5"
                  min="0.5"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setEditingServingCount(true)}
                  className="flex items-center gap-1 text-2xl text-white/60 hover:text-white transition-colors"
                >
                  ×{servingCount}
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="text-slate-400 text-sm uppercase tracking-wide">Calories</div>
          </motion.div>
        </div>

        {/* Item Breakdown */}
        <div className="space-y-3">
          <h4 className="text-white/60 text-sm uppercase tracking-wide">Detected Items</h4>
          {editedItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center justify-between p-3 bg-slate-800/60 rounded-lg hover:bg-slate-800/80 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{item.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditItem(idx)}
                    className="h-6 w-6 p-0 hover:bg-secondary/20"
                  >
                    <Pencil className="w-3 h-3 text-secondary" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card border-white/10">
                      <DropdownMenuItem onClick={() => handleDeleteFood(idx)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Food
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <span className="text-slate-400 text-sm">{item.quantity}</span>
              </div>
              <span className="text-emerald-400 font-mono font-semibold">
                {Math.round(item.nutrition?.calories || 0)} cal
              </span>
            </motion.div>
          ))}
        </div>

        {/* Macro ring chart */}
        <div className="relative w-48 h-48 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="12" />
            <motion.circle
              cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12"
              strokeDasharray={`${proteinPercent * 2.51} ${251 - proteinPercent * 2.51}`}
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 251" }}
              animate={{ strokeDasharray: `${proteinPercent * 2.51} ${251 - proteinPercent * 2.51}` }}
              transition={{ duration: 1, delay: 0.2 }}
            />
            <motion.circle
              cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="12"
              strokeDasharray={`${carbsPercent * 2.51} ${251 - carbsPercent * 2.51}`}
              strokeDashoffset={-proteinPercent * 2.51}
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 251" }}
              animate={{ strokeDasharray: `${carbsPercent * 2.51} ${251 - carbsPercent * 2.51}` }}
              transition={{ duration: 1, delay: 0.4 }}
            />
            <motion.circle
              cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12"
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
            <span className="text-white font-bold">{Math.round(currentTotals.protein)}g</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-white font-medium">Carbs</span>
            </div>
            <span className="text-white font-bold">{Math.round(currentTotals.carbs)}g</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-white font-medium">Fat</span>
            </div>
            <span className="text-white font-bold">{Math.round(currentTotals.fat)}g</span>
          </div>
        </div>

        {/* Log Meal Button */}
        <Button 
          size="lg" 
          onClick={handleLogMeal}
          disabled={logging}
          className="w-full bg-secondary hover:bg-secondary/90 text-background font-semibold gap-2"
        >
          {logging ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Logging Meal...
            </>
          ) : (
            <>
              <Check size={20} />
              Log Meal
            </>
          )}
        </Button>

        {/* Edit Modal */}
        <Dialog open={editingIndex !== null} onOpenChange={() => setEditingIndex(null)}>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Search food..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      searchFatSecretFromClient(searchQuery);
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  onClick={() => searchFatSecretFromClient(searchQuery)}
                  disabled={searching}
                  size="icon"
                >
                  {searching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                </Button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((result, idx) => (
                    <Button
                      key={idx}
                      onClick={() => replaceItem(editingIndex!, result)}
                      variant="outline"
                      className="w-full justify-between text-left"
                    >
                      <span>{result.name}</span>
                      <span className="text-emerald-400 font-mono">{Math.round(result.calories)} cal</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Photo Edit Modal */}
        {editedImage && (
          <PhotoEditModal
            open={showPhotoEdit}
            onOpenChange={setShowPhotoEdit}
            imageUrl={editedImage}
            onSave={(newImageUrl) => setEditedImage(newImageUrl)}
          />
        )}

        {/* Meal Templates Sheet */}
        <MealTemplateSheet
          open={showTemplates}
          onOpenChange={setShowTemplates}
          userId={userId}
          onLoadTemplate={handleLoadTemplate}
        />

        {/* Save Template Dialog */}
        <SaveTemplateDialog
          open={showSaveTemplate}
          onOpenChange={setShowSaveTemplate}
          userId={userId}
          items={editedItems}
          totalCalories={currentTotals.calories}
          totalProtein={currentTotals.protein}
          totalCarbs={currentTotals.carbs}
          totalFat={currentTotals.fat}
          totalFiber={currentTotals.fiber || 0}
        />
      </div>
    );
  }

  return null;
};

export default NutritionTrackResult;
