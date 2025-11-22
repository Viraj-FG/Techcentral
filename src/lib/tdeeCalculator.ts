export interface BiometricData {
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE) using Mifflin-St Jeor Equation
 * This is the gold standard for calculating baseline caloric needs
 */
export function calculateTDEE(bio: BiometricData): number {
  // Step 1: Calculate Basal Metabolic Rate (BMR)
  let bmr: number;
  
  if (bio.gender === 'male') {
    // Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
    bmr = 10 * bio.weight + 6.25 * bio.height - 5 * bio.age + 5;
  } else if (bio.gender === 'female') {
    // Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
    bmr = 10 * bio.weight + 6.25 * bio.height - 5 * bio.age - 161;
  } else {
    // Use average for 'other'
    bmr = 10 * bio.weight + 6.25 * bio.height - 5 * bio.age - 78;
  }
  
  // Step 2: Apply activity multiplier
  const activityMultipliers = {
    sedentary: 1.2,      // Little to no exercise
    light: 1.375,        // Light exercise 1-3 days/week
    moderate: 1.55,      // Moderate exercise 3-5 days/week
    active: 1.725,       // Heavy exercise 6-7 days/week
    very_active: 1.9     // Very heavy exercise, physical job
  };
  
  const tdee = bmr * activityMultipliers[bio.activityLevel];
  
  return Math.round(tdee);
}

/**
 * Convert weight from pounds to kilograms
 */
export function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

/**
 * Convert weight from kilograms to pounds
 */
export function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

/**
 * Convert height from feet/inches to centimeters
 */
export function feetToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

/**
 * Convert height from centimeters to feet/inches
 */
export function cmToFeet(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}
