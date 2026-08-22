-- ============================================================================
-- 00004_assessment_student.sql
-- Assessment-driven student onboarding.
--
-- Visitors who complete the AI Pilates Assessment become student records:
--   * provision_student_from_assessment(p_name, p_phone, p_level)
--       - SECURITY DEFINER so an authenticated visitor can create exactly one
--         roster row linked to their own auth profile (profile_user_id).
--       - Idempotent upsert keyed on profile_user_id: re-running refreshes
--         contact details instead of duplicating rows.
--       - Level is mapped from the assessment scale ('advanced' -> 'expert')
--         to satisfy the students.level CHECK constraint.
--       - Returns the students.id so the caller can immediately self-enroll
--         in a demo session via enroll_in_demo().
-- ============================================================================

CREATE OR REPLACE FUNCTION public.provision_student_from_assessment(
  p_name   text,
  p_phone  text DEFAULT NULL,
  p_level  text DEFAULT 'beginner'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_existing public.students%ROWTYPE;
  v_new_id   text;
  v_level    public.students.level%TYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'A name is required';
  END IF;

  v_level := CASE lower(coalesce(p_level, 'beginner'))
               WHEN 'advanced' THEN 'expert'
               WHEN 'expert'   THEN 'expert'
               WHEN 'intermediate' THEN 'intermediate'
               ELSE 'beginner'
             END;

  SELECT * INTO v_existing
    FROM public.students
    WHERE profile_user_id = v_uid
    LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    UPDATE public.students
       SET name = trim(p_name),
           phone = coalesce(nullif(trim(p_phone), ''), v_existing.phone),
           level = v_level
     WHERE id = v_existing.id;
    RETURN v_existing.id;
  END IF;

  -- Deterministic id derived from the auth uuid (collision-safe for upserts).
  v_new_id := 'stu_' || substr(replace(v_uid::text, '-', ''), 1, 16);

  INSERT INTO public.students (id, name, phone, level, active, profile_user_id)
  VALUES (
    v_new_id,
    trim(p_name),
    nullif(trim(p_phone), ''),
    v_level,
    true,
    v_uid
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.provision_student_from_assessment(text, text, text)
  TO authenticated;
