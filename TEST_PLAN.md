# Test Strategy — Pilates Studio App (Go-Live Readiness)

> Application under test: `reference/PilatesStudioApp.html` (single-file web app, client-side,
> localStorage-backed). Published at https://nakulcopilot.github.io/pilates-studio-app/
>
> Purpose: validate the application **end to end** and certify **go-live readiness**.

---

## 1. Objectives

1. Verify every user flow across all three roles (Admin / Instructor / Student) works end to end.
2. Verify go-live blockers: login, class lifecycle (create → start → end → save), booking rules,
   attendance, persistence across reloads.
3. Verify responsive behavior (desktop, tablet, mobile).
4. Catch runtime errors (console exceptions), broken controls, and dead handlers.
5. Document all observations, fix them, and **re-validate** the fixes (regression pass).

## 2. Scope

**In scope**
- Login & logout (admin, instructor, student), credential validation, role separation.
- Admin: dashboard, studio settings, instructor management (CRUD, permissions, status),
  packages & payments, appearance/branding, reports.
- Instructor: dashboard, classes (CRUD, tabs, search, filters), rosters, attendance,
  students & profiles, demo sessions, AI pre-class brief, live class console
  (timer, per-student observation notes + AI suggestions, cues, transcript, voice, End & Save),
  post-class summary, insights/consultations.
- Student: dashboard, booking (filters, level gating, overlap & full-class rules, package limit),
  schedule (change/cancel with 1-day rule), packages (switch plan), demo booking.
- Cross-cutting: persistence (data **and** session), responsiveness, runtime errors, toasts,
  offline banner, branding/tooltips, AI-feature health, refresh-not-logout.

**Out of scope**
- Real backend/API (app is a client-side prototype).
- Real payments integration, real SMS/email.
- Load/performance benchmarking beyond baseline.

## 3. Test environment

| Item | Detail |
| --- | --- |
| App build | `reference/PilatesStudioApp.html` (local) + live GitHub Pages URL |
| Browsers | Chrome (headless automation), responsive widths 1440/768/390 |
| Test data | Fresh seed via DB key `zenpilates_data_v2`; deterministic reset before each suite |
| Automation | Puppeteer-core + Chrome, Node.js 24 |

## 4. Test approach

- **Levels:** System/E2E (primary) + UI responsiveness + persistence/state.
- **Technique:** automated black-box flows via DOM interaction; each flow asserts on resulting
  DOM state, role/screen transitions, and absence of uncaught exceptions.
- **Data isolation:** `localStorage.clear()` + reload before each suite so runs are repeatable.
- **Defect record:** each check is logged as PASS/FAIL with evidence; failures become
  **observations** and are fixed in the same cycle, then the whole suite is re-run.

## 5. Entry / exit criteria

**Entry:** app deploys; seed data loads; harness connects to Chrome.
**Exit:** all severity-1/2 observations resolved; full suite green; fixes re-validated.

## 6. Roles & responsibilities (of this run)

| Role | Activity |
| --- | --- |
| Tester | Define strategy, execute scenario suite, document observations |
| Developer | Fix observations in `reference/PilatesStudioApp.html` |
| Tester (re-run) | Re-validate fixes — full regression pass |
| Publisher | Commit fixes + docs, redeploy to GitHub Pages, verify live |

## 7. Defect management

Severity: **S1** blocks go-live (crash, dead primary flow). **S2** major functional defect.
**S3** minor/UX. **S4** cosmetic. Observations captured in `OBSERVATIONS.md` with status
`OPEN → FIXED → VERIFIED`.

---

## 8. Scenario catalog

### A — Authentication
| ID | Scenario | Expected |
| --- | --- | --- |
| A-01 | Fresh load | Login page shown (not prototype landing) |
| A-02 | Wrong credentials | Error message, stays on login |
| A-03 | Admin login `admin`/`rules123` | Admin dashboard, role badge "Admin" |
| A-04 | Logout | Returns to login page |
| A-05 | Instructor login `neelamr`/`rules123` | Instructor dashboard, name "Neelam R" |
| A-06 | Instructor password variant `rule 123` | Logs in (typo-tolerant) |
| A-07 | Student profile picker | Student dashboard, role badge "Student" |
| A-08 | Role nav isolation | Each role only sees its own nav items |
| A-09 | Quick-fill buttons | Pre-fill correct credentials |

### B — Admin
| ID | Scenario | Expected |
| --- | --- | --- |
| B-01 | Dashboard | Stats cards + AI intelligence panel |
| B-02 | Studio settings | Edit studio name → save → persists + branding |
| B-03 | Settings validation | Empty name rejected with toast |
| B-04 | Instructors list | Renders instructors with analytics |
| B-05 | Instructor status toggle | Toggle active → persisted |
| B-06 | Add instructor | Modal opens; validation; save adds instructor |
| B-07 | Instructor permissions | Toggle permission persists |
| B-08 | Packages page | Renders packages & payment types |
| B-09 | Add package | Adds a new package |
| B-10 | Appearance | Theme color change applies CSS variable |
| B-11 | Reports | Renders report cards/export |

### C — Instructor
| ID | Scenario | Expected |
| --- | --- | --- |
| C-01 | Dashboard | Greeting, stats, today's class card |
| C-02 | Classes tabs | Upcoming / Past / Drafts filter correctly |
| C-03 | Class search + type filter | List filters |
| C-04 | Create class (single) | Modal → create → appears in list |
| C-05 | Create class validation | Missing time/duration rejected |
| C-06 | Roster | Opens; add student to roster |
| C-07 | Attendance | Select class → mark P/A/L → save persisted |
| C-08 | Students list + profile | Profile modal: level progress, notes |
| C-09 | Demo sessions | Page renders |
| C-10 | AI pre-class brief | Modal renders for a class |
| C-11 | Live class — start | Console opens, timer renders |
| C-12 | Live class — timer presets | Switch preset; start/pause/reset |
| C-13 | Live class — notes | Save manual note appears in notes |
| C-14 | Live class — transcript/tags | Transcript feed + tag toggle |
| C-15 | Live class — End & Save | Confirmation → post-class summary |
| C-16 | Insights / consultations | Page renders |

### D — Student
| ID | Scenario | Expected |
| --- | --- | --- |
| D-01 | Dashboard | Progress ring, next class |
| D-02 | Book — class list | Renders available classes |
| D-03 | Book — filters | Level/type/date filters work |
| D-04 | Book — success | Enroll → appears in schedule |
| D-05 | Book — duplicate | "Already enrolled" error |
| D-06 | Book — overlap | Same date/time error |
| D-07 | Book — full class | Disabled / "Full" |
| D-08 | Book — level gating | Beginner cannot book Intermediate (locked) |
| D-09 | Schedule — change booking | 1-day rule; change works |
| D-10 | Schedule — cancel | Cancels & updates schedule |
| D-11 | Packages | Renders current plan + options |
| D-12 | Packages — switch plan | `switchPackage` works (no JS error) |
| D-13 | Demo booking | Books free demo session |

### E — Cross-cutting
| ID | Scenario | Expected |
| --- | --- | --- |
| E-01 | Persistence | Data survives reload |
| E-02 | No runtime errors | No uncaught exceptions across all suites |
| E-03 | Toasts | Toast container present; toasts render |
| E-04 | Offline banner | Element exists in DOM |
| E-05 | Responsive (mobile) | Login + app usable at 390px, no horizontal overflow |
| E-06 | Responsive (tablet) | Usable at 768px |

### G — Branding & guidance (added cycle 2)
| ID | Scenario | Expected |
| --- | --- | --- |
| G-01 | Brand logo | SVG brand mark on login + app header (+ mobile header) |
| G-02 | Tooltips | Nav items, logout, New Class, Change/Cancel have guidance |
| G-03 | Login guidance | Demo creds visible; placeholders for all roles |

### H — AI features (added cycle 2)
| ID | Scenario | Expected |
| --- | --- | --- |
| H-01 | Pre-class brief | Structured overview/highlights/risks/recommendations |
| H-02 | Priority cue | Confidence-scored cue from notes |
| H-03 | Smart suggestion | Context-aware suggestion text |
| H-04 | Auto-tag | Note text classified to tags |
| H-05 | Consultations | AI-prioritized student list page renders |
| H-06 | Consult detail | Detail + AI summary modals open |
| H-07 | Enhanced insights | Analytics page renders |
| H-08 | Insights export | CSV export function + page renders |
| H-09 | Live AI suggestions | Suggestions appear in per-student panel |
| H-10 | Voice degrade | Graceful feedback when mic/API/UI unavailable |

### I — Responsive (added cycle 2)
| ID | Scenario | Expected |
| --- | --- | --- |
| I-01/02/03 | Student/Instructor/Admin | No horizontal overflow at 390/768px |
| I-04 | Desktop + iPad landscape | All pages render at 1280/1024px, no overflow/errors |
| I-05 | Mobile chrome | Student bottom nav + mobile header on phone; topbar on desktop |

### J — Session persistence (added cycle 2)
| ID | Scenario | Expected |
| --- | --- | --- |
| J-01/02/03 | Refresh Admin/Instructor/Student | Persona + page restored; not logged out |
| J-04 | Logout then refresh | Session cleared; login screen shown |

---

## 9. Test data notes

- `admin` / `rules123`; `neelamr` / `rules123` (variant `rule 123` accepted).
- Student `s1` (Neha Sharma, intermediate) for booking/schedule; `s3` (Meera Iyer, beginner,
  3 beginner classes) for level-gating checks.
- Seed includes Neelam R's classes today (`c27`, `c28`) and tomorrow (`c29`, `c30`).

## 10. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Client-side app has no auth enforcement | State clearly as known constraint; focus on UI-level role flows |
| Browser-only voice API in headless | Voice tests assert graceful fallback ("Not supported") |
| Date-sensitive seed data | Today/tomorrow classes generated at seed time |
