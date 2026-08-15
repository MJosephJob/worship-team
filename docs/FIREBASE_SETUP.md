# Firebase Push Notifications Setup Guide

Firebase Cloud Messaging (FCM) sends push notifications to team members' phones even when the app is closed. This is the service that powers birthday reminders, roster alerts, and prayer partner nudges.

---

## Step 1 — Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Name it something like: `cbc-worship-portal`
4. You can disable Google Analytics (not needed for this app)
5. Click **Create project**

---

## Step 2 — Register Your Web App

1. On the project overview page, click the **Web** icon (`</>`)
2. Enter an app nickname: `CBC Worship Portal`
3. Do NOT tick "Firebase Hosting" — you're using Cloudflare
4. Click **Register app**
5. You'll see a `firebaseConfig` object that looks like this:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "cbc-worship-portal.firebaseapp.com",
  projectId: "cbc-worship-portal",
  storageBucket: "cbc-worship-portal.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc...",
  measurementId: "G-..."
};
```

6. Copy this entire config block.

---

## Step 3 — Enable Cloud Messaging

1. In the left sidebar, go to **Project Settings** (gear icon)
2. Click the **Cloud Messaging** tab
3. Under "Web Push certificates", click **Generate key pair**
4. Copy the generated **Key Pair** — this is your VAPID key

---

## Step 4 — Get Your Server Key

1. Still in Project Settings → Cloud Messaging
2. Under "Project credentials", find **Server key** (also called Legacy server key)
3. Copy it — you'll need this in the Apps Script config

---

## Step 5 — Paste Config into the App

1. Log in to the CBC Worship Portal as Super Admin
2. Go to **Settings → Integrations → Firebase**
3. Paste the entire `firebaseConfig` JSON into the text area (as JSON, not JavaScript)
   - Format it like: `{"apiKey": "...", "authDomain": "...", "vapidKey": "...", "serverKey": "..."}`
   - Add `"vapidKey"` and `"serverKey"` to the config object
4. Click **Save Firebase Config**

---

## Step 6 — Allow Notifications

When a member logs in for the first time, they'll see a prompt asking to allow notifications. They must click **Allow** for push notifications to work on their device.

Members can also enable notifications later via **Profile → Enable Push Notifications**.

---

## Free Tier Limits

Firebase's free Spark plan includes:
- Unlimited push notifications
- No credit card required

This is completely free for your team's usage.
