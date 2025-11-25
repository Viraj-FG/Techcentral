-- Add INSERT policy for profiles table
-- This ensures new user signups can create profiles via the handle_new_user() trigger
CREATE POLICY "System can insert profiles" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);