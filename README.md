# 🦦 ROMO — Your Wellness Companion

A cute otter-themed wellness app: habits, sleep, movement, goals, medications, and recipes. Everything is stored **only on your device** — no accounts, no servers, no tracking.

---

<h3>📸 Screenshots</h3>

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/stats.png" width="220" alt="Stats scoreboard"><br><sub>Year-at-a-glance Stats</sub></td>
    <td align="center"><img src="docs/screenshots/settings-1.png" width="220" alt="Settings profile"><br><sub>Profile &amp; Security</sub></td>
    <td align="center"><img src="docs/screenshots/settings-2.png" width="220" alt="Data management"><br><sub>Backup &amp; Danger Zone</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/settings-3.png" width="220" alt="App updates"><br><sub>In-app updates</sub></td>
    <td align="center"><img src="docs/screenshots/tricks.png" width="220" alt="Trick library"><br><sub>Trick Flow Tree</sub></td>
    <td></td>
  </tr>
</table>

## 📥 Download the App (Android)

**Get the APK here → [ROMO Releases](https://github.com/Nyahmii/Romoo/releases)**

1. Open the link above and click the **newest release** (top of the list).
2. Under **Assets**, tap **`app-release.apk`** to download it.
3. Open the downloaded file on your phone and install it (allow "install from unknown sources" if asked).

### 🔄 Updating the app (over-the-air)
You don't need to download a new APK every time:

1. Open Romo.
2. Go to **Settings** (bottom-right tab).
3. **Scroll down** to the bottom of the page.
4. Tap **Check for updates**.
5. If an update is available, tap **Update** → your browser downloads it → tap **Install**.

Your data (check-ins, meds, recipes, goals) stays safe during updates.

---

## ✨ What Romo Does

- **Daily check-ins** — mood, energy, gratitude, notes
- **Sleep tracker** — including interrupted/multi-block nights
- **Movement tracker** — walks, yoga, dance, stretching
- **Goals** — a simple board (Active / On Hold / Done) with nested tasks
- **Medications** — daily, every-X-days, weekly, bi-weekly, or monthly schedules, with reminders and refill alerts
- **Recipes** — search open recipe sources, filter by diet (vegan, vegetarian, gluten-free, dairy-free, nut-free, egg-free), or import any recipe link ad-free into your personal Recipe Box
- **Stats** — charts for mood, sleep, movement, and medication adherence
- **Privacy** — optional PIN lock, JSON backup export/import

---

## 🛠️ Build It Yourself

**You need:** Node.js 18+, Android Studio (with JDK 17), Git.

```bash
git clone https://github.com/Nyahmii/Romoo.git
cd Romoo
npm install
```

### 2. Web build + Capacitor sync (always from repo root)
```bash
npm run build
npx cap sync android        # if "android not added": npx cap add android && npx cap sync android
```

### 3a. Debug APK (testing only - not for OTA)
```bash
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

### 3b. Signed release APK (required for OTA upgrades)
Point Gradle at your keystore via **environment variables** (never hardcode passwords):
```bash
export ROMOO_STORE_FILE="$HOME/secure/romo-release.jks"
export ROMOO_KEY_ALIAS="romo"
read -s ROMOO_STORE_PASSWORD; export ROMOO_STORE_PASSWORD
read -s ROMOO_KEY_PASSWORD;   export ROMOO_KEY_PASSWORD

cd android && ./gradlew clean assembleRelease
unset ROMOO_STORE_PASSWORD ROMOO_KEY_PASSWORD
# → android/app/build/outputs/apk/release/app-release.apk
```
`android/app/build.gradle` must read these via `System.getenv(...)` / `project.findProperty(...)` in its `signingConfigs.release` block, and `buildTypes.release` must use `signingConfig signingConfigs.release`.

### 4. Verify the signature
```bash
"$ANDROID_HOME/build-tools/<ver>/apksigner" verify --print-certs \
  app/build/outputs/apk/release/app-release.apk
```

### 5. OTA release rules
- **Same keystore/certificate** every release (changing it forces uninstall/reinstall)
- **Same `applicationId`**
- **Higher `versionCode`** each release (`versionName` is display-only)
- Bump both, then publish the APK as a GitHub release; phones update via the 🦦 banner

### Install on a device
- USB: copy APK → tap to install (allow "unknown sources"), or `adb install -r <apk>`
- Email / cloud drive → open & install

### Troubleshooting
- **"SDK location not found"** → set `ANDROID_HOME`, or `android/local.properties` with `sdk.dir=/path/to/sdk`
- **Gradle sync fails** → JDK 17 (`java -version`); Android Studio → *Invalidate Caches / Restart*
- **Crash on launch** → ensure `npm run build` succeeded before `npx cap sync`; check `logcat`
- **Build run from wrong dir** → Capacitor/Gradle commands must run from **repo root**, not inside `android/`

---

## 💻 Development
```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # preview prod build
```

### Project structure
```
Romoo/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx          # check-ins, sleep (multi-block), movement, today's meds
│   │   ├── GoalsPage.tsx          # Trello-style board + nested tasks
│   │   ├── RecipesPage.tsx        # 3-source search, combined filters, ad-free import, My Box
│   │   ├── MedicationsPage.tsx    # custom schedules, pills-left, adherence, reminders
│   │   ├── StatsPage.tsx          # year charts, adherence, sleep-vs-goal, heatmap
│   │   ├── TrickLibraryPage.tsx   # learned-tricks shelf
│   │   ├── HistoryPage.tsx        # historical logs
│   │   ├── SettingsPage.tsx       # profile, PIN, recipes toggle, data mgmt
│   │   ├── Layout.tsx             # header + bottom nav (edge-to-edge safe)
│   │   ├── Onboarding.tsx
│   │   ├── LockScreen.tsx         # PIN entry
│   │   └── UpdateChecker.tsx      # OTA banner
│   ├── services/
│   │   ├── updater.ts             # version check + in-place update flow
│   │   └── widgetSync.ts          # home-screen widget data
│   ├── utils/
│   │   └── medicationSchedule.ts  # shared schedule/interval logic (single source of truth)
│   ├── data/
│   │   └── affirmations.ts        # daily affirmations
│   ├── hooks/
│   │   └── useLocalStorage.ts
│   ├── types.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── android/                       # native project (after cap add)
├── dist/                          # build output
├── capacitor.config.ts
├── package.json
└── README.md
```
> Note: `src/services/llm.ts` and `src/data/recipes.ts` were **removed** (no AI, no built-in recipes).

### Tech stack
- **Frontend**: React 18.2 + TypeScript 5
- **Styling**: Tailwind CSS 3.3
- **Charts**: Recharts 2.12 · **Icons**: Lucide React · **Dates**: date-fns
- **Mobile**: Capacitor (Android) + `@capacitor/core` (`CapacitorHttp` for native fetch in the importer) + `@capacitor/local-notifications`
- **Build tool**: Vite 6

### Adding features
- **New page** → component in `src/components/`, route in `App.tsx`, tab in `Layout.tsx`
- **New data type** → interface in `types.ts`, persist via `useLocalStorage`
- **New med frequency** → extend `utils/medicationSchedule.ts` (don't duplicate `scheduledOn`)
- **New recipe source** → add an adapter in `RecipesPage.tsx` that returns the unified `UniMeal` shape

---

## 🔧 Configuration

### Recipe sources & import
- Open data: **TheMealDB**, **DummyJSON**, **Wikibooks Cookbook** (community recipes, CC-BY-SA)
- **Ad-free import** priority: schema.org JSON-LD → microdata → RDFa → HTML fallback → `og:image` for the photo
- Wikibooks URLs import directly via Wikimedia's CORS-open API (no proxy)

### Diet filters
Vegan / Vegetarian / Gluten-free / Dairy-free / Nut-free / Egg-free - ingredient-based **helpers**, shown with a "double-check labels for allergies" reminder. Not a medical guarantee.

### Medication schedules
Daily · Every X days (interval, anchored to start) · Weekly · Bi-weekly · Monthly; multiple times/day; pills-left + refill threshold; reminders via local notifications (repeating for daily/weekly, discrete upcoming for the rest).

### OTA updates
Signed release APK + in-app banner. Requires identical signing certificate, identical `applicationId`, and a strictly higher `versionCode`. Install preserves `localStorage`.

---

## 🚀 Deployment

### Web (static)
```bash
npm run build   # upload dist/ to any static host
```
Vercel · Netlify · GitHub Pages (`gh-pages` branch) · Cloudflare Pages

### Android
- **Direct download / GitHub Releases** (primary - powers OTA)
- Google Play (signed AAB), APKPure, Amazon Appstore, F-Droid

---

## 🤝 Contributing
Fork → branch (`feature/...`) → commit → push → PR.

Ideas: more diet tags (low-FODMAP with portion awareness, halal/kosher), explicit-vs-inferred allergen confidence, parser test fixtures, code-split the large JS bundle, dark mode, multi-language, customizable Romo, more affirmations.

---

## 📝 License
MIT - see [LICENSE](./LICENSE).

## 🙏 Acknowledgments
- **Otter mascot** - real river otters are amazing 🦦
- **Recipe data** - TheMealDB, DummyJSON, Wikibooks Cookbook (CC-BY-SA)
- **Icons** Lucide · **Charts** Recharts · **Framework** React + Vite + Capacitor

## 🦦 About Romo
Romo is more than an app - it's your friendly otter on your wellness journey: habits, goals, meds, meals, and stats, all kept privately on your device.

**Progress, not perfection. You're doing amazing!** 💛

