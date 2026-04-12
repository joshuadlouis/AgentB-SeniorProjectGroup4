CREATE TABLE public.class_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  room TEXT,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.class_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedule"
  ON public.class_schedule FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedule"
  ON public.class_schedule FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule"
  ON public.class_schedule FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule"
  ON public.class_schedule FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_class_schedule_user_day ON public.class_schedule (user_id, day_of_week);