# Student Module React Native Integration Report (Code-Audited)

## 1) Purpose
This document is a code-audited integration guide for implementing the **Student module in React Native** using the existing Admission Times backend, Supabase auth/session, and current web architecture patterns.

It covers:
- frontend implementation audit (what web already does),
- backend endpoint + domain behavior audit,
- Supabase integration boundaries,
- reminder/notification automation behavior (7/3/1),
- RN implementation decisions: **same as web vs RN-specific adaptation**.

---

## 2) Executive Decision (Final)
For React Native student module, use:

- **Supabase for auth/session/token lifecycle only**
- **Backend `/api/v1/*` for all student business data**
- **Realtime optional transport + polling fallback**

Do **not** add direct Supabase table queries for student domain logic in RN (admissions/watchlist/deadlines/notifications/recommendations).

---

## 3) Code Audit Summary (Current Web Baseline)

## 3.1 Auth + Session (Web)
Current web implementation:
- Supabase session source: `src/services/supabase.ts`
- Zustand auth bootstrap/signin/signup/signout: `src/store/authStore.ts`
- Backend identity fetch after login: `authService.getCurrentUser()` → `GET /api/v1/auth/me`
- API JWT injection interceptor: `src/services/apiClient.ts`

Observed behavior:
1. Sign in via Supabase (`supabase.auth.signInWithPassword`) in store.
2. Fetch backend user profile/role (`/auth/me`).
3. Route by role (`student`, `university`, `admin`).
4. All API requests attach Supabase JWT in `Authorization: Bearer <token>`.

RN parity:
- Keep same sequence.
- Replace web storage with RN secure persistence.

## 3.2 Student Data Flow (Web)
Current student path is backend-first:
- Student store orchestration: `src/store/studentStore.ts`
- Dashboard bootstrap hook: `src/hooks/useStudentDashboardData.ts`
- APIs used:
  - dashboard: `dashboardService.getStudentDashboard()`
  - admissions search/list: `admissionsService.listPublic()`
  - watchlist CRUD/toggle alert: `watchlistsService`
  - notifications list/read/read-all: `notificationsService`

Important validated detail:
- admissions list is capped to backend max limit safety (100) in service/store flow.
- watchlist `alert_opt_in` is the source of reminder eligibility.

## 3.3 Realtime + Polling (Web)
Current student layout (`src/layouts/StudentLayout.tsx`):
- Uses Supabase realtime channel for notification INSERTs **only when** `VITE_ENABLE_REALTIME=true`.
- Always keeps a 30s polling fallback (`fetchNotifications` + `fetchStats`).

RN parity:
- same strategy recommended: realtime when available + focus/poll fallback.

---

## 4) Backend Contract Audit for Student Module

Domain route registration source: `src/domain/index.ts`

## 4.1 Auth + Identity
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/signin`
- `POST /api/v1/auth/signout`
- `GET /api/v1/auth/me`

From: `src/domain/auth/routes/auth.routes.ts`

## 4.2 Student Dashboard + Recommendations
- `GET /api/v1/student/dashboard`
- `GET /api/v1/recommendations`
- `GET /api/v1/recommendations/count`
- `POST /api/v1/recommendations/refresh`

From: `src/domain/dashboard/routes/dashboard.routes.ts`, `src/domain/recommendations/routes/recommendations.routes.ts`

## 4.3 Admissions (Student-visible)
- `GET /api/v1/admissions`
- `GET /api/v1/admissions/:id`

From: `src/domain/admissions/routes/admissions.routes.ts`

## 4.4 Watchlist + Alert Opt-in
- `GET /api/v1/watchlists`
- `POST /api/v1/watchlists`
- `GET /api/v1/watchlists/:id`
- `PATCH /api/v1/watchlists/:id`
- `PATCH /api/v1/watchlists/:id/toggle-alert`
- `DELETE /api/v1/watchlists/:id`
- `DELETE /api/v1/watchlists/admission/:admissionId`

From: `src/domain/watchlists/routes/watchlists.routes.ts`

## 4.5 Deadlines
- `GET /api/v1/deadlines`
- `GET /api/v1/deadlines/upcoming`
- `GET /api/v1/deadlines/urgent`
- `GET /api/v1/users/me/upcoming-deadlines`

From: `src/domain/deadlines/routes/deadlines.routes.ts`

## 4.6 Notifications
- `GET /api/v1/notifications`
- `GET /api/v1/notifications/unread-count`
- `PATCH /api/v1/notifications/:id/read`
- `PATCH /api/v1/notifications/read-all`

From: `src/domain/notifications/routes/notifications.routes.ts`

## 4.7 Preferences
- `GET /api/v1/users/me/preferences`
- `PUT /api/v1/users/me/preferences`
- `PATCH /api/v1/users/me/preferences`

From: `src/domain/users/routes/users.routes.ts`, `src/domain/user-preferences/routes/user-preferences.routes.ts`

---

## 5) Reminder + Notification Automation (Production Behavior)

This section is critical for RN expectations: reminders are backend-owned.

## 5.1 Scheduler Ownership
From `src/shared/scheduler/index.ts`:
- reminder dispatch runs hourly,
- initial dispatch also runs on startup (~15s),
- scheduler logs include `targets/attempted/succeeded/deduped/failed`.

Manual endpoint:
- `POST /api/v1/scheduler/reminder`
- supports `threshold_days` and `force_run`.

From `src/domain/scheduler/routes/scheduler.routes.ts` and `src/domain/deadlines/controllers/deadlines.controller.ts`.

## 5.2 Eligibility Rules
From `src/domain/deadlines/models/deadlines.model.ts`:
- admission must be `is_active=true` and `verification_status='verified'`
- user must have watchlist row for admission
- `watchlists.alert_opt_in=true`
- deadline in look-ahead window (typically 7 days)

## 5.3 7/3/1 Dispatch + Deduplication
From `src/domain/deadlines/services/deadlines.service.ts`:
- thresholds normalized to [7,3,1]
- event key pattern for automatic runs:
  - `deadline_near:<deadline_id>:<recipient_id>:d<day>`
- force-run manual event key includes timestamp suffix to intentionally bypass dedupe
- deduped rows still count toward operational threshold marker updates

From `src/domain/notifications/services/notifications.service.ts`:
- if duplicate (`__existing=true`), side-effects are skipped
- for new `deadline_near`, email is forced even when user disabled email preferences

## 5.4 Deadline Date Update Safety
From `src/domain/deadlines/services/deadlines.service.ts`:
- when `deadline_date` changes:
  - `reminder_sent`, `reminder_sent_7d_at`, `reminder_sent_3d_at`, `reminder_sent_1d_at` reset
  - stale `deadline_near` notifications for that deadline are deleted
- this guarantees fresh reminder lifecycle for new date.

This answers the case: "1 day reminder already sent, then deadline updated" → state is reset and backend can resend according to new timeline.

---

## 6) Supabase Integration Boundary (RN)

Keep direct Supabase usage only for:
1. auth/session/token operations,
2. optional realtime channel transport.

Do **not** use direct table queries in RN for:
- admissions,
- watchlists,
- deadlines,
- notifications,
- recommendations,
- preferences.

Reason:
- backend enforces business rules, idempotency, and reminder lifecycle consistency.

---

## 7) “Do Same as Web?” Matrix (RN Decision)

| Area | Same as Web | RN-specific change required | Final Direction |
|---|---|---|---|
| Supabase sign-in/sign-up/session | Yes | secure persistence adapter | Use same auth flow + RN secure storage |
| JWT to backend interceptor | Yes | axios/fetch RN setup | Same contract |
| Student store architecture | Mostly | prefer RTK/Zustand RN flavor + navigation lifecycle hooks | Keep same state responsibilities |
| Dashboard bootstrapping | Yes | use focus/app-state refresh triggers | Same endpoint usage |
| Realtime notifications | Yes | network-aware reconnect strategy | Keep channel + polling fallback |
| Admissions search | Yes | RN pagination UX tuning | Use `/admissions` backend only |
| Watchlist + alert toggle | Yes | optimistic UX may differ | Keep backend endpoints |
| Deadlines views | Yes | mobile UI grouping/virtualization | Keep backend results |
| Reminder generation | N/A client-side | none | Backend scheduler only |
| Email delivery | N/A client-side | none | Backend only |

---

## 8) React Native Student Module Blueprint

Recommended RN structure:

- `src/services/supabaseAuth.ts`
  - wraps Supabase auth/session/token APIs
- `src/services/apiClient.ts`
  - JWT interceptor, 401 handling
- `src/services/studentApi.ts`
  - dashboard, admissions, watchlists, deadlines, notifications, recommendations, preferences
- `src/store/authStore.ts`
  - auth bootstrap and role routing
- `src/store/studentStore.ts`
  - admissions, notifications, stats, watchlist/alert actions
- `src/realtime/notificationsSubscription.ts`
  - channel subscribe/unsubscribe + reconnect
- `src/screens/student/*`
  - Dashboard, Search, ProgramDetail, Watchlist, Deadlines, Notifications, Compare

---

## 9) End-to-End RN Flow (Student)

1. App launch:
   - restore Supabase session,
   - call `/auth/me`,
   - route to student stack.

2. Student dashboard entry:
   - fetch `/student/dashboard`,
   - fetch `/admissions?limit=100` + watchlists if needed,
   - set store state.

3. Notification sync:
   - subscribe realtime channel if enabled,
   - poll fallback on interval/focus,
   - merge by notification ID.

4. Watchlist interaction:
   - `POST /watchlists` or `DELETE /watchlists/...`,
   - `PATCH /watchlists/:id` for `alert_opt_in`.

5. Deadline reminder behavior:
   - no RN trigger required for automatic flow,
   - backend scheduler handles 7/3/1 and emails,
   - RN only displays notifications/deadlines.

---

## 10) Production Readiness Checklist (RN Student)

- [x] Supabase RN session persistence configured (secure storage)
- [ ] Backend base URL/env strategy per build flavor
- [x] JWT interceptor attached to all `/api/v1` calls
- [x] 401 handling clears auth and redirects to sign-in
- [x] Student screens consume backend-only services
- [x] Realtime + polling fallback implemented
- [ ] Notification de-duplication by notification ID
- [x] Watchlist alert toggle mapped to `alert_opt_in`
- [ ] Dashboard cache + stale refresh policy defined
- [ ] Offline error states + retry UX implemented
- [ ] Smoke tests for: sign-in, dashboard, search, save/toggle alert, notifications read, deadlines list

---

## 11) Risks + Mitigations (Updated)

1. Mixed data access reintroduced in RN
- Mitigation: block direct Supabase table access in code review checklist.

2. Realtime instability on mobile networks
- Mitigation: keep realtime optional + polling on app focus/interval.

3. Reminder confusion (duplicate vs missing)
- Mitigation: rely on backend dedupe + scheduler metrics; never client-generate reminder state.

4. Deadline date updated near threshold
- Mitigation: backend already resets reminder flags and stale reminder notifications on date change.

5. DTO drift web vs RN
- Mitigation: maintain shared API contract docs and endpoint integration tests.

---

## 12) Key File Index (Audited)

Frontend (student-relevant):
- `src/store/authStore.ts`
- `src/services/supabase.ts`
- `src/services/apiClient.ts`
- `src/services/authService.ts`
- `src/store/studentStore.ts`
- `src/hooks/useStudentDashboardData.ts`
- `src/layouts/StudentLayout.tsx`
- `src/services/dashboardService.ts`
- `src/services/admissionsService.ts`
- `src/services/watchlistsService.ts`
- `src/services/notificationsService.ts`
- `src/services/recommendationsService.ts`
- `src/services/deadlinesService.ts`
- `src/Router/router.tsx`

Backend (student + reminders):
- `src/domain/index.ts`
- `src/domain/auth/routes/auth.routes.ts`
- `src/domain/dashboard/routes/dashboard.routes.ts`
- `src/domain/dashboard/services/dashboard.service.ts`
- `src/domain/admissions/routes/admissions.routes.ts`
- `src/domain/watchlists/routes/watchlists.routes.ts`
- `src/domain/deadlines/routes/deadlines.routes.ts`
- `src/domain/deadlines/controllers/deadlines.controller.ts`
- `src/domain/deadlines/services/deadlines.service.ts`
- `src/domain/deadlines/models/deadlines.model.ts`
- `src/domain/notifications/routes/notifications.routes.ts`
- `src/domain/notifications/services/notifications.service.ts`
- `src/domain/notifications/services/notificationPublisher.ts`
- `src/domain/notifications/services/emailDelivery.ts`
- `src/domain/recommendations/routes/recommendations.routes.ts`
- `src/domain/users/routes/users.routes.ts`
- `src/domain/user-preferences/routes/user-preferences.routes.ts`
- `src/domain/scheduler/routes/scheduler.routes.ts`
- `src/shared/scheduler/index.ts`

---

## 13) Final Recommendation
Implement RN student module with **web-parity architecture**:
- Supabase auth/session + backend business APIs,
- no direct domain table reads from RN,
- realtime as optional transport, polling fallback mandatory,
- backend-owned reminders/notifications as source of truth.

This provides consistent behavior across clients and preserves production-safe reminder automation already implemented in backend.

---

## 14) Implementation Status (Current)

Implemented in mobile app:
- Backend-first student module data flow for dashboard, admissions, watchlist, deadlines, notifications.
- Notification read/read-all/unread refresh flows connected to backend APIs.
- Realtime INSERT subscription + 30s polling + app-focus refresh fallback.
- Expo push setup (permission, token retrieval, listeners, local foreground handling).
- Student-only backend push token sync:
  - register token on authenticated student session,
  - unregister token when student session changes/signs out,
  - idempotent client behavior to avoid duplicate registration calls.

Implemented in backend (additive/non-breaking target):
- Push token persistence table and service layer.
- Notifications-domain endpoints for push token register/unregister.
- Notification create flow push side-effect with preference/category checks.

Remaining before production rollout:
- Run backend migration and deploy backend push-token routes/services to production.
- Complete end-to-end test on physical devices for Android/iOS push delivery.
- Add operational monitoring for push failures/token invalidation receipts.
- Complete smoke/regression checklist for auth, dashboard, watchlist alerts, and notifications.
