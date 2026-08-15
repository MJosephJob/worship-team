# CBC Worship Portal — Architecture & Function Reference

---

## PART 1 — High-Level Architecture

### 1a. Frontend Pages (`src/pages/`)

| File | Description |
|---|---|
| `AssetsPage.jsx` | Equipment inventory and maintenance log manager; admins add/edit assets and log maintenance; photo upload; mark-complete flow; asset detail drawer with history |
| `AttendancePage.jsx` | Read-only attendance view for individual members showing their attendance percentage per event |
| `AuditionsPage.jsx` | Talent/audition suggestion board; members submit candidates; admins update status and post response |
| `BirthdayPage.jsx` | Birthday wall; shows today's birthdays; members post written wishes; second tab shows upcoming birthdays across all members |
| `Dashboard.jsx` | Authenticated landing page; shows VM status badge, prayer partner, latest notice, and (admin-only) stat cards, maintenance alerts, VM sign-off tracker, upcoming roster, pending auditions |
| `EventsPage.jsx` | Event creation and bulk attendance marking; admin cycles each member through Present → Informed Prior → Absent; saving triggers absence emails to all absent members |
| `LoginPage.jsx` | Email + password login; "Stay signed in" flag; password reset request and token confirmation |
| `NotFoundPage.jsx` | 404 page |
| `NotificationsPage.jsx` | In-app notification centre; shows last 30 days of notifications; mark individual or all read |
| `NoticeBoardPage.jsx` | Announcement board; admins create notices with urgency tags (Info/Important/Urgent/Meeting); members RSVP Yes/No with reason; acknowledge button; deep-link via `?id=` |
| `OnboardingFlow.jsx` | Multi-step wizard for new members: read V&M → pass quiz → sign commitment key phrase → complete checklist |
| `PrayerBoardPage.jsx` | Prayer request board; post anonymous or named requests; pray button; mark answered with testimony |
| `ProfilePage.jsx` | Member profile editor; photo upload; password change; badge display; attendance percentage; FCM push permission request; PWA install prompt |
| `RosterPage.jsx` | Weekly prayer facilitator roster; admins assign members per week; Zoom details displayed |
| `SettingsPage.jsx` | Admin: manage members (add/edit/remove), V&M content, quiz questions, onboarding checklist items, Zoom/WhatsApp settings, Firebase config, data export/import, clear-all-data |
| `SetupWizard.jsx` | First-run setup wizard; creates super-admin account and initial team configuration |
| `VMReaderPage.jsx` | Vision & Mission content reader; inline quiz; one-time sign-off that creates a VMReviews row |
| `YearEndPage.jsx` | Answered prayer year-end summary; filterable by year; shareable retrospective view |

### 1b. Frontend Components (`src/components/`)

| File | Description |
|---|---|
| `ConfirmDialog.jsx` | Reusable modal requiring typed confirmation for destructive actions |
| `EmptyState.jsx` | Reusable empty-state card with icon, title, and message |
| `ErrorBoundary.jsx` | React error boundary; catches render-time exceptions and shows fallback UI |
| `GoldSpinner.jsx` | Small animated loading spinner, used inline on buttons and page loaders |
| `InstallBanner.jsx` | PWA install prompt banner shown to eligible Android/desktop users |
| `InstrumentPicker.jsx` | Instrument dropdown with categorised list of roles (Vocals, Guitar, Keys, etc.) |
| `IOSInstallModal.jsx` | Modal with step-by-step iOS Safari PWA installation instructions |
| `Layout.jsx` | App shell; renders bottom nav (mobile) / sidebar (desktop); notification bell with unread badge; wraps all authenticated pages |
| `LoadingScreen.jsx` | Full-screen spinner shown during initial session validation |
| `Modal.jsx` | Reusable modal dialog with backdrop, close button, and optional max-width |
| `PageHeader.jsx` | Reusable page header with title, subtitle, and right-side action slot |
| `RichTextEditor.jsx` | Styled textarea used for V&M content editing in Settings |
| `StatCard.jsx` | Small dashboard stat card with icon, label, and numeric value |
| `ToastContainer.jsx` | Global toast notification renderer; subscribes to `AppContext` toast queue |

---

### 1c. Google Sheets (Database Tables)

| Sheet | What it stores |
|---|---|
| `Members` | All user accounts: id, name, email, passwordHash, phone, gender, instrument, birthday (DD/MM), bio, photoBase64, photoUrl, role (MEMBER/ADMIN/SUPER_ADMIN), joinDate, isOnboarded, onboardingStep, fcmToken, lastVMReview, vmReviewStreak, sessionToken, sessionExpiry, isActive |
| `Assets` | Equipment inventory: id, assetId (human-readable prefix-number), name, category, subcategory, description, serialNumber, condition, assignedTo (memberId), purchaseDate, estimatedValue, status (Active/Retired), photoBase64, photoUrl, notes, checkedOutBy, checkedOutAt, checkedOutPurpose, nextDueDate, lastMaintDate, updatedBy |
| `MaintenanceLog` | All maintenance records: id, assetId, serialNumber, date, maintenanceType, description, doneBy (name string), cost, nextDueDate, isCompleted, completedAt, raisedAt, completedBy (name string), submittedBy (name string), photoBase64, photoUrl |
| `Announcements` | Notice board posts: id, title, body, urgency, createdBy (name string), createdAt, readBy (comma-separated names), acknowledged (comma-separated names), rsvpYes (comma-separated names), rsvpNo (comma-separated names), rsvpReason (JSON map of name→reason) |
| `PrayerRequests` | Active prayer requests: id, title, detail, isAnonymous, postedBy (memberId), postedAt, status (Believing/Answered), prayingMembers (comma-separated memberIds), testimony, answeredAt |
| `AnsweredPrayers` | Archive of answered requests: id, originalRequestId, title, detail, postedBy, answeredAt, testimony |
| `Attendance` | Per-event per-member records: id, eventId, memberId, isPresent (boolean), status (Present/InformedPrior/Absent), markedAt |
| `Events` | Events: id, type (Sunday Worship/Rehearsal/etc.), date, notes, createdBy |
| `PrayerPartners` | Member pairing for prayer: id, member1Id, member2Id, season, pairedAt, isActive |
| `FacilitatorRoster` | Weekly prayer meeting facilitator schedule: id, memberId, weekDate, memberName, notes, reminderSent, assignedBy, notificationSent, reminderNotificationSent |
| `AuditionSuggestions` | Talent suggestions: id, suggestedName, skill, ministry, description, contact, submittedBy (name), submittedByMemberId, submittedAt, status (Following Up/etc.), adminResponse, respondedAt |
| `Notifications` | In-app notification records: id, memberId, type, title, body, isRead, createdAt, linkTo |
| `Badges` | Member achievement badges: id, memberId, badgeKey, badgeName, badgeEmoji, awardedAt, isCustom |
| `OnboardingProgress` | Per-member step completions: id, memberId, step, isCompleted, completedAt |
| `VMReviews` | Vision & Mission sign-off records: id, memberId, completedAt, score, month, year |
| `Settings` | Key-value config store: teamName, confirmKeyPhrase, quizQuestions (JSON), onboardingChecklist (JSON), firebaseConfig (JSON), zoomLink, zoomMeetingId, zoomPasscode, whatsappLink, birthdayTime, rosterReminderDays, driveFolderProfilePhotos, driveFolderAssetPhotos, driveFolderMaintenancePhotos, lastBackupDate, vmVision, vmMission, vmValues, cacheTs_* timestamps |
| `BirthdayWishes` | Birthday wall messages: id, birthdayMemberId, year, wisherId, wisherName, wish, createdAt |

---

### 1d. External Services

| Service | How it is used |
|---|---|
| **Google Apps Script** | Entire backend; deployed as Web App (Execute as Me, Anyone); `doGet`/`doPost` entry points; routes all 60+ actions; reads and writes all Sheets; calls all other external services |
| **Google Sheets** | Primary database; all persistent data stored as spreadsheet rows; accessed via `SpreadsheetApp` |
| **Gmail (GmailApp)** | All transactional email: welcome, password reset, maintenance raised/complete/reminder, attendance absence, roster assignment, birthday PDF, announcement blast, onboarding complete, audition suggestion |
| **Google Drive (DriveApp + DocumentApp)** | Birthday PDF generation: `DocumentApp.create()` → export as PDF blob → `GmailApp` attachment → `DriveApp.setTrashed()` for cleanup. Also hosts optional photo storage (deprecated path via `saveImageToDrive`) |
| **Cloudflare R2** | Primary photo storage for all images (profile, asset, maintenance); uploaded from Apps Script via `UrlFetchApp.fetch()` with AWS Signature V4 (`PUT`); five credentials stored in Script Properties; public URL returned and stored in the relevant sheet row |
| **Firebase Cloud Messaging** | Browser/device push notifications; FCM token stored per member in Members sheet; on every `addNotification()` call, Apps Script mints a JWT, exchanges for FCM OAuth2 token, and calls FCM v1 API for each stored device token |

---

## PART 2 — Request Flows

### Flow 1 — Member logs in

```
Frontend: LoginPage.jsx → handleLogin()
  → login() [AuthContext]
    → doLogin() [utils/auth.js]
      → SHA-256 hash password
      → apiFetch('authenticateUser', { email, passwordHash })

Backend: doPost → route() → authenticateUser(p)
  → sheetToObjects(Members) → find by email + passwordHash + isActive
  → genId() → sessionToken; sessionExpiry = now + 7 days
  → updateRow(Members, row, { sessionToken, sessionExpiry })
  → ok(member with sessionToken)

Frontend continued:
  → member written to state; sessionToken stored in localStorage
  → requestFCMPermission() → browser push permission
    → saveFCMToken(memberId, token) → apiFetch('updateMember', { fcmToken })
      → updateRow(Members, row, { fcmToken })

Side effects: Members sheet updated (session fields + fcmToken); no email
```

---

### Flow 2 — Member views Birthday Wall

```
Frontend: BirthdayPage.jsx → useEffect → load()
  → apiFetch('getBirthdayWalls', {})
  → apiFetch('getMembers', {})
  → for each wall: apiFetch('getBirthdayWishes', { birthdayMemberId })

Backend (getBirthdayWalls):
  doPost → route() → getBirthdayWalls(p)
  → requireAuth(p, 'MEMBER')
  → calculates today DD/MM in IST offset
  → sheetToObjects(Members) → filter birthday === today && isActive
  → sheetToObjects(BirthdayWishes) → filter year === current year
  → assembles wall objects { memberId, name, instrument, photo, wishCount }
  → ok(walls)

Backend (getBirthdayWishes):
  doPost → route() → getBirthdayWishes(p)
  → requireAuth(p, 'MEMBER')
  → sheetToObjects(BirthdayWishes) → filter birthdayMemberId && year
  → sort by createdAt desc → ok(wishes)

Side effects: None (read-only)
```

---

### Flow 3 — Admin adds new asset (no photo)

```
Frontend: AssetsPage.jsx → handleSaveAsset(e)
  → strips photoBase64 from form
  → apiFetch('createAsset', assetData)

Backend: doPost → route() → createAsset(p)
  → requireAuth(p, 'ADMIN')
  → addMissingColumns()
  → p.id = genId()
  → prefix = first 3 letters of category (uppercase)
  → counts existing assets in same category → assetId = prefix + zero-padded-count
  → appendRow(Assets, p)
  → touchCache('Assets') → writes cacheTs_Assets to Settings
  → ok({ id, assetId })

Frontend:
  → setSavedAssetId(displayId) → ID shown in form
  → load() → refreshes asset list

Side effects: Assets sheet row written; no email or push
```

### Flow 3b — Admin adds new asset (WITH photo)

```
Same as above, then after createAsset response:
  → apiFetch('updateAsset', { id: internalId, photoBase64 }) [JSON POST — hasPhoto=true]

Backend: doPost [parses JSON body] → route() → updateAsset(p)
  → requireAuth(p, 'ADMIN')
  → addMissingColumns()
  → uploadToR2(photoBase64, 'asset_<id>', 'image/jpeg')
    → PropertiesService → reads R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
                          R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
    → Utilities.base64Decode(cleanBase64) → imageBytes
    → Utilities.computeDigest(SHA_256, imageBytes) → payloadHash
    → builds canonical request + string-to-sign
    → _r2SigningKey() → derives HMAC-SHA256 chain
    → UrlFetchApp.fetch('https://<accountId>.r2.cloudflarestorage.com/...', PUT)
    → returns publicUrl + '/' + fileName
  → p.photoUrl = R2 URL; delete p.photoBase64
  → findRowById(Assets, p.id) → updateRow()
  → touchCache('Assets')
  → ok({ message: 'Updated' })

Side effects: Image stored in Cloudflare R2; photoUrl written to Assets row
```

---

### Flow 4 — Member adds maintenance log (no photo)

```
Frontend: AssetsPage.jsx → handleAddMaintenance(e)
  → setSaving(true)
  → destructures photoBase64 out of maintForm (not sent in step 1)
  → apiFetch('addMaintenanceLog', { ...maintData, doneBy, assetId, serialNumber,
                                     submittedBy: member.id })

Backend: doPost → route() → addMaintenanceLog(p)
  → requireAuth(p, 'MEMBER')
  → addMissingColumns()
  → saves submitterMemberId; resolveToName(p.submittedBy) → overwrites with name string
  → p.id = genId(); p.isCompleted = false; p.raisedAt = getNowIST()
  → appendRow(MaintenanceLog, p)
  → if p.serialNumber && p.nextDueDate:
      → sheetToObjects(Assets) → find by serialNumber
      → updateRow(Assets, row, { nextDueDate })
  → resolves assetName from Assets by serialNumber
  → addNotification(submitterMember.id, 'maintenance', 'Maintenance Logged', ..., '/assets?open=<serial>')
    → appendRow(Notifications, ...)
    → sendPushNotification([member.fcmToken], ...) → FCM v1 API
  → sendMaintenanceRaisedEmail(submitter.email, ...)
    → GmailApp.sendEmail(...)
  → getAdminMembers() → for each admin:
      → addNotification(admin.id, ...)
      → sendMaintenanceRaisedEmail(admin.email, ...)
  → touchCache('MaintenanceLog'); touchCache('Assets')
  → ok({ id: p.id })

Frontend:
  → newLogId = result?.id
  → no photo branch → toast('Maintenance log added', 'success')
  → invalidateCache('getAssets'); invalidateCache('getMembers')
  → setShowMaint(null); reset form
  → load()
  → finally: setSaving(false)

Side effects:
  MaintenanceLog row written; Assets.nextDueDate updated (if supplied);
  in-app notification + FCM push to submitter and all admins;
  email to submitter and all admins
```

### Flow 4b — Member adds maintenance log (WITH photo)

```
All of Flow 4, then after addMaintenanceLog returns:
  → setUploadingPhoto(true) → button label changes to "Uploading photo…"
  → apiFetch('updateMaintenanceLog', { id: newLogId, photoBase64 }) [JSON POST]

Backend: doPost [parses JSON body] → route() → updateMaintenanceLog(p)
  → requireAuth(p, 'MEMBER')
  → photo-only update path (p.isCompleted is undefined) → no admin-role check
  → addMissingColumns()
  → uploadToR2(photoBase64, 'maintenance_<id>_<timestamp>', 'image/jpeg')
    → (same R2 SigV4 path as asset photos)
    → returns public URL
  → p.photoUrl = R2 URL; delete p.photoBase64
  → sheetToObjects(MaintenanceLog) → find by p.id → row = findRowById()
  → updateRow(MaintenanceLog, row, p)
  → touchCache('MaintenanceLog')
  → ok({ message: 'Updated' })

Frontend:
  → toast('Maintenance log added', 'success')
  → [on catch (photoErr)]: console.error + toast warning with photoErr.message
  → setShowMaint(null); reset form; load()
  → finally: setSaving(false); setUploadingPhoto(false)

Side effects: Photo stored in Cloudflare R2; photoUrl written to MaintenanceLog row
```

---

### Flow 5 — Member RSVPs "No" to a notice

```
Frontend: NoticeBoardPage.jsx → handleRsvp('no', announcementId, reason)
  → apiFetch('rsvpAnnouncement', { id, memberId: member.id, response: 'no', reason })

Backend: doPost → route() → rsvpAnnouncement(p)
  → requireAuth(p, 'MEMBER')
  → if response === 'no' && !reason: return err('Reason is required')
  → findRowById(Announcements, p.id)
  → sheetToObjects(Members) → resolve memberId to memberName
  → reads existing rsvpYes, rsvpNo, rsvpReason from Announcements row
  → removes memberName from both yes/no lists
  → pushes memberName to rsvpNo
  → parses existing rsvpReason JSON map → adds { memberName: reason }
  → updateRow(Announcements, row, { rsvpYes, rsvpNo, rsvpReason: JSON.stringify(map) })
  → ok({ message: 'RSVP saved' })

Side effects: Announcements row updated; no email or push notification sent
```

---

### Flow 6 — Admin marks a member absent at an event

```
Frontend: EventsPage.jsx → openMarkEvent(event)
  → loadAttendance(event.id) → apiFetch('getAttendance', { eventId })
  → admin taps each member card → cycleStatus(memberId) [local state only]
    (Present → InformedPrior → Absent → Present cycling)
  → submitAttendance() [on "Save & Send Emails" button]
    → apiFetch('markAttendanceBulk', {
        eventId,
        present: JSON.stringify([...presentMemberIds]),
        informedPrior: JSON.stringify([...informedMemberIds]),
        eventName
      })

Backend: doPost → route() → markAttendanceBulk(p)
  → requireAuth(p, 'ADMIN')
  → JSON.parse(p.present); JSON.parse(p.informedPrior)
  → sheetToObjects(Members).filter(isActive)
  → sheetToObjects(Attendance) → existing records for this event
  → for each active member: determine status (Present/InformedPrior/Absent)
    → if existing record: updateRow(Attendance, ...)
    → else: appendRow(Attendance, { id, eventId, memberId, isPresent, status, markedAt })
  → sheetToObjects(Events) → resolve event date for email subject
  → sheetToObjects(Settings) → resolve teamName
  → for each absent (not present, not informedPrior) member with email:
    → buildAbsenceEmailHtml(memberName, eventName, eventDate, teamName)
    → GmailApp.sendEmail(member.email, 'We missed you...', absenceHtml)
  → touchCache('Attendance')
  → ok({ success: true, marked })

Side effects:
  Attendance rows written/updated for ALL active members (not just the one being marked);
  "We missed you" email sent to every purely absent member
```

---

### Flow 7 — Birthday PDF email trigger fires (scheduled)

```
No frontend involvement — triggered by Apps Script time-based trigger

sendBirthdayPDFs() [time-driven trigger, runs daily ~8pm IST]
  → calculates today DD/MM in IST offset
  → sheetToObjects(Members) → filter birthday === today && isActive && email present
  → sheetToObjects(BirthdayWishes) → filter year === current year
  → sheetToObjects(Settings) → read teamName
  → for each birthday member:
    → DocumentApp.create('Birthday Blessings for <name>...')
    → body: title, heading, date, horizontal rule
    → for each wish: append wisherName (bold) + wish text (italic)
    → doc.saveAndClose()
    → DriveApp.getFileById(doc.getId()).getAs('application/pdf') → pdfBlob
    → GmailApp.sendEmail(member.email, 'Happy Birthday from <teamName>',
                         plainText, { attachments: [pdfBlob] })
    → DriveApp.getFileById(doc.getId()).setTrashed(true) [cleanup temp doc]
  → on any error per member:
    → Logger.log(error)
    → GmailApp.sendEmail(Session.getActiveUser().getEmail(),
                         'Birthday PDF Error', errorDetails)
  → ok({ sent: count })

Side effects:
  Google Doc created and immediately deleted (temporary);
  PDF email sent to each birthday member;
  Error alert email sent to script owner if exception occurs
```

---

### Flow 8 — Member uploads a profile photo

```
Frontend: ProfilePage.jsx → handlePhotoChange(e)
  → compressImage(file, 200*1024, 800) [utils/imageCompress.js]
    → draws to canvas, iterates quality until size < 200KB
    → returns base64 data URL
  → setPhotoPreview(base64) → shows preview in UI
  → apiFetch('updateMember', { id: member.id, photoBase64: base64,
                                requestingMemberId: member.id,
                                [other profile fields] })
    [JSON POST path because hasPhoto=true]

Backend: doPost [parses JSON body] → route() → updateMember(p)
  → requireAuth(p, 'MEMBER')
  → if auth.role === 'MEMBER' && p.id !== p.requestingMemberId: err('Cannot update another member')
  → addMissingColumns()
  → uploadToR2(p.photoBase64, 'profile_<memberId>', 'image/jpeg')
    → PropertiesService → R2 credentials
    → Utilities.base64Decode() → imageBytes
    → AWS SigV4 signing → UrlFetchApp.fetch(PUT to R2)
    → returns publicUrl + '/profile_<memberId>'
  → p.photoUrl = R2 URL; delete p.photoBase64
  → findRowById(Members, p.id) → updateRow(Members, row, p)
  → touchCache('Members')
  → ok({ message: 'Updated' })

Frontend:
  → toast('Profile updated', 'success')
  → refreshMember() → apiFetch('getMember', { id: member.id }) → setMember(data)
    → avatar updates everywhere in UI

Side effects:
  Photo stored in Cloudflare R2 at key 'profile_<memberId>' (overwrites previous);
  photoUrl written to Members row; Members cache invalidated
```

---

## PART 3 — All GAS Actions Reference

| Action Name | Handler Function | Auth Required | Sheets Touched |
|---|---|---|---|
| `ping` | inline `ok('pong')` | None | None |
| `authenticateUser` | `authenticateUser(p)` | None | Members |
| `validateSession` | `validateSession(p)` | None | Members |
| `changePassword` | `changePassword(p)` | None | Members |
| `requestPasswordReset` | `requestPasswordReset(p)` | None | Members + Gmail |
| `confirmPasswordReset` | `confirmPasswordReset(p)` | None | Members |
| `initialSetup` | `initialSetup(p)` | None | All sheets |
| `getMembers` | `getMembers(p)` | MEMBER | Members |
| `getMember` | `getMember(p)` | MEMBER | Members |
| `createMember` | `createMember(p)` | ADMIN | Members, Notifications + Gmail |
| `updateMember` | `updateMember(p)` | MEMBER | Members (+ R2 if photo) |
| `deleteMember` | `deleteMember(p)` | ADMIN | Members |
| `getAssets` | `getAssets(p)` | **None** | Assets |
| `getAsset` | `getAsset(p)` | **None** | Assets |
| `createAsset` | `createAsset(p)` | ADMIN | Assets (+ R2 if photo) |
| `updateAsset` | `updateAsset(p)` | ADMIN | Assets (+ R2 if photo) |
| `deleteAsset` | `deleteAsset(p)` | ADMIN | Assets |
| `checkoutAsset` | `checkoutAsset(p)` | MEMBER | Assets |
| `checkinAsset` | `checkinAsset(p)` | MEMBER | Assets |
| `getMaintenanceLogs` | `getMaintenanceLogs(p)` | MEMBER | MaintenanceLog |
| `addMaintenanceLog` | `addMaintenanceLog(p)` | MEMBER | MaintenanceLog, Assets, Notifications + Gmail + FCM |
| `updateMaintenanceLog` | `updateMaintenanceLog(p)` | MEMBER (completion: ADMIN) | MaintenanceLog, Notifications + Gmail + FCM (if completing) + R2 (if photo) |
| `getAnnouncements` | `getAnnouncements(p)` | **None** | Announcements, Members |
| `createAnnouncement` | `createAnnouncement(p)` | ADMIN | Announcements, Notifications + Gmail blast + FCM |
| `updateAnnouncement` | `updateAnnouncement(p)` | ADMIN | Announcements |
| `deleteAnnouncement` | `deleteAnnouncement(p)` | ADMIN | Announcements |
| `markAnnouncementsRead` | `markAnnouncementsRead(p)` | MEMBER | Announcements, Members |
| `acknowledgeAnnouncement` | `acknowledgeAnnouncement(p)` | MEMBER | Announcements, Members |
| `rsvpAnnouncement` | `rsvpAnnouncement(p)` | MEMBER | Announcements, Members |
| `getPrayerRequests` | `getPrayerRequests(p)` | **None** | PrayerRequests, Members |
| `createPrayerRequest` | `createPrayerRequest(p)` | MEMBER | PrayerRequests |
| `updatePrayerRequest` | `updatePrayerRequest(p)` | MEMBER | PrayerRequests |
| `markAnswered` | `markAnswered(p)` | MEMBER | PrayerRequests, AnsweredPrayers |
| `deletePrayerRequest` | `deletePrayerRequest(p)` | MEMBER | PrayerRequests |
| `prayForRequest` | `prayForRequest(p)` | MEMBER | PrayerRequests, Notifications + FCM |
| `getAnsweredPrayers` | `getAnsweredPrayers(p)` | **None** | AnsweredPrayers, Members |
| `getYearEndSummary` | `getYearEndSummary(p)` | **None** | AnsweredPrayers, Members |
| `getBirthdayWalls` | `getBirthdayWalls(p)` | MEMBER | Members, BirthdayWishes |
| `getBirthdayWishes` | `getBirthdayWishes(p)` | MEMBER | BirthdayWishes |
| `postBirthdayWish` | `postBirthdayWish(p)` | MEMBER | BirthdayWishes |
| `sendBirthdayPDFs` | `sendBirthdayPDFs(p)` | SUPER_ADMIN (skipped for trigger) | Members, BirthdayWishes, Settings + Drive + Gmail |
| `getEvents` | `getEvents(p)` | **None** | Events |
| `createEvent` | `createEvent(p)` | ADMIN | Events |
| `getAttendance` | `getAttendance(p)` | MEMBER | Attendance |
| `markAttendance` | `markAttendance(p)` | MEMBER | Attendance |
| `markAttendanceBulk` | `markAttendanceBulk(p)` | ADMIN | Attendance, Events, Members, Settings + Gmail |
| `getMemberAttendance` | `getMemberAttendance(p)` | **None** | Attendance, Events |
| `exportAttendanceCSV` | `exportAttendanceCSV(p)` | ADMIN | Events, Members, Attendance |
| `getPrayerPartners` | `getPrayerPartners(p)` | MEMBER | PrayerPartners, Members |
| `setPrayerPartners` | `setPrayerPartners(p)` | ADMIN | PrayerPartners, Notifications + FCM |
| `autoPairMembers` | `autoPairMembers(p)` | ADMIN | Members (read-only) |
| `getFacilitatorRoster` | `getFacilitatorRoster(p)` | MEMBER | FacilitatorRoster |
| `updateRosterSlot` | `updateRosterSlot(p)` | ADMIN | FacilitatorRoster, Members, Settings, Notifications + Gmail + FCM |
| `getAuditionSuggestions` | `getAuditionSuggestions(p)` | MEMBER | AuditionSuggestions |
| `createSuggestion` | `createSuggestion(p)` | MEMBER | AuditionSuggestions, Members, Notifications + Gmail to admins + FCM |
| `updateSuggestionStatus` | `updateSuggestionStatus(p)` | ADMIN | AuditionSuggestions, Notifications + FCM |
| `getNotifications` | `getNotifications(p)` | MEMBER | Notifications, Settings |
| `markNotificationsRead` | `markNotificationsRead(p)` | MEMBER | Notifications |
| `getBadges` | `getBadges(p)` | MEMBER | Badges |
| `awardBadge` | `awardBadge(p)` | ADMIN (skipped for internal calls) | Badges, Notifications + FCM |
| `getVMContent` | `getVMContent(p)` | **None** | Settings |
| `updateVMContent` | `updateVMContent(p)` | SUPER_ADMIN | Settings |
| `getQuizQuestions` | `getQuizQuestions(p)` | **None** | Settings |
| `addQuizQuestion` | `addQuizQuestion(p)` | SUPER_ADMIN | Settings |
| `updateQuizQuestion` | `updateQuizQuestion(p)` | SUPER_ADMIN | Settings |
| `saveAllQuizQuestions` | `saveAllQuizQuestions(p)` | SUPER_ADMIN | Settings |
| `deleteQuizQuestion` | `deleteQuizQuestion(p)` | SUPER_ADMIN | Settings |
| `recordVMReview` | `recordVMReview(p)` | MEMBER | VMReviews |
| `getVMReviewStatus` | `getVMReviewStatus(p)` | MEMBER | VMReviews |
| `getOnboardingProgress` | `getOnboardingProgress(p)` | MEMBER | OnboardingProgress |
| `updateOnboardingProgress` | `updateOnboardingProgress(p)` | MEMBER | OnboardingProgress |
| `getOnboardingChecklist` | `getOnboardingChecklist(p)` | **None** | Settings |
| `addOnboardingItem` | `addOnboardingItem(p)` | SUPER_ADMIN | Settings |
| `updateOnboardingItem` | `updateOnboardingItem(p)` | SUPER_ADMIN | Settings |
| `deleteOnboardingItem` | `deleteOnboardingItem(p)` | SUPER_ADMIN | Settings |
| `reorderOnboardingItems` | `reorderOnboardingItems(p)` | SUPER_ADMIN | Settings |
| `completeOnboarding` | `completeOnboarding(p)` | MEMBER | Members, VMReviews, Badges, Notifications + Gmail to admins + FCM |
| `getSettings` | `getSettings(p)` | **None** | Settings |
| `getAllSettings` | `getAllSettings(p)` | SUPER_ADMIN | Settings |
| `updateSettings` | `updateSettings(p)` | SUPER_ADMIN | Settings |
| `getDashboard` | `getDashboard(p)` | MEMBER | Members, VMReviews, PrayerPartners, Announcements, Badges, Attendance, Events + Assets/FacilitatorRoster/AuditionSuggestions/Settings (admin) |
| `exportData` | `exportData(p)` | SUPER_ADMIN | All sheets (read) + Settings (writes lastBackupDate) |
| `importData` | `importData(p)` | SUPER_ADMIN | All sheets (overwrites) |
| `clearAllData` | `clearAllData(p)` | SUPER_ADMIN | All sheets (deletes rows) |

> **Note:** Actions marked **None** for auth have no `requireAuth()` call and return data to any caller with a valid Apps Script URL.

---

## PART 4 — All Time-Driven Triggers

| Function | Documented Schedule | What it does |
|---|---|---|
| `sendMorningBirthdayNotifications()` | Day timer, 8am–9am IST | Finds all active members with today's birthday (DD/MM); composes a notification title with their first names; calls `addNotification()` for **every** active member pointing to `/birthdays`; no email sent from this function |
| `sendBirthdayPDFs(p)` | Daily (separate trigger, runs after wish window) | Finds birthday members with email; for each: creates a Google Doc of their wishes, exports as PDF via Drive, emails it as attachment, trashes the temp Doc; sends an error-alert email to script owner on any failure; also callable manually by SUPER_ADMIN via the UI |
| `sendMaintenanceReminders()` | Hour timer, every 5 hours | Fetches all open (isCompleted false) maintenance logs; for each: sends an in-app notification + `sendMaintenanceRaisedEmail()` (via GmailApp) to **all** admins and super-admins |
| `sendMondayPrayerReminder()` | Presumed Monday morning (no comment in code) | Reads today's FacilitatorRoster slot to find the facilitator name; reads Zoom details from Settings; calls `addNotification()` for every active member and sends a styled email to each member announcing tonight's 9:30pm IST prayer meeting with Zoom link |
| `sendFridayFacilitatorReminder()` | Presumed Friday (no comment in code) | Finds next Monday's FacilitatorRoster slot; if a facilitator is assigned: sends them an in-app notification and email reminding them to prepare prayer points, with Zoom details |

---

## PART 5 — Shared Utilities

### Backend — Code.gs Helper Functions

| Function | Description |
|---|---|
| `getNowIST()` | Returns current datetime as `"YYYY-MM-DD HH:MM IST"` string offset to IST (+5:30) |
| `ok(data)` | Wraps data in `{ success: true, data }` and returns as JSON ContentService output |
| `err(msg)` | Wraps message in `{ success: false, error: msg }` and returns as JSON ContentService output |
| `doGet(e)` | HTTP GET entry point; delegates to `route(action, e.parameter)` |
| `doPost(e)` | HTTP POST entry point; attempts JSON parse of `e.postData.contents`, falls back to `e.parameter`; delegates to `route()` |
| `route(action, p)` | Master switch/case dispatcher mapping 60+ action name strings to handler functions; returns `err('Unknown action')` for unrecognised action |
| `requireAuth(p, requiredRole)` | Validates `p.sessionToken` against Members sheet; checks account is active and session not expired; enforces role hierarchy (SUPER_ADMIN > ADMIN > MEMBER); returns `{ ok: true, role }` or `{ error: '...' }` |
| `touchCache(sheetName)` | Upserts `cacheTs_<sheetName>` key in Settings with current ISO timestamp; frontend compares this to decide whether to invalidate its sessionStorage cache |
| `getSheet(name)` | Returns the named Google Sheet; throws `"Sheet not found: <name>"` if absent |
| `sheetToObjects(sheet)` | Converts all rows (starting from row 2) into objects keyed by header row values; empty cells become `null` |
| `genId()` | Returns a UUID v4 string via `Utilities.getUuid()` |
| `findRowById(sheet, id)` | Scans column A for a row where `String(value) === String(id)`; returns 1-based row number or `-1` |
| `findRowByKey(sheet, key)` | Same as `findRowById` but for Settings key-value structure; used to locate specific settings keys |
| `getHeaders(sheet)` | Returns the first row of a sheet as a string array |
| `appendRow(sheet, obj)` | Maps object properties to header columns and appends a new row; unmapped headers receive empty string |
| `updateRow(sheet, rowNum, obj)` | Reads existing row at `rowNum`, merges `obj` fields over it (preserves fields not present in `obj`), writes back |
| `deleteRow(sheet, rowNum)` | Deletes the row at `rowNum` using `sheet.deleteRow()` |
| `getAdminMembers()` | Returns all active ADMIN and SUPER_ADMIN members from the Members sheet |
| `addMissingColumns()` | Idempotent migration guard: ensures `photoBase64`, `submittedBy`, `completedBy`, `photoUrl` exist in MaintenanceLog, and `photoUrl` exists in Members and Assets |
| `addMissingRosterColumns()` | Idempotent migration guard: ensures `memberName`, `assignedBy`, `notificationSent`, `reminderNotificationSent` exist in FacilitatorRoster |
| `addMissingAnnouncementColumns()` | Idempotent migration guard: ensures `acknowledged`, `rsvpYes`, `rsvpNo`, `rsvpReason` exist in Announcements |
| `columnExists(sheetName, columnName)` | Returns boolean for whether a column header name exists in the named sheet |
| `ensureSheets()` | Creates all 17 required sheets with correct headers if they don't already exist; called only by `initialSetup` |
| `getDriveFolders()` | Reads or creates the Drive folder structure (`CBC Worship Portal / Profile Photos / Asset Photos / Maintenance Photos`); stores folder IDs in Settings |
| `getOrCreateDriveFolder(name, parentId)` | Finds or creates a Drive folder by name under the specified parent |
| `saveImageToDrive(base64, folderKey, fileName)` | **DEPRECATED** — previously uploaded images to Drive; now superseded by `uploadToR2`; retained for rollback |
| `uploadToR2(base64, fileName, contentType)` | Uploads a base64 image to Cloudflare R2 via AWS Signature Version 4 `PUT`; reads five credentials from `PropertiesService`; returns the public URL |
| `_r2FmtDate(d)` | Formats a `Date` as `"YYYYMMDDTHHMMSSZ"` for use in AWS V4 signatures |
| `_r2Hex(bytes)` | Converts a byte array to a lowercase hexadecimal string |
| `_r2SigningKey(secret, dateStamp, region, service)` | Derives the HMAC-SHA256 hierarchical signing key used in AWS V4 request signing |
| `addNotification(memberId, type, title, body, linkTo)` | Appends a row to Notifications sheet and attempts FCM push via `sendPushNotification()` |
| `notifyAllMembers(type, title, body, linkTo)` | Calls `addNotification()` for every active member |
| `getFirebaseAccessToken(serviceAccount)` | Mints a signed JWT from the Firebase service account private key and exchanges it for an FCM OAuth2 Bearer token via `oauth2.googleapis.com/token` |
| `sendPushNotification(tokens, title, body)` | Reads Firebase config from Settings; calls `getFirebaseAccessToken()`; posts FCM v1 API `messages:send` for each device token |
| `buildEmailSubject(templateType, params)` | Returns a formatted email subject string for one of six named template types |
| `buildEmailHtml(templateType, params)` | Returns a full branded HTML email body for: `welcome`, `passwordReset`, `maintenance`, `onboarding`, `vm`, `audition` |
| `buildAbsenceEmailHtml(memberName, eventName, eventDate, teamName)` | Builds HTML for the "We missed you at \<event\>" absence email |
| `buildSimpleEmail(toName, bodyText)` | Wraps plain paragraph text in the standard branded header/footer email template |
| `sendMaintenanceRaisedEmail(toEmail, toName, d)` | Sends a styled HTML table email for a newly raised maintenance log; includes optional photo `<img>` block if `photoUrl` is present |
| `sendMaintenanceCompleteEmail(toEmail, toName, d)` | Sends a styled HTML table email when a maintenance log is marked complete |
| `sendMaintenanceLogEmail(toEmail, toName, rows, isCompletion)` | Sends a multi-row maintenance status table email (used by the reminder trigger) |
| `sendRosterAssignmentEmail(toEmail, toName, d)` | Sends a roster assignment email with Zoom link, meeting ID, and passcode |
| `sendAnnouncementEmailBlast(title, body)` | Sends an announcement HTML email to every active member with an email address |
| `getDashboard(p)` | Aggregates data from 8–11 sheets into a single response; admin path adds asset/roster/audition summaries; SUPER_ADMIN path adds last-backup date |
| `formatISTString(raw)` | Converts `"YYYY-MM-DD HH:MM IST"` to human-readable `"5 May 2026, 2:32 PM"` |
| `getMonthName(mm)` | Converts two-digit month string `"01"`–`"12"` to full month name |
| `getMemberAttendance(p)` | Returns attendance records and percentage for one member over the last 3 months; also called internally by `getDashboard` |

---

### Frontend — Shared Utilities

| Function / Module | Description |
|---|---|
| **`src/utils/api.js`** | |
| `apiFetch(action, payload, options)` | Core API client: injects session token from localStorage; checks sessionStorage cache for cacheable read actions; routes to JSON `POST` (when `photoBase64` present) or form-encoded `POST` (otherwise); throws on HTTP error or `success: false`; returns `data.data` |
| `invalidateCache(action)` | Removes all sessionStorage entries whose key starts with `apicache:<action>:` |
| `setAppsScriptUrl(url)` | Persists the Apps Script deployment URL to `localStorage` |
| `apiGet(action, params)` | Legacy GET-based helper using URL query params (not used by main page flows) |
| `flattenPayload(obj, prefix)` | Recursively flattens nested objects and arrays to a flat key-value map suitable for `URLSearchParams`; arrays are JSON-stringified |
| **`src/utils/imageCompress.js`** | |
| `compressImage(file, maxBytes, maxDimension)` | Draws image to a canvas scaled to `maxDimension`; iterates JPEG quality downward until file size is below `maxBytes`; returns base64 data URL; used before every photo upload |
| **`src/utils/auth.js`** | |
| `login(email, password, staySignedIn)` | SHA-256 hashes password; calls `apiFetch('authenticateUser')`; stores session token in `localStorage` (`cbc_session`) |
| `validateSession()` | Reads token from `localStorage`; calls `apiFetch('validateSession', { token })` |
| `clearSession()` | Removes `cbc_session` from `localStorage` |
| `changePassword(memberId, currentPass, newPass)` | SHA-256 hashes both passwords; calls `apiFetch('changePassword')` |
| **`src/utils/notifications.js`** | |
| `requestFCMPermission()` | Requests browser Notification permission; registers the service worker; returns FCM device token via Firebase JS SDK |
| `saveFCMToken(memberId, token)` | Calls `apiFetch('updateMember', { id: memberId, fcmToken: token })` to persist the device token to the Members sheet |
| **`src/contexts/AuthContext.jsx`** | |
| `AuthProvider` | React context provider; manages `member` state; runs `validateSession()` on mount; exposes `login`, `logout`, `refreshMember`, `updateMemberLocal` |
| `useAuth()` | Hook that returns `{ member, loading, login, logout, refreshMember, updateMemberLocal }` |
| **`src/contexts/AppContext.jsx`** | |
| `AppContext` | Provides global `toast(message, type)` function, `installPrompt`, `whatsappLink`, `teamName`, and their setters throughout the app |
| **`src/contexts/NotificationContext.jsx`** | |
| `NotificationContext` | Polls `getNotifications` on a timer; tracks unread count for the bell badge in `Layout.jsx` |
| **`src/contexts/ThemeContext.jsx`** | |
| `ThemeContext` | Persists dark/light theme toggle to `localStorage`; applies `dark` CSS class to document root |
