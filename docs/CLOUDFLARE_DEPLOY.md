# Cloudflare Pages Deployment Guide

Cloudflare Pages hosts your app for free, globally distributed, with HTTPS included.

---

## Prerequisites

- Node.js installed on your computer
- All npm dependencies installed (`npm install`)
- Apps Script URL configured (see APPS_SCRIPT_SETUP.md)

---

## Step 1 — Build the App

Open a terminal in the project folder and run:

```
npm run build:secure
```

This will:
1. Build the React app (creates a `/dist` folder)
2. Obfuscate all JavaScript files for security

The process takes about 30–90 seconds. When done, you'll see a `/dist` folder in the project directory.

If you want a non-obfuscated build (for testing only):
```
npm run build
```

---

## Step 2 — Create a Cloudflare Account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign up (free).
2. You don't need to add a domain — Cloudflare gives you a free `*.pages.dev` subdomain.

---

## Step 3 — Deploy via Drag and Drop

1. In the Cloudflare dashboard, click **Workers & Pages** in the left sidebar.
2. Click **Create application → Pages → Upload assets**
3. Give your project a name: `cbc-worship-portal`
4. Drag your **`/dist`** folder into the upload area (or click to browse and select the folder)
5. Click **Deploy site**

Cloudflare will process the files and give you a URL like:
`https://cbc-worship-portal.pages.dev`

---

## Step 4 — Configure for React Router (Important!)

Because this is a React Single Page App, you need to tell Cloudflare to serve `index.html` for all routes.

1. In your `/dist` folder (before deploying), create a file called `_redirects` with this content:
```
/* /index.html 200
```

Or create a `_headers` file with:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

2. Re-run `npm run build:secure` after adding these files (put them in `/public` so Vite copies them automatically).

To add the `_redirects` file automatically, create `/public/_redirects` with the content above, then rebuild.

---

## Step 5 — Custom Domain (Optional)

If you have a domain name:
1. In your Pages project, click **Custom domains → Set up a custom domain**
2. Enter your domain (e.g., `worship.cbcthane.in`)
3. Follow Cloudflare's DNS instructions

If you don't have a domain, the `.pages.dev` URL works perfectly.

---

## Redeployment

Whenever you make updates:
1. Run `npm run build:secure`
2. In Cloudflare Pages → your project → **Deployments**
3. Click **Upload assets** and drag the new `/dist` folder

---

## Free Tier Limits

Cloudflare Pages free tier includes:
- 500 deployments per month
- Unlimited bandwidth
- Unlimited requests
- Global CDN

This is entirely free for your team.

---

## Sharing with the Team

Once deployed, share the URL with your worship team. Tell them to:
1. Open the URL in their phone browser (Chrome or Safari)
2. Log in with their credentials
3. Tap "Add to Home Screen" when prompted (or via browser menu)

The app will then behave like a native app on their home screen.
