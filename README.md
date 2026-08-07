# Pilates Studio App

A full-featured studio management platform with an AI-assisted coaching engine — built from the design in
[`reference/PilatesStudioApp.html`](reference/PilatesStudioApp.html).

> **Goal:** deliver a production web app worth ~$10,000 in market value, built for **$0 cash cost**
> by learning the required skills as you build. See [PLAN.md](PLAN.md) for the complete roadmap.

---

## What it is

An all-in-one app for a small Pilates studio with three personas:

| Persona | What they can do |
| --- | --- |
| **Admin** | Dashboard, studio settings, instructor management (CRUD, permissions, assignments, analytics), packages & payments, appearance/branding (logo, theme, sidebar), reports |
| **Instructor** | Dashboard, class management (mat / reformer, levels, rosters), attendance, student profiles (milestones, injuries, notes), demo sessions, **live class console** (phase timer, AI cue engine, voice notes, transcript, post-class summary), insights & consultations |
| **Student** | Book classes (level-gated), free demo sessions, schedule with change/cancel, package plans, progress & level tracking |

The signature feature is **"Movement Intelligence"** — an AI engine that helps instructors track
movement quality and give better cues, with a strong **privacy-first** stance:

> No video · No sensors · No wearables — only structured observations captured by the instructor.

---

## Tech stack (all free tiers)

- **Frontend/Backend:** Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Database:** PostgreSQL via **Supabase** or **Neon** (free tier)
- **ORM / API:** Prisma, Server Actions / Route Handlers
- **Auth:** Supabase Auth or NextAuth.js (email + magic link / password)
- **Realtime (live class):** Supabase Realtime or Pusher free tier
- **AI:** OpenAI / Groq / local Ollama for the cue & insight engine
- **Payments:** Razorpay (UPI — the mockup is INR-based) or Stripe
- **Hosting:** Vercel (free hobby tier) + Postgres provider free tier

---

## Demo roles (as designed in the mockup)

| Role | Login |
| --- | --- |
| Admin | `admin` |
| Instructor | Pick from 6 seeded instructors (e.g., Priya Sharma — `instructor123`) |
| Student | Pick from 9 seeded students (e.g., Neha Sharma) |

Sample data matches the mockup: 6 instructors, 9 students, ~26 classes across June–July,
packages (Starter / Regular / Unlimited), attendance records, class notes, milestones and injuries.

---

## Repository layout

```
.
├── PLAN.md                     # Full $10K-value, $0-cost build roadmap
├── README.md                   # This file
└── reference/
    └── PilatesStudioApp.html   # Original single-file prototype (design & logic reference)
```

The real application code will be added in Phase 1 (see PLAN.md) as a Next.js project in this repo.

---

## Quick start (once app is scaffolded)

```bash
npm install
cp .env.example .env        # fill in Supabase/Neon + AI keys
npm run dev                 # http://localhost:3000
```

Seed data:

```bash
npm run db:seed             # recreates the mockup's demo dataset
```

---

## License

Private/undecided — ask before reusing.
