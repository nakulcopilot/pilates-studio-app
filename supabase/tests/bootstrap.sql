-- ============================================================================
-- tests/bootstrap.sql
-- Makes Supabase migrations executable on a plain Postgres instance by stubbing
-- the auth schema. This is ONLY for the local validation harness
-- (scripts/validate-local.mjs). It is never applied to a real Supabase project.
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS auth;

-- Supabase defines these database roles; stub them for the local harness.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS auth.users (
  id       uuid PRIMARY KEY,
  email    text
);

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text LANGUAGE sql STABLE AS $$ SELECT 'anon'::text $$;

CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$;
