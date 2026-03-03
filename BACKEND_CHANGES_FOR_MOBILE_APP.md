# Backend Changes Required for Mobile App Integration

## Date: March 3, 2026

## Overview
Changes made to fix database schema mismatches and enable mobile app connectivity.

---

## 1. Authentication Model Fix - Column Name Mismatch

**File:** `src/domain/auth/models/auth.model.ts`

**Issue:** The code was querying `organization_id` but the actual database column is `university_id`

**Error:** 
```
column "organization_id" does not exist
```

### Changes Made:

#### In `createUser()` function:
```diff
- auth_user_id, email, password, role, display_name, organization_id, status
+ auth_user_id, email, password, role, display_name, university_id, status

- RETURNING id, email, role, organization_id, display_name, created_at, updated_at
+ RETURNING id, email, role, university_id, display_name, created_at, updated_at

- university_id: user.organization_id, // Map organization_id to university_id in response
+ university_id: user.university_id,
```

#### In `findUserByAuthUserId()` function:
```diff
- SELECT id, email, role, organization_id, display_name, created_at, updated_at
+ SELECT id, email, role, university_id, display_name, created_at, updated_at

- university_id: user.organization_id,
+ university_id: user.university_id,
```

#### In `verifyCredentials()` function:
```diff
- university_id: user.organization_id,
+ university_id: user.university_id,
```

#### In `findUserById()` function:
```diff
- SELECT id, email, role, organization_id, display_name, created_at, updated_at
+ SELECT id, email, role, university_id, display_name, created_at, updated_at

- university_id: user.organization_id,
+ university_id: user.university_id,
```

**Impact:** All authentication endpoints now work correctly - sign in, sign up, and getCurrentUser.

---

## 2. Dashboard Service - Notifications Schema Update

**File:** `src/domain/dashboard/services/dashboard.service.ts`

**Issue:** Notifications table schema was updated but dashboard queries were using old column names

### Changes Made:

#### In `getStudentDashboard()`:
```diff
# Unread notifications count query:
- WHERE n.user_id = $1
-   AND n.user_type = 'student'
+ WHERE recipient_id = $1 
+   AND role_type = 'student'

# Recent notifications query:
- category::text,
+ notification_type::text as category,

- WHERE user_id = $1
-   AND user_type = 'student'
+ WHERE recipient_id = $1 
+   AND role_type = 'student'

# Activity feed notifications:
- WHERE user_id = $1 AND user_type = 'student'
+ WHERE recipient_id = $1 AND role_type = 'student'
```

#### In `getUniversityDashboard()`:
```diff
# Notifications join:
- LEFT JOIN notifications n ON n.user_id = $1 AND n.user_type = 'university'
+ LEFT JOIN notifications n ON n.recipient_id = $1 AND n.role_type = 'university'

# Recent notifications query:
- category::text,
+ notification_type::text as category,

- WHERE user_id = $1
-   AND user_type = 'university'
+ WHERE recipient_id = $1 
+   AND role_type = 'university'
```

**Impact:** Dashboard endpoints now correctly fetch notifications for both students and universities.

---

## 3. Server Network Configuration

**File:** `src/index.ts`

**Issue:** Server was only listening on localhost, preventing mobile devices on the network from connecting.

### Changes Made:

```diff
const PORT = config.port || 3000;
+ const HOST = '0.0.0.0'; // Listen on all network interfaces (required for React Native)

- const server = app.listen(PORT, async () => {
-   console.log(`🚀 Server is running on port ${PORT}`);
+ const server = app.listen(PORT, HOST, async () => {
+   console.log(`🚀 Server is running on ${HOST}:${PORT}`);
    console.log(`📍 Environment: ${config.env}`);
-   console.log(`🔗 Health check: http://localhost:${PORT}/health`);
+   console.log(`🔗 Local: http://localhost:${PORT}/health`);
+   console.log(`🔗 Network: http://192.168.100.144:${PORT}/health`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
```

**Impact:** 
- Server now listens on all network interfaces (0.0.0.0)
- Mobile devices on the same network can connect
- Physical devices and emulators can access the backend API

---

## 4. Database Schema Verification Script (New)

**File:** `scripts/check-users-schema.ts` (NEW)

**Purpose:** Utility script to verify actual database schema and detect column mismatches

```typescript
/**
 * Check Users Table Schema
 * 
 * Queries the database to see what columns actually exist in the users table
 */

import { query, initializePool, closePool } from '../src/database/connection';

async function checkSchema() {
  try {
    console.log('🔍 Checking users table schema...\n');
    await initializePool();
    
    const result = await query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Users table columns:\n');
    console.table(result.rows);
    
    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema();
```

**Usage:**
```bash
pnpm exec ts-node -r tsconfig-paths/register scripts/check-users-schema.ts
```

---

## Summary of Fixes

| Issue | File | Fix |
|-------|------|-----|
| Column name mismatch | `auth.model.ts` | Changed `organization_id` → `university_id` in all queries |
| Notifications schema | `dashboard.service.ts` | Updated `user_id` → `recipient_id`, `user_type` → `role_type`, `category` → `notification_type` |
| Network connectivity | `index.ts` | Server listens on `0.0.0.0` instead of `localhost` |
| Schema verification | `check-users-schema.ts` | New utility script to check database schema |

---

## Testing Checklist

- [x] Sign in works without database errors
- [x] Sign up creates users correctly
- [x] Get current user endpoint returns proper data
- [x] Student dashboard loads without errors
- [x] University dashboard loads without errors
- [x] Mobile app can connect to backend over network
- [x] JWT authentication works end-to-end

---

## Database Schema Reference

### Users Table (Actual Schema):
- `id` (UUID)
- `auth_user_id` (UUID) - Supabase Auth UUID
- `role` (USER-DEFINED) - user_type enum
- `display_name` (VARCHAR)
- `university_id` (UUID) - **NOT organization_id**
- `email` (VARCHAR)
- `status` (VARCHAR)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### Notifications Table (Actual Schema):
- `id` (UUID)
- `recipient_id` (UUID) - **NOT user_id**
- `role_type` (VARCHAR) - **NOT user_type**
- `notification_type` (VARCHAR) - **NOT category**
- `priority` (VARCHAR)
- `title` (VARCHAR)
- `message` (TEXT)
- `is_read` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)
- `action_url` (VARCHAR)

---

## Notes for Backend Team

1. **Column Naming Consistency**: Ensure all code uses `university_id` not `organization_id`
2. **Network Binding**: Keep server listening on `0.0.0.0` for mobile app support
3. **Schema Migrations**: Always run schema verification after migrations
4. **Notifications Schema**: Update any remaining code using old notification column names

---

## Contact
For questions about these changes, contact the mobile app development team.
