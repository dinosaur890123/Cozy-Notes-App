# Cozy Notes — September Vibes

A lightweight, visually rich notes app with a subtle falling leaf background. No build step needed — just open `index.html`.

## Features
- Subtle animated falling leaf background (performance-capped)
- Warm, September-themed palette and typography
- Create, edit (auto-save), delete notes
- Pin notes to keep them at the top
- Search notes
- Local, private persistence with `localStorage`
- Keyboard shortcuts:
  - `Ctrl/Cmd + N`: New note
  - `Ctrl/Cmd + Backspace/Delete`: Delete active note

## Quick start (Windows)
1. Open this folder in VS Code.
2. Use Live Server or any static server to view:

```powershell
# via PowerShell (Node required)
npm i -g serve ; serve .
```

Then open the URL it prints (usually http://localhost:3000 or 5000).

Alternatively, just open `index.html` in your browser, but some features (like fonts) may behave better with a local server.

## Deploy
Because this is a static app, deploy anywhere that serves static files:
- GitHub Pages
- Vercel (as a static project)
- Netlify, Cloudflare Pages, etc.

For Vercel (from this folder):
```powershell
npm i -g vercel ; vercel ; vercel --prod
```

No server is required; all data is in your browser.

## Notes on performance
- The background leaf generator maintains a capped number of leaves based on window width.
- Animations use CSS transforms for GPU acceleration and limited blur/shadow for depth.

## Customize the vibe
- Colors and accents live in `styles.css` under `:root`.
- Leaf hues are randomized between amber/orange — tweak in `app.js` where `hue` is set (around 18–53).

Enjoy your cozy writing season! 🍂☕
