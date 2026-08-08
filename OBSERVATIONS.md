# QA Observations Log

Cycle: Go-Live QA (Test Plan: `TEST_PLAN.md`)
Target: `reference/PilatesStudioApp.html` (local) → GitHub Pages (published)
Status legend: **OPEN** = found, not fixed · **FIXED** = fix applied · **VERIFIED** = regression-tested by automated suite
Severity: **S1** critical (breaks a core flow) · **S2** major (wrong/blocked behavior) · **S3** minor (degraded UX/UI) · **S4** cosmetic

## Summary

- Automated suite: **53/53 PASS** (final, after fixes) — see `C:\Users\Welcome\AppData\Local\Temp\opencode\e2e-test\suite.js`.
- Defects found this cycle: **8** (2 S1, 2 S2, 3 S3, 1 S3/S4). All **FIXED** and **VERIFIED**.
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

## Notes / Non-issues
- Student schedule intentionally uses date tiles (weekday + day number) rather than "Today/Tomorrow" labels; D08 assertion adjusted accordingly.
- `DB_KEY` bumped `zenpilates_data_v2` → `zenpilates_data_v3` so returning visitors receive the corrected seed.
- Post-class summary modal and live-session "End & Save" (OBS on prior cycle) continue to pass (C03/C04).
