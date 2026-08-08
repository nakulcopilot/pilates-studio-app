# QA Observations Log

Cycle: Go-Live QA (Test Plan: `TEST_PLAN.md`)
Target: `reference/PilatesStudioApp.html` (local) → GitHub Pages (published)
Status legend: **OPEN** = found, not fixed · **FIXED** = fix applied · **VERIFIED** = regression-tested by automated suite
Severity: **S1** critical (breaks a core flow) · **S2** major (wrong/blocked behavior) · **S3** minor (degraded UX/UI) · **S4** cosmetic

## Summary

- Automated suite: **75/75 PASS** (final, after fixes) — see `C:\Users\Welcome\AppData\Local\Temp\opencode\e2e-test\suite.js` (suites A–J).
- Defects found this cycle: **15** (2 S1, 4 S2, 8 S3, 1 S4). All **FIXED** and **VERIFIED**.
- All fixes were covered by a failing automated check first, then re-verified green after the change.

## Defect Log

| ID | Severity | Area | Description | Root cause | Status | Verified by |
|----|----------|------|-------------|------------|--------|-------------|
| OBS-001 | S1 | Student Packages | "Switch to [plan]" button threw `ReferenceError: switchPackage is not defined` | `renderStudentPackages` emitted `onclick="switchPackage('p2')"` but no `switchPackage` function existed | FIXED — added `switchPackage(packageId)` (sets `student.packageId`, `saveDB()`, re-renders page) | D11 (switch + packageId persisted + re-render) |
| OBS-002 | S1 | Instructor Nav | Attendance / Students / Demo / Insights pages were **unreachable** — clicking dashboard quick actions appeared to do nothing | `renderApp()` resets `currentPage` to the first nav item when the id is missing from `getNavItems()`; instructor nav only listed Dashboard/Classes/Active Class | FIXED — added the 4 pages as `hidden:true` nav entries so the reset guard passes while the visible nav is unchanged | C07, C08, C13, C14 (pages render), E02 (no page errors) |
| OBS-003 | S1 | AI Modals | Pre-Class AI Briefing (and consultation detail / legacy End-Class confirm) never displayed | `showModal(html)` accepted an argument but ignored it (only trapped focus); callers passed HTML expecting it to render | FIXED — `showModal` now renders non-overlay HTML inside a standard `.modal-overlay/.modal` wrapper | C12 (brief opens, shows class summary) |
| OBS-004 | S2 | Seed Data | Student schedules showed "0 upcoming" even though s1–s5 were enrolled in today/tomorrow classes | Students' `enrolledClasses` arrays were not updated to include new classes c27–c30, while those classes listed them in `enrolled` | FIXED — added c27/c28/c29/c30 to the relevant students' `enrolledClasses` | D08 (3 upcoming, Change/Cancel present) |
| OBS-005 | S2 | Demo Sessions | "No demo sessions available right now" — demo slots were seeded with **hardcoded July 2026 dates**, past relative to the app's current date | `demoSessions` seed used fixed `2026-07-xx` dates instead of relative `today`/`next` | FIXED — demo slots now use `today`/`next` like the c27–c30 classes | D12 (demo booked), C13 (demo page renders current slots) |
| OBS-006 | S3 | Student Schedule | Every class card rendered **"undefined"** as the class name | `renderStudentSchedule` printed `${cls.name}` but seed classes have no `name` property | FIXED — fallback name `Mat Pilates` / `Reformer Pilates` when `cls.name` is absent | D08 (no "undefined", "Mat Pilates" shown) |
| OBS-007 | S3 | Booking UI | Package-limit banner and disabled "Limit" buttons never appeared (`pkg.totalClasses` was always `undefined`) | `renderStudentBook`/`filterStudentClasses` read `pkg.totalClasses`; packages define `classes` | FIXED — use `pkg.classes` | D07 (8/month guard still blocks booking) |
| OBS-008 | S3 | Connectivity | App-level offline banner was dead code — never injected; diagnostics read an old storage key | `buildOfflineBannerHTML()` existed but was never inserted; `showConnectionDiagnostics` used stale `'zenpilates_data'` key | FIXED — banner injected at top of `#app-screen` in `init()`; diagnostics now use `DB_KEY` | E04 (offline event shows banner) |
| OBS-009 | S1 | Sessions | **Refreshing the page logged the user out** for all personas — session state was in-memory only | `currentPersona`/`currentInstructorId`/`currentStudentId`/`currentPage` were never persisted; no restore path in `init()` | FIXED — `saveSession()`/`restoreSession()` via `sessionStorage` (`zenpilates_session_v1`); saved on every `renderApp`, restored in `init()`, cleared in `logout()`; `init()` moved to end of script so restored routes use patched `renderPage` | J01 (admin), J02 (instructor), J03 (student), J04 (logout clears) |
| OBS-010 | S2 | Instructor Nav | Consultations and Enhanced Insights pages were **unreachable** — nav-guard reset them to the first nav item (same root cause class as OBS-002) | `instructor-consultations` / `instructor-enhanced-insights` renderers existed but ids were missing from `getNavItems()`, so `renderApp()` reset `currentPage` | FIXED — added both as `hidden:true` nav entries (visible nav unchanged) | H05 (page renders list), H07 (analytics page renders) |
| OBS-011 | S2 | Live Class | **Per-student observation notes + AI suggestions had no UI** in the redesigned live console (`ls-shell`) — instructors could not log observations, starving downstream AI features | `buildLiveCenterPanel`/`renderLiveNotes`/`selectActiveStudent` targeted the old `.live-center` layout; new console had no student-note surface | FIXED — added "Student Observations" panel to the `ls-right` column with student chips, note input + mic + send, tag bar, history and `#ai-suggestions-{sid}`; `selectActiveStudent` swaps panel in place; `renderLiveNotes` called after shell render | H09 (AI suggestion appears in panel) |
| OBS-012 | S3 | Branding | Logo not industry-standard — emoji 🧘 on login, plain text "P"/"Z" in headers, no SVG brand mark | Static HTML placeholders never swapped for a vector logo | FIXED — `BRAND_LOGO` SVG monogram (gradient tile + "P") injected into `.auth-logo`, `.auth-mobile-logo .abox`, header `#header-logo-icon` and mobile `.logo-mini` in `init()`/`updateBranding()` | G01 (SVG present on login + header) |
| OBS-013 | S3 | Guidance | Key action controls lacked tooltips: nav items, logout, "New Class", schedule Change/Cancel | No `title` attributes on these controls | FIXED — added `title` to nav items, both logout buttons, "New Class", Change, Cancel, package/attendance/snapshot buttons | G02 (all nav + key actions have titles) |
| OBS-014 | S4 | Login | Username placeholder was cleared to empty when switching to the Student tab | `setAuthRole('student')` set `placeholder=''` | FIXED — student role now shows "Select your student profile below" | G03 (placeholder non-empty for all roles) |
| OBS-015 | S3 | Voice Notes | `startVoiceNote` returned **silently** (no feedback) when the note area was missing | `if (!input) return;` before any toast | FIXED — guidance toast "Note area not ready yet…" when the input element is absent | H10 (toast fires when UI unavailable) |

## Notes / Non-issues
- Student schedule intentionally uses date tiles (weekday + day number) rather than "Today/Tomorrow" labels; D08 assertion adjusted accordingly.
- `DB_KEY` bumped `zenpilates_data_v2` → `zenpilates_data_v3` so returning visitors receive the corrected seed.
- Post-class summary modal and live-session "End & Save" (OBS on prior cycle) continue to pass (C03/C04).
- Session persistence is intentionally **per-tab** (`sessionStorage`), not permanent login; closing the tab ends the session (J04).
- Full UX audit with 48 findings (F-01…F-48) is documented in `UX_AUDIT.md`; the three P0 items (session persistence OBS-009, brand logo OBS-012, per-student live notes OBS-011) are now fixed. Remaining audit items (contrast, ARIA, type scale, etc.) are tracked as recommendations, not release blockers.
