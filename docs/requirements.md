# Mobile Requirements

## Functional

1. Student auth and session continuity.
2. Backend-driven student dashboard and admissions data.
3. Watchlist and alert toggles.
4. Deadlines and notifications with read/read-all actions.
5. Program detail and compare flows.
6. AI assistant availability from student context.

## Non-Functional

- Stable behavior on mobile network transitions.
- Type-safe service-layer contracts.
- Role guard: only student role accepted in current mobile scope.
- Graceful fallback when realtime channels are unavailable.

## Integration Contract

- Backend base path expected: `/api/v1`.
- Service modules in `src/services/*` are source of contract usage.

Updated: 2026-03-30
