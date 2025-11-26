import { format } from "date-fns";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface MealLog {
  id: string;
  logged_at: string;
  meal_type: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  image_url: string | null;
  items: any;
}

interface DayData {
  date: Date;
  totalCalories: number;
  targetMet: boolean;
  meals: MealLog[];
}

interface DayDetailModalProps {
  dayData: DayData | null;
  tdee: number;
  open: boolean;
  onClose: () => void;
}

export const DayDetailModal = ({ dayData, tdee, open, onClose }: DayDetailModalProps) => {
  if (!dayData) return null;

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="bg-background border-white/10">
        <DrawerHeader>
          <DrawerTitle className="text-white text-2xl">
            {format(dayData.date, 'EEEE, MMM d')}
          </DrawerTitle>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-muted-foreground text-sm">
              {dayData.totalCalories} / {tdee} cal
            </p>
            <div className={`w-2 h-2 rounded-full ${
              dayData.targetMet ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
          </div>
        </DrawerHeader>
        
        <div className="space-y-4 p-4 max-h-[60vh] overflow-y-auto">
          {dayData.meals.map((meal, index) => (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-semibold capitalize">{meal.meal_type}</h4>
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(meal.logged_at), 'h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{meal.calories || 0} cal</p>
                    <p className="text-muted-foreground text-xs">
                      P:{meal.protein || 0}g C:{meal.carbs || 0}g F:{meal.fat || 0}g
                    </p>
                  </div>
                </div>
                
                {meal.image_url && (
                  <img 
                    src={meal.image_url} 
                    alt={meal.meal_type}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
