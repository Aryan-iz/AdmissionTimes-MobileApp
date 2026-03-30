# Mobile Technical Specs

## Stack

- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript 5
- React Navigation 7
- Zustand
- Axios
- Supabase JS 2.x

## Scripts

- `pnpm start`
- `pnpm android`
- `pnpm ios`
- `pnpm web`
- `pnpm typecheck`

## API Surfaces in Use

- Auth: `/auth/*`
- Student dashboard: `/student/dashboard`
- Admissions: `/admissions*`
- Watchlists: `/watchlists*`
- Deadlines: `/deadlines*`
- Notifications: `/notifications*`
- AI: `/ai/chat`, `/ai/health`

## Runtime Notes

- Mobile app expects backend reachability from device network.
- Notification sync uses API-first approach; realtime can be optional.

Updated: 2026-03-30
