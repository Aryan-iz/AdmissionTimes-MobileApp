# AdmissionTimes (Mobile)

This is a React Native (Expo + TypeScript) mobile application for the Admission Times platform.

## 🎯 Current Scope (FYP Phase)

**This mobile app implements ONLY the STUDENT MODULE.**

Admin and University Representative modules are intentionally excluded in this phase and planned as future work. This is a deliberate scope decision for the Final Year Project demonstration.

## ✅ Student Module Features

The following features are fully functional for Student users:

- ✅ **Authentication** - Student login via Supabase + backend identity (`/auth/me`)
- ✅ **Dashboard** - Personalized stats, recommendations, and quick actions
- ✅ **Search Admissions** - Search, filter, and browse available programs
- ✅ **Compare Programs** - Side-by-side comparison (up to 4 programs)
- ✅ **Watchlist** - Save and track favorite programs
- ✅ **Deadlines** - View upcoming admission deadlines
- ✅ **Notifications** - Admission updates and system alerts
- ✅ **Program Details** - Detailed view of each admission program
- ✅ **AI Assistant** - Context-aware chat assistant for guidance
- ✅ **Backend Integration** - Student data from backend APIs (no in-app mock datasets)

## 🚫 Out of Scope (Current Phase)

The following modules are **not implemented in this mobile app phase**:

- ❌ Admin Dashboard
- ❌ Admin Verification Center
- ❌ Admin Analytics
- ❌ Admin Scraper Jobs Monitor
- ❌ University Dashboard
- ❌ University Manage Admissions
- ❌ University Verification Center

These modules are planned for future phases and are not included in the current code paths.

## 📱 Account Access

Use a valid student account from your configured backend/Supabase environment.

> **Note:** University and Admin role routing is not included in this version.

## 🏗️ Architecture

This folder is a React Native (Expo) structure that mirrors the web app architecture.

### Project Structure
- `screens/` (equivalent to web `pages/`)
  - `student/` - Student feature screens ✅ ACTIVE
  - `auth/` - Authentication screens
- `contexts/`
   - `AiContext.tsx` - AI assistant state
- `data/` - Student types and display utilities
- `services/` - Backend API clients + Supabase auth
- `store/` - Zustand auth/student stores
- `components/` - Reusable UI components
- `navigation/` - App navigation configuration

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- pnpm (or npm)
- Expo Go app on your mobile device (for testing)

### Installation

1. Navigate to the mobile folder:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the Expo development server:
   ```bash
   pnpm start
   ```

4. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

### Building for Production

Build the app for Android or iOS:
```bash
eas build --platform android
eas build --platform ios
```

## 🔧 Development Notes

### Working Directory
**Recommended:** Always run Expo from the `mobile/` folder for the cleanest setup.
- ✅ `cd mobile && pnpm start`
- ⚠️ Running from repo root may cause dependency resolution warnings

### pnpm + Metro Configuration
This project uses a local `index.js` entrypoint (see `main` in `package.json`) because pnpm can cause Metro to resolve `expo/AppEntry.js` incorrectly from the pnpm store path.

## 🐛 Troubleshooting

### SDK Version Issues
If Expo Go says the project SDK is incompatible:
- Ensure `app.json` has `sdkVersion: 54.0.0` 
- Ensure `expo` package is `~54.0.0`

### Missing Modules
If bundling fails with missing modules:
```bash
npx expo install --fix
pnpm add @babel/runtime
```

### Metro Resolution Issues
If you see `TurboModuleRegistry.getEnforcing(...)` errors:
- Make sure you start Expo from inside `mobile/`
- Check `metro.config.js` is resolving from `mobile/node_modules`

### Import Errors
If Metro complains about imports or stale caches:
- clear Expo cache and restart the bundler
- verify dependencies are installed and TypeScript passes

## 📚 Data Source

This app is backend-driven for the student module. Admissions, watchlists, deadlines, notifications, and dashboard data come from configured backend APIs.

## 🔮 Future Enhancements

Planned for future phases:
- Admin module implementation
- University Representative module implementation
- Expanded backend capabilities
- Push notifications
- Offline mode
- Advanced filtering and search
- Social features (sharing, reviews)

## 📄 License

This is a Final Year Project demonstration application.
