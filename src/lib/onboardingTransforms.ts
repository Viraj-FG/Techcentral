import { calculateTDEE } from './tdeeCalculator';

export interface BiometricData {
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface HouseholdMember {
  type: 'adult' | 'child' | 'elderly' | 'toddler';
  name?: string;
  ageGroup?: 'infant' | 'toddler' | 'child' | 'teen' | 'adult' | 'elderly';
  age?: number;
  biometrics?: Partial<BiometricData>;
  allergies?: string[];
  dietaryRestrictions?: string[];
  healthConditions?: string[];
}

export interface ConversationState {
  userName: string | null;
  userBiometrics: BiometricData | null;
  dietaryValues: string[];
  allergies: string[];
  householdMembers: HouseholdMember[];
  beautyProfile: {
    skinType: string | null;
    hairType: string | null;
  } | null;
  household: {
    adults: number;
    kids: number;
    dogs: number;
    cats: number;
    petDetails?: string;
  } | null;
  healthGoals: string[];
  lifestyleGoals: string[];
  isComplete: boolean;
}

/**
 * Transform conversation state into database profile format
 */
export const transformProfileData = (state: ConversationState) => {
  const dietaryPreferences = Array.isArray(state.dietaryValues) ? state.dietaryValues : [];
  const allergies = Array.isArray(state.allergies) ? state.allergies : [];
  const healthGoals = Array.isArray(state.healthGoals) ? state.healthGoals : [];
  const lifestyleGoals = Array.isArray(state.lifestyleGoals) ? state.lifestyleGoals : [];
  const beautyProfile = state.beautyProfile || { skinType: null, hairType: null };

  return {
    user_name: state.userName || null,
    
    // Biometric fields
    user_age: state.userBiometrics?.age || null,
    user_weight: state.userBiometrics?.weight || null,
    user_height: state.userBiometrics?.height || null,
    user_gender: state.userBiometrics?.gender || null,
    user_activity_level: state.userBiometrics?.activityLevel || null,
    calculated_tdee: state.userBiometrics ? calculateTDEE(state.userBiometrics) : null,
    
    dietary_preferences: dietaryPreferences,
    allergies: allergies,
    beauty_profile: beautyProfile,
    health_goals: healthGoals,
    lifestyle_goals: lifestyleGoals,
    
    // Calculate household size from both old and new systems
    household_adults: state.household?.adults || 
      state.householdMembers?.filter(m => m.type === 'adult').length || 1,
    household_kids: state.household?.kids || 
      state.householdMembers?.filter(m => m.type === 'child' || m.type === 'toddler').length || 0,
    
    onboarding_completed: true
  };
};
