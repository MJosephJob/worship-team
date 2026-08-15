# Change List — 20 Things You Can Ask Claude to Change

This app was built with Claude. Here are 20 examples of changes you can ask for, written in plain English.

---

## Branding & Design

1. **"Change the app's main gold colour to a deep burgundy red."**
   Claude will update the CSS variable `--color-gold` and all related hover states throughout the app.

2. **"Add a church logo image to the login screen above the cross icon."**
   Claude will add an `<img>` tag to `LoginPage.jsx` and help you encode your logo as base64.

3. **"Change the app name from 'CBC Thane Worship Portal' to 'Grace Church Worship Hub'."**
   Claude will update the name in `index.html`, `manifest.json`, `LoginPage.jsx`, and the setup wizard.

4. **"Make the cards have sharp corners instead of rounded ones."**
   Claude will remove the `rounded` classes from the card styles and CSS.

---

## Features

5. **"Add a 'Songlist' page where admins can post the songs for this Sunday, and members can see them."**
   Claude will create a new `SonglistPage.jsx`, add it to the navigation, and add the corresponding Apps Script handler.

6. **"Add a 'Team Chat' feature — a simple group message board where members can post short messages."**
   Claude will create a chat page with real-time polling against a new Google Sheet.

7. **"Add a feature where members can RSVP to events as 'Attending', 'Maybe', or 'Can't make it'."**
   Claude will modify `AttendancePage.jsx` and the `Events` sheet structure to support RSVP status.

8. **"Add a 'Personal Notes' section to each member's profile where they can write private notes to themselves."**
   Claude will add a notes field to the profile page and a new column in the Members sheet.

9. **"Add a 'Song Request' button on the dashboard so members can suggest songs for worship."**
   Claude will add a floating button and a new Google Sheet for song requests.

---

## Notifications & Reminders

10. **"Send a push notification every Friday at 6pm reminding the team about Sunday rehearsal."**
    Claude will add a scheduled trigger in `Code.gs` using Apps Script's built-in time-driven triggers.

11. **"Send an email to the admin every time a new prayer request is posted."**
    Claude will add an `sendEmailViaEmailJS` call inside the `createPrayerRequest` function in `Code.gs`.

12. **"Add a notification when a member's asset check-out is more than 7 days overdue."**
    Claude will add a scheduled check in Apps Script that compares `checkedOutAt` dates.

---

## Data & Reporting

13. **"Add a monthly report that shows which members attended the most and least events."**
    Claude will create an attendance leaderboard view on the Attendance page.

14. **"Show a graph of attendance trends over the last 6 months on the admin dashboard."**
    Claude will add a simple SVG bar chart or integrate a lightweight chart library.

15. **"Add a 'Notes' field to each event so admins can log what happened — who led, what was the set, etc."**
    Claude will add a notes field to the event creation form and the Events sheet.

---

## Member Experience

16. **"Let members choose their own profile colour theme — gold, blue, green, or purple."**
    Claude will add a theme picker to the profile page and store the preference in the Members sheet.

17. **"Add a 'Skill Level' dropdown to member profiles: Beginner / Intermediate / Advanced / Professional."**
    Claude will add the field to the profile form, member card, and Members sheet.

18. **"Show a 'Days since last login' indicator on the admin Members list."**
    Claude will add a `lastLoginAt` timestamp to the authentication handler and display it in Settings.

---

## Admin Tools

19. **"Add a bulk-import feature so admins can paste a list of names and emails to add multiple members at once."**
    Claude will add a text area in Settings → Members that accepts CSV input and creates member records in bulk.

20. **"Add an 'Archive' option for prayer requests instead of deleting them, so they can be reviewed later."**
    Claude will add an `isArchived` field to PrayerRequests and an Archive tab on the Prayer Board page.

---

## How to ask Claude

Just describe what you want in plain English — you don't need to know which file to edit. For example:

> "I want to add a feature where team members can post short praise reports — not prayer requests, but quick 'praise God for...' posts. Make it a new tab on the Prayer Board page."

Claude will identify which files need changing, write the code, and explain what was changed.
