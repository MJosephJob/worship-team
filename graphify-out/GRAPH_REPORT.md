# Graph Report - CBC-Worship-Portal  (2026-07-21)

## Corpus Check
- 63 files · ~44,714 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 352 nodes · 665 edges · 25 communities (23 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- AppContext.jsx
- useApp
- apiFetch
- App.jsx
- devDependencies
- PART 2 — Request Flows
- package.json
- manifest.json
- EmailJS Setup Guide
- main.jsx
- Member Onboarding Guide
- Cloudflare Pages Deployment Guide
- Change List — 20 Things You Can Ask Claude to Change
- Firebase Push Notifications Setup Guide
- Dashboard.jsx
- Apps Script Setup Guide
- JavaScript Obfuscation Guide
- CBC Worship Portal — Task Brief for Claude Code
- service-worker.js
- firebase-messaging-sw.js

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 41 edges
2. `useAuth()` - 39 edges
3. `apiFetch()` - 35 edges
4. `GoldSpinner()` - 15 edges
5. `PageHeader()` - 13 edges
6. `Modal()` - 12 edges
7. `PART 2 — Request Flows` - 11 edges
8. `EmptyState()` - 10 edges
9. `Cloudflare Pages Deployment Guide` - 10 edges
10. `invalidateCache()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `obfuscateDir()` --references--> `javascript-obfuscator`  [EXTRACTED]
  build-tools/obfuscate.js → package.json
- `RequireAuth()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.jsx → src/contexts/AuthContext.jsx
- `RequireOnboarded()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.jsx → src/contexts/AuthContext.jsx
- `App()` --calls--> `useApp()`  [EXTRACTED]
  src/App.jsx → src/contexts/AppContext.jsx
- `App()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.jsx → src/contexts/AuthContext.jsx

## Import Cycles
- None detected.

## Communities (25 total, 2 thin omitted)

### Community 0 - "AppContext.jsx"
Cohesion: 0.10
Nodes (27): ConfirmDialog(), EmptyState(), GoldSpinner(), Modal(), PageHeader(), RichTextEditor(), AppContext, initialState (+19 more)

### Community 1 - "useApp"
Cohesion: 0.08
Nodes (38): RequireAuth(), RequireOnboarded(), BOTTOM_NAV, FAB_ITEMS, Layout(), navItems, useApp(), useAuth() (+30 more)

### Community 2 - "apiFetch"
Cohesion: 0.13
Nodes (24): InstrumentPicker(), INSTRUMENTS, AuthContext, AuthProvider(), STEPS, apiFetch(), CACHE_TTLS, CACHEABLE (+16 more)

### Community 3 - "App.jsx"
Cohesion: 0.09
Nodes (22): AssetsPage, AuditionsPage, BirthdayPage, Dashboard, EventsPage, NotFoundPage, NoticeBoardPage, NotificationsPage (+14 more)

### Community 4 - "devDependencies"
Cohesion: 0.09
Nodes (22): autoprefixer, DIST_DIR, obfuscateDir(), OBFUSCATOR_OPTIONS, javascript-obfuscator, devDependencies, autoprefixer, javascript-obfuscator (+14 more)

### Community 5 - "PART 2 — Request Flows"
Cohesion: 0.09
Nodes (22): 1a. Frontend Pages (`src/pages/`), 1b. Frontend Components (`src/components/`), 1c. Google Sheets (Database Tables), 1d. External Services, Backend — Code.gs Helper Functions, CBC Worship Portal — Architecture & Function Reference, Flow 1 — Member logs in, Flow 2 — Member views Birthday Wall (+14 more)

### Community 6 - "package.json"
Cohesion: 0.09
Nodes (21): firebase, lucide-react, dependencies, firebase, lucide-react, react, react-dom, react-router-dom (+13 more)

### Community 7 - "manifest.json"
Cohesion: 0.13
Nodes (14): background_color, categories, description, display, icons, name, orientation, prefer_related_applications (+6 more)

### Community 8 - "EmailJS Setup Guide"
Cohesion: 0.14
Nodes (13): EmailJS Setup Guide, Step 1 — Create an EmailJS Account, Step 2 — Add an Email Service, Step 3 — Create Email Templates, Step 4 — Get Your Keys, Step 5 — Paste into the App, Template 1 — New Announcement, Template 2 — Password Reset (+5 more)

### Community 9 - "main.jsx"
Cohesion: 0.18
Nodes (6): App(), ErrorBoundary, AppProvider(), appReducer(), ThemeContext, ThemeProvider()

### Community 10 - "Member Onboarding Guide"
Cohesion: 0.17
Nodes (11): After onboarding, How to add a new member, How to track onboarding progress, Member Onboarding Guide, Step 1 — Welcome screen, Step 2 — Vision & Mission Reader, Step 3 — Quiz, Step 4 — Typed Confirmation (+3 more)

### Community 11 - "Cloudflare Pages Deployment Guide"
Cohesion: 0.18
Nodes (10): Cloudflare Pages Deployment Guide, Free Tier Limits, Prerequisites, Redeployment, Sharing with the Team, Step 1 — Build the App, Step 2 — Create a Cloudflare Account, Step 3 — Deploy via Drag and Drop (+2 more)

### Community 12 - "Change List — 20 Things You Can Ask Claude to Change"
Cohesion: 0.22
Nodes (8): Admin Tools, Branding & Design, Change List — 20 Things You Can Ask Claude to Change, Data & Reporting, Features, How to ask Claude, Member Experience, Notifications & Reminders

### Community 13 - "Firebase Push Notifications Setup Guide"
Cohesion: 0.22
Nodes (8): Firebase Push Notifications Setup Guide, Free Tier Limits, Step 1 — Create a Firebase Project, Step 2 — Register Your Web App, Step 3 — Enable Cloud Messaging, Step 4 — Get Your Server Key, Step 5 — Paste Config into the App, Step 6 — Allow Notifications

### Community 14 - "Dashboard.jsx"
Cohesion: 0.31
Nodes (4): StatCard(), Dashboard(), getCached(), greeting()

### Community 15 - "Apps Script Setup Guide"
Cohesion: 0.25
Nodes (7): Apps Script Setup Guide, Important Notes, Step 1 — Create the Google Spreadsheet, Step 2 — Open the Apps Script Editor, Step 3 — Paste the Code, Step 4 — Deploy as a Web App, Step 5 — Paste the URL into the App

### Community 16 - "JavaScript Obfuscation Guide"
Cohesion: 0.25
Nodes (7): Does obfuscation break the app?, How to run the obfuscated build, JavaScript Obfuscation Guide, Normal build vs secure build, Obfuscation settings used, What does it protect?, What is obfuscation?

### Community 17 - "CBC Worship Portal — Task Brief for Claude Code"
Cohesion: 0.33
Nodes (5): CBC Worship Portal — Task Brief for Claude Code, General constraints, Project context, Task 1 — Department-scoped admin roles (foundation), Task 2 — Notification routing overhaul (depends on Task 1)

## Knowledge Gaps
- **162 isolated node(s):** `DIST_DIR`, `OBFUSCATOR_OPTIONS`, `name`, `private`, `version` (+157 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useApp()` connect `useApp` to `AppContext.jsx`, `apiFetch`, `App.jsx`, `main.jsx`, `Dashboard.jsx`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useApp` to `AppContext.jsx`, `apiFetch`, `App.jsx`, `main.jsx`, `Dashboard.jsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `apiFetch` to `AppContext.jsx`, `useApp`, `Dashboard.jsx`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `DIST_DIR`, `OBFUSCATOR_OPTIONS`, `name` to the rest of the system?**
  _162 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AppContext.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10204081632653061 - nodes in this community are weakly interconnected._
- **Should `useApp` be split into smaller, more focused modules?**
  _Cohesion score 0.0824524312896406 - nodes in this community are weakly interconnected._
- **Should `apiFetch` be split into smaller, more focused modules?**
  _Cohesion score 0.13063063063063063 - nodes in this community are weakly interconnected._