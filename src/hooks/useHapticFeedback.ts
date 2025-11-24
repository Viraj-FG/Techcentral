// Note: Install @capacitor/haptics for native haptic feedback
// For now, using web vibration API as fallback

export type HapticFeedbackType = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'success' 
  | 'warning' 
  | 'error'
  | 'selection';

export const useHapticFeedback = () => {
  const trigger = async (type: HapticFeedbackType = 'light') => {
    // Use web vibration API if available
    if ('vibrate' in navigator) {
      const pattern = getVibrationPattern(type);
      navigator.vibrate(pattern);
    }
    
    // TODO: Add native haptic feedback when @capacitor/haptics is installed
    // Example:
    // if (Capacitor.isNativePlatform()) {
    //   await Haptics.impact({ style: ImpactStyle.Light });
    // }
  };

  return { trigger };
};

const getVibrationPattern = (type: HapticFeedbackType): number | number[] => {
  switch (type) {
    case 'light':
      return 10;
    case 'medium':
      return 20;
    case 'heavy':
      return 40;
    case 'success':
      return [10, 50, 10];
    case 'warning':
      return [20, 100, 20];
    case 'error':
      return [50, 100, 50];
    case 'selection':
      return 5;
    default:
      return 10;
  }
};
