import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MealPlanPreferences {
  cuisines?: string[];
  avoid_ingredients?: string[];
  cooking_time_max?: number;
  dietary_preferences?: string[];
}

interface MealPlanCustomizationDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (preferences: MealPlanPreferences) => void;
  isGenerating?: boolean;
}

const AVAILABLE_CUISINES = [
  'Italian',
  'Mexican',
  'Asian',
  'Mediterranean',
  'American',
  'Indian',
  'Thai',
  'Japanese',
  'Greek',
  'French',
  'Chinese',
  'Korean'
];

const DIETARY_PREFERENCES = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Low-Carb',
  'Keto',
  'Paleo',
  'Pescatarian'
];

export const MealPlanCustomizationDialog = ({
  open,
  onClose,
  onGenerate,
  isGenerating = false
}: MealPlanCustomizationDialogProps) => {
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [avoidIngredients, setAvoidIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [cookingTimeMax, setCookingTimeMax] = useState<number>(60);
  const [selectedDietaryPrefs, setSelectedDietaryPrefs] = useState<string[]>([]);

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const toggleDietaryPref = (pref: string) => {
    setSelectedDietaryPrefs(prev =>
      prev.includes(pref)
        ? prev.filter(p => p !== pref)
        : [...prev, pref]
    );
  };

  const handleAddIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !avoidIngredients.includes(trimmed)) {
      setAvoidIngredients(prev => [...prev, trimmed]);
      setIngredientInput('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setAvoidIngredients(prev => prev.filter(i => i !== ingredient));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  const handleGenerate = () => {
    const preferences: MealPlanPreferences = {
      cuisines: selectedCuisines.length > 0 ? selectedCuisines : undefined,
      avoid_ingredients: avoidIngredients.length > 0 ? avoidIngredients : undefined,
      cooking_time_max: cookingTimeMax,
      dietary_preferences: selectedDietaryPrefs.length > 0 ? selectedDietaryPrefs : undefined,
    };
    onGenerate(preferences);
  };

  const handleReset = () => {
    setSelectedCuisines([]);
    setAvoidIngredients([]);
    setIngredientInput('');
    setCookingTimeMax(60);
    setSelectedDietaryPrefs([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Your Meal Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cuisines */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Preferred Cuisines</Label>
            <p className="text-sm text-muted-foreground">Select the cuisines you'd like in your meal plan</p>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_CUISINES.map(cuisine => (
                <div
                  key={cuisine}
                  onClick={() => toggleCuisine(cuisine)}
                  className={cn(
                    "p-3 rounded-lg border text-center cursor-pointer transition-all",
                    selectedCuisines.includes(cuisine)
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card/40 border-border hover:bg-card/60"
                  )}
                >
                  {cuisine}
                </div>
              ))}
            </div>
          </div>

          {/* Avoid Ingredients */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Avoid Ingredients</Label>
            <p className="text-sm text-muted-foreground">Add ingredients to exclude from your meal plan</p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., mushrooms, cilantro, olives"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button onClick={handleAddIngredient} variant="secondary">
                Add
              </Button>
            </div>
            {avoidIngredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {avoidIngredients.map(ingredient => (
                  <Badge key={ingredient} variant="outline" className="gap-1">
                    {ingredient}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeIngredient(ingredient)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Cooking Time Limit */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Maximum Cooking Time</Label>
            <p className="text-sm text-muted-foreground">
              Limit recipes to {cookingTimeMax} minutes or less
            </p>
            <div className="flex items-center gap-4">
              <Slider
                value={[cookingTimeMax]}
                onValueChange={(value) => setCookingTimeMax(value[0])}
                min={15}
                max={120}
                step={15}
                className="flex-1"
              />
              <div className="w-20 text-center font-semibold text-foreground">
                {cookingTimeMax} min
              </div>
            </div>
          </div>

          {/* Dietary Preferences */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Dietary Preferences</Label>
            <p className="text-sm text-muted-foreground">Select any dietary restrictions or preferences</p>
            <div className="space-y-2">
              {DIETARY_PREFERENCES.map(pref => (
                <div key={pref} className="flex items-center space-x-2">
                  <Checkbox
                    id={pref}
                    checked={selectedDietaryPrefs.includes(pref)}
                    onCheckedChange={() => toggleDietaryPref(pref)}
                  />
                  <label
                    htmlFor={pref}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {pref}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="ghost" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate Meal Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
