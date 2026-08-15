# CBC Worship Portal — Architecture Review

Findings below are grounded in the actual source: `CBC Worship portal - ARCHITECTURE.md`, `claude-code-task-brief.md`, `docs/CHANGE_LIST.md`, the frontend in `src/`, and — as of this revision — the real backend at `apps-script/Code.gs`. The first pass of this review only had the architecture doc's description of the backend to go on; this pass reads the actual `Code.gs` line-by-line for the items that mattered most, which changed two findings in §1 from "worth checking" to "confirmed."

---

## 1. Data flow into storage — validation & auth gaps (confirmed against `apps-script/Code.gs`)

You have `apps-script/Code.gs` inside the project folder (`apps-script/Code.gs`, plus `.backup`/`.backup2.gs`/`.backup3` copies) — I hadn't seen it in the first pass and had flagged several things as "needs checking against the live backend." I read it directly this time. Two of those are confirmed real bugs, not hypotheticals, and one is worse than it looked because the anonymity flag is actually discarded in storage, not just under-protected in one response.

There's no traditional server here: the entire backend is `doGet`/`doPost` → `route(action, p)`, dispatching 60+ named actions against Google Sheets. Every write is meant to pass through `requireAuth(p, requiredRole)` (Code.gs:192), which checks `sessionToken` against `Members`, verifies it isn't expired, and enforces `SUPER_ADMIN > ADMIN > MEMBER` via an explicit allow-map — that part is implemented cleanly, for every handler that actually calls it. The Apps Script URL itself is not a secret (called from the browser on every page load, visible in any Network tab, stored in `localStorage`) — obfuscating the built JS doesn't hide network calls — so any handler that skips `requireAuth()` is effectively public.

### Confirmed: anonymous prayer requests aren't actually anonymous to the API

`getPrayerRequests(p)` (Code.gs:1211) has no `requireAuth()` call at all, and its anonymity handling only *adds* a display name — it never removes the original field:

```js
requests.forEach(function(r) {
  if (!r.isAnonymous) {
    var poster = members.find(...)
    r.posterName = poster ? poster.name : 'A member'
  }
})
return ok(requests)
```

`r` is the raw sheet row, and `postedBy` (the memberId) is present on every row regardless. For named posts the code adds `posterName` alongside it; for anonymous posts it just skips adding `posterName` — `postedBy` is never deleted. Every prayer request, anonymous or not, ships the poster's memberId to anyone who calls this endpoint, logged in or not.

It's worse one step further in. `markAnswered(p)` (Code.gs:1268–1282), when a request is marked answered, archives it into `AnsweredPrayers` with `postedBy: req.postedBy` — and never copies `isAnonymous` at all:

```js
appendRow(getSheet('AnsweredPrayers'), {
  id: genId(), originalRequestId: p.id, title: req.title, detail: req.detail,
  postedBy: req.postedBy, answeredAt: now, testimony: p.testimony
});
```

So the moment a prayer is marked answered, its anonymity is permanently discarded in storage — there's no field left for anything downstream to honor. `getYearEndSummary` (Code.gs:1309, also no-auth) reads straight from `AnsweredPrayers` and will show `postedBy` for every answered prayer, including ones originally posted anonymously, in what your own docs describe as a "shareable retrospective view."

**Fix, in order:**
1. `getPrayerRequests` — delete `postedBy` from the response for rows where `isAnonymous` is true (cleanest: never send raw `postedBy` to the client at all; send server-computed `posterName` only, for both anonymous and named posts).
2. `markAnswered` — carry `isAnonymous` into the `AnsweredPrayers` row, and write `postedBy` as empty when the original was anonymous. Without this, fix #1 doesn't survive archiving.
3. Add `requireAuth(p, 'MEMBER')` to both `getPrayerRequests` and `getYearEndSummary` — right now both are callable with zero login.

### Confirmed: `getSettings` leaks exactly what the developer explicitly protects fifteen lines below it

`getSettings(p)` (Code.gs:2568) has no auth check, and when called without a `key` parameter returns **every** row in the `Settings` sheet unfiltered — including `firebaseConfig`, `zoomPasscode`, and `confirmKeyPhrase`.

Compare it to `getAllSettings(p)` (Code.gs:2577), which *is* gated to `SUPER_ADMIN` and explicitly redacts one field before returning:

```js
rows = rows.map(function(row) {
  if (row.key === 'firebaseConfig') {
    return { key: row.key, value: '[protected — edit via Settings UI]' }
  }
  return row
})
```

The redaction proves the developer considers `firebaseConfig` sensitive enough to hide — it's just only hidden in the authenticated path. The unauthenticated `getSettings` returns it in full, plus `zoomPasscode` (lets anyone join your private prayer-meeting Zoom uninvited) and `confirmKeyPhrase` (the onboarding commitment phrase members are meant to type as a deliberate ritual step — exposed, it stops meaning anything).

**Fix:** either add `requireAuth(p, 'MEMBER')` to `getSettings`, or — better, since some settings genuinely need to be readable pre-login (e.g. `teamName`/logo for the login screen) — change it to return an explicit allowlist of public keys (`teamName`, `vmVision`, `vmMission`, `vmValues`, `teamLogo`) instead of every row in the sheet.

### Confirmed as suspected: `changePassword` has no session check

Code.gs:446 — the entire function is a `memberId` lookup, a `currentHash` string comparison, and a write. No `requireAuth()` call anywhere in it. Add `requireAuth(p, 'MEMBER')` alongside the existing current-password check — the cheapest fix on this list.

### Everything else in the "no-auth reads" list is as-designed, not a bug

`getAssets`, `getAnnouncements`, `getEvents`, `getQuizQuestions`, `getOnboardingChecklist` genuinely have no auth check and return full sheet contents, matching what your Actions Reference already documents — confirmed directly, e.g. `getAssets(p)` (Code.gs:552) is a one-line `return ok(sheetToObjects(getSheet('Assets')))`. For a 100-person internal team, asset inventory and announcement text are low-sensitivity. I'd leave these as hygiene cleanup, not urgent — same call as before, just now confirmed rather than inferred.

### Route-level role gating is UI-only (unchanged from initial read)

`RequireAuth`/`RequireOnboarded` in `src/App.jsx` check only "is someone logged in" — there's no `RequireRole` wrapper. `/settings` has no route-level admin check; `SettingsPage.jsx` gates its own tabs internally via `isAdmin = ['ADMIN','SUPER_ADMIN'].includes(member.role)`. This isn't a data leak on its own — every real mutation there is still role-gated server-side — but it's weaker defense-in-depth than a route-level guard, and it's already an open item in your own `claude-code-task-brief.md` (Task 1): *"role enforcement should be verified server-side (not just frontend UI hiding)... close any remaining gaps."* Worth doing before the department-admin rollout (§4) adds more roles on top of this.

**Updated priority order:** (1) fix `getPrayerRequests` to strip `postedBy` for anonymous posts — confirmed bug, directly undermines the app's core trust feature; (2) fix `markAnswered` to preserve `isAnonymous` and blank `postedBy` in the archive, or fix #1 doesn't survive into the Year End view; (3) add `requireAuth` to `changePassword` — confirmed, one line; (4) fix `getSettings` to stop leaking `firebaseConfig`/`zoomPasscode`/`confirmKeyPhrase` — confirmed, one of the two most serious findings here; (5) gate `getMemberAttendance`/`getYearEndSummary`. The remaining no-auth reads (`getAssets`, `getAnnouncements`, `getEvents`, `getQuizQuestions`, `getOnboardingChecklist`) can stay as low-priority hygiene.

---

## 2. God Nodes — refactor plan

The graph's "God Nodes" ranking (`useApp()` 41 edges, `useAuth()` 39 edges, `apiFetch()` 35 edges) measures *how many other files call something*, not how large or tangled that something is. `useApp()` and `useAuth()` are each about 15 lines — thin context hooks that most pages import, which is the React context pattern working exactly as intended. Splitting them would add provider nesting without shrinking any real logic, so I'd leave them alone.

The graph does point at the real bloat indirectly, though: both hooks' community ("AppContext.jsx", cohesion score 0.10) groups in the two files that are actually oversized by responsibility count and line count — and the report's own suggested question asks exactly this: *"Should `AppContext.jsx` be split into smaller, more focused modules?"* The honest answer is that the community label is misleading; the real offenders are two page files:

| File | Size | State hooks | Distinct concerns |
|---|---|---|---|
| `SettingsPage.jsx` | 37.8 KB / ~3,087 words | 24 `useState` calls, ~30 handlers | Members, VM content, quiz questions, onboarding checklist, branding/integrations, data export/import/clear — six unrelated admin domains in one file |
| `AssetsPage.jsx` | 34.9 KB / ~2,852 words | 18 `useState` calls | Asset inventory CRUD + maintenance-log CRUD + duplicated photo-upload logic, two domains bolted together |

### Plan A — `SettingsPage.jsx`

1. Name the six concerns currently living in one file: member management, V&M content editor, quiz editor, onboarding checklist editor, branding/integrations (logo, WhatsApp link, Firebase config), and data admin (export/import/clear-all).
2. Extract each into its own file under a new `src/pages/settings/` folder — `MembersTab.jsx`, `VisionMissionTab.jsx`, `QuizTab.jsx`, `OnboardingTab.jsx`, `BrandingTab.jsx`, `DataAdminTab.jsx` — each owning only its own state and handlers (e.g. `MembersTab.jsx` owns `members`, `memberForm`, `handleAddMember`, `handleRemoveMember`, `handleRoleChange`, nothing else).
3. Keep `SettingsPage.jsx` as a thin shell: tab strip + `activeTab` state + lazy-loading the active tab, mirroring the `React.lazy()` pattern `App.jsx` already uses for top-level routes. A member who only opens the Members tab never downloads the Data Admin bundle.
4. Each tab calls `useAuth()`/`useApp()` directly rather than receiving `member`/`toast` as props — consistent with how the rest of the codebase already does it.
5. Move tab-specific constants (`ROLES`, confirm-clear counters, etc.) into their respective files.
6. Migrate one tab at a time, smallest blast radius first (Data Admin, SUPER_ADMIN-only, rarely used) to largest last (Members, highest traffic) — ship and verify each independently, matching the "stop for review after each" approach your task brief already asks for.
7. Payoff: once split, the SUPER_ADMIN-only tabs become the natural home for the new `MAIN_ADMIN` visibility rules in your pending notification-routing work (§4), without touching the Members tab that department admins will also need.

### Plan B — `AssetsPage.jsx`

1. Split along the boundary that already exists in your data model: Assets (inventory: search/filter/add/edit/detail) vs. MaintenanceLog (raise/view/complete). They're two different Sheets and two different action groups in your Actions Reference — the code should mirror that.
2. Extract `src/pages/assets/AssetList.jsx` (search, filters, grid) and `src/pages/assets/AssetDetail.jsx` (detail drawer + its maintenance sub-list).
3. Extract `AssetForm.jsx` and `MaintenanceForm.jsx` as standalone modal components, each owning its own form state instead of sharing the parent's.
4. Pull the shared photo pipeline (`compressImage` → base64 → R2 upload round-trip) into one reusable `src/hooks/usePhotoUpload.js` — it's currently near-duplicated between `handlePhotoCapture` and `handleMaintPhoto`.
5. Leave `AssetsPage.jsx` as the route container: `load()` + top-level lists + composing `AssetList` and the two modals.
6. Payoff: since `ASSETS_ADMIN` is a new department role in your pending brief, this split makes "who can open this form" a one-line role check per component instead of a search through one 900-line file.

---

## 3. Dead code candidates

The graph flags 162 "isolated" nodes, but almost all of them are single-occurrence leaf values that are artifacts of the extraction method — individual `package.json` keys, one-off local constants — not real dead code. I checked actual import chains and usage in the source instead, and found four genuine, verifiable candidates:

- **`src/utils/badges.js`** — the whole file (`BADGE_DEFINITIONS`, `checkAndAwardBadges()`) has zero import sites anywhere in `src/`. Badges are actually awarded server-side (`completeOnboarding` and other `Code.gs` handlers write to the `Badges` sheet directly, per your Actions Reference). This client-side copy looks like an earlier approach that got superseded but never deleted. Worth a five-minute look before deleting, in case reviving its intent (see the "encourager" badge idea in §5) is more valuable than removing it.
- **`apiGet()`** in `src/utils/api.js` — zero call sites in `src/`, and your own architecture doc already labels it *"legacy GET-based helper... not used by main page flows."* Safe to delete, along with the `doGet` entry point on the backend if nothing external depends on it.
- **`public/service-worker.js`** — a hand-written service worker (`PRECACHE_ASSETS`, `syncNotifications()`) that nothing in the app registers. `vite-plugin-pwa` is configured with `strategies: 'generateSW'`, which auto-generates and self-registers its own service worker at build time (`dist/sw.js` + `dist/registerSW.js`) — that's what's actually running in production. Before deleting, check whether `syncNotifications()` represents an offline background-sync feature you still want; if so it needs porting into the Workbox config rather than just removed, since it's inert either way right now.
- **`dev-dist/` folder** — `vite-plugin-pwa`'s local dev-mode build output. It isn't in `.gitignore` (which only lists `node_modules`, `dist`, `.env*`), so it's likely been committed by accident. Add `dev-dist` to `.gitignore` and remove it — it regenerates on every `npm run dev`.

One more, backend-side, now confirmed directly in `apps-script/Code.gs`: `saveImageToDrive()` (Code.gs:2649) is defined but never called anywhere else in the file — matching your docs' *"DEPRECATED... retained for rollback"* note. Genuinely dead. Once the R2 photo path has been stable for a while in production, that's a safe removal — say the word if you want me to make that edit along with the security fixes above.

No page or route component is orphaned — `App.jsx` imports and routes every file in `src/pages/`, confirmed against the import graph, so there's no "unused page" cleanup opportunity beyond the four items above.

---

## 4. Where "Department-scoped admin roles" plugs in

Mapping your own `claude-code-task-brief.md` (Tasks 1–2) onto the current architecture, using the patterns already in place rather than inventing new ones:

**Schema.** `member.role` today is a flat `MEMBER`/`ADMIN`/`SUPER_ADMIN` string, read directly off the `Members` sheet. Your brief wants a person to hold `MEMBER` plus zero-or-more department grants — a genuine schema shift. The lowest-disruption approach that still fits `sheetToObjects()`/`updateRow()` (which treat every column as a flat string): keep `role` for the singular tier (`MEMBER`/`ADMIN`→ migrated /`MAIN_ADMIN`/`SUPER_ADMIN`), and add one new column, e.g. `departments` (comma-separated: `"ASSETS,PRAYER"`), for department grants. No sheet-structure rewrite needed.

**Backend gate.** `requireAuth(p, requiredRole)` already does hierarchy comparison. Add a parallel `requireDepartmentAdmin(p, department)` that reads the new `departments` column, used only on the handlers your brief names: `createAsset`/`updateAsset`/`checkoutAsset` etc. for `ASSETS_ADMIN`; `updateSuggestionStatus` for `AUDITIONS_ADMIN`; `setPrayerPartners`/`updateRosterSlot` for `PRAYER_ADMIN`. `MAIN_ADMIN` and `SUPER_ADMIN` should pass every department check automatically, same as they already sit above `ADMIN` in the existing hierarchy check.

**Frontend nav/FAB.** `src/components/Layout.jsx` already has exactly the extension point your brief names: the `roles: [...]` arrays on `navItems` and `FAB_ITEMS` (lines 15–42). Given the brief's "no new nav items for base members" constraint, department scoping mostly won't touch these arrays — it'll touch the per-page `isAdmin` checks instead. Today `AssetsPage.jsx`, `NoticeBoardPage.jsx`, `AuditionsPage.jsx`, `RosterPage.jsx` each do something like `isAdmin = ['ADMIN','SUPER_ADMIN'].includes(member.role)` to show admin controls. Each becomes a department-specific check, e.g. `isAssetsAdmin = member.role === 'SUPER_ADMIN' || member.role === 'MAIN_ADMIN' || member.departments?.includes('ASSETS')`.

**Notification routing.** `NotificationContext.jsx`'s existing model (30s poll, per-sheet cache-invalidation map, toast on new notification ID) doesn't need to change at all — it already renders whatever the backend decided to write to a member's `Notifications` row. The "right person gets the right notification" principle from Task 2 is entirely a backend dispatch change: the `addNotification()` call sites in `Code.gs` that currently fan out to "all admins" need to target the relevant department instead. The one plausible new frontend surface is the "pending items assigned to me" badge your brief mentions for department admins — that slots in next to the existing unread-count bell badge in `Layout.jsx` as a second small counter, not a new provider.

**Escalation (48h SLA).** Pure backend addition — a new time-driven trigger following the exact pattern `sendMaintenanceReminders()`/`sendMondayPrayerReminder()` already use (documented in `PART 4` of your architecture doc). No graph nodes or frontend changes needed.

**Suggested build order**, matching the dependency your brief already states (Task 1 before Task 2):
1. Add the `departments` column + `requireDepartmentAdmin()`; migrate existing `ADMIN` rows, flagging ambiguous cases rather than guessing (per your own instruction).
2. Update `Layout.jsx` role arrays and each page's `isXAdmin` checks.
3. Switch the "all admins" fan-out call sites in `Code.gs` to department-scoped `addNotification()` calls.
4. Add the 48h escalation trigger + Overseer weekly digest.
5. Add the "pending items assigned to me" badge last — it's the only net-new UI surface, and the brief explicitly deprioritizes touching UI.

---

## 5. Enhancement suggestions

Scoped for what this actually is: a private, ~100-user PWA for one team, meant to build trust and accountability — not a product to scale or harden against the general internet. Recommendations below are proportionate to that, not a rewrite.

**Security, in order of how directly it touches the app's purpose.** The prayer-request anonymity bug (§1) is confirmed, not hypothetical — I'd treat it as urgent rather than "nice to have." It's the one technical gap that directly undermines the emotional safety the Prayer Board exists to provide, and it's a small, contained fix (two functions in `Code.gs`). Passwords are hashed with plain client-side SHA-256 and no salt (`sha256.js`); if the `Members` sheet were ever exported or shared, `passwordHash` values would be fast to brute-force offline. Moving to a salted hash — ideally computed server-side, since Apps Script's `Utilities` class supports HMAC — closes that without changing the login UX. Sessions live for 7 days as a bare token string in the sheet with no revoke-all; a simple "sign out of all devices" control on the Profile page (regenerate `sessionToken`, which login already does implicitly) would give people a real lever if they lose a phone.

**Google Sheets as the database has a ceiling worth planning around, even if you're nowhere near it today.** Lookups like `findRowById()` scan column A linearly, and sheets like `Notifications`, `MaintenanceLog`, and `Attendance` only grow. `NotificationsPage.jsx` already only displays the last 30 days — a matching periodic archive (move anything older to a second sheet) would keep the live sheet small and Apps Script executions fast as the team's history accumulates, without changing anything the UI shows.

**Feature ideas that reinforce the stated mission, cheap to build on existing patterns:**
- A "praise report" quick-post — your own `docs/CHANGE_LIST.md` already suggests this; it's a small variant of the existing `Announcements` or `PrayerRequests` flow, not new infrastructure.
- A one-tap "thinking of you" encouragement note on member profiles — this is effectively what the currently-dead `encourager` badge in `utils/badges.js` was designed to track (§3). Reviving the intent as a small real feature, rather than deleting the file outright, might be the better call.
- A prayer-partner check-in nudge — `PrayerPartners` pairing and the `sendMondayPrayerReminder()` trigger pattern already exist; a weekly "have you checked in with your prayer partner?" reminder reuses that exact mechanism.
- Per-member notification preferences (email on/off, push on/off) on the Profile page. Right now every email fires unconditionally; as the Task 2 digest/escalation changes add notification volume for department admins and the Overseer, some of the 100 members will want a lighter footprint.

**Process.** Your own task brief already flags that Apps Script has no native rollback and asks to confirm git is initialized before touching anything — worth double-checking that's actually in place now, since every change above (auth fixes, department roles) ships safer with a diffable history and the ability to redeploy a prior Apps Script version if something breaks.

Deliberately not suggesting: a "real" database migration, rate limiting, CI/CD, or any infrastructure beyond what's here — at 100 trusted users, none of that is proportionate, and it would work against the "dead simple for regular members" priority your own brief states as the top constraint.
