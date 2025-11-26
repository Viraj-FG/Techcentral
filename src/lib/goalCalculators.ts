// Universal goal calculation functions for nutrition, hydration, pets, and beauty domains

interface BiometricData {
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

interface NutritionGoals {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
}

interface Pet {
  species: 'dog' | 'cat';
  weight: number; // kg
  age?: number;
  activityLevel?: 'low' | 'moderate' | 'high';
}

// TDEE Calculation (Mifflin-St Jeor Equation)
export function calculateTDEE(bio: BiometricData): number {
  // Calculate BMR
  let bmr: number;
  if (bio.gender === 'male') {
    bmr = 10 * bio.weight + 6.25 * bio.height - 5 * bio.age + 5;
  } else {
    bmr = 10 * bio.weight + 6.25 * bio.height - 5 * bio.age - 161;
  }

  // Activity multipliers
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  return Math.round(bmr * multipliers[bio.activityLevel]);
}

// Nutrition Goals (TDEE-based with macro distribution)
export function calculateNutritionGoals(bio: BiometricData): NutritionGoals {
  const tdee = calculateTDEE(bio);
  
  return {
    calories: tdee,
    protein: Math.round(bio.weight * 2.0), // 2g per kg body weight
    carbs: Math.round((tdee * 0.45) / 4), // 45% of calories, 4 cal/g
    fat: Math.round((tdee * 0.30) / 9), // 30% of calories, 9 cal/g
    fiber: bio.gender === 'male' ? 38 : 25 // Dietary guidelines
  };
}

// Hydration Goal (weight-based)
export function calculateWaterGoal(weight: number): number {
  // 33ml per kg of body weight
  return Math.round(weight * 33);
}

// Pet Daily Feeding Portion (weight and species-based)
export function calculatePetPortion(pet: Pet): number {
  // Base rate: 2-3% of body weight for dogs, 4-5% for cats
  let baseRate = pet.species === 'dog' ? 0.025 : 0.045;
  
  // Adjust for activity level
  if (pet.activityLevel === 'high') {
    baseRate *= 1.2;
  } else if (pet.activityLevel === 'low') {
    baseRate *= 0.8;
  }
  
  // Return in grams
  return Math.round(pet.weight * 1000 * baseRate);
}

// Beauty Product Replacement Date (PAO-based)
export function calculateReplacementDate(openedDate: Date, paoMonths: number): Date {
  const replacementDate = new Date(openedDate);
  replacementDate.setMonth(replacementDate.getMonth() + paoMonths);
  return replacementDate;
}

// Calculate days until beauty product expires
export function calculateDaysUntilExpiry(openedDate: Date, paoMonths: number): number {
  const replacementDate = calculateReplacementDate(openedDate, paoMonths);
  const today = new Date();
  const diffTime = replacementDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// BMI Calculation
export function calculateBMI(weight: number, height: number): number {
  // weight in kg, height in cm
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
}

// BMI Category
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Healthy';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

// Macro percentage from calories
export function calculateMacroPercentage(macroGrams: number, macroType: 'protein' | 'carbs' | 'fat', totalCalories: number): number {
  const caloriesPerGram = macroType === 'fat' ? 9 : 4;
  const macroCalories = macroGrams * caloriesPerGram;
  return Math.round((macroCalories / totalCalories) * 100);
}
