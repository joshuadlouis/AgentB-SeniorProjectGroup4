
-- Fix 1: Recreate profiles_safe with security_invoker
DROP VIEW IF EXISTS public.profiles_safe;
CREATE VIEW public.profiles_safe
  WITH (security_invoker = true)
AS
  SELECT id, full_name, email, university_id, learning_styles, created_at, updated_at
  FROM public.profiles;

-- Fix 2: Tighten generated_resources SELECT to authenticated only
DROP POLICY IF EXISTS "Anyone can view generated resources" ON public.generated_resources;
CREATE POLICY "Authenticated users can view generated resources"
  ON public.generated_resources
  FOR SELECT
  TO authenticated
  USING (true);
