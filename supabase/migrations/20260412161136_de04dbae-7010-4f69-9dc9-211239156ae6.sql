
-- Content feedback table for explicit ratings
CREATE TABLE public.content_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating IN (-1, 1)),
  feedback_text TEXT,
  feedback_type TEXT NOT NULL DEFAULT 'explicit',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);

ALTER TABLE public.content_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON public.content_feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON public.content_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON public.content_feedback FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
  ON public.content_feedback FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_content_feedback_updated_at
  BEFORE UPDATE ON public.content_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to find low-rated content for a user's courses
CREATE OR REPLACE FUNCTION public.get_low_rated_content(p_user_id UUID, p_threshold NUMERIC DEFAULT -0.3)
RETURNS TABLE (
  content_id UUID,
  topic TEXT,
  class_name TEXT,
  avg_rating NUMERIC,
  feedback_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cf.content_id,
    cc.topic,
    cc.class_name,
    AVG(cf.rating)::NUMERIC AS avg_rating,
    COUNT(*) AS feedback_count
  FROM content_feedback cf
  JOIN course_content cc ON cc.id = cf.content_id
  WHERE cc.user_id = p_user_id
  GROUP BY cf.content_id, cc.topic, cc.class_name
  HAVING AVG(cf.rating) <= p_threshold
  ORDER BY AVG(cf.rating) ASC;
$$;
