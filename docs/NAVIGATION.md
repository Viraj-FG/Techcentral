# Kaeva Navigation Architecture

## Overview

This document describes the navigation flow for both authenticated and unauthenticated users in the Kaeva application.

## Route Protection Components

### `ProtectedRoute`
- **Location:** `src/components/ProtectedRoute.tsx`
- **Purpose:** Guards routes that require authentication
- **Behavior:**
  - Checks session on mount
  - Stores intended destination in `sessionStorage`
  - Redirects to `/auth` if not authenticated
  - Listens for auth state changes (handles sign-out)

### `PublicRoute`
- **Location:** `src/components/PublicRoute.tsx`
- **Purpose:** Handles public pages with optional auth redirect
- **Props:**
  - `redirectIfAuthenticated`: If true, sends authenticated users to `/app`
- **Behavior:**
  - Checks `sessionStorage` for stored redirect path
  - Forwards to intended destination after login

### `AdminRoute`
- **Location:** `src/components/AdminRoute.tsx`
- **Purpose:** Guards admin-only routes
- **Behavior:**
  - Verifies authentication
  - Calls `check-admin` edge function
  - Redirects non-admins to `/`

---

## Route Configuration

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ROUTE TABLE                                  │
├─────────────────┬──────────────┬────────────────────────────────────┤
│ Route           │ Guard        │ Description                        │
├─────────────────┼──────────────┼────────────────────────────────────┤
│ /               │ PublicRoute* │ Landing page (marketing)           │
│ /auth           │ PublicRoute* │ Login/signup                       │
│ /app            │ Protected    │ Main dashboard                     │
│ /settings       │ Protected    │ User settings                      │
│ /household      │ Protected    │ Household management               │
│ /inventory      │ Protected    │ Inventory view                     │
│ /recipes        │ Protected    │ Recipe book                        │
│ /meal-planner   │ Protected    │ Meal planning                      │
│ /analytics      │ Protected    │ Analytics dashboard                │
│ /admin          │ AdminRoute   │ Admin panel                        │
│ /recipe/:token  │ None         │ Public shared recipes              │
│ /household/join │ None**       │ Invite acceptance (handles both)   │
│ *               │ None         │ 404 page                           │
└─────────────────┴──────────────┴────────────────────────────────────┘

* PublicRoute with redirectIfAuthenticated=true
** Has internal auth handling for invite persistence
```

---

## User Flows

### 1. Unauthenticated User Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                  UNAUTHENTICATED USER FLOW                          │
└────────────────────────────────────────────────────────────────────┘

User visits any URL
        │
        ▼
┌───────────────────┐
│ Is route public?  │
└────────┬──────────┘
         │
    ┌────┴────┐
    │         │
   YES        NO
    │         │
    ▼         ▼
┌────────┐ ┌─────────────────────────┐
│ Show   │ │ Store intended URL in   │
│ page   │ │ sessionStorage          │
└────────┘ │ Redirect to /auth       │
           └────────────┬────────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │ User logs in / signs up │
           └────────────┬───────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │ Check sessionStorage    │
           │ for redirect path       │
           └────────────┬───────────┘
                        │
              ┌─────────┴─────────┐
              │                   │
         Has path            No path
              │                   │
              ▼                   ▼
     ┌─────────────────┐  ┌──────────────┐
     │ Redirect to     │  │ Redirect to  │
     │ stored path     │  │ /app         │
     └─────────────────┘  └──────────────┘
```

### 2. First-Time User Flow (Post-Authentication)

```
┌────────────────────────────────────────────────────────────────────┐
│                    FIRST-TIME USER FLOW                             │
└────────────────────────────────────────────────────────────────────┘

User authenticates successfully
        │
        ▼
┌───────────────────────────────┐
│ Redirect to /app              │
│ ProtectedRoute allows entry   │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ Index.tsx loads               │
│ Show SPLASH (2.5 seconds)     │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ Check profile.onboarding_     │
│ modules.core                  │
└───────────────┬───────────────┘
                │
         ┌──────┴──────┐
         │             │
    NOT complete    Complete
         │             │
         ▼             ▼
┌─────────────────┐ ┌─────────────────┐
│ Show CORE       │ │ Check household │
│ ONBOARDING      │ │ status          │
│ (30s voice)     │ └────────┬────────┘
└────────┬────────┘          │
         │              ┌────┴────┐
         ▼              │         │
┌─────────────────┐  No HH     Has HH
│ On complete:    │     │         │
│ Check household │     ▼         ▼
└────────┬────────┘ ┌────────┐ ┌────────┐
         │          │HOUSEHOLD│ │DASHBOARD│
         ▼          │ SETUP   │ │        │
   ┌───────────┐    └────┬────┘ └────────┘
   │ Has HH?   │         │
   └─────┬─────┘         ▼
         │          ┌────────┐
    ┌────┴────┐     │DASHBOARD│
    │         │     └────────┘
   NO        YES
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│HOUSEHOLD│ │DASHBOARD│
│ SETUP   │ │        │
└────────┘ └────────┘
```

### 3. Returning User Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                    RETURNING USER FLOW                              │
└────────────────────────────────────────────────────────────────────┘

User visits /app (already authenticated)
        │
        ▼
┌───────────────────────────────┐
│ ProtectedRoute validates      │
│ session ✓                     │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ Index.tsx loads               │
│ Detects: isFirstTimeUser=false│
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ Show SHORT SPLASH             │
│ (1.5 seconds, auto-proceed)   │
│ NO "Get Started" button       │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ Profile already complete      │
│ Household already set up      │
└───────────────┬───────────────┘
                │
                ▼
        ┌───────────────┐
        │   DASHBOARD   │
        │ Full app view │
        └───────────────┘
```

### 4. Household Invite Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                   HOUSEHOLD INVITE FLOW                             │
└────────────────────────────────────────────────────────────────────┘

User clicks invite link: /household/join?code=ABC123
        │
        ▼
┌───────────────────────────────┐
│ HouseholdInviteAccept loads   │
│ Check authentication          │
└───────────────┬───────────────┘
                │
         ┌──────┴──────┐
         │             │
    Authenticated  Not Authenticated
         │             │
         │             ▼
         │    ┌─────────────────────────┐
         │    │ Store invite code in    │
         │    │ sessionStorage          │
         │    │ Redirect to /auth       │
         │    └────────────┬────────────┘
         │                 │
         │                 ▼
         │    ┌─────────────────────────┐
         │    │ User logs in            │
         │    │ Redirect back to        │
         │    │ /household/join?code=X  │
         │    └────────────┬────────────┘
         │                 │
         └────────┬────────┘
                  │
                  ▼
     ┌────────────────────────┐
     │ Show invite acceptance │
     │ UI with buttons:       │
     │ [Accept] [Cancel]      │
     └───────────┬────────────┘
                 │
                 ▼
     ┌────────────────────────┐
     │ Call accept-household- │
     │ invite edge function   │
     └───────────┬────────────┘
                 │
        ┌────────┴────────┐
        │                 │
     Success           Error
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Show success │  │ Show error   │
│ Redirect to  │  │ message      │
│ /app         │  │              │
└──────────────┘  └──────────────┘
```

---

## Session Storage Keys

| Key | Purpose |
|-----|---------|
| `kaeva_redirect_after_auth` | Stores intended destination before auth redirect |
| `kaeva_pending_invite` | Stores invite code for unauthenticated users |

---

## Key Behaviors

### Sign Out
1. User signs out from any page
2. `ProtectedRoute` detects auth state change
3. Current path stored in `sessionStorage`
4. User redirected to `/auth`
5. If they sign back in, they return to their previous page

### Session Expiry
1. Session expires while user is on protected page
2. `ProtectedRoute` auth listener fires
3. Stores current path
4. Redirects to `/auth`
5. On re-authentication, returns to stored path

### OAuth Callback
1. User clicks "Sign in with Google"
2. Redirected to Google
3. Google redirects back to `/app`
4. `ProtectedRoute` validates session
5. If `sessionStorage` has redirect path, goes there
6. Otherwise, stays on `/app`

### Deep Links
- All protected routes can be bookmarked
- If not authenticated, path is stored and restored after login
- Public shared recipes (`/recipe/:token`) work without auth

---

## Component Hierarchy

```
App.tsx
├── QueryClientProvider
│   └── RealtimeProvider
│       └── TooltipProvider
│           └── ErrorBoundary
│               └── BrowserRouter
│                   └── VoiceAssistantProvider
│                       └── Routes
│                           ├── PublicRoute (redirectIfAuthenticated)
│                           │   ├── Landing
│                           │   └── Auth
│                           ├── ProtectedRoute
│                           │   ├── Index (handles first-time vs returning)
│                           │   │   ├── Splash
│                           │   │   ├── OnboardingModuleSheet
│                           │   │   ├── HouseholdSetup
│                           │   │   └── Dashboard
│                           │   ├── Settings
│                           │   ├── Household
│                           │   ├── Inventory
│                           │   ├── RecipeBook
│                           │   ├── MealPlanner
│                           │   └── Analytics
│                           ├── AdminRoute
│                           │   └── Admin
│                           ├── SharedRecipe (public)
│                           ├── HouseholdInviteAccept (mixed)
│                           └── NotFound
```
