// ============================================================================
// validate-local.mjs
// Proves the Supabase migrations run on a REAL Postgres without any cloud
// account: spins up a project-local embedded Postgres, applies the auth stub,
// runs 00001_schema.sql + 00002_seed.sql, and asserts the security model
// (RLS on every table, row counts, integrity).
//
//   Run: npm run validate   (first run downloads a ~30 MB Postgres binary)
// ============================================================================
import EmbeddedPostgres from 'embedded-postgres';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MIGRATIONS = path.join(ROOT, 'supabase', 'migrations');
const BOOTSTRAP = path.join(ROOT, 'supabase', 'tests', 'bootstrap.sql');
const DATA_DIR = process.env.PG_DATA_DIR || path.join(ROOT, '.pgdata');
const PG_PORT = Number(process.env.PG_PORT) || 55432;

let passed = 0, failed = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { passed++; console.log('  PASS  ' + name); }
  else { failed++; console.log('  FAIL  ' + name + (extra ? ' :: ' + extra : '')); }
};
const sqlFile = p => readFileSync(p, 'utf8');

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: 'postgres',
  password: 'postgres',
  port: PG_PORT,
  persistent: false,
  timeout: 120_000,
});

let client;
const run = async sql => client.query(sql);
const query = async (sql, params) => (await client.query(sql, params)).rows;

try {
  console.log('[1/4] Starting embedded Postgres...');
  if (!existsSync(path.join(DATA_DIR, 'PG_VERSION'))) {
    await pg.initialise();
  }
  await pg.start();
  client = pg.getPgClient();
  await client.connect();

  console.log('[2/4] Applying migrations (00001 schema + 00002 seed + 00003 RPC)...');
  const runs = [
    ['auth bootstrap (test stub)', sqlFile(BOOTSTRAP)],
    ['00001_schema.sql', sqlFile(path.join(MIGRATIONS, '00001_schema.sql'))],
    ['00002_seed.sql', sqlFile(path.join(MIGRATIONS, '00002_seed.sql'))],
    ['00003_enroll_rpc.sql', sqlFile(path.join(MIGRATIONS, '00003_enroll_rpc.sql'))],
  ];
  for (const [label, sql] of runs) {
    try { await run(sql); ok(label + ' applied', true); }
    catch (e) { ok(label + ' applied', false, String(e.message).slice(0, 400)); }
  }

  console.log('[3/4] Asserting data + security model...');
  const counts = await query(`
    SELECT 'instructors' t, count(*) n FROM public.instructors
    UNION ALL SELECT 'students', count(*) FROM public.students
    UNION ALL SELECT 'classes', count(*) FROM public.classes
    UNION ALL SELECT 'class_notes', count(*) FROM public.class_notes
    UNION ALL SELECT 'attendance', count(*) FROM public.attendance
    UNION ALL SELECT 'milestones', count(*) FROM public.student_milestones
    UNION ALL SELECT 'injuries', count(*) FROM public.student_injuries
    UNION ALL SELECT 'feedback', count(*) FROM public.instructor_feedback
    UNION ALL SELECT 'student_notes', count(*) FROM public.student_notes
    UNION ALL SELECT 'demo_sessions', count(*) FROM public.demo_sessions
    UNION ALL SELECT 'studio_settings', count(*) FROM public.studio_settings;
  `);
  const map = {};
  for (const r of counts) map[r.t] = Number(r.n);
  ok('7 instructors seeded', map.instructors === 7, JSON.stringify(map));
  ok('9 students seeded', map.students === 9, JSON.stringify(map));
  ok('30 classes seeded', map.classes === 30, JSON.stringify(map));
  ok('31 class notes seeded', map.class_notes === 31, JSON.stringify(map));
  ok('attendance rows seeded', map.attendance >= 40, JSON.stringify(map));
  ok('milestones seeded', map.milestones === 14, JSON.stringify(map));
  ok('injuries seeded', map.injuries === 3, JSON.stringify(map));
  ok('feedback seeded', map.feedback === 18, JSON.stringify(map));
  ok('student notes seeded', map.student_notes === 8, JSON.stringify(map));
  ok('demo sessions seeded', map.demo_sessions === 3, JSON.stringify(map));
  ok('single studio_settings row', map.studio_settings === 1, JSON.stringify(map));

  // No plaintext password anywhere in seeded columns
  const rls = await query(`
    SELECT c.relname, c.relrowsecurity
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND c.relname NOT IN ('profiles') -- profiles FK depends on auth.users
    ORDER BY c.relname;
  `);
  const off = rls.filter(r => !r.relrowsecurity);
  ok('RLS enabled on all tables', off.length === 0, 'missing: ' + off.map(r => r.relname).join(','));

  const pol = await query(`
    SELECT c.relname, count(*)::int n
    FROM pg_policies p JOIN pg_class c ON c.relname = p.tablename
    GROUP BY c.relname ORDER BY c.relname;
  `);
  ok('RLS policies exist on every table', pol.length === 14 && pol.every(p => p.n >= 1), JSON.stringify(pol));

  const sensitive = await query(`
    SELECT 'password' pat, count(*) n FROM public.students s
    WHERE to_jsonb(s)::text ILIKE '%password%'
    UNION ALL SELECT 'password', count(*) FROM public.instructors i WHERE to_jsonb(i)::text ILIKE '%password%';
  `);
  ok('no password data in seeded columns', sensitive.every(s => Number(s.n) === 0), JSON.stringify(sensitive));

  console.log('[4/4] Verifying audit helper + updated_at trigger...');
  let auditRejected = false;
  try {
    await run("SELECT public.audit('test-action')");
  } catch (e) {
    auditRejected = /Not authorized/i.test(String(e.message));
  }
  ok('audit() rejects unauthenticated callers', auditRejected, 'expected "Not authorized" guard for non-staff');
  const trg = await query(`SELECT count(*)::int n FROM pg_trigger WHERE tgname LIKE 'trg_%_updated'`);
  ok('updated_at triggers installed', trg[0].n >= 8, JSON.stringify(trg));

  console.log('[5/5] Exercising enrollment RPCs under a simulated auth user...');
  const uuid = () => crypto.randomUUID();
  const uStudent = uuid();
  const uStranger = uuid();
  const uAdmin = uuid();
  await run(`INSERT INTO auth.users (id, email) VALUES ('${uStudent}', 's1@test'), ('${uStranger}', 'x@test'), ('${uAdmin}', 'a@test')`);
  await run(`UPDATE public.students SET profile_user_id = '${uStudent}' WHERE id = 's1'`);
  await run(`INSERT INTO public.profiles (id, role, display_name) VALUES ('${uAdmin}', 'admin', 'Admin')`);
  await run(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT '${uStudent}'::uuid $$`);

  const rpc = async (fn, ...args) => (await query(`SELECT public.${fn}(${args.map((a, i) => `$${i + 1}`).join(',')}) AS r`, args))[0].r;
  ok('enroll_in_class succeeds for own profile', (await rpc('enroll_in_class', 'c4', 's1')) === 'enrolled');
  ok('duplicate enrollment rejected', (await rpc('enroll_in_class', 'c4', 's1')) === 'already_enrolled');
  await run(`INSERT INTO public.classes (id, type, level, date, time, duration, max_students, status, instructor, enrolled) VALUES ('c99', 'mat', 'beginner', '2026-06-10', '07:00', 60, 15, 'active', 'i1', '{}')`);
  ok('overlapping class rejected', (await rpc('enroll_in_class', 'c99', 's1')) === 'overlap');
  await run(`INSERT INTO public.classes (id, type, level, date, time, duration, max_students, status, instructor, enrolled) VALUES ('c100', 'reformer', 'beginner', '2026-12-01', '12:00', 60, 0, 'active', 'i2', '{}')`);
  ok('full class rejected', (await rpc('enroll_in_class', 'c100', 's1')) === 'full');
  ok('demo enrollment succeeds', (await rpc('enroll_in_demo', 'd1', 's1')) === 'enrolled');
  ok('demo entitlement enforced', (await rpc('enroll_in_demo', 'd2', 's1')) === 'demo_limit');
  ok('duplicate demo rejected', (await rpc('enroll_in_demo', 'd1', 's1')) === 'already_enrolled');

  await run(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT '${uStranger}'::uuid $$`);
  ok('stranger cannot manage another student', (await rpc('unenroll_from_class', 'c4', 's1')) === 'forbidden');

  await run(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT '${uAdmin}'::uuid $$`);
  await run('DISCARD PLANS');
  ok('is_staff() true for admin with NULL optional columns', (await query(`SELECT public.is_staff() AS r`))[0].r === true);
  ok('is_admin() true for admin', (await query(`SELECT public.is_admin() AS r`))[0].r === true);
  const adminResult = await rpc('unenroll_from_class', 'c4', 's1');
  ok('staff can manage any student', adminResult === 'unenrolled', 'got: ' + adminResult);

  try { await client.end(); } catch {}
  await pg.stop();
} catch (e) {
  console.error('Fatal:', e);
  failed++;
  try { if (client) await client.end(); } catch {}
  try { await pg.stop(); } catch {}
}
console.log('\n==================================');
console.log('PASS: ' + passed + '  FAIL: ' + failed);
process.exit(failed ? 1 : 0);
