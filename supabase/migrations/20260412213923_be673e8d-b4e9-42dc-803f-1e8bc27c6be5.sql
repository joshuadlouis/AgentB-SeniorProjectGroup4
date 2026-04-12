-- Add missing UPDATE policy on practice_history
CREATE POLICY "Users can update their own practice history"
ON public.practice_history
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);