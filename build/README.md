# CBC Worship Portal — Obfuscated Build Guide

## What is this?

Before deploying, you can run an obfuscated build that scrambles your JavaScript source code to make it harder for others to read or copy. Your app works identically — it just looks like gibberish to anyone who views source.

## How to run it

**Step 1** — Make sure you have installed dependencies:
```
npm install
```

**Step 2** — Run the secure build:
```
npm run build:secure
```

This does two things automatically:
1. Runs `npm run build` (Vite builds the app into `/dist`)
2. Runs `node build-tools/obfuscate.js` (scrambles all JS files in `/dist/assets`)

## What the output looks like

Before obfuscation, your `/dist/assets/index-xxx.js` looks like readable React code.
After obfuscation, it looks like:
```
var _0x3a9f=['push','apply','length',...];(function(_0x...){...})(_0x3a9f,0x...);
```

It is not possible to reverse this to the original source.

## Deploying

After `npm run build:secure`, drag the `/dist` folder to Cloudflare Pages.
See `/docs/CLOUDFLARE_DEPLOY.md` for step-by-step instructions.

## Important notes

- Never commit the `/dist` folder to git — it contains your obfuscated production code
- The obfuscation process takes 15–60 seconds depending on bundle size — this is normal
- If obfuscation fails on a specific file, the build still works — that file just won't be obfuscated
- Service workers and manifest files are NOT obfuscated (they need to be readable by the browser)
