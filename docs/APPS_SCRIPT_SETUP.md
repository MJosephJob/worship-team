# Apps Script Setup Guide

This guide connects your React app to Google Sheets via Google Apps Script.

---

## Step 1 — Create the Google Spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Name it something like: **CBC Thane Worship Portal Data**
3. You don't need to add any columns — the app will set everything up automatically on first launch.

---

## Step 2 — Open the Apps Script Editor

1. In your spreadsheet, click the top menu: **Extensions → Apps Script**
2. A new tab will open with a code editor.
3. Delete the default `function myFunction() {}` code.

---

## Step 3 — Paste the Code

1. Open the file `/apps-script/Code.gs` from this project folder.
2. Copy its entire contents.
3. Paste it into the Apps Script editor.
4. Click **Save** (the floppy disk icon or Ctrl+S).

---

## Step 4 — Deploy as a Web App

1. Click **Deploy → New deployment** in the top right.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in the settings:
   - **Description**: CBC Worship Portal API
   - **Execute as**: Me (your Google account)
   - **Who has access**: Anyone (even anonymous)
4. Click **Deploy**.
5. Google will ask you to authorise the app — click through the permissions prompts. (It's your own code accessing your own Sheets.)
6. After authorising, you'll see a screen with a **Web app URL**.
7. Copy that URL — it looks like: `https://script.google.com/macros/s/AKfycb.../exec`

---

## Step 5 — Paste the URL into the App

1. Open your CBC Worship Portal app in the browser.
2. You'll see the Setup Wizard (first launch only).
3. Paste your Web App URL into the "Apps Script Web App URL" field.
4. Click "Test Connection & Continue".

---

## Important Notes

- **If you make changes to Code.gs**, you must create a new deployment (Deploy → Manage deployments → New version) — not just save the file. The old URL still works but won't reflect your changes.
- **Permissions**: If you change what the script does (e.g., adds email sending), you'll need to re-authorise.
- **Quota**: Google Apps Script has generous free-tier limits (20,000 reads/day, 2,000 writes/day) — more than enough for a 20–30 member team.
- **Never share the Web App URL publicly** — it is your database API. Treat it like a password.
