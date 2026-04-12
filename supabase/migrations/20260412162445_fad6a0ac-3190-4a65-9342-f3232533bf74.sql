
-- Absence requests table
CREATE TABLE public.absence_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  class_name TEXT NOT NULL,
  absence_date DATE NOT NULL,
  reason TEXT NOT NULL DEFAULT 'medical',
  explanation_text TEXT,
  file_name TEXT,
  file_path TEXT,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'submitted',
  professor_email TEXT,
  make_up_details JSONB DEFAULT '{}'::jsonb,
  notification_draft TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.absence_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own absence requests"
  ON public.absence_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own absence requests"
  ON public.absence_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own absence requests"
  ON public.absence_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own absence requests"
  ON public.absence_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_absence_requests_updated_at
  BEFORE UPDATE ON public.absence_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for absence documentation
INSERT INTO storage.buckets (id, name, public)
VALUES ('absence-documents', 'absence-documents', false);

CREATE POLICY "Users can upload absence docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'absence-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their absence docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'absence-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their absence docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'absence-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
