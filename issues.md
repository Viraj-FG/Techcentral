# KAEVA Production Audit - Issues & Gaps

> **Generated:** November 26, 2025  
> **Version:** Current main branch (commit 0b38118)  
> **Status:** 85-90% Production Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Issues (P0)](#critical-issues-p0)
3. [High Priority (P1)](#high-priority-p1)
4. [Medium Priority (P2)](#medium-priority-p2)
5. [Low Priority (P3)](#low-priority-p3)
6. [Feature Gaps by Module](#feature-gaps-by-module)
7. [Technical Debt](#technical-debt)
8. [API & Integration Gaps](#api--integration-gaps)
9. [Mobile App Gaps](#mobile-app-gaps)
10. [Estimated Effort](#estimated-effort)

---

## Executive Summary

KAEVA is a comprehensive AI-powered home management app with voice assistant, smart scanning, nutrition tracking, and household management. The core features are **fully implemented** and functional. This document identifies gaps needed to reach **production quality**.

### What's Working ✅
- Authentication (Email + Google OAuth)
- Voice AI Assistant (ElevenLabs integration)
- Smart Scanner (7 modes with Gemini Vision)
- Nutrition Tracking (meal logging, macros, TDEE)
- Inventory Management (real-time CRUD)
- Household Management (members, pets, invites)
- Recipe Engine (suggestions, match scoring)
- Analytics Dashboard (charts, exports, AI insights)
- Admin Panel (comprehensive monitoring)
- All 17 Edge Functions deployed

### What's Missing ❌
- Push notification delivery
- Account deletion
- Testing infrastructure
- Error tracking (Sentry)
- Some scanner result features incomplete

---

## Critical Issues (P0)

> **Must fix before production launch**

### P0-001: Account Deletion Not Implemented
- **Location:** `src/components/settings/AccountSheet.tsx:70-79`
- **Current:** Shows "Feature Coming Soon" toast
- **Impact:** **Required for App Store compliance** (Apple & Google)
- **Solution:** Implement Supabase auth.admin.deleteUser() + cascade delete all user data
- **Effort:** 4-6 hours

### P0-002: Push Notifications Not Delivered
- **Location:** `supabase/functions/notify-spoilage/index.ts`
- **Current:** Creates entries in `notifications` table but NO actual push delivery
- **Impact:** Users never receive spoilage alerts
- **Solution:** Integrate Firebase Cloud Messaging (FCM) + APNs
- **Effort:** 16-24 hours

### P0-003: No Error Tracking
- **Location:** N/A (not implemented)
- **Current:** Console.error only, no aggregation
- **Impact:** Cannot monitor production errors
- **Solution:** Add Sentry or LogRocket
- **Effort:** 4-8 hours

### P0-004: Notification Settings Stub
- **Location:** `src/pages/Settings.tsx:247-256`
- **Current:** Shows "Feature Coming Soon" toast
- **Impact:** Users cannot configure notification preferences
- **Solution:** Build notification preferences UI + store in profiles
- **Effort:** 8-12 hours

---

## High Priority (P1)

> **Should fix before launch**

### P1-001: APPLIANCE_SCAN Doesn't Fetch Recipes
- **Location:** `src/components/scanner/SmartScanner.tsx:369-422`
- **Current:** Shows "Unlocked Recipes" UI but `unlockedRecipes` is always empty
- **Backend Call Missing:** `suggest-recipes` is never called with new appliances
- **Solution:** Add call to `suggest-recipes` with `{ appliances: newAppliances }` before showing results
- **Effort:** 2-3 hours

### P1-002: PRODUCT_ANALYSIS Deception Flags Empty
- **Location:** `src/components/scanner/SmartScanner.tsx:599-649`
- **Current:** `deceptionFlags` array always empty, `dietaryConflicts` always empty
- **Backend Gap:** `enrich-product` doesn't return deception analysis
- **Solution:** Enhance Gemini prompt to detect misleading labels, hidden sugars, false health claims
- **Effort:** 8-12 hours

### P1-003: EMPTY_PACKAGE No Confirmation UI
- **Location:** `src/components/scanner/SmartScanner.tsx:689-755`
- **Current:** Immediately updates inventory + adds to cart with only a toast
- **Impact:** User cannot cancel or correct before action
- **Solution:** Add confirmation modal showing item name and actions to be taken
- **Effort:** 2-3 hours

### P1-004: No Duplicate Inventory Check
- **Location:** `src/components/scanner/SmartScanner.tsx:288-360`
- **Current:** Always inserts new inventory items
- **Impact:** Scanning same item twice creates duplicates
- **Solution:** Check for existing item by name/barcode, offer to update quantity
- **Effort:** 4-6 hours

### P1-005: Rate Limiting Not Implemented
- **Location:** All edge functions
- **Current:** No rate limits on API calls
- **Impact:** Vulnerable to abuse, API cost spikes
- **Solution:** Add rate limiting middleware (per user/IP)
- **Effort:** 8-12 hours

### P1-006: Input Validation Missing on Edge Functions
- **Location:** All edge functions
- **Current:** Basic validation only
- **Impact:** Potential for malformed data, security issues
- **Solution:** Add Zod schemas for all request bodies
- **Effort:** 12-16 hours

---

## Medium Priority (P2)

> **Nice to have for launch**

### P2-001: Beauty Products No Ingredient Warnings
- **Location:** `src/components/scanner/result-modes/VanitySweepResult.tsx`
- **Current:** Shows product name, PAO, expiry - no ingredient analysis
- **Expected:** Flag parabens, sulfates, harmful chemicals
- **Solution:** Enhance `enrich-product` for beauty category to parse ingredients
- **Effort:** 8-12 hours

### P2-002: No Skin Type Compatibility Check
- **Location:** `src/components/scanner/result-modes/VanitySweepResult.tsx`
- **Current:** User has skin type in profile, but not matched against products
- **Solution:** Compare product ingredients against user's beauty profile
- **Effort:** 6-8 hours

### P2-003: Inventory Items No Inline Nutrition Preview
- **Location:** `src/components/scanner/result-modes/InventorySweepResult.tsx`
- **Current:** Shows name, brand, quantity - no nutrition badge
- **Solution:** Add small cal/protein badge per item
- **Effort:** 2-3 hours

### P2-004: No Direct "Add to Cart" from Inventory Scan
- **Location:** `src/components/scanner/result-modes/InventorySweepResult.tsx`
- **Current:** Can only confirm all items to inventory
- **Solution:** Add individual "Add to Cart" button per item
- **Effort:** 3-4 hours

### P2-005: Water Tracking May Have Missing Table
- **Location:** `src/components/dashboard/WaterTrackingWidget.tsx:37-44`
- **Current:** Queries `water_logs` table
- **Risk:** Table may not exist in all deployments (not in migrations audit)
- **Solution:** Verify table exists, add migration if needed
- **Effort:** 1-2 hours

### P2-006: Recipe Cook Flow Incomplete
- **Location:** `src/components/scanner/result-modes/NutritionTrackResult.tsx`
- **Current:** Shows recipe suggestions but no "Cook This" button flow
- **Solution:** Add button that calls `cook-recipe` edge function
- **Effort:** 4-6 hours

### P2-007: No Offline Support
- **Location:** N/A
- **Current:** App requires internet for all operations
- **Solution:** Service worker + local storage for offline inventory viewing
- **Effort:** 16-24 hours

### P2-008: No Error Boundaries
- **Location:** `src/App.tsx`
- **Current:** Unhandled errors crash entire app
- **Solution:** Add React Error Boundaries with fallback UI
- **Effort:** 4-6 hours

---

## Low Priority (P3)

> **Post-launch improvements**

### P3-001: Onboarding Too Long - Needs Modular Approach
- **Location:** `src/components/VoiceOnboarding.tsx`
- **Current:** Single 2+ minute voice onboarding collecting everything upfront (biometrics, dietary, allergies, household, pets, beauty)
- **Impact:** High drop-off rate, user fatigue, collects info before user sees value
- **Proposed Solution:** Split into 6 contextual micro-onboarding modules (30 seconds each)

#### Modular Onboarding Architecture

| Module | Trigger Location | Data Collected | Duration |
|--------|-----------------|----------------|----------|
| **Core** | Initial app launch | Name, primary goal | 30s |
| **Nutrition** | First Fuel dashboard view or meal scan | Age, gender, height, weight, allergies, TDEE | 30s |
| **Pantry** | First inventory scan | Shopping habits, preferred stores, organic preference | 30s |
| **Beauty** | Glow dashboard view or vanity scan | Skin type, hair type, skin concerns | 30s |
| **Pets** | Pets dashboard view or pet scan | Pet names, species, breeds, toxic monitoring | 30s |
| **Household** | Home dashboard view or household page | Family members, their allergies/restrictions | 30s |

#### Database Change
```sql
ALTER TABLE profiles ADD COLUMN onboarding_modules JSONB DEFAULT '{
  "core": false,
  "nutrition": false,
  "pantry": false,
  "beauty": false,
  "pets": false,
  "household": false
}'::jsonb;
```

#### Component Structure
```
src/components/onboarding/
├── ModularOnboardingPrompt.tsx    # Floating Kaeva dialog prompt
├── OnboardingModuleSheet.tsx      # Bottom sheet with voice UI
├── modules/
│   ├── CoreOnboarding.tsx         # Name, primary goal (30s)
│   ├── NutritionOnboarding.tsx    # TDEE, diet, allergies (30s)
│   ├── PantryOnboarding.tsx       # Shopping habits (30s)
│   ├── BeautyOnboarding.tsx       # Skin/hair profile (30s)
│   ├── PetsOnboarding.tsx         # Pet setup (30s)
│   └── HouseholdOnboarding.tsx    # Family members (30s)
└── hooks/
    └── useModularOnboarding.ts    # State management
```

#### UX Flow
1. **App Launch:** Only Core module (30s) - name + goal, then straight to dashboard
2. **Contextual Prompts:** When user visits a section without that module complete, show:
   ```
   ┌─────────────────────────────────────────┐
   │   [Kaeva Aperture Animation]            │
   │                                         │
   │   "Want me to learn about your skin     │
   │    so I can give better advice?"        │
   │                                         │
   │   [Let's Go! (30s)]  [Maybe Later]     │
   └─────────────────────────────────────────┘
   ```
3. **"Maybe Later":** Dismiss, re-prompt once per session
4. **Progress Tracking:** Show completion badges in Settings

#### Benefits
- Lower drop-off (30s vs 2+ min initial commitment)
- Contextual relevance (user learns when they need it)
- Progressive disclosure (don't overwhelm upfront)
- Better data quality (user is in context when answering)
- Skip & return (no blocking - explore first, setup later)

#### ElevenLabs Configuration
Update `provision-agents` to support module-specific 30-second prompts for each onboarding type.

- **Effort:** 20-28 hours
- **Priority:** P3 (post-launch enhancement, but high impact on retention)

### P3-002: No Usage Analytics
- **Location:** N/A
- **Current:** No tracking of user behavior
- **Solution:** Add Mixpanel, Amplitude, or PostHog
- **Effort:** 8-12 hours

### P3-003: No Performance Monitoring
- **Location:** N/A
- **Current:** No Web Vitals tracking
- **Solution:** Add performance monitoring (Lighthouse CI, Vercel Analytics)
- **Effort:** 4-6 hours

### P3-004: No i18n (Internationalization)
- **Location:** Entire app
- **Current:** English only, hardcoded strings
- **Solution:** Extract strings to i18n files, add language selector
- **Effort:** 24-40 hours

### P3-005: Pet Scan No Care Tips
- **Location:** `src/components/scanner/result-modes/PetIdResult.tsx`
- **Current:** Shows species/breed/size only
- **Enhancement:** Add breed-specific care tips, common health issues
- **Effort:** 8-12 hours

### P3-006: No Recipe Sharing
- **Location:** `src/pages/RecipeBook.tsx`
- **Current:** Recipes are private per user
- **Enhancement:** Share recipes with household or publicly
- **Effort:** 12-16 hours

### P3-007: Accessibility Audit Needed
- **Location:** Entire app
- **Current:** Basic accessibility, needs audit
- **Solution:** ARIA labels, keyboard navigation, screen reader testing
- **Effort:** 16-24 hours

---

## Feature Gaps by Module

### 📸 Smart Scanner

| Mode | Status | Gap |
|------|--------|-----|
| INVENTORY_SWEEP | ⚠️ 90% | No duplicate check, no nutrition preview |
| VANITY_SWEEP | ⚠️ 80% | No ingredient warnings, no skin compatibility |
| NUTRITION_TRACK | ✅ 100% | Fully featured |
| PRODUCT_ANALYSIS | ⚠️ 70% | Deception flags empty, dietary conflicts empty |
| APPLIANCE_SCAN | ⚠️ 60% | Recipe unlocking never called |
| PET_ID | ✅ 95% | Missing care tips |
| EMPTY_PACKAGE | ⚠️ 75% | No confirmation modal |

### 🎙️ Voice Assistant

| Feature | Status | Gap |
|---------|--------|-----|
| ElevenLabs Integration | ✅ 100% | Working |
| Client Tools (6) | ✅ 100% | Working |
| Wake Word | ✅ 100% | Working |
| Context Injection | ✅ 100% | Working |

### 📊 Analytics

| Feature | Status | Gap |
|---------|--------|-----|
| Calendar View | ✅ 100% | Working |
| Macro Charts | ✅ 100% | Working |
| BMI Gauge | ✅ 100% | Working |
| AI Insights | ✅ 100% | Working |
| CSV Export | ✅ 100% | Working |
| Full Data Export (GDPR) | ❌ 0% | Not implemented |

### ⚙️ Settings

| Feature | Status | Gap |
|---------|--------|-----|
| Profile Editing | ✅ 100% | Working |
| Dietary Preferences | ✅ 100% | Working |
| Beauty Profile | ✅ 100% | Working |
| Nutrition Goals | ✅ 100% | Working |
| Store Selector | ✅ 100% | Working |
| Notification Settings | ❌ 0% | Stub only |
| Account Deletion | ❌ 0% | Stub only |

### 🏠 Household

| Feature | Status | Gap |
|---------|--------|-----|
| Member CRUD | ✅ 100% | Working |
| Pet CRUD | ✅ 100% | Working |
| Invite System | ✅ 100% | Working |
| Activity Feed | ✅ 100% | Working |

### 🛒 Shopping & Instacart

| Feature | Status | Gap |
|---------|--------|-----|
| Store Selection | ✅ 100% | Working |
| Cart Creation | ✅ 100% | Working |
| Dietary Filters | ✅ 100% | Working |
| Order Webhooks | ❌ 0% | Not implemented |

---

## Technical Debt

### TD-001: Hardcoded API Endpoints
- **Locations:** Various edge functions
- **Issue:** Some URLs hardcoded instead of environment variables
- **Risk:** Deployment issues

### TD-002: Console.log Statements
- **Locations:** Throughout codebase
- **Issue:** Debug logs in production code
- **Solution:** Add proper logging library or remove

### TD-003: Large Component Files
- **Examples:** 
  - `SmartScanner.tsx` (982 lines)
  - `NutritionTrackResult.tsx` (826 lines)
  - `Dashboard.tsx` (665 lines)
- **Issue:** Hard to maintain
- **Solution:** Split into smaller focused components

### TD-004: Type Safety Gaps
- **Issue:** Some `any` types used
- **Solution:** Add proper TypeScript interfaces

### TD-005: Missing JSDoc Comments
- **Issue:** Functions lack documentation
- **Solution:** Add JSDoc for public APIs

---

## API & Integration Gaps

### External APIs Status

| API | Status | Gap |
|-----|--------|-----|
| Google Gemini | ✅ Working | - |
| ElevenLabs | ✅ Working | - |
| FatSecret | ✅ Working | - |
| Instacart | ✅ Working | Missing order webhooks |
| Open Food Facts | ✅ Working | - |
| Makeup API | ✅ Working | - |
| Google Places | ✅ Working | - |
| Firebase (FCM) | ❌ Not integrated | Push notifications |

### Missing Integrations

1. **Push Notification Service** (FCM/APNs)
2. **Analytics Service** (Mixpanel/Amplitude)
3. **Error Tracking** (Sentry/LogRocket)
4. **Payment Processing** (if subscription planned)

---

## Mobile App Gaps

### Android (Capacitor)

| Item | Status | Gap |
|------|--------|-----|
| Project Setup | ✅ Done | - |
| Build Config | ⚠️ Partial | Needs signing config |
| Deep Links | ❌ Missing | For household invites |
| Push Notifications | ❌ Missing | FCM integration |
| App Store Assets | ❌ Missing | Icons, screenshots |

### iOS (Capacitor)

| Item | Status | Gap |
|------|--------|-----|
| Project Setup | ⚠️ Partial | No ios/ folder |
| Provisioning | ❌ Missing | Certificates needed |
| Deep Links | ❌ Missing | Universal links |
| Push Notifications | ❌ Missing | APNs integration |
| App Store Assets | ❌ Missing | Icons, screenshots |

---

## Estimated Effort

### By Priority

| Priority | Items | Hours | Cost Estimate |
|----------|-------|-------|---------------|
| P0 (Critical) | 4 | 32-50h | $3,200-5,000 |
| P1 (High) | 6 | 36-52h | $3,600-5,200 |
| P2 (Medium) | 8 | 44-65h | $4,400-6,500 |
| P3 (Low) | 7 | 92-138h | $9,200-13,800 |
| **Total** | **25** | **204-305h** | **$20,400-30,500** |

### By Category

| Category | Hours | Cost |
|----------|-------|------|
| Scanner Fixes | 28-42h | $2,800-4,200 |
| Notifications | 24-36h | $2,400-3,600 |
| Account/Security | 8-14h | $800-1,400 |
| Error Handling | 8-14h | $800-1,400 |
| Backend Enhancements | 28-40h | $2,800-4,000 |
| Mobile Publishing | 24-40h | $2,400-4,000 |
| Testing/QA | 32-48h | $3,200-4,800 |
| Polish/UX | 32-43h | $3,200-4,300 |

---

## Recommended Fix Order

### Phase 1: Pre-Launch Critical (Week 1-2)
1. ✅ P0-001: Account Deletion
2. ✅ P0-003: Error Tracking (Sentry)
3. ✅ P1-001: Appliance Scan Recipe Fetch
4. ✅ P1-003: Empty Package Confirmation

### Phase 2: Launch Preparation (Week 3-4)
5. ✅ P0-002: Push Notifications
6. ✅ P0-004: Notification Settings
7. ✅ P1-004: Duplicate Inventory Check
8. ✅ P1-005: Rate Limiting

### Phase 3: Post-Launch (Week 5-8)
9. ✅ P1-002: Product Deception Detection
10. ✅ P2-001: Beauty Ingredient Warnings
11. ✅ P2-008: Error Boundaries
12. ✅ Mobile App Store Submission

### Phase 4: Enhancement (Ongoing)
13. Analytics & Monitoring
14. Accessibility Audit
15. i18n Support
16. Advanced Features

---

## Notes

- All edge functions are **fully implemented** with no TODOs or FIXMEs
- Database schema is complete with proper RLS policies
- Core app flow is solid - these are enhancement gaps, not blockers
- Voice AI and Vision AI are production-ready
- Admin panel is comprehensive for monitoring

---

*Last Updated: November 26, 2025*
