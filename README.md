# 🌟 Senna Kids Zone

**A magical bilingual (English + Nepali) learning adventure for toddlers aged 1–4.**  
Zero hosting cost · Cloudflare Pages + Workers · Offline-capable PWA · Privacy-first

---

## 🚀 What's Inside

| File | Purpose |
|------|---------|
| `index.html` | PWA shell — cosmic toddler UI, all CSS |
| `src/app.js` | Global supervisor: state, routing, timer, audio, particles |
| `src/components/Attendance.js` | Magic Mirror (WebRTC fog-wipe entry) |
| `src/components/GameEngine.js` | 15-step bilingual interactive adventure |
| `src/components/ParentPortal.js` | Math-gated dashboard + printable workbook |
| `src/services/storage.js` | Local-first persistence (localStorage) |
| `src/services/parent-sync.js` | Cloudflare Worker sync with offline queue |
| `functions/api/parent-sync.js` | Cloudflare Pages Function (edge API) |
| `_headers` | Security headers + camera permissions |
| `_redirects` | SPA routing for Cloudflare Pages |
| `manifest.json` | PWA install manifest |

---

## ⚡ Deploy in 3 Minutes (Zero Cost)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "🌟 Senna Kids Zone v3 - Production"
git remote add origin https://github.com/subashnp169/senonsurprise-kidszone.git
git push -u origin main
```

### 2. Connect to Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages**
2. Click **Create a project** → **Connect to Git**
3. Select your `senonsurprise-kidszone` repo
4. Settings:
   - **Framework preset**: None
   - **Build command**: *(leave empty)*
   - **Build output directory**: `/` (root)
5. Click **Save and Deploy**

### 3. Custom Domain (Optional)
In Cloudflare Pages → Custom Domains → Add `kidszone.sennaplatform.com`

---

## 🎮 How It Works

### For the Child (1–4 years):
1. **Magic Mirror** — Wipe fog off the camera to see their face (builds motor skills!)
2. **Adventure Game** — 15 bilingual emoji questions, one tap at a time
3. **Celebrations** — Particle bursts + sound on every answer
4. **Sleep Timer** — Auto-stops at 18 minutes (prevents tantrums!)

### For Parents:
1. **Lock button** 🔒 → Math challenge gate (keeps children out)
2. **Dashboard** — Fine Motor / Cognitive / Social-Emotional scores
3. **Badges** — 6 achievement badges earned through play
4. **Bridge Missions** — Real-world offline activities based on today's session
5. **Print Workbook** — Personalised tracing sheets for physical practice

---

## 🌐 Language Toggle
- Tap 🌐 EN / नेपाली to switch instantly
- All 15 questions, celebrations, and narration switch together
- Text-to-Speech works in both English and Nepali

---

## 📱 Device Support
- **Mobile** (iOS Safari, Android Chrome) — Primary target
- **Tablet** — Optimised touch targets
- **Desktop** — Mouse support, works as demo
- **Offline** — All gameplay works without internet; data syncs when reconnected

---

## 🔒 Privacy & Security
- **Zero ads** — No advertising, ever
- **No PII collected** — Only anonymous gameplay scores stored
- **Local-first** — All data stays on device; cloud sync is optional
- **Camera** — Used only for fog-wipe mirror; stream never leaves the browser
- **No tracking pixels** — No Google Analytics, no third-party scripts

---

## 🆚 Why This Beats YouTube Kids

| Feature | YouTube Kids | Senna Kids Zone |
|---------|-------------|-----------------|
| Interactive | ❌ Passive watching | ✅ Active tapping/wiping |
| Screen time limit | ❌ Infinite scroll | ✅ 18-min auto-stop |
| Ads | ⚠️ Still has ads | ✅ Zero ads |
| Offline | ❌ Needs internet | ✅ Full offline PWA |
| Parent insights | ❌ Watch history only | ✅ Developmental metrics |
| Bilingual | ❌ English-centric | ✅ English + Nepali |
| Privacy | ⚠️ Data collection | ✅ Local-first |
| Cost | $0 (with ads) | $0 (truly free) |

---

## 🛠 Adding More Languages

In `src/app.js`, add a new language block to the `LANG` object:
```js
LANG.hi = {
  sleep_title: "सोने का समय! 🌙",
  steps: [ /* 15 Hindi questions */ ],
  // ... all keys
};
```
Then update the toggle logic in `toggleLang()`.

---

## 📊 Cloudflare KV (Optional Analytics)

To enable server-side session storage:
1. In Cloudflare Dashboard → **Workers & Pages** → **KV**
2. Create namespace: `SKZ_KV`
3. In your Pages project → **Settings** → **Functions** → **KV Namespace Bindings**
4. Add binding: Variable `SKZ_KV` → Namespace `SKZ_KV`

Sessions will then persist for 90 days server-side.

---

## 📝 License
MIT — Free to use, modify, and deploy. Please keep the Senna Kids Zone branding for the Nepal pilot.

**Built with ❤️ for children everywhere.**
