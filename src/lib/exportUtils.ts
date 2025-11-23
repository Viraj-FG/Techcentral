import { format } from "date-fns";

interface MealLog {
  id: string;
  logged_at: string;
  meal_type: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  items: any;
}

export const exportMealLogsToCSV = (meals: MealLog[]) => {
  // Define CSV headers
  const headers = [
    'Date', 'Time', 'Meal Type', 'Calories', 
    'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Fiber (g)', 'Items'
  ];

  // Convert meal data to CSV rows
  const rows = meals.map(meal => [
    format(new Date(meal.logged_at), 'yyyy-MM-dd'),
    format(new Date(meal.logged_at), 'HH:mm:ss'),
    meal.meal_type,
    meal.calories || 0,
    meal.protein || 0,
    meal.carbs || 0,
    meal.fat || 0,
    meal.fiber || 0,
    JSON.stringify(meal.items || []).replace(/,/g, ';') // Escape commas
  ]);

  // Combine headers + rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Trigger browser download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `kaeva-meal-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
