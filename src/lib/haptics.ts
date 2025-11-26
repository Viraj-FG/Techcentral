import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Haptic feedback utilities for Kaeva
 * Uses Capacitor Haptics plugin when available (native mobile)
 * Falls back to Vibration API on web
 */

const isNative = Capacitor.isNativePlatform();

export const haptics = {
  /**
   * Success feedback - short sharp vibration
   * Use for: scan complete, item added, action confirmed
   */
  success: async () => {
    try {
      if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else {
        // Web fallback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  },

  /**
   * Warning feedback - double heavy vibration
   * Use for: toxicity alerts, errors, dangerous actions
   */
  warning: async () => {
    try {
      if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        setTimeout(async () => {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        }, 100);
      } else {
        // Web fallback
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  },

  /**
   * Selection feedback - light tick
   * Use for: scrolling lists, selecting items, tapping buttons
   */
  selection: async () => {
    try {
      if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else {
        // Web fallback
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  },

  /**
   * Impact feedback - medium impact
   * Use for: opening modals, completing tasks
   */
  impact: async () => {
    try {
      if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        // Web fallback
        if ('vibrate' in navigator) {
          navigator.vibrate(30);
        }
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }
};
