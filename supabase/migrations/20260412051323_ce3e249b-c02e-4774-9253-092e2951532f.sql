
-- ============================================================
-- AgentB Full Schema Migration
-- ============================================================

-- 1. Universities
CREATE TABLE IF NOT EXISTS public.universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO public.universities (name) VALUES
  ('Boston University'),
  ('MIT'),
  ('Harvard University'),
  ('Northeastern University'),
  ('Tufts University')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view universities" ON public.universities FOR SELECT USING (true);

-- 2. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  university_id UUID REFERENCES public.universities(id),
  learning_styles text[] DEFAULT NULL,
  canvas_access_token text,
  canvas_refresh_token text,
  canvas_connected_at timestamp with time zone,
  canvas_domain text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

COMMENT ON COLUMN public.profiles.learning_styles IS 'Array of learning style preferences identified from the learning style quiz';

-- 3. Trigger functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. User classes
CREATE TABLE IF NOT EXISTS public.user_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  professor TEXT,
  semester TEXT,
  year INTEGER,
  is_archived boolean NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own classes" ON public.user_classes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own classes" ON public.user_classes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own classes" ON public.user_classes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own classes" ON public.user_classes FOR DELETE USING (auth.uid() = user_id);

-- 5. Calendar events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  event_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own calendar events" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own calendar events" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own calendar events" ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own calendar events" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON public.calendar_events (user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_type_date ON public.calendar_events (user_id, event_type, event_date);

-- 6. Learning resources
CREATE TABLE public.learning_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN ('written_explanation', 'real_world_example', 'diagram', 'pre_quiz')),
  content text NOT NULL,
  subject text,
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view learning resources" ON public.learning_resources FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_learning_resources_updated_at
  BEFORE UPDATE ON public.learning_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('syllabi', 'syllabi', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies for syllabi
CREATE POLICY "Users can upload their own syllabi" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'syllabi' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own syllabi" ON storage.objects FOR SELECT USING (bucket_id = 'syllabi' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own syllabi" ON storage.objects FOR DELETE USING (bucket_id = 'syllabi' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own syllabi files" ON storage.objects FOR UPDATE USING (bucket_id = 'syllabi' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Storage policies for assignments
CREATE POLICY "Users can upload their own assignments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assignments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own assignments" ON storage.objects FOR SELECT USING (bucket_id = 'assignments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own assignments" ON storage.objects FOR DELETE USING (bucket_id = 'assignments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own assignment files" ON storage.objects FOR UPDATE USING (bucket_id = 'assignments' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 8. Syllabi table
CREATE TABLE public.syllabi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  class_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  parsed_content text NULL,
  course_description text NULL,
  learning_objectives text[] NULL,
  weekly_schedule jsonb NULL,
  grading_policy jsonb NULL,
  required_materials text[] NULL,
  parsed_at timestamp with time zone NULL,
  bloom_classifications jsonb DEFAULT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.syllabi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own syllabi_table" ON public.syllabi FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own syllabi_table" ON public.syllabi FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own syllabi_table" ON public.syllabi FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own syllabi_table" ON public.syllabi FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_syllabi_user_id ON public.syllabi (user_id);

-- 9. Generated resources
CREATE TABLE public.generated_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT NOT NULL,
  resource_title TEXT NOT NULL,
  topic TEXT NOT NULL,
  learning_styles TEXT[] NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  usage_count INTEGER DEFAULT 1
);

CREATE UNIQUE INDEX idx_generated_resources_lookup ON public.generated_resources (resource_type, resource_title, topic, learning_styles);
CREATE INDEX idx_generated_resources_styles ON public.generated_resources USING GIN (learning_styles);

ALTER TABLE public.generated_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view generated resources" ON public.generated_resources FOR SELECT USING (true);

CREATE TRIGGER update_generated_resources_updated_at
  BEFORE UPDATE ON public.generated_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Quiz results
CREATE TABLE public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  class_name text NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  weak_areas text[] NOT NULL DEFAULT '{}',
  strong_areas text[] NOT NULL DEFAULT '{}',
  objectives jsonb DEFAULT '[]',
  resources jsonb DEFAULT '[]',
  completed_objectives integer[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, class_name)
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own quiz results" ON public.quiz_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quiz results" ON public.quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quiz results" ON public.quiz_results FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quiz results" ON public.quiz_results FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_quiz_results_updated_at
  BEFORE UPDATE ON public.quiz_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Practice history
CREATE TABLE public.practice_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  class_name TEXT NOT NULL,
  practice_type TEXT NOT NULL,
  score INTEGER,
  total INTEGER,
  topics_practiced TEXT[] DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE public.practice_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own practice history" ON public.practice_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own practice history" ON public.practice_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own practice history" ON public.practice_history FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_practice_history_user_class ON public.practice_history(user_id, class_name);
CREATE INDEX idx_practice_history_completed_at ON public.practice_history(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_practice_history_class ON public.practice_history (user_id, class_name, completed_at DESC);

-- 12. Assessment type enum + Assignments
CREATE TYPE public.assessment_type AS ENUM ('summative', 'formative', 'pre_assessment', 'benchmark');

CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  class_name TEXT NOT NULL,
  assignment_title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  due_date DATE,
  parsed_content TEXT,
  learning_objectives TEXT[],
  assessment_type public.assessment_type,
  assessment_metadata jsonb DEFAULT '{}'::jsonb,
  difficulty_level text DEFAULT NULL,
  irt_parameters jsonb DEFAULT '{}'::jsonb,
  knowledge_dependencies text[] DEFAULT '{}'::text[],
  difficulty_analyzed_at timestamptz DEFAULT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own assignments_table" ON public.assignments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own assignments_table" ON public.assignments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assignments_table" ON public.assignments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assignments_table" ON public.assignments FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON public.assignments (user_id);

COMMENT ON COLUMN public.assignments.assessment_type IS 'Classification: summative, formative, pre_assessment, benchmark';
COMMENT ON COLUMN public.assignments.difficulty_level IS 'IRT-derived difficulty: novice, intermediate, advanced, expert';
COMMENT ON COLUMN public.assignments.irt_parameters IS 'Item Response Theory parameters';
COMMENT ON COLUMN public.assignments.knowledge_dependencies IS 'Knowledge Space Theory prerequisite concepts';

-- 13. Course textbooks
CREATE TABLE public.course_textbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  class_name TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  requirement_type TEXT NOT NULL DEFAULT 'required',
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_textbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own textbooks" ON public.course_textbooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own textbooks" ON public.course_textbooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own textbooks" ON public.course_textbooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own textbooks" ON public.course_textbooks FOR DELETE USING (auth.uid() = user_id);

-- 14. Audit logs
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_audit_logs_user_created ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- 15. Consent records
CREATE TABLE public.consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consent_type text NOT NULL,
  consent_version text NOT NULL DEFAULT '1.0',
  granted boolean NOT NULL DEFAULT true,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own consent records" ON public.consent_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own consent records" ON public.consent_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own consent records" ON public.consent_records FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_consent_records_user ON public.consent_records (user_id, consent_type);

-- 16. Course content
CREATE TABLE public.course_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  class_name text NOT NULL,
  topic text NOT NULL,
  topic_order integer NOT NULL DEFAULT 0,
  lesson_content text,
  quiz_questions jsonb DEFAULT '[]'::jsonb,
  exercises jsonb DEFAULT '[]'::jsonb,
  study_resources jsonb DEFAULT '[]'::jsonb,
  bloom_level text,
  generation_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own course content" ON public.course_content FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own course content" ON public.course_content FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own course content" ON public.course_content FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own course content" ON public.course_content FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_course_content_user_class ON public.course_content (user_id, class_name, topic_order);

-- 17. Content reviews
CREATE TABLE public.content_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revision_requested', 'rejected')),
  accuracy_score INTEGER CHECK (accuracy_score BETWEEN 1 AND 5),
  alignment_score INTEGER CHECK (alignment_score BETWEEN 1 AND 5),
  bloom_match_score INTEGER CHECK (bloom_match_score BETWEEN 1 AND 5),
  pedagogy_score INTEGER CHECK (pedagogy_score BETWEEN 1 AND 5),
  inclusivity_score INTEGER CHECK (inclusivity_score BETWEEN 1 AND 5),
  overall_comments TEXT,
  inline_annotations JSONB DEFAULT '[]'::jsonb,
  revision_notes TEXT,
  syllabus_objectives_checked TEXT[] DEFAULT '{}'::text[],
  objectives_covered INTEGER DEFAULT 0,
  objectives_total INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reviews" ON public.content_reviews FOR SELECT TO authenticated USING (reviewer_id = auth.uid());
CREATE POLICY "Users can insert their own reviews" ON public.content_reviews FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "Users can update their own reviews" ON public.content_reviews FOR UPDATE TO authenticated USING (reviewer_id = auth.uid());
CREATE POLICY "Users can delete their own reviews" ON public.content_reviews FOR DELETE TO authenticated USING (reviewer_id = auth.uid());
CREATE POLICY "Content owners can view reviews" ON public.content_reviews FOR SELECT TO authenticated USING (content_id IN (SELECT id FROM public.course_content WHERE user_id = auth.uid()));

-- 18. Bias audits
CREATE TABLE public.bias_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  user_id UUID NOT NULL,
  overall_score INTEGER NOT NULL DEFAULT 0,
  gender_score INTEGER NOT NULL DEFAULT 0,
  racial_score INTEGER NOT NULL DEFAULT 0,
  socioeconomic_score INTEGER NOT NULL DEFAULT 0,
  language_score INTEGER NOT NULL DEFAULT 0,
  flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  auto_fixed BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bias_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view audits for their content" ON public.bias_audits FOR SELECT TO authenticated USING (content_id IN (SELECT id FROM course_content WHERE user_id = auth.uid()));
CREATE POLICY "Users can view their own audits" ON public.bias_audits FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own audits" ON public.bias_audits FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own audits" ON public.bias_audits FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 19. Transit routes
CREATE TABLE public.transit_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  route_name TEXT NOT NULL,
  route_type TEXT NOT NULL DEFAULT 'shuttle' CHECK (route_type IN ('shuttle', 'metro')),
  color TEXT NOT NULL DEFAULT '#3B82F6',
  operating_hours TEXT NOT NULL DEFAULT '7:00 AM - 10:00 PM',
  frequency_minutes INTEGER NOT NULL DEFAULT 15,
  days_of_week TEXT[] NOT NULL DEFAULT '{Monday,Tuesday,Wednesday,Thursday,Friday}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transit_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view transit routes" ON public.transit_routes FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_transit_routes_university ON public.transit_routes (university_id);
CREATE INDEX idx_transit_routes_type ON public.transit_routes (route_type);

-- 20. Transit stops
CREATE TABLE public.transit_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES public.transit_routes(id) ON DELETE CASCADE,
  stop_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  stop_order INTEGER NOT NULL DEFAULT 0,
  arrival_offset_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transit_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view transit stops" ON public.transit_stops FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_transit_stops_route ON public.transit_stops (route_id);

-- Seed transit routes
INSERT INTO public.transit_routes (route_name, route_type, color, operating_hours, frequency_minutes, days_of_week, is_active) VALUES
  ('Campus Loop', 'shuttle', '#10B981', '7:00 AM - 10:00 PM', 10, '{Monday,Tuesday,Wednesday,Thursday,Friday}', true),
  ('North Express', 'shuttle', '#F59E0B', '8:00 AM - 6:00 PM', 20, '{Monday,Tuesday,Wednesday,Thursday,Friday}', true),
  ('Weekend Connector', 'shuttle', '#8B5CF6', '10:00 AM - 8:00 PM', 30, '{Saturday,Sunday}', true),
  ('Red Line', 'metro', '#EF4444', '5:00 AM - 12:00 AM', 8, '{Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday}', true),
  ('Blue Line', 'metro', '#3B82F6', '5:30 AM - 11:30 PM', 10, '{Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday}', true);

-- Seed stops for Campus Loop
INSERT INTO public.transit_stops (route_id, stop_name, latitude, longitude, stop_order, arrival_offset_minutes)
SELECT id, stop_name, lat, lng, ord, offset_min
FROM public.transit_routes, (VALUES
  ('Main Library', 40.7580, -73.9855, 1, 0),
  ('Student Union', 40.7590, -73.9840, 2, 3),
  ('Science Complex', 40.7605, -73.9830, 3, 7),
  ('Athletic Center', 40.7615, -73.9850, 4, 12),
  ('Residence Halls', 40.7595, -73.9870, 5, 16),
  ('Main Library', 40.7580, -73.9855, 6, 20)
) AS s(stop_name, lat, lng, ord, offset_min)
WHERE route_name = 'Campus Loop';

-- Seed stops for North Express
INSERT INTO public.transit_stops (route_id, stop_name, latitude, longitude, stop_order, arrival_offset_minutes)
SELECT id, stop_name, lat, lng, ord, offset_min
FROM public.transit_routes, (VALUES
  ('South Gate', 40.7560, -73.9860, 1, 0),
  ('Medical Center', 40.7620, -73.9835, 2, 5),
  ('North Campus', 40.7650, -73.9820, 3, 12),
  ('Research Park', 40.7670, -73.9810, 4, 18)
) AS s(stop_name, lat, lng, ord, offset_min)
WHERE route_name = 'North Express';

-- Seed stops for Red Line
INSERT INTO public.transit_stops (route_id, stop_name, latitude, longitude, stop_order, arrival_offset_minutes)
SELECT id, stop_name, lat, lng, ord, offset_min
FROM public.transit_routes, (VALUES
  ('Downtown Central', 40.7505, -73.9935, 1, 0),
  ('University Station', 40.7555, -73.9880, 2, 4),
  ('Campus South', 40.7580, -73.9860, 3, 7),
  ('Midtown North', 40.7630, -73.9810, 4, 11),
  ('Uptown Terminal', 40.7690, -73.9780, 5, 16)
) AS s(stop_name, lat, lng, ord, offset_min)
WHERE route_name = 'Red Line';

-- Seed stops for Blue Line
INSERT INTO public.transit_stops (route_id, stop_name, latitude, longitude, stop_order, arrival_offset_minutes)
SELECT id, stop_name, lat, lng, ord, offset_min
FROM public.transit_routes, (VALUES
  ('West Terminal', 40.7540, -73.9950, 1, 0),
  ('Civic Center', 40.7560, -73.9910, 2, 5),
  ('Campus West', 40.7575, -73.9870, 3, 9),
  ('East Village', 40.7590, -73.9830, 4, 14),
  ('East Terminal', 40.7610, -73.9790, 5, 19)
) AS s(stop_name, lat, lng, ord, offset_min)
WHERE route_name = 'Blue Line';

-- 21. Transit arrivals
CREATE TABLE public.transit_arrivals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id uuid REFERENCES public.transit_routes(id) ON DELETE CASCADE NOT NULL,
  stop_id uuid REFERENCES public.transit_stops(id) ON DELETE CASCADE NOT NULL,
  predicted_arrival_time timestamp with time zone NOT NULL,
  estimated_minutes integer NOT NULL DEFAULT 0,
  data_source text NOT NULL DEFAULT 'simulated',
  vehicle_id text,
  status text NOT NULL DEFAULT 'on_time',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.transit_arrivals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view transit arrivals" ON public.transit_arrivals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can insert transit arrivals" ON public.transit_arrivals FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can delete transit arrivals" ON public.transit_arrivals FOR DELETE TO service_role USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.transit_arrivals;

-- 22. Transit arrival history
CREATE TABLE public.transit_arrival_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id uuid NOT NULL REFERENCES public.transit_routes(id) ON DELETE CASCADE,
  stop_id uuid NOT NULL REFERENCES public.transit_stops(id) ON DELETE CASCADE,
  scheduled_minutes integer NOT NULL DEFAULT 0,
  actual_minutes integer NOT NULL DEFAULT 0,
  delay_minutes integer NOT NULL DEFAULT 0,
  day_of_week integer NOT NULL DEFAULT 0,
  hour_of_day integer NOT NULL DEFAULT 0,
  data_source text NOT NULL DEFAULT 'simulated',
  recorded_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.transit_arrival_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view transit history" ON public.transit_arrival_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can insert transit history" ON public.transit_arrival_history FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can delete old transit history" ON public.transit_arrival_history FOR DELETE TO service_role USING (true);

CREATE INDEX idx_transit_history_route_stop ON public.transit_arrival_history (route_id, stop_id);
CREATE INDEX idx_transit_history_patterns ON public.transit_arrival_history (route_id, stop_id, day_of_week, hour_of_day);
CREATE INDEX idx_transit_history_recorded ON public.transit_arrival_history (recorded_at DESC);

-- 23. Study focus areas
CREATE TABLE public.study_focus_areas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  class_name text NOT NULL,
  topic text NOT NULL,
  topic_order integer NOT NULL DEFAULT 0,
  is_unlocked boolean NOT NULL DEFAULT false,
  quiz_passed boolean NOT NULL DEFAULT false,
  quiz_score integer,
  quiz_threshold integer NOT NULL DEFAULT 70,
  estimated_time_minutes integer DEFAULT 60,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.study_focus_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own focus areas" ON public.study_focus_areas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own focus areas" ON public.study_focus_areas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own focus areas" ON public.study_focus_areas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own focus areas" ON public.study_focus_areas FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_study_focus_areas_updated_at BEFORE UPDATE ON public.study_focus_areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 24. Study modules
CREATE TABLE public.study_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  focus_area_id uuid NOT NULL REFERENCES public.study_focus_areas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  module_type text NOT NULL DEFAULT 'concept',
  title text NOT NULL,
  description text,
  content text,
  module_order integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  estimated_time_minutes integer DEFAULT 15,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.study_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own modules" ON public.study_modules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own modules" ON public.study_modules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own modules" ON public.study_modules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own modules" ON public.study_modules FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_study_modules_updated_at BEFORE UPDATE ON public.study_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 25. profiles_safe view
CREATE VIEW public.profiles_safe
WITH (security_invoker = true) AS
SELECT id, email, full_name, university_id, learning_styles, canvas_domain, canvas_connected_at, created_at, updated_at
FROM public.profiles;

-- 26. Learning events
CREATE TABLE public.learning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  class_name text NOT NULL,
  event_type text NOT NULL,
  topic text,
  bloom_level text,
  outcome text,
  score numeric,
  total numeric,
  latency_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_learning_events_user_class ON public.learning_events(user_id, class_name);
CREATE INDEX idx_learning_events_type ON public.learning_events(event_type);
CREATE INDEX idx_learning_events_created ON public.learning_events(created_at);
CREATE INDEX IF NOT EXISTS idx_learning_events_class_type ON public.learning_events (user_id, class_name, event_type);
CREATE INDEX IF NOT EXISTS idx_learning_events_user_created ON public.learning_events (user_id, created_at DESC);

ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own learning events" ON public.learning_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own learning events" ON public.learning_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own learning events" ON public.learning_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 27. Weekly performance snapshots
CREATE TABLE public.weekly_performance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  class_name text NOT NULL,
  week_start date NOT NULL,
  quizzes_taken integer DEFAULT 0,
  avg_score numeric DEFAULT 0,
  exercises_completed integer DEFAULT 0,
  modules_completed integer DEFAULT 0,
  topics_studied text[] DEFAULT '{}'::text[],
  bloom_levels_reached jsonb DEFAULT '{}'::jsonb,
  mastery_pct numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, class_name, week_start)
);

CREATE INDEX idx_weekly_snapshots_user ON public.weekly_performance_snapshots(user_id, class_name);

ALTER TABLE public.weekly_performance_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own snapshots" ON public.weekly_performance_snapshots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own snapshots" ON public.weekly_performance_snapshots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own snapshots" ON public.weekly_performance_snapshots FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own snapshots" ON public.weekly_performance_snapshots FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Anonymization function
CREATE OR REPLACE FUNCTION public.anonymize_old_learning_events(cutoff_date timestamptz)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE public.learning_events
  SET user_id = gen_random_uuid(),
      metadata = '{}'::jsonb
  WHERE created_at < cutoff_date
    AND user_id NOT IN (SELECT gen_random_uuid());
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected;
END;
$$;

-- 28. Knowledge components
CREATE TABLE public.knowledge_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  class_name text NOT NULL,
  objective text NOT NULL,
  source text NOT NULL DEFAULT 'syllabus',
  bloom_level text,
  parent_topic text,
  component_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own knowledge components" ON public.knowledge_components FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own knowledge components" ON public.knowledge_components FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own knowledge components" ON public.knowledge_components FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own knowledge components" ON public.knowledge_components FOR DELETE USING (auth.uid() = user_id);

-- 29. Knowledge mastery
CREATE TABLE public.knowledge_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  component_id uuid NOT NULL REFERENCES public.knowledge_components(id) ON DELETE CASCADE,
  mastery_score numeric NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 0,
  last_practiced_at timestamptz,
  mastery_level text NOT NULL DEFAULT 'not_started',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, component_id)
);

ALTER TABLE public.knowledge_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own mastery" ON public.knowledge_mastery FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mastery" ON public.knowledge_mastery FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mastery" ON public.knowledge_mastery FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mastery" ON public.knowledge_mastery FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_knowledge_mastery_updated_at
  BEFORE UPDATE ON public.knowledge_mastery
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 30. Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  category text NOT NULL DEFAULT 'general',
  source_type text,
  source_id text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert notifications" ON public.notifications FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Users can insert their own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE INDEX idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, is_read, created_at DESC);

-- 31. Notification preferences
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  assignment_due boolean NOT NULL DEFAULT true,
  exam_reminder boolean NOT NULL DEFAULT true,
  quiz_results boolean NOT NULL DEFAULT true,
  study_plan boolean NOT NULL DEFAULT true,
  course_updates boolean NOT NULL DEFAULT true,
  system_alerts boolean NOT NULL DEFAULT true,
  channel_in_app boolean NOT NULL DEFAULT true,
  channel_email boolean NOT NULL DEFAULT false,
  channel_push boolean NOT NULL DEFAULT false,
  quiet_hours_enabled boolean NOT NULL DEFAULT false,
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end time DEFAULT '07:00',
  frequency text NOT NULL DEFAULT 'realtime',
  disabled_classes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own preferences" ON public.notification_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.notification_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 32. Performance reports
CREATE TABLE public.performance_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  class_name text NOT NULL,
  report_type text NOT NULL DEFAULT 'weekly',
  period_start date NOT NULL,
  period_end date NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_performance_reports_user ON public.performance_reports (user_id, class_name, report_type);
CREATE INDEX idx_performance_reports_period ON public.performance_reports (user_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_performance_reports_type ON public.performance_reports (user_id, report_type, period_start DESC);

ALTER TABLE public.performance_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reports" ON public.performance_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reports" ON public.performance_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reports" ON public.performance_reports FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 33. Daily metrics
CREATE TABLE public.daily_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  class_name text NOT NULL,
  metric_date date NOT NULL,
  events_count integer NOT NULL DEFAULT 0,
  quizzes_taken integer NOT NULL DEFAULT 0,
  avg_score numeric DEFAULT 0,
  exercises_completed integer NOT NULL DEFAULT 0,
  modules_completed integer NOT NULL DEFAULT 0,
  bloom_distribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  topics text[] NOT NULL DEFAULT '{}'::text[],
  completion_rate numeric DEFAULT 0,
  avg_latency_ms integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, class_name, metric_date)
);

CREATE INDEX idx_daily_metrics_user_date ON public.daily_metrics (user_id, class_name, metric_date DESC);
CREATE INDEX idx_daily_metrics_date ON public.daily_metrics (metric_date DESC);

ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own daily metrics" ON public.daily_metrics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own daily metrics" ON public.daily_metrics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily metrics" ON public.daily_metrics FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own daily metrics" ON public.daily_metrics FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Backfill function
CREATE OR REPLACE FUNCTION public.backfill_daily_metrics(p_user_id uuid, p_class_name text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rows_affected integer := 0;
  rec record;
BEGIN
  FOR rec IN
    SELECT
      le.user_id,
      le.class_name,
      le.created_at::date AS metric_date,
      count(*) AS events_count,
      count(*) FILTER (WHERE le.event_type IN ('quiz_attempt','quiz_completed')) AS quizzes_taken,
      coalesce(avg(CASE WHEN le.event_type IN ('quiz_attempt','quiz_completed') AND le.total > 0 THEN (le.score::numeric / le.total) * 100 END), 0) AS avg_score,
      count(*) FILTER (WHERE le.event_type = 'exercise_completed') AS exercises_completed,
      count(*) FILTER (WHERE le.event_type = 'module_completed') AS modules_completed,
      jsonb_object_agg(
        coalesce(le.bloom_level, 'unknown'),
        1
      ) FILTER (WHERE le.bloom_level IS NOT NULL) AS bloom_dist,
      array_agg(DISTINCT le.topic) FILTER (WHERE le.topic IS NOT NULL) AS topics,
      CASE WHEN count(*) > 0 THEN
        (count(*) FILTER (WHERE le.event_type LIKE '%completed%' OR le.outcome IN ('correct','pass')))::numeric / count(*) * 100
      ELSE 0 END AS completion_rate,
      coalesce(avg(le.latency_ms) FILTER (WHERE le.latency_ms IS NOT NULL), 0)::integer AS avg_latency_ms
    FROM public.learning_events le
    WHERE le.user_id = p_user_id
      AND (p_class_name IS NULL OR le.class_name = p_class_name)
    GROUP BY le.user_id, le.class_name, le.created_at::date
  LOOP
    INSERT INTO public.daily_metrics (user_id, class_name, metric_date, events_count, quizzes_taken, avg_score, exercises_completed, modules_completed, bloom_distribution, topics, completion_rate, avg_latency_ms)
    VALUES (rec.user_id, rec.class_name, rec.metric_date, rec.events_count, rec.quizzes_taken, rec.avg_score, rec.exercises_completed, rec.modules_completed, coalesce(rec.bloom_dist, '{}'::jsonb), coalesce(rec.topics, '{}'::text[]), rec.completion_rate, rec.avg_latency_ms)
    ON CONFLICT (user_id, class_name, metric_date) DO UPDATE SET
      events_count = EXCLUDED.events_count,
      quizzes_taken = EXCLUDED.quizzes_taken,
      avg_score = EXCLUDED.avg_score,
      exercises_completed = EXCLUDED.exercises_completed,
      modules_completed = EXCLUDED.modules_completed,
      bloom_distribution = EXCLUDED.bloom_distribution,
      topics = EXCLUDED.topics,
      completion_rate = EXCLUDED.completion_rate,
      avg_latency_ms = EXCLUDED.avg_latency_ms,
      updated_at = now();
    rows_affected := rows_affected + 1;
  END LOOP;
  RETURN rows_affected;
END;
$$;

-- 34. Enable realtime for calendar_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;

-- 35. Rubrics
CREATE TABLE public.rubrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  class_name text NOT NULL,
  title text NOT NULL,
  description text,
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE SET NULL,
  bloom_level text,
  source text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'draft',
  learning_objectives text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own rubrics" ON public.rubrics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own rubrics" ON public.rubrics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own rubrics" ON public.rubrics FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own rubrics" ON public.rubrics FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_rubrics_class ON public.rubrics (user_id, class_name);

CREATE TRIGGER update_rubrics_updated_at BEFORE UPDATE ON public.rubrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 36. Rubric criteria
CREATE TABLE public.rubric_criteria (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rubric_id uuid NOT NULL REFERENCES public.rubrics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  criterion_name text NOT NULL,
  description text,
  weight numeric NOT NULL DEFAULT 1,
  criterion_order integer NOT NULL DEFAULT 0,
  performance_levels jsonb NOT NULL DEFAULT '[
    {"level": "Exemplary", "score": 4, "description": ""},
    {"level": "Proficient", "score": 3, "description": ""},
    {"level": "Developing", "score": 2, "description": ""},
    {"level": "Beginning", "score": 1, "description": ""}
  ]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.rubric_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own criteria" ON public.rubric_criteria FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own criteria" ON public.rubric_criteria FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own criteria" ON public.rubric_criteria FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own criteria" ON public.rubric_criteria FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_rubric_criteria_rubric ON public.rubric_criteria (rubric_id);

CREATE TRIGGER update_rubric_criteria_updated_at BEFORE UPDATE ON public.rubric_criteria FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 37. Assignment examples
CREATE TABLE public.assignment_examples (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rubric_id uuid NOT NULL REFERENCES public.rubrics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  example_content text NOT NULL DEFAULT '',
  quality_level text NOT NULL DEFAULT 'proficient',
  annotations jsonb NOT NULL DEFAULT '[]'::jsonb,
  learning_objectives text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.assignment_examples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own examples" ON public.assignment_examples FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own examples" ON public.assignment_examples FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own examples" ON public.assignment_examples FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own examples" ON public.assignment_examples FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_assignment_examples_rubric ON public.assignment_examples (rubric_id);

CREATE TRIGGER update_assignment_examples_updated_at BEFORE UPDATE ON public.assignment_examples FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
