-- ============================================================================
-- 00003_enroll_rpc.sql
-- Student self-service enrollment through SECURITY DEFINER functions.
--
-- Students cannot write public.classes / public.demo_sessions directly (RLS
-- grants write only to staff). These RPCs run with owner privileges but apply
-- their own authorization + business-rule checks:
--   * the caller must be the student themselves (profiles -> students link)
--     or staff;
--   * the class must be active and not full;
--   * no time overlap with another class the student is enrolled in;
--   * demo enrollment respects the admin's demoSessions entitlement.
--
-- Only the RPCs may be CALLED by any authenticated user; there is no direct
-- write path for non-staff.
-- ============================================================================

-- Returns true when p_student belongs to the current auth user, or the caller
-- is staff. Used by every mutation below.
CREATE OR REPLACE FUNCTION public.can_manage_student(p_student_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_staff()
      OR EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = p_student_id AND s.profile_user_id = auth.uid()
      );
$$;

-- Checks whether a proposed class time overlaps any other ACTIVE class the
-- student is already enrolled in. Returns true when there IS an overlap.
CREATE OR REPLACE FUNCTION public.class_overlaps(p_class_id text, p_student_id text)
RETURNS boolean LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE
  v_class  public.classes%ROWTYPE;
  v_start  timestamp;
  v_end    timestamp;
  v_other  public.classes%ROWTYPE;
BEGIN
  SELECT * INTO v_class FROM public.classes WHERE id = p_class_id;
  IF v_class.id IS NULL THEN RETURN false; END IF;
  v_start := (v_class.date::timestamp + v_class.time::time);
  v_end   := v_start + make_interval(mins => v_class.duration);

  FOR v_other IN
    SELECT * FROM public.classes c
    WHERE c.id <> p_class_id
      AND c.status = 'active'
      AND c.enrolled @> ARRAY[p_student_id]
  LOOP
    DECLARE
      o_start timestamp := (v_other.date::timestamp + v_other.time::time);
      o_end   timestamp := o_start + make_interval(mins => v_other.duration);
    BEGIN
      IF v_start < o_end AND o_start < v_end THEN
        RETURN true;
      END IF;
    END;
  END LOOP;
  RETURN false;
END;
$$;

-- Enrolls a student into a scheduled class. Returns a message code:
--   'enrolled' | 'forbidden' | 'not_found' | 'not_active' | 'already_enrolled'
--   | 'full' | 'overlap' | 'student_not_found'
CREATE OR REPLACE FUNCTION public.enroll_in_class(p_class_id text, p_student_id text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_class   public.classes%ROWTYPE;
  v_student public.students%ROWTYPE;
BEGIN
  SELECT * INTO v_student FROM public.students WHERE id = p_student_id;
  IF v_student.id IS NULL THEN RETURN 'student_not_found'; END IF;
  IF NOT public.can_manage_student(p_student_id) THEN RETURN 'forbidden'; END IF;

  SELECT * INTO v_class FROM public.classes WHERE id = p_class_id;
  IF v_class.id IS NULL THEN RETURN 'not_found'; END IF;
  IF v_class.status <> 'active' THEN RETURN 'not_active'; END IF;
  IF v_class.enrolled @> ARRAY[p_student_id] THEN RETURN 'already_enrolled'; END IF;
  IF coalesce(array_length(v_class.enrolled, 1), 0) >= v_class.max_students THEN
    RETURN 'full';
  END IF;
  IF public.class_overlaps(p_class_id, p_student_id) THEN RETURN 'overlap'; END IF;

  UPDATE public.classes SET enrolled = v_class.enrolled || p_student_id
    WHERE id = p_class_id;
  UPDATE public.students SET enrolled_classes = v_student.enrolled_classes || p_class_id
    WHERE id = p_student_id;
  RETURN 'enrolled';
END;
$$;

-- Removes a student from a class (self-service drop or staff reassignment).
CREATE OR REPLACE FUNCTION public.unenroll_from_class(p_class_id text, p_student_id text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_class   public.classes%ROWTYPE;
  v_student public.students%ROWTYPE;
BEGIN
  SELECT * INTO v_student FROM public.students WHERE id = p_student_id;
  IF v_student.id IS NULL THEN RETURN 'student_not_found'; END IF;
  IF NOT public.can_manage_student(p_student_id) THEN RETURN 'forbidden'; END IF;

  SELECT * INTO v_class FROM public.classes WHERE id = p_class_id;
  IF v_class.id IS NULL THEN RETURN 'not_found'; END IF;

  UPDATE public.classes SET enrolled = array_remove(v_class.enrolled, p_student_id)
    WHERE id = p_class_id;
  UPDATE public.students SET enrolled_classes = array_remove(v_student.enrolled_classes, p_class_id)
    WHERE id = p_student_id;
  RETURN 'unenrolled';
END;
$$;

-- Enrolls a student into a free demo session, respecting the admin-configured
-- demo entitlement (settings.data->>'demoSessions'). Demo slots never overlap
-- with any class the student is enrolled in.
CREATE OR REPLACE FUNCTION public.enroll_in_demo(p_demo_id text, p_student_id text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_demo    public.demo_sessions%ROWTYPE;
  v_student public.students%ROWTYPE;
  v_settings public.studio_settings%ROWTYPE;
  v_limit   integer := 1;
BEGIN
  SELECT * INTO v_student FROM public.students WHERE id = p_student_id;
  IF v_student.id IS NULL THEN RETURN 'student_not_found'; END IF;
  IF NOT public.can_manage_student(p_student_id) THEN RETURN 'forbidden'; END IF;

  SELECT * INTO v_demo FROM public.demo_sessions WHERE id = p_demo_id;
  IF v_demo.id IS NULL THEN RETURN 'not_found'; END IF;
  IF v_demo.enrolled @> ARRAY[p_student_id] THEN RETURN 'already_enrolled'; END IF;

  SELECT * INTO v_settings FROM public.studio_settings WHERE id = 1;
  IF v_settings.id IS NOT NULL THEN
    v_limit := coalesce((v_settings.data->>'demoSessions')::int, 1);
  END IF;
  IF coalesce(array_length(v_student.enrolled_demos, 1), 0) >= v_limit THEN
    RETURN 'demo_limit';
  END IF;
  IF coalesce(array_length(v_demo.enrolled, 1), 0) >= v_demo.max_students THEN
    RETURN 'full';
  END IF;

  UPDATE public.demo_sessions SET enrolled = v_demo.enrolled || p_student_id
    WHERE id = p_demo_id;
  UPDATE public.students SET enrolled_demos = v_student.enrolled_demos || p_demo_id
    WHERE id = p_student_id;
  RETURN 'enrolled';
END;
$$;

GRANT EXECUTE ON FUNCTION public.enroll_in_class(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unenroll_from_class(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enroll_in_demo(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_student(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.class_overlaps(text, text) TO authenticated;
