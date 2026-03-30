# Project Scope Document - FYP Mobile App

## Executive Summary

This document clarifies the intentional scope limitation of the Admission Times Mobile Application for the Final Year Project demonstration.

## Current Implementation Scope

### ✅ STUDENT MODULE (100% Complete)

The mobile application **fully implements** the Student user experience:

#### Authentication & Account Management
- Student login via Supabase + backend user lookup (`/api/v1/auth/me`)
- Session persistence using secure mobile storage
- Secure logout functionality

#### Core Features
1. **Dashboard**
   - Personalized statistics (active admissions, saved programs, upcoming deadlines)
   - AI-powered recommendations (85%+ match score)
   - Quick action cards for common tasks
   - Recent activity feed
   - Upcoming deadline alerts

2. **Search & Browse**
   - Advanced search functionality
   - Multi-criteria filtering:
     - University name
     - Degree type (BS, MS, PhD, MBA, etc.)
     - Admission status (Open, Closing Soon, Closed)
     - Location/City
   - Grid and list view modes
   - Real-time search results

3. **Compare Programs**
   - Side-by-side comparison of up to 4 programs
   - Comparison criteria:
     - Fees
     - Deadlines
     - Location
     - Degree type
     - Status
     - Match score
   - Visual comparison cards

4. **Watchlist Management**
   - Save favorite programs
   - Multi-select for batch operations
   - Alert toggles for deadline notifications
   - Filter and search within saved items
   - Quick comparison from watchlist

5. **Deadline Tracking**
   - Calendar view of all deadlines
   - Visual status indicators (Open, Closing Soon, Closed)
   - Days remaining calculation
   - Filter by month and status
   - Direct navigation to program details

6. **Notifications Center**
   - Admission updates
   - Deadline alerts
   - System notifications
   - Mark as read/unread
   - Notification categorization (alert, system, admission)
   - Time-stamped notifications

7. **Program Details**
   - Comprehensive program information
   - University details
   - Admission requirements
   - Fee structure
   - Deadline information
   - AI-generated summary
   - Official website link
   - Quick actions (save, share)

8. **AI Assistant**
   - Context-aware chat interface
   - Student-focused guidance
   - Program recommendations
   - Admission process help
   - Modal-based chat UI

#### Technical Implementation
- React Native (Expo) with TypeScript
- Zustand for state management
- Backend API integration for student domain data
- Responsive UI for all screen sizes
- Navigation using React Navigation
- Secure session persistence

### 🚫 OUT OF SCOPE (Intentionally Excluded)

The following modules are **intentionally excluded** in this phase:

#### Admin Module (Not Accessible)
- Admin Dashboard
- Admin Verification Center
- Admin Analytics and Reporting
- Admin Scraper Jobs Monitor
- Admin Change Logs
- Admin Notifications Center
- User management
- System configuration

#### University Representative Module (Not Accessible)
- University Dashboard
- Manage Admissions
- Verification Center
- University Change Logs
- University Notifications Center
- University Settings
- Admission posting and editing
- Application review

## Technical Implementation of Scope Limitation

### Code-Level Restrictions

1. **AppNavigator.tsx**
   - Registers only student and auth routes
   - Only Student routes are registered
   - No university/admin/public route registrations

2. **Module Pruning**
   - University/Admin/Public screens and related module files are removed from active app paths
   - Store and UI exports are constrained to student-only usage

3. **LoginScreen.tsx**
   - Uses real backend/Supabase credentials
   - No hardcoded demo credentials
   - Input validation before sign-in requests

4. **Student Data Layer**
   - Student screens read from backend-connected services/stores
   - In-file mock student datasets removed from runtime flows

## Rationale for Scope Decision

### Academic Justification
1. **Depth over Breadth**: Focus on implementing one module with excellence rather than three modules with incomplete functionality
2. **Demo Quality**: A fully functional Student module provides better demonstration value than partially working multi-role system
3. **Time Constraints**: FYP timeline allows for one complete, polished module
4. **User Experience**: Students are the primary end-users of an admissions platform, making this the most relevant module
5. **Technical Competency**: Demonstrates full-stack mobile development skills without dilution

### Development Benefits
1. **Testing**: Easier to achieve comprehensive test coverage for one module
2. **Bug Fixing**: Focused scope allows thorough bug resolution
3. **UI/UX Polish**: Time to refine user experience details
4. **Performance**: Optimized for single-module use case
5. **Documentation**: Complete documentation for implemented features

## Future Work Plan

The architecture supports future expansion:

### Phase 2 (Post-FYP)
- Activate University Representative module
- Enable university authentication
- Implement admission management features
- University-student interaction workflows

### Phase 3 (Post-FYP)
- Activate Admin module
- Enable admin authentication
- Implement verification workflows
- System analytics and monitoring
- User management

### Phase 4 (Post-FYP)
- Real-time notifications (Firebase/OneSignal)
- Advanced analytics
- Social features
- Offline mode

## Demonstration Strategy

### For Viva/Presentation

**Opening Statement:**
> "This mobile application demonstrates a complete, backend-integrated Student module for the Admission Times platform. The mobile scope is intentionally limited to student workflows so the delivered experience is stable, polished, and ready for FYP demonstration."

**Key Points to Emphasize:**
1. All Student features are 100% functional
2. Clean, professional UI/UX
3. No placeholder logic or broken navigation
4. Real backend integration demonstrates production-style mobile architecture
5. Architecture supports future role expansion

**Handling Questions:**
- Q: "Why not implement all modules?"
  - A: "Based on FYP time constraints and best practices, I focused on depth over breadth. A fully functional Student module demonstrates more technical competency than three partially working modules."

- Q: "Can you show Admin/University features?"
   - A: "Those modules are intentionally out of the current mobile scope. The current implementation focuses on a complete student workflow with real backend integration."

- Q: "Is the app production-ready?"
   - A: "The student module is backend-integrated and production-oriented. Full production rollout would still require deployment hardening, monitoring, and release testing."

## Success Metrics

### Student Module Completeness ✅
- [x] Zero navigation errors
- [x] All features accessible
- [x] No crash scenarios in normal use
- [x] Clean build (no TypeScript errors)
- [x] No console errors during normal operation
- [x] Professional UI across all screens
- [x] Consistent user experience
- [x] All data flows working
- [x] Context providers stable

### Code Quality ✅
- [x] TypeScript types defined
- [x] Comments explaining scope decisions
- [x] No hardcoded hacks
- [x] Clean separation of concerns
- [x] Reusable components
- [x] Consistent styling
- [x] Error handling implemented

### Documentation ✅
- [x] README with scope explanation
- [x] Inline code documentation
- [x] Architecture documented
- [x] Account access expectations documented
- [x] Setup instructions clear
- [x] Troubleshooting guide included

## Deployment Readiness

### Development Build
```bash
cd mobile
pnpm install
pnpm start
```
Status: ✅ Fully functional

### Production Build
```bash
eas build --platform android
```
Status: ✅ Builds successfully (Student module)

### Testing Scenarios
1. ✅ Student login
2. ✅ Dashboard navigation
3. ✅ Search and filter
4. ✅ Program comparison
5. ✅ Watchlist management
6. ✅ Deadline tracking
7. ✅ Notifications
8. ✅ Program details
9. ✅ AI assistant
10. ✅ Logout

All scenarios pass without errors.

## Conclusion

This scope document confirms that the Admission Times Mobile Application successfully implements a **complete, stable, and demo-ready Student module** while maintaining architectural foundation for future role expansion. The intentional scope limitation is a deliberate academic and technical decision that enhances the quality and demonstration value of the FYP submission.

---

**Document Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Final for FYP Submission
