# PLAN — Build a $10,000-Value Pilates Studio Web App for $0

> **Your goal:** learn the skills to *deliver* a web application that meets this quality bar, at **zero cash cost**.
> This document turns the `reference/PilatesStudioApp.html` mockup into a complete, phased build plan:
> what to build, what to learn, in what order, and how to stay at $0.

---

## 1. Executive summary

The mockup is a single-file prototype of a complete studio-management + AI-coaching product
(~11,600 lines of HTML/CSS/JS with a working localStorage "database"). That prototype is the
**spec** and the **benchmark**. Your job is to rebuild it as a real, deployed web app.

| | |
| --- | --- |
| **Market value of target** | ~$10,000 (what a freelancer/agency would charge to build this scope) |
| **Cash budget** | **$0** — free tiers, free learning resources, you write the code |
| **Build time (learner-paced)** | ~12–16 weeks at 15–20 hrs/week |
| **Stack** | Next.js 14 + TypeScript + Tailwind, PostgreSQL (Supabase/Neon), Prisma, Vercel |
| **Scope** | Full feature set of the mockup across all 3 personas |

### How "$10,000 value" is reached with $0 cash

Value comes from **your skills + time**, not from spending:

1. Every feature you port from the mockup would otherwise be billable work (see value map in §2).
2. All infrastructure runs on generous free tiers (Vercel hobby, Supabase/Neon free, free courses).
3. The only recurring cost that *can* exist is AI API usage; the plan keeps it ~$0 with free/self-hosted options (§4, §9).

---

## 2. Product scope & value map

Every line item below exists in the mockup. Each maps to a **value estimate** (what a client would
pay to have it built). Totaling ~$10K.

| Value | Feature area | Mockup reference |
| --- | --- | --- |
| $800 | Landing / marketing page + persona-based login (Admin / Instructor / Student) | `#login-screen`, `pres-*` sections |
| $1,200 | **Admin**: dashboard KPIs, studio settings, appearance (logo/theme/sidebar), packages & payment types | `renderAdminDashboard/Settings/Packages/Appearance` |
| $1,400 | **Admin**: instructor management — CRUD, permissions, class assignment, comparative analytics | `renderAdminInstructors`, `getComparativeInsightsHTML` |
| $1,200 | **Instructor**: class CRUD, rosters, attendance, demo sessions | `renderInstructorClasses/Attendance/Demo` |
| $1,000 | **Instructor**: student profiles — level progress, milestones, injuries, notes, feedback | `showStudentProfile`, `renderStudentLevelProgress` |
| $2,000 | **Live class console**: phase timer (Free/Pilates/Interval/EMOM/AMRAP), roster chips, live notes, voice capture & transcript | `renderInstructorActiveClass`, timer functions, voice functions |
| $1,400 | **AI engine**: pre-class brief, live cue engine w/ confidence, auto-tagging, performance scoring, consultations | `generatePreClassBrief`, `generatePriorityCue`, `smartAISuggestion`, `getStudentPerformance`, `renderConsultations` |
| $1,000 | **Student**: booking (level-gated, filters, demo), schedule change/cancel, packages | `renderStudentBook/Schedule/Packages` |
| $0–500 | Reporting, export, offline banner, polish, responsive design | `renderAdminReports`, `buildOfflineBannerHTML` |
| **≈ $10,000** | **Total equivalent scope** | |

> Builders note: freelancers quote this class of app (multi-role SaaS + realtime + AI) at
> $10–15K. We are effectively "earning" that value through the skills we acquire.

---

## 3. Skills you will acquire (the real deliverable)

You finish this project having learned, hands-on:

1. **Git & GitHub** — version control, branching, PRs, CI basics.
2. **HTML/CSS/Tailwind** — port the mockup's design system (spacing, color vars, components) 1:1.
3. **TypeScript + React** — components, state, hooks, context.
4. **Next.js (App Router)** — routing, layouts, Server Components, Server Actions, Route Handlers, API design.
5. **Databases** — PostgreSQL schema design, Prisma ORM, seeding, migrations, indexes.
6. **Authentication & RBAC** — 3 roles (admin/instructor/student) with route + action guards.
7. **Realtime** — live class updates (roster, notes, timer) via Supabase Realtime/WebSockets.
8. **AI integration** — prompt design, calling LLM APIs, structured output, graceful fallbacks.
9. **Testing & QA** — unit (Vitest), integration (Playwright), and the discipline to test each phase.
10. **DevOps** — deploy to Vercel, environment variables, Postgres on Neon/Supabase, monitoring.
11. **Product thinking** — turning a UI mockup into a data model, user stories, and acceptance criteria.

---

## 4. Tech stack & the $0 cost plan

### Chosen stack (from the earlier decision: Next.js + PostgreSQL)

| Layer | Choice | Cost at our scale |
| --- | --- | --- |
| App | Next.js 14 (App Router) + React + TypeScript | $0 |
| Styling | Tailwind CSS (+ ported CSS vars from mockup) | $0 |
| Database | PostgreSQL on **Supabase free** or **Neon free** | $0 (500MB–1GB) |
| ORM | Prisma | $0 |
| Auth | Supabase Auth or NextAuth.js (email/OTP) | $0 |
| Realtime | Supabase Realtime / Pusher free | $0 |
| AI | **Prefer free**: Groq free tier, or local **Ollama**; or OpenAI with tight token budgets | ~$0–$5/mo |
| Payments | Razorpay (UPI, INR — matches mockup) or Stripe | $0/month + per-transaction |
| Files | Supabase Storage (logo upload, etc.) | $0 (1GB) |
| Email | Resend free (100 emails/day) | $0 |
| Hosting | Vercel hobby | $0 (100GB bandwidth) |
| Domain | Optional later; use `*.vercel.app` until launch | $0 (or ~$12/yr) |
| Monitoring | Vercel Analytics / Sentry free tier | $0 |

### The one real cost: AI tokens

The mockup's AI is **simulated** (rules + templates). For the real app you have three $0-friendly options:

- **A. Rules-first (default):** keep the mockup's deterministic engine (tag frequency, confidence scoring).
  $0, fully predictable, and it already looks smart.
- **B. Local model:** run **Ollama** on your machine for dev/demo. $0.
- **C. Managed API later:** swap in Groq/OpenAI with prompt templates + caching + hard token caps.
  Expect only **$0–$5/month** at studio scale — optional.

---

## 5. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js 14 (Vercel)                                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ App Router                                              │  │
│  │  /              → marketing/landing (login)             │  │
│  │  /admin/*       → admin dashboard, settings, ...        │  │
│  │  /instructor/*  → classes, live-class, students, ...    │  │
│  │  /student/*     → book, schedule, packages              │  │
│  │  /api/*         → route handlers (export, webhooks)     │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ Server Actions  → mutations w/ RBAC guards              │  │
│  │ Server Components → reads, dashboard queries            │  │
│  │ Realtime client → live class panel, notes, timer sync   │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬──────────────────────────────┘
                                │ Prisma
                    ┌───────────▼───────────┐
                    │ PostgreSQL (Neon/Supa) │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │ Realtime (channels)    │
                    └───────────────────────┘
```

**Key principles**

- **Port first, then enhance.** Phase 1–3 reproduce the mockup exactly (same pages, same copy, same
  behavior) using the mockup's CSS variables as the design token source.
- **RBAC everywhere.** Every server action and route checks the caller's role — never trust the UI.
- **Optimistic + offline-friendly** (matches mockup's offline banner): timers and notes work offline,
  sync when back online.
- **Audit log** (already in mockup data model) for instructor/admin changes.

---

## 6. Data model (from the mockup's `defaultDB()`)

The prototype already defines the schema. Port it 1:1:

- `StudioSettings` — studio name, logo, color theme, class types (mat/reformer), default duration,
  time slots, payment types, currency, packages[], demo-session quota, instructor defaults, sidebar theme.
- `Instructor` — profile, certification, experience, availability (per-day time slots), permissions
  (editSchedule, editPricing), rating, active flag.
- `Student` — contact, emergency contact, gender, level, `levelProgress{beginner,intermediate,expert}`,
  enrolled class IDs, demo IDs, packageId, active.
- `Class` — type (mat/reformer), level, date, time, duration, capacity, status, instructor, enrolled[], waitlist[].
- `DemoSession` — date/time/duration/capacity/enrolled.
- `Attendance` — `classId → { studentId: present|late|absent }`.
- `ClassNote` — `classId → studentId → [{text, tags[], timestamp}]`.
- `StudentNote`, `StudentMilestone`, `StudentInjury` (body part, severity, modification, resolved).
- `InstructorFeedback` — student → instructor rating + comment.
- `AuditLog`, `CueDismissed`, `CueSnoozed`, `MicConsent`, `RetentionDays`.

Design these as Postgres tables with Prisma in **Phase 2** (after the mockup is re-implemented with
in-memory/localStorage in Phase 1 so behavior matches first).

---

## 7. Build roadmap (phases)

Each phase = **learn → build → verify**. Only move on when the "exit criteria" pass.

### Phase 0 — Foundations (Week 1) · $0
**Learn:** Git & GitHub basics (add/commit/push/branch), HTML/CSS essentials, VS Code.
**Do:**
- [ ] Set up this repo (`git init` done), copy mockup into `reference/`.
- [ ] Create `gh` repo, first commit, branch workflow (`main` + `feature/*`).
- [ ] Read the mockup end-to-end; annotate screens/pages you'll port (list in §2).
**Free resources:** freeCodeCamp Responsive Web Design, GitHub Skills courses.
**Exit:** You can commit/push and open a PR; you can open the mockup and name every screen.

### Phase 1 — Next.js skeleton + marketing/landing (Weeks 1–2) · $0
**Learn:** React basics (components, props, state), Next.js App Router, Tailwind.
**Do:**
- [ ] `npx create-next-app@latest` in `app/` with TypeScript + Tailwind.
- [ ] Port the **landing/login screen** (`#login-screen`, presentation sections, phone mockup carousel).
- [ ] Extract the mockup's CSS variables into Tailwind theme tokens (colors, radii, sidebar).
- [ ] Add `/admin`, `/instructor`, `/student` route shells with simple layouts.
- [ ] Deploy to Vercel free (link repo → auto-deploy). First URL 🎉.
**Exit:** `yourapp.vercel.app` shows the polished landing + role entry points; mobile responsive.

### Phase 2 — Data layer + auth (Weeks 3–4) · $0
**Learn:** SQL basics, Prisma schema/migrations/seed, auth (Supabase or NextAuth), RBAC patterns.
**Do:**
- [ ] Create Supabase/Neon project; put connection string in `.env`.
- [ ] Prisma schema from §6; `prisma db push` + `prisma db seed` (recreate mockup demo dataset).
- [ ] Auth: 3 roles. Seed accounts match mockup (admin, 6 instructors w/ `instructor123`, 9 students).
- [ ] Role guards: middleware for routes + a `requireRole()` helper for server actions.
**Exit:** Login/logout works per persona; seeded data visible in a debug page; role mismatch blocked.

### Phase 3 — Admin modules (Weeks 4–6) · $0
**Learn:** Server Components vs Server Actions, forms, CRUD patterns, file upload (logo).
**Do:**
- [ ] Admin dashboard KPIs (classes today, active students, revenue est., AI panel).
- [ ] Studio Settings (name, class types, duration, time slots, payment types, packages).
- [ ] Appearance (logo upload → Supabase Storage, theme color, sidebar presets).
- [ ] Instructors (CRUD, availability, permissions, active toggle, assign students, comparative analytics).
- [ ] Payments & Packages (add/remove packages, toggle cash/UPI/card).
- [ ] Reports (export CSV).
**Exit:** Admin can fully run a studio from the app; all mockup admin screens ported & working with DB.

### Phase 4 — Instructor modules (Weeks 6–9) · $0
**Learn:** Complex forms, nested relations (rosters), date/time handling.
**Do:**
- [ ] Instructor dashboard + class list (filters, create/edit class, delete, roster management).
- [ ] Attendance page (mark present/late/absent, per-class + bulk).
- [ ] Students page (add student, assign to class, profile view).
- [ ] Student profile detail: level progress bars, milestones, injuries w/ modifications, notes timeline, feedback.
- [ ] Demo sessions (create/manage slots, book students).
**Exit:** An instructor can run a full pre-class workflow (schedule → roster → attendance → notes) against the real DB.

### Phase 5 — Live class console (Weeks 9–12) · $0  ← hardest, most valuable
**Learn:** Realtime (Supabase Realtime/Pusher), timers & state machines, voice (Web Speech API),
streaming UI.
**Do:**
- [ ] Start class → live console (port `renderInstructorActiveClass` layout).
- [ ] Phase timer: Free Run + Pilates/Interval/EMOM/AMRAP presets, phase bar, play/pause, rounds, urgent colors.
- [ ] Roster chips + student detail panel: live notes, quick tags, attendance buttons.
- [ ] Voice capture: Web Speech API transcription → auto-tag → notes (browser-level; no cloud cost).
- [ ] Transcript feed (right panel) with tag highlighting.
- [ ] Realtime sync: notes/attendance appear on any open console (Supabase Realtime).
- [ ] End class → post-class summary + save notes (port `showPostClassDashboard`).
**Exit:** You can run a simulated class start→end with notes, cues, timer, and post-summary — with another
browser tab observing changes in realtime.

### Phase 6 — AI engine (Weeks 12–13) · $0
**Learn:** Prompt engineering, structured LLM output, caching; OR keep the rules engine.
**Do:**
- [ ] Port the **deterministic** engine first: `autoTagNote`, `getStudentPerformance`, `generatePriorityCue`,
      `generatePreClassBrief`, `smartAISuggestion`, `getConsultData`, confidence scoring. (Matches mockup, $0.)
- [ ] Optional upgrade: plug local Ollama or Groq for *natural-language* cue text, with the rules engine
      as the fallback when offline/over budget.
- [ ] Wire AI into: instructor dashboard insights, pre-class briefing, live cue card, consult page.
**Exit:** The AI surfaces (brief, cue card with confidence/rationale/demo/checklist, consult list) behave
exactly like the mockup, backed by real data.

### Phase 7 — Student app (Weeks 13–14) · $0
**Learn:** Mobile-first responsive UX, booking logic, level gating.
**Do:**
- [ ] Student dashboard (next class, AI recommendation card, progress ring, level milestones).
- [ ] Book classes (level-gating per mockup rules: 5 beginner → intermediate, 10 intermediate → expert;
      overlap checks; spot limits; package/month limit).
- [ ] Schedule (upcoming/past, change ≥1 day, cancel).
- [ ] Packages (current plan usage, switch plan).
- [ ] Demo session booking.
**Exit:** A student can go from login → book → attend → view progress with correct gating rules.

### Phase 8 — QA, security, polish, launch (Weeks 14–16) · $0
**Learn:** Playwright end-to-end tests, OWASP basics (auth, injection, XSS, secrets), Lighthouse.
**Do:**
- [ ] Write Playwright flows: admin CRUD, instructor live class, student booking (happy + failure paths).
- [ ] Security pass: all actions RBAC-guarded, env vars never in client, input validation everywhere.
- [ ] Lighthouse ≥ 90 across pages; responsive pass (mockup has mobile/tablet breakpoints — match them).
- [ ] Offline banner + PWA (optional) matching mockup's connectivity UX.
- [ ] Seed fresh demo data for reviewers; write a 2-min demo script per persona.
- [ ] Set up branch protection, enable GitHub Actions CI (lint + test + build).
**Exit:** All 3 persona walkthroughs pass end-to-end; CI green; deployed to production URL.

---

## 8. Weekly rhythm (keeps it affordable & consistent)

- **Learn** (~40%): one focused topic per week from free resources.
- **Build** (~50%): port the matching mockup feature into the app.
- **Verify** (~10%): exit-criteria checklist + commit + PR.
- Track progress in this file's checkboxes (they're the acceptance criteria).

### Free learning resources
- GitHub Skills (git/github), freeCodeCamp (HTML/CSS/JS/React), Next.js Learn course (free),
  Prisma docs, Supabase docs, Vercel guides, MDN, and the official docs for each tool.

---

## 9. Keeping it at $0 (guardrails)

1. **Hosting:** Vercel hobby + Neon/Supabase free. No paid plan unless traffic demands.
2. **AI:** rules engine by default; local Ollama for dev; only if needed, Groq (free tier) before OpenAI.
   Set hard token caps + caching so AI never becomes a surprise bill.
3. **Auth/email/storage:** free tiers (Supabase/NextAuth, Resend 100/day, Supabase storage 1GB).
4. **Payments:** enable live payment only for a real studio; Razorpay/Stripe cost per transaction, not monthly.
5. **Never pay for tutorials:** everything needed is free.
6. **Reject scope creep:** the mockup is the spec; gold-plating adds time (your real cost), not value.

---

## 10. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Scope too big for learner pace | Phases are independently valuable; §7 order puts a working product up by Week 6 |
| AI API cost creep | Rules engine default; local model in dev; caps + caching if managed API used (§4) |
| Realtime complexity (Phase 5) | Prototype in a sandbox page first; Supabase Realtime has generous free tier |
| Mockup logic gaps / dead code | The mockup is a prototype — some flows are simulated; define "good enough" per mockup, then improve |
| Motivation fade | Milestone demos after each phase; deploy early and often (visible progress) |

---

## 11. After launch (future, no extra cost now)

- Webhooks to payment providers; automated invoices.
- Multi-studio support (tenants) — keep `studioId` in mind when designing schema.
- Instructor mobile app (PWA) for live class on a tablet.
- Export/sync to Google Calendar.
- Paid plan here only if the studio grows; until then the free tiers suffice.

---

## 12. Definition of done (the $10K quality bar)

The app is "done" (Phase 8) when:

- [ ] All mockup screens are ported for all 3 personas and work with a real database.
- [ ] Live class works end-to-end incl. realtime sync and post-class summary.
- [ ] AI features behave at least as well as the mockup, with graceful offline fallback.
- [ ] Auth + RBAC secure every route and action; audit log records key changes.
- [ ] Responsive on mobile/tablet/desktop; Lighthouse ≥ 90.
- [ ] End-to-end tests pass; CI is green on `main`.
- [ ] Deployed on a public URL with seeded demo data, ready to demo to a real studio.

At that point you own a deployable, demo-ready product of ~$10K build value **and** the skills to
build, ship, and extend it — without spending money.
