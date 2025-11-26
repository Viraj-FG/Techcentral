import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  AlertCircle, 
  ChefHat, 
  ShoppingCart, 
  Lightbulb, 
  Video,
  ArrowRight,
  X,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { haptics } from "@/lib/haptics";

interface InsightCard {
  type: 'expiring_food' | 'meal_suggestion' | 'restock_alert' | 'nutrition_tip' | 'recipe_match' | 'video_tutorial';
  priority: 1 | 2 | 3;
  title: string;
  message: string;
  reasoning: string;
  action: { type: string; payload: any };
  expiresAt?: string;
}

interface AIInsightsWidgetProps {
  userId: string;
}

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'expiring_food':
      return <AlertCircle className="w-5 h-5" />;
    case 'meal_suggestion':
    case 'recipe_match':
      return <ChefHat className="w-5 h-5" />;
    case 'restock_alert':
      return <ShoppingCart className="w-5 h-5" />;
    case 'nutrition_tip':
      return <Lightbulb className="w-5 h-5" />;
    case 'video_tutorial':
      return <Video className="w-5 h-5" />;
    default:
      return <Lightbulb className="w-5 h-5" />;
  }
};

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 1:
      return 'border-destructive/50 bg-destructive/5';
    case 2:
      return 'border-primary/50 bg-primary/5';
    case 3:
      return 'border-accent/50 bg-accent/5';
    default:
      return 'border-white/10 bg-white/5';
  }
};

const getPriorityIconColor = (priority: number) => {
  switch (priority) {
    case 1:
      return 'text-destructive';
    case 2:
      return 'text-primary';
    case 3:
      return 'text-accent';
    default:
      return 'text-muted-foreground';
  }
};

export const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ userId }) => {
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dismissedCards, setDismissedCards] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchDigest = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_digests')
        .select('*')
        .eq('user_id', userId)
        .eq('digest_date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching digest:', error);
        return;
      }

      if (data) {
        setInsights((data.insights as unknown as InsightCard[]) || []);
      } else {
        // No digest for today, generate one
        await generateDigest();
      }
    } catch (error) {
      console.error('Error in fetchDigest:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDigest = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-ai-digest');

      if (error) throw error;

      if (data?.insights) {
        setInsights(data.insights);
        haptics.success();
      }
    } catch (error) {
      console.error('Error generating digest:', error);
      toast({
        title: "Failed to generate insights",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAction = async (insight: InsightCard) => {
    haptics.selection();
    
    switch (insight.action.type) {
      case 'find_recipe':
        navigate('/recipes', { state: { ingredients: insight.action.payload.ingredients } });
        break;
      case 'add_to_cart':
        // Handle adding to cart
        toast({
          title: "Added to cart",
          description: `${insight.action.payload.items?.join(', ')} added to shopping list`
        });
        break;
      case 'view_recipe':
        navigate(`/recipes/${insight.action.payload.recipeId}`);
        break;
      case 'log_meal':
        navigate('/app', { state: { viewMode: 'fuel' } });
        break;
      default:
        console.log('Unknown action:', insight.action.type);
    }

    // Mark as viewed
    await markViewed();
  };

  const handleDismiss = (index: number) => {
    haptics.selection();
    setDismissedCards(prev => new Set(prev).add(`${index}`));
  };

  const markViewed = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await supabase
        .from('daily_digests')
        .update({ viewed_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('digest_date', today);
    } catch (error) {
      console.error('Error marking digest as viewed:', error);
    }
  };

  useEffect(() => {
    fetchDigest();
  }, [userId]);

  // Filter out dismissed cards and sort by priority
  const visibleInsights = insights
    .filter((_, index) => !dismissedCards.has(`${index}`))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4); // Show max 4 cards

  if (isLoading || isGenerating) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">
            {isGenerating ? 'Generating your daily insights...' : 'Loading insights...'}
          </span>
        </div>
      </div>
    );
  }

  if (visibleInsights.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden">
        <div className="text-center">
          <Lightbulb className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">No insights yet today</p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={generateDigest}
            className="gap-2"
          >
            Generate Insights
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
          AI Insights
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateDigest}
          disabled={isGenerating}
          className="text-xs text-muted-foreground hover:text-foreground gap-2"
        >
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {visibleInsights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ delay: index * 0.1 }}
            className={`backdrop-blur-xl border rounded-xl p-4 overflow-hidden relative ${getPriorityColor(insight.priority)}`}
          >
            <button
              onClick={() => handleDismiss(index)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full bg-background/50 flex items-center justify-center flex-shrink-0 ${getPriorityIconColor(insight.priority)}`}>
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground mb-1 truncate">
                  {insight.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {insight.message}
                </p>
              </div>
            </div>

            <div className="bg-background/30 rounded-lg p-3 mb-3">
              <p className="text-xs text-muted-foreground italic">
                <span className="font-semibold text-foreground">Why this matters:</span>{' '}
                {insight.reasoning}
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => handleAction(insight)}
              className="w-full gap-2 bg-primary text-background hover:bg-primary/90"
            >
              {insight.action.type === 'find_recipe' && 'Find Recipe'}
              {insight.action.type === 'add_to_cart' && 'Add to Cart'}
              {insight.action.type === 'view_recipe' && 'View Recipe'}
              {insight.action.type === 'log_meal' && 'Log Meal'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};