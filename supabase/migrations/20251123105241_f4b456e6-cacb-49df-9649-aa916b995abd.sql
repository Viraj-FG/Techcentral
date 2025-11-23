-- Enable realtime for inventory table
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;

-- Enable realtime for shopping_list table
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_list;

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable realtime for meal_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_logs;

-- Enable realtime for recipes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.recipes;