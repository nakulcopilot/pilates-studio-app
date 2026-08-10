# Execution Plan — Making Pilates Studio App Live

> Companion to `PLAN.md`. This is the **runbook**: the concrete, ordered steps to turn the
> single-file prototype (`reference/PilatesStudioApp.html`) into a live, multi-role web app
> with a real database, auth, and clean URLs.

---

## 0. Current state (what exists today)

| Asset | Status |
| --- | --- |
| `reference/PilatesStudioApp.html` | ~11,600-line single-file prototype; all logic client-side, data in `localStorage`, auth hardcoded |
| `index.html` + GitHub Pages | Static demo at `nakulcopilot.github.io/pilates-studio-app` — no backend, no DB, no real routing |
| `PLAN.md` | Full 16-week $10K-value roadmap (scope + learning path) |
| Real app code | **Not started.** This document is the execution checklist to change that |

---

## 1. Prerequisites (do once)

- [ ] GitHub account (already used for hosting)
- [ ] [Vercel](https://vercel.com) account (free hobby tier)
- [ ] [Supabase](https://supabase.com) **or** [Neon](https://neon.tech) project (free Postgres tier)
- [ ] Node.js 20+ (`node --version`)
- [ ] Optional: Groq API key (free) for AI text upgrade later; not required for MVP

---

## 2. Build phases (each phase ends with a deploy + verify)

### Phase A — Scaffold & first live deploy (day 1)
- [ ] Scaffold Next.js App Router project in `app/`:
  ```bash
  npx create-next-app@latest app --typescript --tailwind --app --src-dir
  ```
- [ ] Move the prototype's CSS design tokens (colors, radii, sidebar theme) into Tailwind theme
- [ ] Port landing + login screen (`#login-screen`, presentation sections) to `/`
- [ ] Deploy to Vercel (link the GitHub repo → auto-deploy on push)
- [ ] **Exit:** `yourapp.vercel.app` shows the landing page

### Phase B — Data layer + auth (week 1–2)
- [ ] Create Prisma schema from the prototype's `defaultDB()` models:
  `StudioSettings`, `Instructor`, `Student`, `Class`, `DemoSession`, `Attendance`,
  `ClassNote`, `StudentNote`, `StudentMilestone`, `StudentInjury`, `InstructorFeedback`,
  `AuditLog`, `CueDismissed`, `CueSnoozed`, `MicConsent`
- [ ] `prisma db push` + `prisma db seed` (recreate mockup demo dataset: 7 instructors, 9 students, packages, classes)
- [ ] Auth with 3 roles — seeded accounts match mockup (`admin/rules123`, `neelamr/rules123`, 9 students)
- [ ] RBAC: middleware route guards + `requireRole()` helper for every server action
- [ ] **Exit:** login/logout per persona; role-mismatch blocked; seeded data readable

### Phase C — Clean URLs & routing (week 2)
- [ ] Implement the route structure in §4 below (file-based routing → clean paths, no hashes)
- [ ] Per-route `metadata` (title + description) via Next.js Metadata API
- [ ] `app/sitemap.ts` + `app/robots.ts` generated automatically
- [ ] **Exit:** every screen reachable at its own clean URL; shareable/bookmarkable links

### Phase D — Admin modules (week 3–4)
- [ ] Dashboard KPIs, studio settings, appearance (logo upload → Supabase Storage), packages & payments, instructor CRUD + permissions + analytics, reports/CSV export
- [ ] **Exit:** admin can fully run a studio against the real DB

### Phase E — Instructor modules (week 5–6)
- [ ] Dashboard, class CRUD + rosters, attendance, student profiles (level progress, milestones, injuries, notes, feedback), demo sessions
- [ ] **Exit:** instructor runs full pre-class workflow (schedule → roster → attendance → notes)

### Phase F — Live class console (week 7–9) ← most valuable
- [ ] Start class → live console; phase timer (Free/Pilates/Interval/EMOM/AMRAP), roster chips, live notes
- [ ] Voice capture via Web Speech API (browser-level, $0) → transcript feed with tag highlighting
- [ ] Realtime sync via Supabase Realtime (roster/notes/timer on any open tab)
- [ ] End class → post-class summary + saved notes
- [ ] **Exit:** simulated class runs start→end with a second browser observing in realtime

### Phase G — AI engine (week 9–10)
- [ ] Port deterministic engine first ($0): `autoTagNote`, `getStudentPerformance`, `generatePriorityCue`, `generatePreClassBrief`, `smartAISuggestion`, confidence scoring
- [ ] Optional: swap in Groq/Ollama for natural-language cues with rules engine as fallback
- [ ] **Exit:** AI surfaces (brief, cue card, consult list) behave like the mockup, backed by real data

### Phase H — Student app (week 11)
- [ ] Student dashboard, book classes (level gating: 5 beginner → intermediate, 10 intermediate → expert; overlap/spot/package-limit checks), schedule change/cancel, packages, demo booking
- [ ] **Exit:** student goes login → book → attend → view progress with correct gating

### Phase I — QA, SEO, launch (week 12)
- [ ] Playwright E2E: admin CRUD, instructor live class, student booking (happy + failure paths)
- [ ] Security pass: RBAC on all routes/actions, env vars never in client, input validation
- [ ] Lighthouse ≥ 90; responsive across breakpoints; sitemap submitted to Google Search Console
- [ ] Seed fresh demo data; 2-min demo script per persona; CI (lint + test + build) green on `main`
- [ ] **Exit:** production URL live, all 3 personas walk through end-to-end

---

## 3. Deployments & environments

| Env | URL | Purpose |
| --- | --- | --- |
| Preview | `*-git-*.vercel.app` (per PR) | Test each phase |
| Production | `pilates-studio.vercel.app` | Demo / launch URL |
| Production DB | Neon/Supabase free (500MB–1GB) | Postgres |
| Storage | Supabase Storage free (1GB) | Logo / branding uploads |
| Realtime | Supabase Realtime free | Live class sync |
| AI | Rules engine by default; Groq/Ollama optional | $0–$5/mo |

Environment variables (`.env.local`, never in client code):
```
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AUTH_SECRET=
GROQ_API_KEY=            # optional
```

---

## 4. Clean URL architecture (file-based routing)

Each page maps to a real path — no `#sections`, no `?id=` query strings. Friendly for
navigation (shareable/bookmarkable) and SEO (each route is its own indexable page).

```
app/
├── page.tsx                              →  /                 landing + login
├── sitemap.ts                            →  /sitemap.xml      auto-generated
├── robots.ts                             →  /robots.txt       auto-generated
├── (auth)/
│   ├── login/page.tsx                    →  /login            dedicated login (no-render if authed)
│   └── logout/route.ts                   →  /logout           session end
├── admin/
│   ├── page.tsx                          →  /admin            admin dashboard (role: admin)
│   ├── instructors/page.tsx              →  /admin/instructors
│   ├── instructors/[id]/page.tsx         →  /admin/instructors/:id   (detail/analytics)
│   ├── packages/page.tsx                 →  /admin/packages
│   ├── settings/page.tsx                 →  /admin/settings
│   ├── appearance/page.tsx               →  /admin/appearance
│   └── reports/page.tsx                  →  /admin/reports
├── instructor/
│   ├── page.tsx                          →  /instructor       instructor dashboard (role: instructor)
│   ├── classes/page.tsx                  →  /instructor/classes
│   ├── classes/[id]/page.tsx             →  /instructor/classes/:id   (roster/attendance)
│   ├── classes/[id]/live/page.tsx        →  /instructor/classes/:id/live  (live console)
│   ├── students/page.tsx                 →  /instructor/students
│   └── students/[id]/page.tsx            →  /instructor/students/:id  (profile)
└── student/
    ├── page.tsx                          →  /student          student dashboard (role: student)
    ├── book/page.tsx                     →  /student/book
    ├── schedule/page.tsx                 →  /student/schedule
    ├── packages/page.tsx                 →  /student/packages
    └── account/page.tsx                  →  /student/account
```

### Route rules
- **Login gate:** `/admin/*`, `/instructor/*`, `/student/*` wrapped in middleware; unauthenticated → redirect `/login`
- **Role gate:** role-specific layouts throw/redirect on wrong persona
- **Dynamic params:** `[id]` gives real URLs (`/student/neha-sharma`) — prefer slugs (`slug` field on Instructor/Student/Class) over numeric IDs for shareable, SEO-friendly URLs
- **Server-first:** pages are Server Components (pre-rendered for SEO); interactivity added client-side only where needed

### SEO checklist
- [ ] Every route exports `metadata` (unique `title` + `description`)
- [ ] `sitemap.ts` lists public routes (landing, login) + role pages for authenticated content is optional
- [ ] Semantic HTML: one `h1` per page, correct heading order, descriptive link text
- [ ] Mobile responsive (prototype breakpoints ported) — Core Web Vitals friendly
- [ ] Submit production URL + sitemap to Google Search Console
- [ ] Share previews via `metadata.openGraph` for each route

---

## 5. Definition of "live" (acceptance)

- [ ] Public URL on Vercel; all three personas log in with seeded accounts
- [ ] Every screen reachable at a clean, shareable URL (§4)
- [ ] Data persists in Postgres (not localStorage); survives refresh/re-login
- [ ] Live class syncs in realtime across tabs; post-class summary saves
- [ ] AI features behave like the mockup, with graceful offline fallback
- [ ] E2E tests + CI green; Lighthouse ≥ 90; sitemap submitted
