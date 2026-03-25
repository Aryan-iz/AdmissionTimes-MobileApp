# Change Log Summary

## March 13, 2026

### Student-only architecture finalized
- removed admin, university, and public mobile modules from active code paths
- simplified navigation to auth + student flows only
- trimmed shared exports to student-used stores and UI components
- removed legacy mock/data-context modules that no longer participate in runtime

### Backend integration finalized for student flows
- student dashboard, admissions, watchlist, deadlines, and notifications use backend APIs
- auth flow uses Supabase for session handling and backend `/api/v1/auth/me` for user identity
- push token registration/unregistration remains backend-driven for authenticated student sessions
- realtime notification subscription retains polling/app-focus fallback

### Runtime hardening
- dynamic API base URL resolution to avoid stale LAN host breakage
- auth check throttling/deduplication to reduce repeated `/auth/me` storms
- student-only auth enforcement at runtime for sign-in, sign-up, and auth refresh
- reduced sensitive and repetitive debug logging

### Documentation alignment
- README and scope documentation updated to reflect backend-integrated student-only delivery
- pre-demo checklist updated for real student account verification instead of mock credentials
- functional improvements notes rewritten around current backend-driven behavior

### Validation
- `pnpm typecheck` passes
