# Functional Improvements Summary

## March 2026 Final Pass

This document summarizes the final functional improvements applied to the student mobile app.

## 1. Student-only delivery
- removed non-student mobile routes and inactive module files from runtime scope
- enforced student-only sign-in/sign-up behavior in mobile auth flow
- updated shared UI/navigation to avoid references to removed routes

## 2. Backend-driven student data
- admissions, watchlists, notifications, and dashboard state are now backend-driven
- removed in-app mock student datasets from runtime flows
- preserved shared student type/utility helpers for display logic only

## 3. Network and auth reliability
- API host resolution no longer depends on a stale hardcoded LAN IP
- auth checks are deduplicated and throttled to reduce repeated timeout cascades
- network outages no longer immediately destroy valid local auth state

## 4. Notifications and push integration
- backend notification APIs power list/read/read-all flows
- realtime inserts refresh local state with polling/app-focus fallback
- push token registration/unregistration is synchronized with student sessions

## 5. UX correctness
- removed render-time side effects from student screens
- preserved loading indicators with effect-based timers
- cleaned route couplings left from deleted non-student screens

## 6. Validation status
- `pnpm typecheck` passes
- student module remains the only active mobile module
