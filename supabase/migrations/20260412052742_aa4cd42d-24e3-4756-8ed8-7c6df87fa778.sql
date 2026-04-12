
-- Drop dependent view first
DROP VIEW IF EXISTS public.profiles_safe;

-- Remove Canvas OAuth columns from profiles table
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS canvas_access_token,
  DROP COLUMN IF EXISTS canvas_refresh_token,
  DROP COLUMN IF EXISTS canvas_domain,
  DROP COLUMN IF EXISTS canvas_connected_at;

-- Recreate profiles_safe view without canvas columns
CREATE VIEW public.profiles_safe AS
  SELECT
    id,
    full_name,
    email,
    university_id,
    learning_styles,
    created_at,
    updated_at
  FROM public.profiles;
