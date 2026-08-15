# JavaScript Obfuscation Guide

## What is obfuscation?

When you build a web app, your code gets compiled into JavaScript files that anyone can read by opening browser DevTools. Obfuscation transforms that readable code into scrambled, hard-to-read code that performs identically but looks like gibberish.

**Before obfuscation** — your code looks like:
```js
function loginUser(email, password) {
  const hash = sha256(password)
  return fetch('/api', { method: 'POST', body: { email, hash } })
}
```

**After obfuscation** — it looks like:
```js
var _0x3a=['push','apply','7261RRbbql'];(function(_0x1a2b){var _0xc3=function...
```

The app works exactly the same. It just becomes very difficult for someone to copy or reverse-engineer your logic.

---

## What does it protect?

- Business logic in your frontend components
- The structure of your API calls
- Any configuration or patterns in your code

**It does NOT protect:**
- Your Google Sheets data (that's protected by your Apps Script URL, which you keep private)
- Your Firebase/EmailJS keys (stored in the app settings, not the source code)

---

## How to run the obfuscated build

Open a terminal in your project folder:

```bash
npm run build:secure
```

This single command:
1. Runs Vite to build the app → creates `/dist`
2. Runs the obfuscator script → scrambles all `.js` files in `/dist/assets`

It takes 30–90 seconds. You'll see output like:
```
🔒 CBC Worship Portal — Obfuscating build output...

Obfuscating: index-Bx2k9aH4.js
Obfuscating: vendor-CxZ3pQ7n.js

✓ Obfuscated 2 JS file(s)
✓ Obfuscation complete. Ready to deploy.
```

---

## Obfuscation settings used

The app uses these obfuscation techniques:

| Setting | Effect |
|---------|--------|
| `compact` | Removes whitespace and line breaks |
| `controlFlowFlattening` | Restructures if/else and loop logic |
| `deadCodeInjection` | Adds fake unused code to confuse readers |
| `stringEncryption` | Encrypts string literals |
| `rotateStringArray` | Rotates the string lookup array each build |

---

## Does obfuscation break the app?

No. The obfuscated code runs identically in all modern browsers. If you notice any issues after an obfuscated build, you can always deploy the non-obfuscated version (`npm run build`) for debugging.

---

## Normal build vs secure build

| Command | When to use |
|---------|-------------|
| `npm run build` | Local testing, debugging |
| `npm run build:secure` | Every production deployment |
| `npm run dev` | Local development with hot reload |
