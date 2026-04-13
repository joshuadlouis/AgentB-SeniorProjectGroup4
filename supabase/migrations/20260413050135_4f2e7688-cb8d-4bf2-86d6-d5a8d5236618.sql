
-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Replace the trigger function with a safe version
CREATE OR REPLACE FUNCTION public.notify_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Fire-and-forget HTTP call to the edge function
  -- Uses pg_net so it's async and won't block the insert
  PERFORM extensions.http_post(
    url := 'https://xgqnjhnukbuaboabhbtf.supabase.co/functions/v1/send-resend-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhncW5qaG51a2J1YWJvYWJoYnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDkxOTAsImV4cCI6MjA5MTMyNTE5MH0.x8g-pd3DWfNB2-l2r4bSlgV9ddmYQ58p-JC1l-i9gVA'
    ),
    body := jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'full_name', NEW.full_name,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block user creation if email fails
  RAISE LOG 'notify_new_signup failed: %', SQLERRM;
  RETURN NEW;
END;
$$;
