import { useState } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { SlidersHorizontal } from 'lucide-react';

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
}

interface FilterState {
  categories: string[];
  fillLevel: number[];
  showExpiring: boolean;
  showLowStock: boolean;
}

const CATEGORIES = ['fridge', 'pantry', 'beauty', 'pets'];

export const FilterBottomSheet = ({ isOpen, onClose, onApplyFilters }: FilterBottomSheetProps) => {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    fillLevel: [0, 100],
    showExpiring: false,
    showLowStock: false
  });

  const handleCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      categories: [],
      fillLevel: [0, 100],
      showExpiring: false,
      showLowStock: false
    });
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filter Items"
      snapPoints={[0.7, 0.4]}
      initialSnap={0}
    >
      <div className="space-y-6">
        {/* Categories */}
        <div>
          <Label className="text-white mb-3 block">Categories</Label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(category => (
              <div
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all
                  ${filters.categories.includes(category)
                    ? 'bg-kaeva-sage/20 border-kaeva-sage/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }
                `}
              >
                <span className="text-white capitalize">{category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fill Level Range */}
        <div>
          <Label className="text-white mb-3 block">
            Fill Level: {filters.fillLevel[0]}% - {filters.fillLevel[1]}%
          </Label>
          <Slider
            value={filters.fillLevel}
            onValueChange={(value) => setFilters(prev => ({ ...prev, fillLevel: value }))}
            min={0}
            max={100}
            step={5}
            className="mb-2"
          />
        </div>

        {/* Quick Filters */}
        <div className="space-y-3">
          <Label className="text-white block">Quick Filters</Label>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="expiring"
              checked={filters.showExpiring}
              onCheckedChange={(checked) => 
                setFilters(prev => ({ ...prev, showExpiring: checked as boolean }))
              }
            />
            <label htmlFor="expiring" className="text-white text-sm cursor-pointer">
              Show expiring items only
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="lowStock"
              checked={filters.showLowStock}
              onCheckedChange={(checked) => 
                setFilters(prev => ({ ...prev, showLowStock: checked as boolean }))
              }
            />
            <label htmlFor="lowStock" className="text-white text-sm cursor-pointer">
              Show low stock items only
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            Reset
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-kaeva-sage text-kaeva-void hover:bg-kaeva-sage/90"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default FilterBottomSheet;
