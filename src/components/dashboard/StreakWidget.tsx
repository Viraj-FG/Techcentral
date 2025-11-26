import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { updateStreak } from "@/lib/streakUtils";

interface StreakWidgetProps {
  userId: string;
  onShare?: () => void;
}

export const StreakWidget = ({ userId, onShare }: StreakWidgetProps) => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStreak();
  }, [userId]);

  const fetchStreak = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak')
        .eq('id', userId)
        .single();

      if (profile) {
        setCurrentStreak(profile.current_streak || 0);
        setLongestStreak(profile.longest_streak || 0);
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate progress to next milestone
  const milestones = [7, 14, 30, 60, 90];
  const nextMilestone = milestones.find(m => m > currentStreak) || 100;
  const progress = (currentStreak / nextMilestone) * 100;

  if (isLoading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-24 bg-white/5 rounded-lg" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-3">
            Daily Streak
          </h3>
          
          <div className="flex items-center gap-4">
            {/* Fire Icon with Streak Number */}
            <div className="relative">
              <motion.div
                animate={{ 
                  scale: currentStreak > 0 ? [1, 1.1, 1] : 1,
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Flame className="w-16 h-16 text-primary drop-shadow-[0_0_12px_rgba(214,158,46,0.6)]" />
              </motion.div>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-background">
                {currentStreak}
              </span>
            </div>

            {/* Stats */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {currentStreak === 0 ? 'Start your streak today!' : 'days in a row'}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Trophy className="w-3 h-3 text-secondary" />
                Your longest: {longestStreak} days
              </p>
            </div>
          </div>
        </div>

        {/* Share Button */}
        {onShare && currentStreak > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onShare}
            className="flex-shrink-0"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Progress Ring */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Next milestone: {nextMilestone} days
          </span>
          <span className="text-primary font-mono">
            {Math.round(progress)}%
          </span>
        </div>
        
        <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
          />
        </div>
      </div>

      {/* Celebration Message */}
      {milestones.includes(currentStreak) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg"
        >
          <p className="text-sm text-primary font-medium text-center">
            🎉 Milestone reached! {currentStreak} days strong!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};