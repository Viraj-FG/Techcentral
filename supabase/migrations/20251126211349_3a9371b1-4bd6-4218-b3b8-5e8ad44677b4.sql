-- Create learned_preferences table for AI learning system
CREATE TABLE IF NOT EXISTS public.learned_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  preference_type TEXT NOT NULL CHECK (preference_type IN ('cuisine', 'ingredient', 'cooking_time', 'meal_time', 'avoid_ingredient', 'difficulty')),
  preference_value TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  learned_from TEXT CHECK (learned_from IN ('meal_log', 'recipe_save', 'recipe_cook', 'voice_conversation', 'explicit')),
  occurrences INTEGER DEFAULT 1,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, preference_type, preference_value)
);

-- Enable RLS
ALTER TABLE public.learned_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences"
  ON public.learned_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.learned_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.learned_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage preferences"
  ON public.learned_preferences FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to learn from meal logs
CREATE OR REPLACE FUNCTION public.learn_from_meal_log()
RETURNS TRIGGER AS $$
DECLARE
  v_item JSONB;
  v_item_name TEXT;
  v_meal_hour INTEGER;
BEGIN
  -- Learn meal time patterns
  v_meal_hour := EXTRACT(HOUR FROM NEW.logged_at);
  INSERT INTO public.learned_preferences (user_id, preference_type, preference_value, learned_from, occurrences)
  VALUES (NEW.user_id, 'meal_time', NEW.meal_type || '_' || v_meal_hour, 'meal_log', 1)
  ON CONFLICT (user_id, preference_type, preference_value)
  DO UPDATE SET 
    occurrences = learned_preferences.occurrences + 1,
    confidence = LEAST(1.0, learned_preferences.confidence + 0.05),
    last_updated = now();

  -- Learn from meal items
  IF NEW.items IS NOT NULL THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      v_item_name := v_item->>'name';
      IF v_item_name IS NOT NULL THEN
        INSERT INTO public.learned_preferences (user_id, preference_type, preference_value, learned_from, occurrences)
        VALUES (NEW.user_id, 'ingredient', v_item_name, 'meal_log', 1)
        ON CONFLICT (user_id, preference_type, preference_value)
        DO UPDATE SET 
          occurrences = learned_preferences.occurrences + 1,
          confidence = LEAST(1.0, learned_preferences.confidence + 0.03),
          last_updated = now();
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for meal logs
DROP TRIGGER IF EXISTS trigger_learn_from_meal_log ON public.meal_logs;
CREATE TRIGGER trigger_learn_from_meal_log
  AFTER INSERT ON public.meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.learn_from_meal_log();

-- Create function to learn from recipe bookmarks
CREATE OR REPLACE FUNCTION public.learn_from_recipe_bookmark()
RETURNS TRIGGER AS $$
DECLARE
  v_recipe RECORD;
  v_ingredient JSONB;
BEGIN
  -- Only process recipe bookmarks
  IF NEW.item_type = 'recipe' THEN
    SELECT * INTO v_recipe FROM public.recipes WHERE id = NEW.item_id;
    
    IF FOUND THEN
      -- Learn cooking time preference
      IF v_recipe.cooking_time IS NOT NULL THEN
        IF v_recipe.cooking_time <= 30 THEN
          INSERT INTO public.learned_preferences (user_id, preference_type, preference_value, learned_from)
          VALUES (NEW.user_id, 'cooking_time', 'quick', 'recipe_save')
          ON CONFLICT (user_id, preference_type, preference_value)
          DO UPDATE SET 
            occurrences = learned_preferences.occurrences + 1,
            confidence = LEAST(1.0, learned_preferences.confidence + 0.08),
            last_updated = now();
        END IF;
      END IF;
      
      -- Learn difficulty preference
      IF v_recipe.difficulty IS NOT NULL THEN
        INSERT INTO public.learned_preferences (user_id, preference_type, preference_value, learned_from)
        VALUES (NEW.user_id, 'difficulty', v_recipe.difficulty, 'recipe_save')
        ON CONFLICT (user_id, preference_type, preference_value)
        DO UPDATE SET 
          occurrences = learned_preferences.occurrences + 1,
          confidence = LEAST(1.0, learned_preferences.confidence + 0.08),
            last_updated = now();
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for bookmarks
DROP TRIGGER IF EXISTS trigger_learn_from_recipe_bookmark ON public.bookmarks;
CREATE TRIGGER trigger_learn_from_recipe_bookmark
  AFTER INSERT ON public.bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.learn_from_recipe_bookmark();