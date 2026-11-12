# 🦦 ROMO - Your Wellness Companion

A charming productivity & wellness app with habit tracking, **custom medication schedules**, and a **from-scratch recipe box** built from open web sources - all stored **100% locally**. Cute otter included.

> No accounts. No servers. No tracking. No AI. Just you and Romo. 💛

Features · Installation · Android APK · Development · Screenshots

---

## 🌟 Features

### 📊 Wellness Tracking
- **Daily Check-ins** - mood, energy (1–5), gratitude, reflections
- **Sleep Tracker** - single or **interrupted / multi-block** nights (e.g. 3h + 5h) with auto totals + quality
- **Movement Tracker** - stretch / walk / yoga / dance / other, with duration & intensity
- **Streak System** - daily habit streaks

### 🎯 Goals
- Create & track goals across 5 categories (Health, Learning, Creative, Personal, Career)
- **Trello-style board** - Active / On Hold / Completed columns
- Nested tasks (up to 10 levels deep), progress bars & completion %

### 💊 Medications (custom schedules)
- Frequencies: **Daily · Every X days (interval) · Weekly · Bi-weekly · Monthly**
- Interval schedules are **anchored to the start date** (stable even if a dose is late/skipped)
- Multiple times per day, pills-left counter + refill threshold, per-intake notes
- **Reminder notifications** on phone (repeating for daily/weekly; discrete upcoming for interval/bi-weekly/monthly)
- Month & year **adherence %**

### 🍽️ Recipe Box (no AI, no built-ins)
- **Search + browse** across three open sources: **TheMealDB**, **DummyJSON**, **Wikibooks Cookbook**
- **Combined filters in one search**: text + category + region + ingredient + diet, with page-by-page results
- **Diet filters**: 🌱 Vegan · 🥦 Vegetarian · 🌾 Gluten-free · 🥛 Dairy-free · 🥜 Nut-free · 🥚 Egg-free *(ingredient-checking helpers - always double-check labels for allergies)*
- **Ad-free URL import**: paste any recipe link → strips ads/life-story, keeps ingredients + steps + photo (schema.org JSON-LD → microdata/RDFa → HTML fallback + `og:image`)
- **My Box**: save any recipe (built-in-style, web result, or import) to your personal in-app repository

### 📈 Statistics
- Year-by-year charts with ‹ › navigation, med adherence, sleep-vs-goal, year heatmap
- Mood/energy trends, sleep & movement bars, goals pie, weekly wellness radar
- Quick stats: avg energy, avg sleep, active minutes, current streak

### 🎓 Learned Tricks
- A "tricks shelf" listing landed tricks with category breadcrumbs

### 🔐 Security & Privacy
- **100% local** - all data in `localStorage`; no servers, no accounts
- Optional **PIN** lock screen (4–8 digits, shake on wrong entry)
- **Export / Import** full backup as JSON
- Recipe search/import makes outbound requests only to the open sources listed above (or the URL you paste); **no personal data is uploaded**

### 🎨 Experience
- Mobile-first, responsive (phone / tablet / desktop)
- Otter mascot, onboarding flow, 30+ rotating daily affirmations, smooth animations
- **Bottom navigation clears the Android system bar** (edge-to-edge safe)
- **Home-screen widget** - top goals, streak 🔥, weekly med %

### 📲 OTA Updates
- In-place updates via the in-app 🦦 banner → browser download → install, **data preserved**
- Signed release APKs; same certificate + higher `versionCode` required for upgrades

---

## 📱 Android APK Build

### Prerequisites
1. **Node.js** v18+
2. **Android Studio** + **Java JDK 17**
3. **Git**
4. A **release keystore stored OUTSIDE the repo** (e.g. `~/secure/romo-release.jks`) with its password + key password kept in a password manager

### 1. Clone & install
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

