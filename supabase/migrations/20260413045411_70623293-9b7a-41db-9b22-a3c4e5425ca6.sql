
-- Add email_confirmed flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_confirmed boolean NOT NULL DEFAULT false;

-- Create email_confirmations table for storing verification tokens
CREATE TABLE public.email_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.email_confirmations ENABLE ROW LEVEL SECURITY;

-- Users can view their own confirmations
CREATE POLICY "Users can view their own confirmations"
  ON public.email_confirmations FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (used by edge functions)
CREATE POLICY "Service role full access"
  ON public.email_confirmations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for fast token lookup
CREATE INDEX idx_email_confirmations_token ON public.email_confirmations (token);
