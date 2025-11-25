# System Architecture

## High-Level Architecture

The Kaeva application follows a modern client-server architecture with realtime capabilities:

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React App]
        B[Context Providers]
        C[Custom Hooks]
        D[UI Components]
    end
    
    subgraph "Backend Layer - Lovable Cloud"
        E[Supabase Database]
        F[Supabase Auth]
        G[Supabase Realtime]
        H[Edge Functions]
        I[Storage Buckets]
    end
    
    subgraph "External Services"
        J[ElevenLabs AI]
        K[Google Gemini]
        L[Instacart API]
        M[FatSecret API]
        N[Google Places]
    end
    
    A --> B
    B --> C
    C --> D
    B --> E
    B --> F
    B --> G
    H --> J
    H --> K
    H --> L
    H --> M
    H --> N
    C --> H
```

See diagram source: [`/docs/diagrams/system-architecture.mmd`](./diagrams/system-architecture.mmd)

## Routing Structure

The application uses a two-tier routing system separating public marketing pages from authenticated app experiences:

```mermaid
flowchart TD
    Start([User Visits]) --> Root[/ Route]
    Root --> Landing[Landing Page - Marketing]
    Landing --> Auth1[Login Button]
    Auth1 --> AuthPage[/auth Route]
    
    AuthPage --> |Success| AppIndex[/app Route]
    AppIndex --> CheckOnboarding{Onboarding<br/>Complete?}
    
    CheckOnboarding --> |No| Onboarding[Voice Onboarding]
    CheckOnboarding --> |Yes| CheckHousehold{Household<br/>ID Set?}
    
    CheckHousehold --> |No| HouseholdSetup[Household Setup]
    CheckHousehold --> |Yes| Dashboard[Dashboard]
    
    Dashboard --> Inventory[/inventory]
    Dashboard --> Recipes[/recipes]
    Dashboard --> Analytics[/analytics]
    Dashboard --> Household[/household]
    Dashboard --> Settings[/settings]
    Dashboard --> Admin[/admin - Admin Only]
```

See diagram source: [`/docs/diagrams/routing-structure.mmd`](./diagrams/routing-structure.mmd)

### Route Protection

- **Public Routes**: `/`, `/auth`
- **Protected Routes**: All other routes require authentication via `ProtectedRoute` wrapper
- **Admin Routes**: `/admin` requires `admin` role in `user_roles` table

## Component Hierarchy

```mermaid
graph TD
    App[App.tsx] --> Router[React Router]
    
    Router --> PublicShell[PublicShell]
    Router --> UniversalShell[UniversalShell]
    Router --> AppShell[AppShell]
    
    PublicShell --> Landing[Landing Page]
    
    UniversalShell --> Auth[Auth Page]
    UniversalShell --> Index[Index Page]
    
    AppShell --> Dashboard[Dashboard]
    AppShell --> Inventory[Inventory]
    AppShell --> Recipes[RecipeBook]
    AppShell --> Analytics[Analytics]
    AppShell --> Household[Household]
    AppShell --> Settings[Settings]
    AppShell --> Admin[Admin]
    
    Dashboard --> PulseHeader
    Dashboard --> InventoryMatrix
    Dashboard --> NutritionWidget
    Dashboard --> RecipeFeed
    Dashboard --> FloatingActionButton
    
    FloatingActionButton --> VoiceAssistant
    FloatingActionButton --> VisionSpotlight
    
    VoiceAssistant --> ConversationOverlay
    VoiceAssistant --> SleepingIndicator
    
    VisionSpotlight --> SmartScanner
    SmartScanner --> ScanModeCarousel
    SmartScanner --> CaptureButton
    SmartScanner --> ScanResults
```

See diagram source: [`/docs/diagrams/component-hierarchy.mmd`](./diagrams/component-hierarchy.mmd)

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant RC as RealtimeContext
    participant SB as Supabase
    participant EF as Edge Functions
    participant AI as AI Services

    Note over U,AI: Authentication Flow
    U->>F: Login with email/password
    F->>SB: auth.signInWithPassword()
    SB-->>F: Session + User
    F->>SB: Fetch profile data
    SB-->>F: Profile with household_id
    F->>U: Redirect to /app

    Note over U,AI: Realtime Updates
    F->>RC: Subscribe to inventory changes
    RC->>SB: .channel().on('postgres_changes')
    SB-->>RC: Realtime event
    RC-->>F: Update local state
    F->>U: UI updates automatically

    Note over U,AI: Voice Interaction
    U->>F: Activate voice (Cmd+Shift+K)
    F->>AI: ElevenLabs useConversation
    U->>AI: "What's in my fridge?"
    AI->>F: clientTools.check_inventory()
    F->>SB: Query inventory table
    SB-->>F: Inventory items
    F-->>AI: sendContextualUpdate(inventory)
    AI-->>U: Voice response

    Note over U,AI: Scanner Flow
    U->>F: Open scanner
    F->>F: Capture image via webcam
    F->>EF: analyze-vision edge function
    EF->>AI: Google Gemini vision model
    AI-->>EF: Product identification
    EF->>EF: enrich-product (FatSecret API)
    EF-->>F: Product data + nutrition
    F->>SB: Insert into inventory
    SB->>RC: Broadcast change
    RC-->>F: All household members updated
```

See diagram source: [`/docs/diagrams/data-flow.mmd`](./diagrams/data-flow.mmd)

## State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Landing
    Landing --> Auth: Click Login
    
    Auth --> Index: Login Success
    
    state Index {
        [*] --> CheckOnboarding
        CheckOnboarding --> Onboarding: Not Complete
        CheckOnboarding --> CheckHousehold: Complete
        
        state Onboarding {
            [*] --> VoiceOnboarding
            VoiceOnboarding --> Mission: Profile
            Mission --> Biometrics: Health
            Biometrics --> Language: Preferences
            Language --> Household: Family
            Household --> Beauty: Personal
            Beauty --> Safety: Pets
            Safety --> [*]: Complete
        }
        
        CheckHousehold --> HouseholdSetup: No Household
        CheckHousehold --> Dashboard: Has Household
        HouseholdSetup --> Dashboard: Setup Complete
    }
    
    state Dashboard {
        [*] --> DashboardHome
        DashboardHome --> Inventory
        DashboardHome --> Recipes
        DashboardHome --> Analytics
        DashboardHome --> Household
        DashboardHome --> Settings
        DashboardHome --> Admin: If Admin Role
        
        Inventory --> DashboardHome
        Recipes --> DashboardHome
        Analytics --> DashboardHome
        Household --> DashboardHome
        Settings --> DashboardHome
        Admin --> DashboardHome
    }
    
    Dashboard --> Auth: Logout
    Auth --> [*]
```

See diagram source: [`/docs/diagrams/state-management.mmd`](./diagrams/state-management.mmd)

## Voice Agent Architecture

```mermaid
graph TB
    subgraph "Client Side"
        A[User Interface]
        B[useAssistantVoice Hook]
        C[useOnboardingVoice Hook]
        D[Client Tools]
    end
    
    subgraph "ElevenLabs Cloud"
        E[Conversational AI Agent]
        F[Speech-to-Text]
        G[Text-to-Speech]
    end
    
    subgraph "Client Tools Registration"
        D1[check_inventory]
        D2[get_recipes]
        D3[add_to_shopping_list]
        D4[check_expiring_items]
        D5[updateProfile]
        D6[saveHouseholdMember]
    end
    
    A --> |Activate Voice| B
    A --> |Start Onboarding| C
    
    B --> |useConversation| E
    C --> |useConversation| E
    
    B --> |Register| D1
    B --> |Register| D2
    B --> |Register| D3
    B --> |Register| D4
    
    C --> |Register| D5
    C --> |Register| D6
    
    E --> F
    E --> G
    
    F --> |User Speech| E
    G --> |AI Response| A
    
    E --> |Tool Call| D
    D --> |Execute & Persist| Supabase[(Supabase)]
    D --> |sendContextualUpdate| E
```

See diagram source: [`/docs/diagrams/voice-architecture.mmd`](./diagrams/voice-architecture.mmd)

## Context Providers

### AuthContext

**Purpose**: Manages authentication session state (session, user, isLoading, isAuthenticated)

**Location**: `src/contexts/` (implicitly used via `useAuth()`)

**Key Responsibilities**:
- Listen to `onAuthStateChange` events
- Maintain session and user state
- Provide authentication status to entire app
- **Does NOT** manage profile data (separated to `useProfile()` hook)

### RealtimeContext

**Purpose**: Provides realtime subscriptions for household data

**Location**: `src/contexts/RealtimeContext.tsx`

**Key Responsibilities**:
- Subscribe to `inventory` table changes for current household
- Subscribe to `household_activity` for activity feed
- Subscribe to `shopping_list` for shared cart updates
- Broadcast changes to all connected household members
- Send contextual updates to voice assistant when data changes

## Mobile & PWA Support

### Viewport Handling

All pages use `UniversalShell` (or `PublicShell` for public pages) to handle:
- **Dynamic Viewport Height**: `h-[100dvh]` instead of `h-screen` fixes Safari address bar
- **Safe Areas**: `env(safe-area-inset-*)` for notches and home bars
- **Fixed Positioning**: Prevents whole-page scrolling, only internal zones scroll
- **Overscroll Prevention**: `overscroll-none` disables iOS rubber-band bounce

### Permission Strategy

Mobile browsers require progressive fallback for media permissions:
1. Request audio + video together
2. Fall back to audio-only if combined fails (audio critical for voice)
3. Fall back to video-only if needed for scanner

iOS-specific workarounds:
- Play silent audio to unlock audio system
- Delay track cleanup for 3 seconds to prevent permission re-prompts
- Detect and warn users in in-app browsers (Instagram/Facebook WebViews)

## Security Model

### Row Level Security (RLS)

All tables enforce RLS policies:

**Household-Based Access**:
```sql
-- Example: inventory table policy
CREATE POLICY "Users can view household inventory"
ON inventory FOR SELECT
USING (
  household_id IN (
    SELECT household_id 
    FROM household_memberships 
    WHERE user_id = auth.uid()
  )
);
```

**User-Based Access**:
```sql
-- Example: profiles table policy
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());
```

### Edge Function Security

- All edge functions validate JWT tokens
- Household membership verified before data access
- External API keys stored as secrets, never exposed to client
- Rate limiting via Supabase built-in protections

## Performance Considerations

1. **Lazy Loading**: Scanner camera only activates when scanner page opened
2. **Debouncing**: Voice context updates debounced to avoid flooding
3. **Optimistic UI**: Inventory updates show immediately, sync in background
4. **Caching**: Product data cached in `product_cache` table to reduce API calls
5. **Skeleton Loading**: All data fetches show skeleton states for perceived performance

## Error Handling Patterns

1. **Graceful Degradation**: Voice fails → show manual input forms
2. **Toast Notifications**: User-friendly error messages via `sonner` toast library
3. **Retry Logic**: Failed API calls retry with exponential backoff
4. **Offline Support**: Basic read operations work offline via cached data
5. **Permission Errors**: Clear instructions for enabling camera/microphone in settings

---

For component-specific implementation details, see [COMPONENTS.md](./COMPONENTS.md)

For database structure, see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

For edge function details, see [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md)
