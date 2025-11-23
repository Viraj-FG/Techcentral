import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";

interface MealLog {
  id: string;
  logged_at: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

interface DayData {
  date: Date;
  totalCalories: number;
  targetMet: boolean;
  meals: MealLog[];
}

interface CalendarViewProps {
  month: number;
  year: number;
  mealLogs: MealLog[];
  tdee: number;
  onDayClick: (dayData: DayData) => void;
}

export const CalendarView = ({ month, year, mealLogs, tdee, onDayClick }: CalendarViewProps) => {
  const selectedDate = new Date(year, month, 1);
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  
  // Get all days in the month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add padding days from previous month
  const firstDayOfWeek = monthStart.getDay();
  const paddingDays = Array(firstDayOfWeek).fill(null);
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDayData = (date: Date): DayData => {
    const dayMeals = mealLogs.filter(meal => 
      isSameDay(new Date(meal.logged_at), date)
    );
    
    const totalCalories = dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const targetMet = Math.abs(totalCalories - tdee) < tdee * 0.1;

    return {
      date,
      totalCalories,
      targetMet,
      meals: dayMeals
    };
  };

  return (
    <div>
      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center text-muted-foreground text-xs font-semibold py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Padding days */}
        {paddingDays.map((_, index) => (
          <div key={`padding-${index}`} className="aspect-square" />
        ))}
        
        {/* Actual days */}
        {daysInMonth.map((date) => {
          const dayData = getDayData(date);
          const hasMeals = dayData.meals.length > 0;
          const isToday = isSameDay(date, new Date());

          return (
            <motion.button
              key={date.toISOString()}
              onClick={() => hasMeals && onDayClick(dayData)}
              disabled={!hasMeals}
              className={`aspect-square bg-white/5 rounded-lg relative flex items-center justify-center
                ${hasMeals ? 'cursor-pointer hover:bg-white/10' : 'cursor-default opacity-50'}
                ${isToday ? 'ring-2 ring-kaeva-sage' : ''}
                transition-colors`}
              whileHover={hasMeals ? { scale: 1.05 } : {}}
              whileTap={hasMeals ? { scale: 0.95 } : {}}
            >
              <span className={`text-sm ${isToday ? 'text-kaeva-sage font-bold' : 'text-foreground'}`}>
                {format(date, 'd')}
              </span>
              
              {/* Status indicator dot */}
              {hasMeals && (
                <div 
                  className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${
                    dayData.targetMet ? 'bg-green-500' : 'bg-yellow-500'
                  }`} 
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
