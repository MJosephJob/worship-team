# CBC Worship Portal — Task Brief for Claude Code

## Project context

This is `CBC Thane Worship Portal`, a production PWA for a church worship team (48+ members), currently live at https://cbc-worship-portal.pages.dev. Stack: React 18 + Vite 5 + Tailwind (frontend), Google Apps Script `apps-script/Code.gs` as the backend, Google Sheets as the database, Cloudflare Pages hosting, Firebase FCM v1 for push. This folder is the confirmed current/live source — check `CBC Worship portal - ARCHITECTURE.md` in this folder for the up-to-date architecture and function reference before starting (it's more current than any product doc from earlier in the project's history).

**Before making any changes:** check whether this project is under git. If it isn't, initialize a repo and commit the current state as a baseline before touching anything — this is a live production app for a real church and Apps Script has no native rollback, so we need a diffable history. Also note: there is a second, older/stale copy of this project elsewhere on this machine that does NOT have current features (e.g. it's missing the mobile FAB menu in `Layout.jsx`) — do not work from that copy. Confirm you are editing files in *this* folder only.

**Top-level priority: this must stay dead simple for regular members.** The team is optimizing for 95% adoption. Every change below is additive on the admin/backend side — a regular member's day-to-day flow (view notices, RSVP, acknowledge, pray, submit a request/suggestion) must look and feel exactly as it does today. No new permission prompts, no new nav items, no added friction for the base member experience. Preserve the existing optimistic-UI/toast pattern, and preserve the existing mobile FAB (Assets/Events/Birthdays/Auditions/Settings quick-menu in `Layout.jsx`) exactly as-is unless a task below specifically requires touching it.

Work through the tasks in order (Task 1 is a prerequisite for Task 2), and stop for review after each rather than doing everything in one pass. Propose a short plan first (files touched, Sheets schema impact, migration for existing data) before writing code.

**Current state check:** role model today is a flat `MEMBER` / `ADMIN` / `SUPER_ADMIN` enum (confirmed in `Members` sheet schema and `AuthContext.jsx` — no department-scoped roles exist yet). Nothing from this brief has been implemented yet in this folder as of this writing.

---

## Task 1 — Department-scoped admin roles (foundation)

**Everyone is a member first.** There's no isolation between roles — every single person, including every admin, gets the full base member experience: notices, prayer board, event/attendance reminders, birthdays, and the ability to raise a request or suggestion on anything in the app (asset issue, audition suggestion, prayer request, etc.) from anywhere. Admin status only adds the ability to *action* things in a specific department; it never removes anything a member already had.

**New role model:**
- **SUPER_ADMIN** (Joey / developer) — unchanged, unrestricted, full technical access (Firebase config, backups, override on any department action).
- **MAIN_ADMIN — "Overseer"** — new role, one tier below Super Admin, not tied to any single department. Does **not** get routine per-item notifications. Instead receives: (a) **one weekly digest** rolling up pending + completed items across all four departments, and (b) **real-time escalation alerts** when any item goes unactioned past 48 hours (see Task 2).
- **Department admins** — `WORSHIP_ADMIN`, `ASSETS_ADMIN`, `AUDITIONS_ADMIN`, `PRAYER_ADMIN`. Each is a normal member plus action rights scoped to their own department only. E.g. the Assets admin can action maintenance requests and mark them complete, but has no special rights over notices, roster, or auditions unless separately granted.
- **MEMBER** — base role, held by literally everyone (including all admins).

**Schema:** extend `Members` sheet with a role/department model that supports a person holding `MEMBER` plus zero or more department-admin grants (don't force a single-role enum — someone could plausibly admin more than one department). Migrate existing `ADMIN` members to the closest department(s) based on what they actually use today; flag ambiguous cases for manual review rather than guessing. `SUPER_ADMIN` and the new `MAIN_ADMIN` are singular/rare — confirm actual assignment with Joey before migrating.

**Open question to resolve during planning, not by guessing:** the current sheet schema doesn't have an obvious "Worship" action queue the way Assets (MaintenanceLog), Auditions (AuditionSuggestions), and Prayer (PrayerRequests/FacilitatorRoster) do. Clarify with Joey what actionable items actually belong to the Worship department before wiring notifications for it.

**Also fix while in this code:** role enforcement should be verified server-side (not just frontend UI hiding) for every admin-gated handler in Code.gs's router — check current state first since this may already be partially handled, and close any remaining gaps.

**Relevant files:** `apps-script/Code.gs` (router, all admin-gated handlers, `Members` sheet), `src/contexts/AuthContext.jsx`, `src/pages/AssetsPage.jsx`, `src/pages/NoticeBoardPage.jsx`, `src/pages/RosterPage.jsx`, `src/pages/AuditionsPage.jsx`, `src/pages/EventsPage.jsx`, `src/components/Layout.jsx` (nav + FAB role filtering — extend the existing `roles: [...]` arrays pattern already used for `navItems`/`FAB_ITEMS` rather than inventing a new mechanism).

---

## Task 2 — Notification routing overhaul (depends on Task 1)

**Principle: the right person gets the right notification, nobody gets everything, everybody gets the basics.**

| Who | Gets |
|---|---|
| Every member (incl. admins) | All existing broadcast content: notices, prayer board activity, event/attendance reminders, birthdays — unchanged from today |
| Every member (incl. admins) | An immediate confirmation notification/toast for every action *they personally* take (submit a request, RSVP, acknowledge, pray for a request, etc.) |
| Requester (any member) | A notification specifically when *their own* submitted request/suggestion is actioned/resolved by the relevant department admin — not before |
| Department admin (Assets/Auditions/Prayer/Worship) | Real-time notification when a new actionable item lands in their department (e.g. Assets admin notified on new maintenance issue). They action it, then the system auto-notifies the original requester it's done. |
| Main Admin / Overseer | One weekly digest across all departments, **plus** real-time escalation if any item sits unactioned >48 hours |
| Super Admin | No routine flood — full visibility available on demand via dashboard |

**This replaces any current "all admins" fan-out** for maintenance-log, prayer-request, and talent-suggestion emails/notifications — route each to the single relevant department admin instead of every admin.

**Escalation logic (new):** add a 48-hour SLA check. When a department-actionable item (maintenance log not completed, audition suggestion still pending, etc.) has been outstanding longer than 48 hours since creation/assignment, fire an escalation (email + in-app) to the Overseer — in addition to, not instead of, the standing notification already sent to the department admin. Implement as a new scheduled trigger (hourly or daily) that scans each relevant sheet's pending items against their timestamp + status columns. Make the 48-hour threshold configurable in the `Settings` sheet rather than hardcoded.

**Recurring scheduled reminders**: where these currently email multiple items separately to admins (e.g. daily overdue-maintenance alerts), consolidate into a single digest-style email/in-app notification per run rather than one per item. Broadcast-to-all-members triggers (general prayer reminder, birthday) are fine as-is and don't need digesting.

**Relevant files:** `apps-script/Code.gs` (notification dispatch, trigger functions, email-sending loops), `Settings` sheet, `src/utils/notifications.js`, notification context. On the admin UI side, consider a lightweight "pending items assigned to me" count/badge for department admins and the Overseer's weekly-digest view — but do not add anything to the base member UI, and do not alter the existing FAB or bottom nav.

---

## General constraints

- This serves a live production team — no breaking changes without a migration path for existing Sheet data.
- Follow existing conventions already in this codebase (check `CBC Worship portal - ARCHITECTURE.md` for the current patterns before assuming anything from an older doc).
- Regular member UI/UX must not change. This is the top constraint across all tasks, and includes not touching the existing mobile FAB menu.
- After each task, remind me of the manual deploy steps needed (Apps Script "New version" deploy is required — saving alone doesn't update the live API; frontend needs a rebuild + Cloudflare Pages deploy).
