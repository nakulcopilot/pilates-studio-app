-- ============================================================================
-- Pilates Studio App — Production schema (migration 00001)
-- Target: Supabase (Postgres 15+). Safe to re-run: guarded by IF NOT EXISTS.
-- IMPORTANT ORDERING: helper functions (is_staff/is_admin/current_profile)
-- declare `r public.profiles`, and PL/pgSQL resolves DECLARE types at CREATE
-- time. They MUST be created AFTER the profiles table and BEFORE the policies
-- that call them. Keep that order when editing.
-- Security model:
--   * Row Level Security is ENABLED on every table.
--   * Identity lives in auth.users (Supabase Auth, bcrypt-hashed passwords).
--     No plaintext passwords ever reach the database or any HTML.
--   * profiles.role drives all policies. Helpers: public.is_staff(), is_admin().
--   * ai_config secrets are NOT stored here — the OpenRouter key is an Edge
--     Function secret (Deno.env), see supabase/functions/ai-proxy.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- profiles — the single identity table, linked 1:1 to auth.users.
-- Role is assigned at account creation; role changes are admin-only (policy).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          text NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
  display_name  text NOT NULL,
  email         text,
  phone         text,
  avatar_url    text,
  meta          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper functions used by RLS policies.
-- NOTE: these declare `r public.profiles`, and PL/pgSQL resolves DECLARE
-- variable types at CREATE time — so they must be created AFTER the profiles
-- table but BEFORE the policies that call them. SQL inside bodies is run-time.
-- ---------------------------------------------------------------------------
-- Returns true when the authenticated user is staff (admin or instructor).
-- NOTE: uses EXISTS (not a %ROWTYPE `IS NOT NULL` test) so that profiles with
-- NULL optional columns (email/phone/avatar_url) are still recognised.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'instructor')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Returns true when the authenticated user is an admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Returns the profile row of the current user (requires public.profiles to exist).
CREATE OR REPLACE FUNCTION public.current_profile()
RETURNS public.profiles AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin()
  );

-- Users may update their own non-role profile fields; admins may update anything.
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.is_admin()
  ) WITH CHECK (
    (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin()
  );

-- Only admins (or service-role/trigger flows) create profiles.
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS profiles_delete ON public.profiles;
CREATE POLICY profiles_delete ON public.profiles
  FOR DELETE USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- studio_settings — single-row (id = 1) JSONB configuration document.
-- Contains branding, packages, AI *client* prefs (enabled/model/temperature).
-- Never contains secrets.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.studio_settings (
  id          integer PRIMARY KEY CHECK (id = 1),
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES auth.users(id)
);

ALTER TABLE public.studio_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS studio_settings_select ON public.studio_settings;
CREATE POLICY studio_settings_select ON public.studio_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS studio_settings_write ON public.studio_settings;
CREATE POLICY studio_settings_write ON public.studio_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- instructors — studio roster. login_id links an auth profile to an instructor
-- (e.g. login_id 'neelamr' matches the auth user). NO password column here.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.instructors (
  id               text PRIMARY KEY,
  name             text NOT NULL,
  specialization   text,
  certification    text,
  experience       integer NOT NULL DEFAULT 3,
  email            text,
  phone            text,
  photo            text,
  active           boolean NOT NULL DEFAULT true,
  date_joined      date,
  bio              text NOT NULL DEFAULT '',
  availability     jsonb NOT NULL DEFAULT '{}'::jsonb,
  permissions      jsonb NOT NULL DEFAULT '{"editSchedule":true,"editPricing":false}'::jsonb,
  rating           numeric(3,1) NOT NULL DEFAULT 4.0 CHECK (rating BETWEEN 0 AND 5),
  login_id         text UNIQUE,
  profile_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS instructors_read ON public.instructors;
CREATE POLICY instructors_read ON public.instructors
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS instructors_write ON public.instructors;
CREATE POLICY instructors_write ON public.instructors
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---------------------------------------------------------------------------
-- students — studio roster. profile_user_id links a student auth account.
-- enrolled_classes/enrolled_demos mirror class registrations.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
  id               text PRIMARY KEY,
  name             text NOT NULL,
  phone            text,
  email            text,
  gender           text,
  emergency        text,
  active           boolean NOT NULL DEFAULT true,
  level            text NOT NULL DEFAULT 'beginner'
                   CHECK (level IN ('beginner', 'intermediate', 'expert')),
  level_progress   jsonb NOT NULL DEFAULT '{"beginner":0,"intermediate":0,"expert":0}'::jsonb,
  enrolled_classes text[] NOT NULL DEFAULT '{}',
  enrolled_demos   text[] NOT NULL DEFAULT '{}',
  profile_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS students_read ON public.students;
CREATE POLICY students_read ON public.students
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS students_write ON public.students;
CREATE POLICY students_write ON public.students
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---------------------------------------------------------------------------
-- classes — class schedule.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classes (
  id           text PRIMARY KEY,
  type         text NOT NULL CHECK (type IN ('mat', 'reformer')),
  level        text NOT NULL DEFAULT 'beginner'
               CHECK (level IN ('beginner', 'intermediate', 'expert')),
  date         date NOT NULL,
  time         text NOT NULL,
  duration     integer NOT NULL DEFAULT 60,
  max_students integer NOT NULL DEFAULT 15,
  status       text NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'cancelled', 'completed')),
  instructor   text REFERENCES public.instructors(id) ON DELETE SET NULL,
  enrolled     text[] NOT NULL DEFAULT '{}',
  waitlist     text[] NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS classes_read ON public.classes;
CREATE POLICY classes_read ON public.classes
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS classes_write ON public.classes;
CREATE POLICY classes_write ON public.classes
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---------------------------------------------------------------------------
-- demo_sessions — free intro sessions.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.demo_sessions (
  id           text PRIMARY KEY,
  date         date NOT NULL,
  time         text NOT NULL,
  duration     integer NOT NULL DEFAULT 45,
  max_students integer NOT NULL DEFAULT 5,
  enrolled     text[] NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS demo_sessions_read ON public.demo_sessions;
CREATE POLICY demo_sessions_read ON public.demo_sessions
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS demo_sessions_write ON public.demo_sessions;
CREATE POLICY demo_sessions_write ON public.demo_sessions
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---------------------------------------------------------------------------
-- attendance — one row per (class, student).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
  class_id    text NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id  text NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'present'
              CHECK (status IN ('present', 'absent', 'late')),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attendance_read ON public.attendance;
CREATE POLICY attendance_read ON public.attendance
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS attendance_write ON public.attendance;
CREATE POLICY attendance_write ON public.attendance
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---------------------------------------------------------------------------
-- class_notes — instructor observations during class. Students may read only
-- notes about themselves; staff read/write all.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_notes (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  class_id    text NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id  text NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  text        text NOT NULL CHECK (length(text) BETWEEN 1 AND 2000),
  tags        text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_notes_class ON public.class_notes(class_id);
CREATE INDEX IF NOT EXISTS idx_class_notes_student ON public.class_notes(student_id);

ALTER TABLE public.class_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS class_notes_select ON public.class_notes;
CREATE POLICY class_notes_select ON public.class_notes
  FOR SELECT USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = public.class_notes.student_id
        AND s.profile_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS class_notes_write ON public.class_notes;
CREATE POLICY class_notes_write ON public.class_notes
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---------------------------------------------------------------------------
-- student_notes — longitudinal notes on a student's profile.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_notes (
  id          text PRIMARY KEY,
  student_id  text NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  text        text NOT NULL CHECK (length(text) BETWEEN 1 AND 2000),
  date        date NOT NULL DEFAULT CURRENT_DATE,
  added_by    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_notes_select ON public.student_notes;
CREATE POLICY student_notes_select ON public.student_notes
  FOR SELECT USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = public.student_notes.student_id
        AND s.profile_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS student_notes_write ON public.student_notes;
CREATE POLICY student_notes_write ON public.student_notes
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---------------------------------------------------------------------------
-- student_milestones — achievements/progress markers.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_milestones (
  id          text PRIMARY KEY,
  student_id  text NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  date        date NOT NULL DEFAULT CURRENT_DATE,
  achieved    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_milestones_select ON public.student_milestones;
CREATE POLICY student_milestones_select ON public.student_milestones
  FOR SELECT USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = public.student_milestones.student_id
        AND s.profile_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS student_milestones_write ON public.student_milestones;
CREATE POLICY student_milestones_write ON public.student_milestones
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---------------------------------------------------------------------------
-- student_injuries — health-sensitive; student may read their own, staff all.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_injuries (
  id           text PRIMARY KEY,
  student_id   text NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  body_part    text NOT NULL,
  severity     text NOT NULL DEFAULT 'mild' CHECK (severity IN ('mild', 'moderate', 'severe')),
  notes        text NOT NULL DEFAULT '',
  modification text NOT NULL DEFAULT '',
  date         date NOT NULL DEFAULT CURRENT_DATE,
  resolved     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_injuries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_injuries_select ON public.student_injuries;
CREATE POLICY student_injuries_select ON public.student_injuries
  FOR SELECT USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = public.student_injuries.student_id
        AND s.profile_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS student_injuries_write ON public.student_injuries;
CREATE POLICY student_injuries_write ON public.student_injuries
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---------------------------------------------------------------------------
-- instructor_feedback — student ratings/comments on instructors.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.instructor_feedback (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  instructor_id text REFERENCES public.instructors(id) ON DELETE CASCADE,
  student_id    text REFERENCES public.students(id) ON DELETE CASCADE,
  rating        integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text NOT NULL DEFAULT '',
  date          date NOT NULL DEFAULT CURRENT_DATE,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS instructor_feedback_select ON public.instructor_feedback;
CREATE POLICY instructor_feedback_select ON public.instructor_feedback
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Students may add feedback about themselves; staff may add/update.
DROP POLICY IF EXISTS instructor_feedback_insert ON public.instructor_feedback;
CREATE POLICY instructor_feedback_insert ON public.instructor_feedback
  FOR INSERT WITH CHECK (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = public.instructor_feedback.student_id
        AND s.profile_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS instructor_feedback_update ON public.instructor_feedback;
CREATE POLICY instructor_feedback_update ON public.instructor_feedback
  FOR UPDATE USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS instructor_feedback_delete ON public.instructor_feedback;
CREATE POLICY instructor_feedback_delete ON public.instructor_feedback
  FOR DELETE USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_log — append-only (no UPDATE/DELETE policies). Rows carry actor info.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id   uuid REFERENCES auth.users(id),
  actor_name text NOT NULL DEFAULT '',
  action     text NOT NULL,
  entity     text,
  entity_id  text,
  details    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_select ON public.audit_log;
CREATE POLICY audit_log_select ON public.audit_log
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS audit_log_insert ON public.audit_log;
CREATE POLICY audit_log_insert ON public.audit_log
  FOR INSERT WITH CHECK (public.is_staff());

-- Convenience helper to write an audit entry (security definer, staff-only guard).
CREATE OR REPLACE FUNCTION public.audit(action text, entity text DEFAULT NULL, entity_id text DEFAULT NULL, details jsonb DEFAULT '{}'::jsonb)
RETURNS void AS $$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO public.audit_log (actor_id, actor_name, action, entity, entity_id, details)
  VALUES (
    auth.uid(),
    COALESCE((SELECT display_name FROM public.profiles WHERE id = auth.uid()), 'unknown'),
    action, entity, entity_id, details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- client_state — per-user ephemeral UI state (cues, mic consent, retention).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_state (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_state_own ON public.client_state;
CREATE POLICY client_state_own ON public.client_state
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','studio_settings','instructors','students','classes',
    'demo_sessions','attendance','student_injuries','client_state'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated ON public.%1$s', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END;
$$;

COMMIT;
