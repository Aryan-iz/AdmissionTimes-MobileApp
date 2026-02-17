# AdmissionTimes (Mobile)

This folder is a React Native (Expo) structure that mirrors the web app.

## Rules mirrored from web
- `pages/` -> `screens/`
- `student/`, `university/`, `admin/` stay separate
- `StudentDataContext` + `UniversityDataContext` are reused (same logic)
- Mock data is reused from the web project for now (no backend)

## Run (after installing dependencies)
Recommended (treat `mobile/` as the app root):
1) Open a terminal in this folder (or `cd mobile`)
2) Install deps: `pnpm install` (or `npm install`)
3) Start Expo: `pnpm start` (or `npm run start`)

Tip (VS Code): if you want `mobile/` to behave like the “root project”, open the `mobile/` folder directly using **File → Open Folder…**.

Running Expo from the repo root is optional.

- If you run `npx expo start` from the repo root, it works because a root [App.tsx](../App.tsx) shim points to the mobile app.
- However, it may pick up the web workspace dependencies (and show extra version warnings).
- For the cleanest mobile setup, always start Expo from inside `mobile/`.

### Note about pnpm + Metro
This project uses a local `index.js` entrypoint (see `main` in `package.json`) because pnpm can cause Metro to resolve `expo/AppEntry.js` from the pnpm store path, which breaks its internal `../../App` import.

## Troubleshooting
- If Expo Go says the project SDK is incompatible: ensure `app.json` has `sdkVersion: 54.0.0` and `expo` is `~54.0.0`.
- If bundling fails with missing modules like `expo-modules-core`, `expo-asset`, `expo-constants`, or `@babel/runtime/*`: run `npx expo install --fix` and then `pnpm add @babel/runtime`.
- If you see `TurboModuleRegistry.getEnforcing(...)` at runtime: make sure you start Expo from inside `mobile/` and keep Metro resolving only from `mobile/node_modules` (see `metro.config.js`).

If Metro complains about importing from `../src/*`, copy the mock data files from the web app into `mobile/src/data`.
