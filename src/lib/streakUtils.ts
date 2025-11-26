import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, isToday, isYesterday, parseISO } from "date-fns";

/**
 * Calculate if the streak continues or breaks based on last log date
 */
export const calculateStreak = (lastLogDate: string | null, currentDate: Date = new Date()): {
  continues: boolean;
  startsNew: boolean;
} => {
  if (!lastLogDate) {
    return { continues: false, startsNew: true };
  }

  const lastLog = parseISO(lastLogDate);
  
  // If today, streak continues
  if (isToday(lastLog)) {
    return { continues: true, startsNew: false };
  }
  
  // If yesterday, streak continues
  if (isYesterday(lastLog)) {
    return { continues: true, startsNew: false };
  }
  
  // More than 1 day gap, streak breaks
  return { continues: false, startsNew: true };
};

/**
 * Update user's streak after logging a meal
 */
export const updateStreak = async (userId: string): Promise<void> => {
  try {
    // Fetch current profile data
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_log_date, streak_start_date')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const today = new Date();
    const todayDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // If already logged today, don't update streak
    if (profile.last_log_date === todayDate) {
      return;
    }

    const { continues, startsNew } = calculateStreak(profile.last_log_date, today);

    let newStreak = profile.current_streak || 0;
    let newLongest = profile.longest_streak || 0;
    let newStreakStart = profile.streak_start_date;

    if (startsNew) {
      // Start new streak
      newStreak = 1;
      newStreakStart = todayDate;
    } else if (continues) {
      // Continue existing streak
      newStreak = (profile.current_streak || 0) + 1;
      
      // Update longest if current surpasses it
      if (newStreak > newLongest) {
        newLongest = newStreak;
      }
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_log_date: todayDate,
        streak_start_date: newStreakStart
      })
      .eq('id', userId);

    if (updateError) throw updateError;

  } catch (error) {
    console.error('Error updating streak:', error);
    throw error;
  }
};