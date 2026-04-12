
-- Helper: notify a user about a content/policy change
CREATE OR REPLACE FUNCTION public.notify_content_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notif_title TEXT;
  notif_body TEXT;
  notif_category TEXT;
  notif_source_type TEXT;
BEGIN
  -- Course content updates (lesson refined, regenerated, etc.)
  IF TG_TABLE_NAME = 'course_content' THEN
    -- Only fire when content actually changes (not just status flips to pending)
    IF NEW.generation_status = 'complete' AND (
      OLD.lesson_content IS DISTINCT FROM NEW.lesson_content OR
      OLD.quiz_questions::text IS DISTINCT FROM NEW.quiz_questions::text OR
      OLD.exercises::text IS DISTINCT FROM NEW.exercises::text
    ) THEN
      notif_title := 'Content updated: ' || NEW.topic;
      notif_body := 'Chapter "' || NEW.topic || '" in ' || NEW.class_name || ' has been updated with new content.';
      notif_category := 'course_updates';
      notif_source_type := 'course_content';

      INSERT INTO public.notifications (user_id, title, body, category, source_type, source_id)
      VALUES (NEW.user_id, notif_title, notif_body, notif_category, notif_source_type, NEW.id::text);
    END IF;
  END IF;

  -- Syllabus policy/schedule updates
  IF TG_TABLE_NAME = 'syllabi' THEN
    IF OLD.grading_policy::text IS DISTINCT FROM NEW.grading_policy::text THEN
      INSERT INTO public.notifications (user_id, title, body, category, source_type, source_id)
      VALUES (NEW.user_id,
        'Grading policy updated: ' || NEW.class_name,
        'The grading policy for ' || NEW.class_name || ' has been modified. Review the changes on your course page.',
        'course_updates', 'syllabi', NEW.id::text);
    END IF;

    IF OLD.learning_objectives::text IS DISTINCT FROM NEW.learning_objectives::text THEN
      INSERT INTO public.notifications (user_id, title, body, category, source_type, source_id)
      VALUES (NEW.user_id,
        'Learning objectives changed: ' || NEW.class_name,
        'The learning objectives for ' || NEW.class_name || ' have been updated.',
        'course_updates', 'syllabi', NEW.id::text);
    END IF;

    IF OLD.weekly_schedule::text IS DISTINCT FROM NEW.weekly_schedule::text THEN
      INSERT INTO public.notifications (user_id, title, body, category, source_type, source_id)
      VALUES (NEW.user_id,
        'Schedule updated: ' || NEW.class_name,
        'The weekly schedule for ' || NEW.class_name || ' has changed. Check your course calendar.',
        'course_updates', 'syllabi', NEW.id::text);
    END IF;

    IF OLD.required_materials::text IS DISTINCT FROM NEW.required_materials::text THEN
      INSERT INTO public.notifications (user_id, title, body, category, source_type, source_id)
      VALUES (NEW.user_id,
        'Required materials updated: ' || NEW.class_name,
        'The required materials list for ' || NEW.class_name || ' has been updated.',
        'course_updates', 'syllabi', NEW.id::text);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on course_content updates
CREATE TRIGGER trg_notify_course_content_change
  AFTER UPDATE ON public.course_content
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_content_change();

-- Trigger on syllabi updates
CREATE TRIGGER trg_notify_syllabus_change
  AFTER UPDATE ON public.syllabi
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_content_change();
