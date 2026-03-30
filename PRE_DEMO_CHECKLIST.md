# Pre-Demo Checklist for FYP

Use this checklist before the demonstration of the student-only mobile app.

---

## Technical Verification

### Build & Startup
- [ ] Run `pnpm install`
- [ ] Run `pnpm typecheck`
- [ ] Run `pnpm start`
- [ ] Confirm Expo starts without errors
- [ ] Confirm VS Code shows no TypeScript or lint-blocking issues

### Backend Connectivity
- [ ] Backend health endpoint is reachable from the demo device/network
- [ ] Mobile app resolves the correct backend base URL
- [ ] `/api/v1/auth/me` responds successfully after sign-in
- [ ] Notifications, dashboard, and watchlist APIs return live data

### Device Testing
- [ ] App launches on Android device/emulator
- [ ] App launches on iOS device/simulator if available
- [ ] No crash on first render
- [ ] Login and navigation feel responsive

---

## Authentication Testing

- [ ] Sign in works with a valid student account from the configured backend/Supabase project
- [ ] Invalid credentials show a clean error
- [ ] Non-student accounts are rejected in mobile scope
- [ ] Session persists after reload
- [ ] Logout works correctly

---

## Student Feature Testing

### Dashboard
- [ ] Dashboard loads from backend without errors
- [ ] Statistics render correctly
- [ ] Recommendations and deadlines appear when available
- [ ] Quick actions navigate correctly

### Search Admissions
- [ ] Search screen loads current admissions
- [ ] Search and filters work
- [ ] Save/remove watchlist actions work
- [ ] Compare flow works from selected results

### Watchlist
- [ ] Saved programs appear from backend watchlist data
- [ ] Remove from watchlist works
- [ ] Alert toggle persists
- [ ] Compare works with 2+ selected items

### Deadlines
- [ ] Deadline list loads
- [ ] Days remaining and status badges look correct
- [ ] Filters work
- [ ] Program detail navigation works

### Notifications
- [ ] Notifications list loads from backend
- [ ] Mark one as read works
- [ ] Mark all as read works
- [ ] Navigation from admission-related notification works

### Program Details
- [ ] Program detail loads from store/backend-fed data
- [ ] Save/remove action works
- [ ] Official link behavior is correct
- [ ] Related programs section renders

### AI Assistant
- [ ] AI button and modal work
- [ ] Context reflects current student screen

---

## Documentation Review

- [ ] README explains student-only scope accurately
- [ ] SCOPE.md reflects backend-integrated student module
- [ ] CHANGES.md reflects final cleanup and API integration

---

## Viva Preparation

### Key messages
- [ ] "The mobile app is intentionally student-only in this phase"
- [ ] "Student flows are integrated with backend APIs, not mock datasets"
- [ ] "Supabase handles auth/session while backend owns business data"
- [ ] "Realtime notifications have polling/focus fallback for mobile reliability"

### If asked about other roles
- [ ] Explain that admin/university mobile modules are intentionally out of scope for this phase
- [ ] Explain that current effort focused on a complete student workflow with stable integration

---

## Recommended Demo Flow

1. Sign in with a valid student account
2. Show dashboard stats/recommendations
3. Search admissions and apply filters
4. Save a program to watchlist
5. Open watchlist and toggle alerts
6. Compare programs
7. Open deadlines
8. Open notifications and mark items read
9. Open program detail
10. Show AI assistant
11. Logout

---

## Backup Plan

- [ ] Have backend already running and verified before the demo
- [ ] Keep a backup student account ready
- [ ] Keep screenshots/video of the happy path
- [ ] Keep device and laptop charged
