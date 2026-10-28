# Changelog

All notable changes to ROMO will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-02-02

### Added
- 🤖 **Local LLM Integration**
  - WebLLM support (browser-based TinyLlama 1.1B)
  - Ollama support (local server connection)
  - AI-powered recipe generation
  - Meal analysis and suggestions
  - Toggle on/off in Settings
  
- 🌐 **Web Recipe Search**
  - DuckDuckGo API integration
  - Search for recipes online
  - No API key required
  - Toggle on/off in Settings

- 📊 **Statistics Page**
  - Mood & Energy trends (7-day line chart)
  - Sleep duration tracking (bar chart)
  - Movement activity (bar chart)
  - Goals by category (pie chart)
  - Weekly wellness radar (radar chart)
  - Quick stats cards
  - Personalized insights from Romo

- 🔐 **Security Features**
  - Optional PIN protection (4-8 digits)
  - Lock screen with shake animation
  - All data stored locally (no servers)
  - Data export/import (JSON backup)

- 📱 **Android APK Support**
  - Capacitor integration
  - Build scripts for APK generation
  - GitHub Actions workflow for automated builds
  - Optimized for Android 5.0+ (last 5 years of phones)

- 🎨 **UI/UX Improvements**
  - Complete redesign with otter theme
  - Mobile-first responsive design
  - Bottom navigation
  - Smooth animations and transitions
  - Interactive onboarding flow
  - Daily affirmations (30+ messages)

### Changed
- Migrated from original ROMO codebase to modern React + TypeScript
- Replaced external API dependencies with local storage
- Improved recipe library with 10+ built-in recipes
- Enhanced goal tracking with task breakdown
- Better sleep tracker with duration calculations
- Improved movement tracker with activity types

### Fixed
- Sleep tracker logic (now tracks previous night correctly)
- Recipe image issues (replaced with emojis)
- Broken imports and missing components
- Type safety issues
- Mobile responsiveness problems

### Removed
- External API dependencies (OpenAI)
- Server-side requirements
- User accounts and authentication
- Tracking and analytics

## [1.0.0] - 2025-02-01

### Added
- Initial release
- Basic goal tracking
- Simple recipe library
- Daily check-in system
- Sleep tracking
- Movement tracking
- Hobby tracking

### Known Issues
- Sleep tracker logic unclear
- Recipe images missing
- UI inconsistencies
- Mobile optimization needed

---

## Version History

- **v2.0.0** - Complete rebuild with AI, statistics, security, and Android support
- **v1.0.0** - Initial release with basic wellness tracking features

---

## Upcoming Features (Planned)

- [ ] Dark mode theme
- [ ] More built-in recipes (50+)
- [ ] Customizable Romo appearance
- [ ] Habit reminders and notifications
- [ ] Export data as CSV
- [ ] Multi-language support
- [ ] Social sharing features
- [ ] More LLM providers
- [ ] Advanced statistics (monthly/yearly views)
- [ ] Custom chart configurations
- [ ] Goal templates
- [ ] Recipe meal planning
