
# LifeHub v2 — Javeed

Now with:
- ✅ PWA (Add to Home Screen) — manifest + service worker
- ✅ Career tab (CompTIA A+ roadmap + GitHub upload checklist)
- ✅ Finance CSV export
- ✅ Reading tracker + suggestions

## Local run
1) Install Node.js LTS from https://nodejs.org
2) In a terminal:
```
npm install
npm run dev
```
Open the URL it prints (usually http://localhost:5173).

## Deploy to Vercel
1) Create a free account at https://vercel.com (use Google login).
2) New Project → Upload → select this ZIP.
3) Build Command: `npm run build`
4) Output Directory: `dist`
5) Deploy → you get a public URL. On your phone, open it → “Add to Home Screen”.

### Data
Stored locally (localStorage). Use **Export** in the app to back up JSON or CSV.
