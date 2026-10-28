# 🦦 ROMO - Your Wellness Companion

<div align="center">

![ROMO Logo](https://img.shields.io/badge/ROMO-Wellness%20Companion-amber?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38bdf8?style=flat-square&logo=tailwind-css)
![Android](https://img.shields.io/badge/Android-APK%20Ready-3ddc84?style=flat-square&logo=android)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**A charming productivity and wellness web app featuring AI-powered recipe generation, comprehensive habit tracking, and detailed statistics. Designed with a cute otter-themed interface to bring joy and simplicity to managing daily tasks, goals, and health.**

[Features](#-features) • [Installation](#-installation) • [Android APK](#-android-apk-build) • [Development](#-development) • [Screenshots](#-screenshots)

</div>

---

## 🌟 Features

### 📊 Core Wellness Tracking
- **Daily Check-ins**: Track your mood, energy levels, gratitude, and daily reflections
- **Sleep Tracker**: Log bedtime, wake time, and sleep quality with duration calculations
- **Movement Tracker**: Record physical activities (stretching, walking, yoga, dance) with duration and intensity
- **Streak System**: Build and maintain daily habit streaks

### 🎯 Goals & Habits
- **Goal Management**: Create, track, and complete personal goals across 5 categories (Health, Learning, Creative, Personal, Career)
- **Task Breakdown**: Break goals into actionable tasks with progress tracking
- **Visual Progress**: Progress bars and completion percentages
- **Filtering**: View all, active, or completed goals

### 🍽️ Recipe Library
- **Built-in Recipes**: 10+ curated healthy recipes with full instructions
- **Category Filtering**: Browse by meal type (breakfast, lunch, dinner, snacks, desserts)
- **Search Functionality**: Find recipes by name or tags
- **Favorites**: Save your favorite recipes for quick access
- **Detailed View**: Full ingredient lists, step-by-step instructions, prep/cook times

### 🤖 AI-Powered Features (Optional)
- **Local LLM Integration**: 
  - **WebLLM**: Browser-based AI using TinyLlama 1.1B (runs entirely on device)
  - **Ollama Support**: Connect to local Ollama instance for more powerful models
  - **Privacy-First**: All AI processing happens locally - no data leaves your device
- **AI Recipe Generation**: Generate custom recipes based on your preferences
- **Meal Analysis**: Get nutritional insights and suggestions
- **Toggle On/Off**: Enable or disable AI features anytime in Settings

### 🌐 Web Recipe Search (Optional)
- **DuckDuckGo Integration**: Search the web for recipes (no API key required)
- **Toggle Control**: Enable/disable in Settings
- **External Links**: Results link directly to recipe websites

### 📈 Statistics & Analytics
- **Visual Charts**: 
  - Mood & Energy trends (7-day line chart)
  - Sleep duration tracking (bar chart)
  - Movement activity (bar chart)
  - Goals by category (pie chart)
  - Weekly wellness radar (radar chart)
- **Quick Stats**: Average energy, sleep hours, total active minutes, current streak
- **Personalized Insights**: Romo provides customized tips based on your data
- **Historical Data**: Review all past check-ins, sleep logs, and movements

### 🔐 Security & Privacy
- **100% Local**: All data stored in browser localStorage - no servers, no accounts
- **Optional PIN Protection**: Set a 4-8 digit PIN to lock the app
- **Lock Screen**: Beautiful PIN entry with shake animation on wrong attempts
- **Data Export**: Backup your data as JSON
- **Data Import**: Restore from previous backups
- **No Tracking**: Zero analytics, zero data collection

### 🎨 User Experience
- **Mobile-First Design**: Optimized for Android phones (last 5 years)
- **Otter Mascot**: Friendly Romo otter guides you through the app
- **Onboarding Flow**: Interactive tutorial for new users
- **Daily Affirmations**: 30+ positive messages that rotate daily
- **Smooth Animations**: Polished transitions and interactions
- **Bottom Navigation**: Easy one-handed access to all features
- **Responsive Layout**: Works beautifully on phones, tablets, and desktops

---

## 📱 Android APK Build

### Prerequisites

Before building the APK, ensure you have:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Android Studio** - [Download](https://developer.android.com/studio)
3. **Java JDK 17** (comes with Android Studio)
4. **Git** - [Download](https://git-scm.com/)

### Step-by-Step Build Instructions

#### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ROMO.git
cd ROMO
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Build the Web App

```bash
npm run build
```

This creates the optimized web app in the `dist/` folder.

#### 4. Add Android Platform

```bash
npx cap add android
```

This creates the `android/` folder with native Android project files.

#### 5. Sync Web Assets to Android

```bash
npx cap sync android
```

This copies the built web app into the Android project.

#### 6. Open in Android Studio

```bash
npx cap open android
```

Android Studio will open with the project loaded.

#### 7. Build the APK

In Android Studio:

1. **Wait for Gradle sync** to complete (first time may take 5-10 minutes)
2. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. Wait for the build to complete
4. Click **"locate"** in the notification to find your APK

The APK will be located at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

#### 8. Build Release APK (Optional)

For a signed release APK:

1. In Android Studio, go to **Build > Generate Signed Bundle / APK**
2. Select **APK** and click **Next**
3. Create a new keystore or use existing one
4. Select **release** build variant
5. Click **Finish**

The release APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Quick Build Script

Create a `build-apk.sh` script for easier builds:

```bash
#!/bin/bash

echo "🦦 Building ROMO Android APK..."

# Build web app
echo "📦 Building web app..."
npm run build

# Sync with Android
echo "🔄 Syncing with Android..."
npx cap sync android

# Build APK using Gradle
echo "🔨 Building APK..."
cd android
./gradlew assembleDebug

echo "✅ APK built successfully!"
echo "📱 Location: android/app/build/outputs/apk/debug/app-debug.apk"
```

Make it executable:
```bash
chmod +x build-apk.sh
./build-apk.sh
```

### Installing on Android Device

#### Method 1: USB Transfer
1. Connect your Android phone via USB
2. Copy the APK file to your phone
3. Open the file manager on your phone
4. Tap the APK file to install
5. Enable "Install from unknown sources" if prompted

#### Method 2: ADB Install
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

#### Method 3: Email/Cloud
1. Email the APK to yourself or upload to Google Drive
2. Open on your phone and install

### Troubleshooting

**Build fails with "SDK location not found"**
- Set `ANDROID_HOME` environment variable to your Android SDK path
- Or create `android/local.properties` with: `sdk.dir=/path/to/android/sdk`

**Gradle sync fails**
- Ensure you have Java JDK 17 installed
- Run `java -version` to verify
- In Android Studio: File > Invalidate Caches / Restart

**App crashes on launch**
- Check Android Studio logcat for errors
- Ensure `npm run build` completed successfully before `npx cap sync`
- Try `npx cap sync android` again

**WebLLM not working on older phones**
- WebLLM requires WebGPU support (Chrome 113+)
- Older phones may need to use Ollama instead
- Or disable LLM features in Settings

---

## 💻 Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure

```
ROMO/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.tsx    # Main dashboard with check-ins
│   │   ├── GoalsPage.tsx    # Goals and habits management
│   │   ├── RecipesPage.tsx  # Recipe library with AI features
│   │   ├── StatisticsPage.tsx # Charts and analytics
│   │   ├── HistoryPage.tsx  # Historical data view
│   │   ├── SettingsPage.tsx # App settings and security
│   │   ├── Layout.tsx       # Main layout with navigation
│   │   ├── Onboarding.tsx   # First-time user setup
│   │   └── LockScreen.tsx   # PIN protection screen
│   ├── services/
│   │   └── llm.ts          # LLM integration (WebLLM/Ollama)
│   ├── data/
│   │   ├── recipes.ts      # Built-in recipe database
│   │   └── affirmations.ts # Daily affirmation messages
│   ├── hooks/
│   │   └── useLocalStorage.ts # LocalStorage hook
│   ├── types.ts            # TypeScript type definitions
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── android/                # Android native project (after cap add)
├── dist/                   # Production build output
├── capacitor.config.ts     # Capacitor configuration
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

### Technology Stack

- **Frontend**: React 18.2 + TypeScript 5.0
- **Styling**: Tailwind CSS 3.3
- **Charts**: Recharts 2.12
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **AI/LLM**: @mlc-ai/web-llm (browser-based)
- **Mobile**: Capacitor (Android)
- **Build Tool**: Vite 4.4

### Adding New Features

1. **New Page**: Create component in `src/components/`, add to `App.tsx` routing
2. **New Data Type**: Add interface in `src/types.ts`, use `useLocalStorage` hook
3. **New Recipe**: Add to `src/data/recipes.ts` array
4. **New Affirmation**: Add to `src/data/affirmations.ts` array

---

## 📸 Screenshots

<div align="center">

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)
*Daily check-ins, mood tracking, and quick stats*

### Goals
![Goals](docs/screenshots/goals.png)
*Goal management with task breakdown and progress tracking*

### Recipes
![Recipes](docs/screenshots/recipes.png)
*Recipe library with AI generation and web search*

### Statistics
![Statistics](docs/screenshots/statistics.png)
*Visual charts and analytics for all your data*

### Settings
![Settings](docs/screenshots/settings.png)
*PIN protection, LLM settings, and data management*

</div>

---

## 🔧 Configuration

### LLM Settings

**WebLLM (Browser-based)**
- Runs entirely in the browser using WebGPU
- Uses TinyLlama 1.1B model (~700MB download, cached after first use)
- Requires Chrome 113+ with WebGPU support
- Best for phones from 2021 onwards

**Ollama (Local Server)**
- Connect to Ollama running on your computer or another device
- Supports more powerful models (Llama 3.2, Mistral, Phi, etc.)
- Requires Ollama installation: https://ollama.ai
- Default URL: `http://localhost:11434`

### Web Search

- Uses DuckDuckGo Instant Answer API
- No API key required
- Requires internet connection
- Can be disabled in Settings

---

## 🚀 Deployment

### Web Deployment

The app can be deployed to any static hosting service:

```bash
npm run build
# Upload dist/ folder to your hosting provider
```

**Recommended Platforms:**
- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop `dist/` folder
- **GitHub Pages**: Push `dist/` to `gh-pages` branch
- **Cloudflare Pages**: Connect repository

### Android Distribution

**Google Play Store**
1. Build signed release APK/AAB in Android Studio
2. Create Google Play Developer account ($25 one-time fee)
3. Create app listing with screenshots and description
4. Upload AAB (Android App Bundle) format
5. Submit for review (typically 1-3 days)

**Alternative Distribution**
- **APKPure**: Upload APK directly
- **Amazon Appstore**: Submit APK
- **Direct Download**: Host APK on your website
- **F-Droid**: Submit to open-source app store

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Ideas for Contributions

- [ ] Dark mode theme
- [ ] More built-in recipes
- [ ] Additional chart types
- [ ] Export data as CSV
- [ ] Habit reminders/notifications
- [ ] More LLM providers
- [ ] Multi-language support
- [ ] Customizable Romo appearance
- [ ] Social sharing features
- [ ] More affirmation messages

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Otter Mascot Inspiration**: Real river otters are amazing creatures!
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **AI Models**: [MLC AI](https://github.com/mlc-ai/mlc-llm) and [Ollama](https://ollama.ai)
- **Framework**: [React](https://react.dev/) and [Vite](https://vitejs.dev/)


---

## 🦦 About Romo

Romo is more than just an app - it's your friendly otter companion on your wellness journey. Whether you're tracking habits, setting goals, or discovering new recipes, Romo is here to support you with kindness and encouragement.

**Remember**: Progress, not perfection. You're doing amazing! 💛

