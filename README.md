# AdmissionTimes Mobile App

React Native mobile app built with Expo and TypeScript for the AdmissionTimes project.

## Scope

This mobile app currently targets the Student module.

## Quick Answer: Do I Repeat Setup Every Time?

One-time only:
1. Install Node.js and pnpm.
2. Install dependencies with pnpm.
3. Install EAS CLI.
4. Login to Expo CLI.

Repeat every development/testing session:
1. Start Metro bundler.
2. Re-open the app on device/emulator.
3. Keep backend running if you need live API data.

You do not repeat full installation every time. You do repeat Metro startup every time you begin a new run session.

## Prerequisites

1. Node.js: version >=20 and <23
2. pnpm installed globally
3. Android Studio emulator or physical Android device
4. Expo account with access to this project
5. Optional for cloud builds: EAS CLI

## Project Identity (Current)

1. Expo slug: admissiontimes
2. EAS project ID: 49a0e653-a0c9-481d-a9bb-6b6f02cb4ec0
3. Android package: com.bankai_senbonzakura.admissiontimes

## One-Time Setup on a New Machine

1. Open terminal in mobile repo:
```bash
cd E:\fyp\AdmissionTimes-MobileApp
```

2. Install dependencies:
```bash
pnpm install
```

3. Verify TypeScript build health:
```bash
pnpm typecheck
```

4. Install EAS CLI (once):
```bash
npm install -g eas-cli
```

5. Login Expo CLI (once per machine/session if token not cached):
```bash
eas login
eas whoami
eas project:info
```

Expected project info:
- fullName: @bankai_senbonzakura/admissiontimes
- ID: 49a0e653-a0c9-481d-a9bb-6b6f02cb4ec0

## Daily Run Scenarios

## Scenario A: Fast Local Development (Expo Go)

Use this for UI and non-push feature testing.

1. Start Metro:
```bash
pnpm start
```

2. Open in Expo Go:
- Android: scan QR in Expo Go.
- iOS: scan QR with Camera or Expo Go.

Notes:
1. Metro must run while app is connected.
2. If Metro stops, app hot-reload/dev sync stops.
3. For push-notification validation, prefer Scenario B or C.

## Scenario B: Development Client Build (Best for native feature debugging)

Use this when Expo Go limitations block testing.

1. Build development client:
```bash
eas build --platform android --profile development
```

2. Install resulting APK on physical device.

3. Start Metro for dev client:
```bash
npx expo start --dev-client
```

4. Open installed dev client app.

Repeat rules:
1. Build step is not required every day unless native deps/config changed.
2. Metro start is required each active debug session.

## Scenario C: Internal Tester Install (No Metro required at runtime)

Use this for realistic QA and teammate installs.

1. Build preview artifact:
```bash
eas build --platform android --profile preview
```

2. Share/install artifact from EAS build link.

Repeat rules:
1. Rebuild only when app changes need a new binary.
2. End users/testers do not need Metro for normal app usage.

## Scenario D: Production Release Build

1. Build production:
```bash
eas build --platform android --profile production
```

2. Submit/distribute via your release process.

## Push Notification Validation Flow

For reliable push checks, use Scenario B or C on a physical device.

1. Login in app as student and allow notification permission.
2. Confirm token registration in backend DB (`push_notification_tokens`).
3. Run backend smoke test:
```bash
pnpm --dir E:\fyp\admission-times-backend smoke:push
```
4. Validate delivery for:
- foreground
- background
- app closed

## Common Questions

Q: Do I need `eas login` every time?
A: Usually no. Only when session/token expires, machine changes, or you logged out.

Q: Do I need `pnpm install` every time?
A: No. Only first setup or when dependencies change.

Q: Do I need Metro every time?
A: Yes for Expo Go and dev-client live development. No for installed preview/production binaries.

Q: Can I test push fully in Expo Go?
A: Do not rely on Expo Go for full Android push validation in this project. Use dev/preview build on a physical device.

Q: Why does the app sometimes require the same Wi-Fi network?
A: That is only for local development with Metro (Expo Go or dev-client with local LAN URL). Installed preview/production builds do not require same Wi-Fi when backend APIs are publicly reachable.

Q: Can users run the app from any network in future production?
A: Yes. Deploy backend/API to public HTTPS, configure production base URLs, build preview/production app, and users can run from mobile data or any Wi-Fi without Metro.

Q: Why do app icon and push icon look different on Android?
A: Android adaptive launcher icons and notification tray icons have different rendering rules. This project uses separate assets for each: adaptive foreground and monochrome notification icon.

Q: Should Firebase JSON keys be committed?
A: No. Keep Firebase credential files local or in secure CI secrets. This repository ignores service-account and google-services credential files by default.

## Troubleshooting

1. Not logged in error from EAS:
```bash
eas login
eas whoami
eas project:info
```

2. Dependency mismatch:
```bash
npx expo install --fix
pnpm install
```

3. Metro stale cache:
```bash
pnpm start -- --clear
```

4. Build fails due to credentials/permissions:
- Ensure account has access to @bankai_senbonzakura/admissiontimes.
- Ask project owner to add your Expo account role if needed.

## Useful Commands Reference

```bash
pnpm start
pnpm android
pnpm ios
pnpm web
pnpm typecheck
eas whoami
eas project:info
eas build --platform android --profile development
eas build --platform android --profile preview
eas build --platform android --profile production
```
