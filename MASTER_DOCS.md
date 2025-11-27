# KAEVA - Master Technical Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [Application Structure](#application-structure)
7. [Pages & Routes](#pages--routes)
8. [Components Architecture](#components-architecture)
9. [Hooks & Custom Logic](#hooks--custom-logic)
10. [Utility Libraries](#utility-libraries)
11. [Edge Functions](#edge-functions)
12. [API Integrations](#api-integrations)
13. [Voice AI System](#voice-ai-system)
14. [Smart Scanner System](#smart-scanner-system)
15. [Design System](#design-system)
16. [User Flows](#user-flows)
17. [Security & RLS Policies](#security--rls-policies)
18. [Environment Variables](#environment-variables)
19. [Deployment & Configuration](#deployment--configuration)

---

## Project Overview

### Product Description
KAEVA is a voice-first, AI-powered household management platform that transforms home management from a chore into a seamless, intelligent experience. The platform combines:
- **Voice-based interactions** using ElevenLabs conversational AI with dual-agent architecture
- **Smart inventory management** across fridge, pantry, beauty products, and pet supplies
- **Multi-intent smart scanner** with Google Gemini Vision and multi-modal product identification
- **Household-level collaboration** with invite system and activity feed
- **Proactive AI insights** through daily digest and learned preferences
- **Meal planning & recipe management** with YouTube tutorials and Instacart integration
- **Allergen and toxicity detection** for household and pet safety
- **Nutrition tracking** with TDEE calculations and macro goals
- **Beauty product tracking** with inspiration and expiration alerts
- **Pet care management** with toxic food monitoring and care tips

### Core Value Proposition
KAEVA transforms household management into an intelligent, proactive system that anticipates user needs through AI-powered insights, voice interactions, and contextual recommendations. The platform shifts from reactive (responds when asked) to proactive (anticipates needs through daily insights, personalized recommendations, and contextual suggestions).

### Target Users
- Families with children and/or pets
- Health-conscious individuals tracking nutrition
- Busy households seeking automation and proactive assistance
- Users with dietary restrictions, allergies, or beauty routines
- Multi-person households needing shared inventory and meal planning
- Anyone wanting a voice-first, AI-powered home management solution

### Distribution Strategy
- **Primary**: Progressive Web App (PWA) installation via browser
- **Platforms**: iOS Safari, Android Chrome, Desktop browsers
- **Installation Flow**: Dedicated `/install` guide page with platform-specific instructions
- **Future**: Native mobile apps via Capacitor (infrastructure already in place)

---

## Architecture Overview

### High-Level 3-Tier Architecture

```mermaid
graph TD
    subgraph "Public Tier"
        A[Landing Page] --> B[Auth Page]
        C[Install Guide] --> B
        D[Shared Recipe Links] --> B
    end
    
    subgraph "Protected Tier - Lazy Loaded"
        B --> E[AuthenticatedLayout]
        E --> F[Voice SDK Provider]
        F --> G[App Routes]
    end
    
    subgraph "Admin Tier"
        G --> H[Admin Dashboard]
        H --> I[Agent Provisioning]
        H --> J[System Monitoring]
    end
    
    G --> K[Dashboard]
    G --> L[Inventory]
    G --> M[Recipes]
    G --> N[Settings]
    
    K --> O[6 Swipeable Views]
    O --> P[PULSE - Wellness]
    O --> Q[FUEL - Nutrition]
    O --> R[PANTRY - Food]
    O --> S[GLOW - Beauty]
    O --> T[PETS - Pet Care]
    O --> U[HOME - Household]
```

### Code Splitting & Lazy Loading Strategy

**Public Routes** (loaded immediately, no voice SDK):
- `/` - Landing page (marketing homepage)
- `/auth` - Authentication page
- `/install` - PWA installation guide
- `/recipe/:shareToken` - Public recipe links

**Protected Routes** (lazy loaded via React.lazy()):
- `/app` - Main app entry (onboarding flow / dashboard)
- `/inventory` - Inventory management
- `/recipes` - Recipe book
- `/meal-planner` - Weekly meal planning
- `/analytics` - Nutrition analytics
- `/household` - Household management
- `/settings` - User settings
- `/household/join/:inviteCode` - Join household via invite

**Admin Routes** (lazy loaded, role-restricted):
- `/admin` - Admin dashboard with system monitoring

**Voice SDK Optimization**:
- Voice SDK (@11labs/react, ~100KB) lazy loads only for authenticated users
- `AuthenticatedLayout` component wraps protected routes and dynamically imports `VoiceAssistantProvider`
- Public routes never load voice libraries, reducing initial bundle by ~100KB

**Vendor Chunking**:
```typescript
// vite.config.ts
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', ...],
  'animation-vendor': ['framer-motion'],
  'chart-vendor': ['recharts'],
  'supabase-vendor': ['@supabase/supabase-js', '@tanstack/react-query']
}
```

### System Components

1. **Frontend Layer** (React + TypeScript + Tailwind CSS)
   - Single Page Application (SPA) architecture
   - React Router v6 for navigation
   - TanStack Query for server state management
   - Framer Motion for animations and page transitions
   - Shadcn UI components with custom theming
   - Route-based code splitting for optimal bundle size
   - PWA capabilities with Vite PWA plugin

2. **Backend Layer** (Lovable Cloud / Supabase)
   - PostgreSQL database with household-level RLS policies
   - Serverless Edge Functions (Deno runtime)
   - Real-time subscriptions for inventory, notifications, household activity
   - Authentication (Email/Password only - Google OAuth removed)
   - Storage buckets (configured: `app-assets`)

3. **AI/ML Layer**
   - **ElevenLabs Conversational AI**: Dual-agent architecture (onboarding + assistant)
   - **Google Gemini 2.0 Flash**: Vision analysis, meal analysis, product identification
   - **Lovable AI Gateway**: PWA icon generation, image editing
   - **OpenAI GPT-5**: Intent detection (deprecated - using Gemini now)
   - **Custom Logic**: Allergen detection, toxicity analysis, preference learning

4. **Third-Party Integrations**
   - **FatSecret API**: Primary nutrition data enrichment
   - **USDA FoodData Central**: Secondary nutrition enrichment fallback
   - **YouTube Data API v3**: Recipe video tutorial search
   - **Instacart API**: Shopping cart creation and management
   - **Google Places API**: Store hours lookup
   - **ElevenLabs SDK**: Voice interactions and agent provisioning

---

## Technology Stack

### Frontend Dependencies

```json
{
  "@11labs/react": "^0.2.0",
  "@elevenlabs/client": "^0.11.0",
  "@capacitor/android": "^7.4.4",
  "@capacitor/core": "^7.4.4",
  "@capacitor/haptics": "^7.0.2",
  "@capacitor/ios": "^7.4.4",
  "@hookform/resolvers": "^3.10.0",
  "@radix-ui/*": "Latest versions (30+ UI primitives)",
  "@supabase/supabase-js": "^2.84.0",
  "@tanstack/react-query": "^5.83.0",
  "class-variance-authority": "^0.7.1",
  "date-fns": "^4.1.0",
  "embla-carousel-react": "^8.6.0",
  "framer-motion": "^11.18.2",
  "lucide-react": "^0.462.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-hook-form": "^7.61.1",
  "react-router-dom": "^6.30.1",
  "react-webcam": "^7.2.0",
  "recharts": "^2.15.4",
  "tailwindcss": "Latest",
  "typescript": "Latest",
  "vite-plugin-pwa": "^1.1.0",
  "zod": "^3.25.76"
}
```

### Backend Technologies

- **Runtime**: Deno (for Edge Functions)
- **Database**: PostgreSQL 13+ (via Supabase)
- **Authentication**: Supabase Auth (email/password only)
- **Storage**: Supabase Storage (bucket: `app-assets`)
- **Serverless Functions**: Supabase Edge Functions (26 functions)
- **Real-time**: Supabase Realtime (inventory, notifications, household_activity)

### Development Tools

- **Build Tool**: Vite 5.x with PWA plugin
- **Package Manager**: npm / bun
- **Linting**: ESLint with TypeScript support
- **Type Checking**: TypeScript 5.x
- **Version Control**: Git
- **Hosting**: Lovable Cloud with automatic deployments
- **API Gateway**: Lovable AI Gateway for image generation

### PWA Configuration

**Manifest** (`public/manifest.json`):
```json
{
  "name": "KAEVA - Smart Home Assistant",
  "short_name": "KAEVA",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "theme_color": "#D69E2E",
  "background_color": "#08080A",
  "display": "standalone"
}
```

**Mobile Meta Tags** (`index.html`):
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

---

## Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    profiles ||--o{ household_memberships : "belongs to"
    households ||--o{ household_memberships : "has members"
    households ||--o{ household_invites : "generates invites"
    households ||--o{ household_activity : "tracks activity"
    households ||--o{ inventory : "owns items"
    households ||--o{ shopping_list : "maintains list"
    households ||--o{ recipes : "saves recipes"
    households ||--o{ meal_plans : "plans meals"
    households ||--o{ daily_digests : "receives insights"
    
    profiles ||--o{ household_members : "manages dependents"
    profiles ||--o{ pets : "owns pets"
    profiles ||--o{ meal_logs : "tracks meals"
    profiles ||--o{ water_logs : "tracks hydration"
    profiles ||--o{ conversation_history : "has conversations"
    profiles ||--o{ conversation_events : "generates events"
    profiles ||--o{ notifications : "receives alerts"
    profiles ||--o{ bookmarks : "saves items"
    profiles ||--o{ learned_preferences : "learns from"
    profiles ||--o{ meal_templates : "creates templates"
    profiles ||--o{ saved_foods : "saves foods"
    profiles ||--|| user_roles : "has role"
    
    recipes ||--o{ meal_plans : "planned for"
    inventory ||--o{ shopping_list : "triggers reorder"
    
    profiles {
        uuid id PK
        uuid current_household_id FK
        text user_name
        int user_age
        numeric user_weight
        numeric user_height
        text user_gender
        text user_activity_level
        int calculated_tdee
        jsonb allergies
        jsonb dietary_preferences
        jsonb health_goals
        jsonb lifestyle_goals
        jsonb beauty_profile
        int household_adults
        int household_kids
        text language
        text user_zip_code
        text preferred_retailer_id
        text preferred_retailer_name
        timestamp last_retailer_refresh
        bool onboarding_completed
        jsonb onboarding_modules
        bool permissions_granted
        bool agent_configured
        timestamp agent_configured_at
        timestamp agent_last_configured_at
        text agent_prompt_version
        int daily_calorie_goal
        int daily_protein_goal
        int daily_carbs_goal
        int daily_fat_goal
        int water_goal_ml
        int current_streak
        int longest_streak
        date streak_start_date
        date last_log_date
        jsonb notification_preferences
        timestamp created_at
        timestamp updated_at
    }
    
    households {
        uuid id PK
        uuid owner_id FK
        text name
        timestamp created_at
        timestamp updated_at
    }
    
    household_memberships {
        uuid id PK
        uuid household_id FK
        uuid user_id FK
        text role
        timestamp joined_at
    }
    
    household_invites {
        uuid id PK
        uuid household_id FK
        uuid created_by FK
        text invite_code
        timestamp expires_at
        int max_uses
        int times_used
        timestamp created_at
    }
    
    household_activity {
        uuid id PK
        uuid household_id FK
        uuid actor_id FK
        text actor_name
        text activity_type
        text entity_type
        uuid entity_id
        text entity_name
        jsonb metadata
        timestamp created_at
    }
    
    household_members {
        uuid id PK
        uuid user_id FK
        text member_type
        text name
        int age
        text age_group
        numeric height
        numeric weight
        text gender
        text activity_level
        int calculated_tdee
        jsonb allergies
        jsonb dietary_restrictions
        jsonb health_conditions
        jsonb medication_interactions
        timestamp created_at
        timestamp updated_at
    }
    
    pets {
        uuid id PK
        uuid user_id FK
        text name
        text species
        text breed
        int age
        text notes
        text food_brand
        numeric daily_serving_size
        bool toxic_flags_enabled
        timestamp created_at
    }
    
    inventory {
        uuid id PK
        uuid household_id FK
        text name
        text brand_name
        inventory_category category
        text barcode
        numeric quantity
        numeric original_quantity
        text unit
        int fill_level
        date expiry_date
        inventory_status status
        jsonb allergens
        jsonb dietary_flags
        jsonb nutrition_data
        text fatsecret_id
        text product_image_url
        bool auto_order_enabled
        int reorder_threshold
        numeric consumption_rate
        timestamp last_activity_at
        timestamp last_enriched_at
        timestamp created_at
        timestamp updated_at
    }
    
    recipes {
        uuid id PK
        uuid household_id FK
        uuid user_id FK
        text name
        jsonb ingredients
        jsonb instructions
        int servings
        int cooking_time
        text difficulty
        int estimated_calories
        int match_score
        text_array required_appliances
        bool is_public
        text share_token
        timestamp shared_at
        int view_count
        timestamp cached_at
        timestamp created_at
    }
    
    meal_plans {
        uuid id PK
        uuid household_id FK
        uuid user_id FK
        uuid recipe_id FK
        date planned_date
        text meal_type
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    meal_logs {
        uuid id PK
        uuid user_id FK
        text meal_type
        timestamp logged_at
        text image_url
        jsonb items
        numeric calories
        numeric protein
        numeric carbs
        numeric fat
        numeric fiber
        timestamp created_at
    }
    
    meal_templates {
        uuid id PK
        uuid user_id FK
        text template_name
        jsonb items
        numeric total_calories
        numeric total_protein
        numeric total_carbs
        numeric total_fat
        numeric total_fiber
        timestamp created_at
        timestamp updated_at
    }
    
    water_logs {
        uuid id PK
        uuid user_id FK
        int amount_ml
        timestamp logged_at
        timestamp created_at
    }
    
    shopping_list {
        uuid id PK
        uuid household_id FK
        text item_name
        numeric quantity
        text unit
        text priority
        text status
        text source
        uuid inventory_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    daily_digests {
        uuid id PK
        uuid user_id FK
        uuid household_id FK
        date digest_date
        jsonb insights
        timestamp generated_at
        timestamp viewed_at
    }
    
    bookmarks {
        uuid id PK
        uuid user_id FK
        text item_type
        uuid item_id
        timestamp created_at
    }
    
    learned_preferences {
        uuid id PK
        uuid user_id FK
        text preference_type
        text preference_value
        numeric confidence
        int occurrences
        text learned_from
        timestamp created_at
        timestamp last_updated
    }
    
    saved_foods {
        uuid id PK
        uuid user_id FK
        text food_name
        jsonb nutrition_data
        timestamp created_at
        timestamp last_used_at
    }
    
    conversation_history {
        uuid id PK
        uuid user_id FK
        uuid conversation_id
        text role
        text message
        jsonb metadata
        timestamp created_at
    }
    
    conversation_events {
        uuid id PK
        uuid user_id FK
        uuid conversation_id
        text agent_type
        text event_type
        text role
        jsonb event_data
        timestamp created_at
    }
    
    notifications {
        uuid id PK
        uuid user_id FK
        text type
        text title
        text message
        jsonb metadata
        bool read
        timestamp created_at
    }
    
    user_roles {
        uuid id PK
        uuid user_id FK
        app_role role
        timestamp created_at
    }
    
    product_cache {
        uuid id PK
        text search_term
        jsonb fatsecret_response
        jsonb nutrition_summary
        text image_url
        timestamp cached_at
        timestamp expires_at
        timestamp created_at
    }
    
    rate_limits {
        uuid id PK
        uuid user_id FK
        text endpoint
        int request_count
        timestamp window_start
        timestamp created_at
    }
```

### Household-Level Data Model Migration

**Critical Architectural Shift**: The application migrated from user-level to household-level data organization:
- `inventory`, `shopping_list`, `recipes`, `meal_plans` now use `household_id` instead of `user_id`
- Every user must belong to at least one household via `household_memberships`
- User's `profiles.current_household_id` determines active household context
- Enables multi-user households to share inventory, recipes, and meal plans
- Maintains proper data isolation between different households

### Table Descriptions

#### `profiles`
Core user profile with biometrics, preferences, household composition, and onboarding state.

**Key Fields:**
- `current_household_id`: Active household (required after onboarding)
- `calculated_tdee`: Total Daily Energy Expenditure from biometric data
- `onboarding_completed`: Gates access to main app (onboarding → dashboard)
- `onboarding_modules`: JSONB tracking 6 module completion (core, nutrition, pantry, beauty, pets, household)
- `agent_configured`: Whether ElevenLabs agents are provisioned
- `allergies`, `dietary_preferences`: JSON arrays for safety checks
- `beauty_profile`: JSONB for beauty product preferences (skin type, hair type, goals)
- `notification_preferences`: JSONB controlling alert types
- `current_streak`, `longest_streak`: Nutrition logging streaks
- `daily_*_goal`: Nutrition goals (calories, protein, carbs, fat)
- `water_goal_ml`: Hydration target

**Indexes:**
- Primary key on `id`
- Foreign key to `households(id)` on `current_household_id`

#### `households`
Household entity enabling multi-user data sharing.

**Key Fields:**
- `owner_id`: User who created the household
- `name`: Household display name (e.g., "Smith Family")

**Use Cases:**
- Multi-user inventory sharing
- Household-wide meal planning
- Shared recipe collections
- Family activity tracking

#### `household_memberships`
Junction table linking users to households with roles.

**Roles:**
- `owner`: Full control (delete household, manage members)
- `admin`: Manage inventory, recipes, settings
- `member`: Standard access (view/edit shared data)

**Use Cases:**
- Multi-household support (user can join multiple households)
- Role-based permissions
- Household member management

#### `household_invites`
Time-limited, usage-capped invite system for household sharing.

**Key Fields:**
- `invite_code`: JWT-signed secure code
- `expires_at`: Invite expiration timestamp
- `max_uses`: Maximum redemptions (default 1)
- `times_used`: Redemption counter

**Security:**
- JWT signature prevents tampering
- Time expiration limits exposure
- Usage caps prevent abuse

#### `household_activity`
Real-time activity feed for household events.

**Activity Types:**
- `member_joined`: New member added to household
- `inventory_added`, `inventory_updated`, `inventory_removed`: Inventory changes
- `recipe_added`: New recipe saved
- `meal_planned`: Meal scheduled

**Key Fields:**
- `actor_id`, `actor_name`: Who performed the action
- `entity_type`, `entity_id`, `entity_name`: What was affected
- `metadata`: JSONB with action details (old/new values, quantities, etc.)

**Triggers:**
- `log_member_joined`: Fires on household_memberships INSERT
- `log_inventory_change`: Fires on inventory INSERT/UPDATE/DELETE
- `log_recipe_added`: Fires on recipes INSERT

#### `household_members`
Dependents (children, partners, elderly) with individual health profiles.

**Member Types:**
- `child`, `partner`, `elderly`, `other`

**Key Fields:**
- `age_group`: For children without specific age
- `calculated_tdee`: Individual TDEE calculation
- `medication_interactions`: JSONB of drug interactions
- `health_conditions`: JSONB of medical conditions

**Use Cases:**
- Multi-person TDEE calculations
- Household-wide allergen tracking
- Age-appropriate meal suggestions
- Medication interaction warnings

#### `pets`
Pet profiles for toxicity checking and pet-specific inventory.

**Key Fields:**
- `species`: 'dog', 'cat', etc.
- `toxic_flags_enabled`: Controls toxicity warnings in scanner
- `food_brand`, `daily_serving_size`: Feeding tracking

**Use Cases:**
- Toxic food detection (chocolate, grapes for dogs)
- Pet food inventory management
- Age-based dietary recommendations
- Feeding schedule tracking

#### `inventory`
Household inventory across all categories (household-level).

**Categories** (enum `inventory_category`):
- `fridge`: Refrigerated items
- `pantry`: Shelf-stable food
- `beauty`: Beauty/skincare/haircare products
- `pets`: Pet food and supplies

**Status** (enum `inventory_status`):
- `sufficient`, `low`, `critical`, `out`, `out_of_stock`, `likely_spoiled`

**Key Fields:**
- `household_id`: Shared across household members
- `fill_level`: 0-100 percentage for auto-reordering
- `allergens`: JSONB array of detected allergens
- `nutrition_data`: Full FatSecret/USDA API response
- `fatsecret_id`: For re-enrichment
- `auto_order_enabled`: Enables automatic shopping list addition
- `reorder_threshold`: Fill level triggering reorder (default 20)
- `consumption_rate`: Usage velocity for predictive reordering
- `last_activity_at`: Updated on interaction, used for spoilage detection
- `last_enriched_at`: Tracks nutrition data freshness

**Triggers:**
- `update_inventory_activity`: Sets `last_activity_at` on UPDATE
- `log_inventory_change`: Logs to household_activity

#### `recipes`
Saved recipes with ingredients, instructions, and metadata (household-level).

**Key Fields:**
- `household_id`: Shared across household
- `user_id`: Recipe creator
- `ingredients`: JSONB array `[{name, quantity, unit}]`
- `instructions`: JSONB array `[{step, duration, temperature}]`
- `required_appliances`: Text array `['oven', 'stovetop']`
- `match_score`: AI-calculated ingredient availability score (0-100)
- `is_public`: Whether recipe is publicly shareable
- `share_token`: Unique token for public recipe links
- `view_count`: Public recipe view counter

**Use Cases:**
- AI recipe suggestions based on inventory
- Meal planning integration
- Public recipe sharing via links
- YouTube video tutorial integration

#### `meal_plans`
Weekly meal planning (household-level).

**Key Fields:**
- `household_id`: Shared meal plans
- `user_id`: Plan creator
- `recipe_id`: Linked recipe (nullable for custom meals)
- `planned_date`: Meal date
- `meal_type`: 'breakfast', 'lunch', 'dinner', 'snack'
- `notes`: Custom instructions or preferences

**Use Cases:**
- Weekly meal calendar
- Shopping list generation from meal plan
- Household meal coordination

#### `meal_logs`
Individual nutrition tracking (user-level).

**Key Fields:**
- `user_id`: Individual tracking
- `meal_type`: 'breakfast', 'lunch', 'dinner', 'snack'
- `items`: JSONB array `[{name, quantity, calories, protein, carbs, fat, fiber}]`
- `image_url`: Meal photo from scanner
- Aggregated macros: `calories`, `protein`, `carbs`, `fat`, `fiber`

**Use Cases:**
- Daily nutrition tracking
- Macro goal progress
- Meal history and patterns
- Streak calculation

**Triggers:**
- `learn_from_meal_log`: Updates learned_preferences

#### `meal_templates`
Saved meal templates for quick logging.

**Key Fields:**
- `template_name`: User-defined name (e.g., "Breakfast Smoothie")
- `items`: JSONB array of food items
- Aggregated macros: `total_calories`, `total_protein`, etc.

**Use Cases:**
- Quick meal logging
- Repeated meals
- Custom meal presets

#### `water_logs`
Hydration tracking (user-level).

**Key Fields:**
- `amount_ml`: Water intake in milliliters
- `logged_at`: Timestamp of log

**Use Cases:**
- Daily hydration tracking
- Water goal progress

#### `shopping_list`
Auto-generated and manual shopping items (household-level).

**Sources:**
- `auto_reorder`: Triggered by low inventory
- `recipe`: Generated from meal plan
- `voice_request`: Added via voice assistant
- `manual`: User-added

**Priority:**
- `high`, `normal`, `low`

**Status:**
- `pending`, `in_cart`, `purchased`

**Key Fields:**
- `household_id`: Shared shopping list
- `inventory_id`: Links to inventory for auto-reorder

**Use Cases:**
- Automatic low-stock reordering
- Recipe ingredient aggregation
- Instacart cart creation

#### `daily_digests`
AI-generated proactive insights delivered daily (cron job).

**Key Fields:**
- `user_id`: Recipient
- `household_id`: Household context
- `digest_date`: Generation date
- `insights`: JSONB array `[{type, title, message, priority, reasoning}]`
- `generated_at`: Timestamp of generation
- `viewed_at`: User viewed timestamp

**Insight Types:**
- `expiring_items`: Items approaching expiration
- `low_stock`: Items needing reorder
- `nutrition_gap`: Macro deficiencies
- `meal_suggestion`: Time-appropriate meal ideas
- `safety_alert`: Allergen or toxicity warnings

**Use Cases:**
- Proactive AI assistance
- Daily household check-in
- Waste reduction
- Nutrition optimization

#### `bookmarks`
User-saved items across domains.

**Item Types:**
- `recipe`: Saved recipes
- `meal_template`: Saved templates
- `product`: Saved products

**Use Cases:**
- Quick access to favorites
- Cross-domain bookmarking

#### `learned_preferences`
AI learning system tracking user behavior patterns.

**Preference Types:**
- `ingredient`: Frequently used ingredients
- `cuisine`: Preferred cuisines
- `cooking_time`: Time preferences (quick vs elaborate)
- `difficulty`: Skill level preferences
- `meal_time`: When user eats specific meal types

**Key Fields:**
- `confidence`: 0.0-1.0 score of preference strength
- `occurrences`: Number of times pattern observed
- `learned_from`: Source (`meal_log`, `recipe_save`, `voice_request`)

**Use Cases:**
- Personalized recipe suggestions
- Contextual meal recommendations
- Adaptive AI behavior

**Triggers:**
- `learn_from_meal_log`: Updates from meal logs
- `learn_from_recipe_bookmark`: Updates from recipe saves

#### `saved_foods`
Frequently used foods for quick meal logging.

**Use Cases:**
- Quick meal logging autocomplete
- Common food shortcuts

#### `conversation_history`
Persistent storage of all voice conversations.

**Key Fields:**
- `conversation_id`: Groups messages by session
- `role`: 'user', 'assistant', 'system'
- `message`: Message content
- `metadata`: JSONB for context (intent, confidence, tool calls)

**Use Cases:**
- Conversation continuity
- Intent pattern analysis
- Debugging voice interactions
- Conversation history review

#### `conversation_events`
Detailed event logging for voice agent monitoring.

**Event Types:**
- `message_sent`, `message_received`, `tool_call`, `error`

**Key Fields:**
- `agent_type`: 'onboarding' or 'assistant'
- `event_data`: JSONB with full event payload

**Use Cases:**
- Admin monitoring
- Agent debugging
- Performance analytics

#### `notifications`
System-generated notifications.

**Types:**
- `spoilage_alert`: Items likely spoiled
- `reorder_needed`: Low stock items
- `allergen_warning`: Scanned item contains allergen
- `toxicity_warning`: Scanned item toxic to pet
- `household_activity`: Member actions

**Key Fields:**
- `metadata`: JSONB with action data (item_id, item_name, etc.)
- `read`: Boolean tracking read status

#### `user_roles`
Role-based access control.

**Roles** (enum `app_role`):
- `admin`: Full system access (admin panel, agent provisioning)
- `user`: Standard user access

**Use Cases:**
- Admin panel access control
- System monitoring
- Agent provisioning permissions

#### `product_cache`
FatSecret API response cache (30-day TTL).

**Key Fields:**
- `search_term`: Normalized search string
- `expires_at`: Cache expiration (default +30 days)
- `nutrition_summary`: Extracted key nutrition

**Use Cases:**
- Reducing redundant API calls
- Faster product enrichment
- Cost optimization

#### `rate_limits`
API rate limiting tracking.

**Key Fields:**
- `endpoint`: Rate-limited endpoint
- `request_count`: Requests in current window
- `window_start`: Window start timestamp

**Use Cases:**
- Preventing API abuse
- Cost control
- Fair usage enforcement

**Database Function:**
- `clean_old_rate_limits()`: Removes expired windows

### Database Functions

#### `check_spoilage()`
Returns inventory items likely spoiled based on age and last activity.

**Logic:**
- Fridge items: >14 days since last activity
- Pantry items: >90 days since last activity

**Returns:**
```sql
TABLE(inventory_id uuid, item_name text, days_old integer, category inventory_category)
```

**Used By:**
- `notify-spoilage` edge function (cron job)
- Dashboard spoilage alerts

#### `mark_spoilage(_inventory_id uuid)`
Marks an inventory item as likely spoiled.

**Updates:**
- Sets `status = 'likely_spoiled'`
- Updates `updated_at` timestamp

#### `has_role(_user_id uuid, _role app_role)`
Checks if a user has a specific role.

**Security:** `SECURITY DEFINER` - runs with elevated privileges

**Used By:**
- Admin panel access control
- RLS policies for admin-only tables

#### `handle_new_user()`
Trigger function creating profile on user signup.

**Execution:** Fires on `INSERT` to `auth.users`

**Creates:**
- Profile entry with user's email/name
- Sets `onboarding_completed = false`
- Assigns default 'user' role in `user_roles`

#### `handle_updated_at()`
Generic trigger function updating `updated_at` timestamps.

**Execution:** Fires on `UPDATE` to tables with `updated_at` column

#### `log_household_activity()`
Logs household events to activity feed.

**Parameters:**
- `p_household_id`: Household ID
- `p_activity_type`: Event type
- `p_entity_type`: Entity type (inventory, recipe, member)
- `p_entity_id`: Entity UUID
- `p_entity_name`: Entity display name
- `p_metadata`: JSONB with additional context

**Security:** `SECURITY DEFINER`

**Called By:**
- Trigger functions (inventory changes, recipe adds, member joins)
- Edge functions (manual activity logging)

#### `insert_household_batch()`
Atomically inserts household members and pets from onboarding.

**Parameters:**
- `p_user_id`: User ID
- `p_members`: JSONB array of household members
- `p_pets`: JSONB array of pets

**Returns:**
```json
{
  "success": true,
  "members_count": 2,
  "pets_count": 1
}
```

**Use Cases:**
- Onboarding data save
- Bulk household setup

#### `clean_old_rate_limits()`
Removes expired rate limit windows (>1 hour old).

**Execution:** Can be called periodically or on-demand

---

## Authentication & Authorization

### Authentication Flow

**Current Implementation**: Email/Password only (Google OAuth removed due to redirect loops)

```mermaid
sequenceDiagram
    participant U as User
    participant L as Landing Page
    participant A as Auth Page
    participant S as Supabase Auth
    participant I as Index.tsx
    participant D as Dashboard
    
    U->>L: Visit /
    L->>L: Check auth state
    alt Authenticated
        L->>I: Redirect to /app
    else Unauthenticated
        L->>L: Show hero/features
    end
    
    U->>A: Click "Start Free" → /auth
    A->>A: Show signup form
    U->>A: Enter email/password
    A->>S: signUp()
    S->>S: Create auth.users entry
    S->>S: Trigger handle_new_user()
    S-->>A: Session token
    A->>I: Redirect to /app
    
    I->>I: Check onboarding_completed
    alt Not completed
        I->>I: Show Splash → Onboarding
    else Completed
        alt Has current_household_id
            I->>D: Show Dashboard
        else No household
            I->>I: Show HouseholdSetup
        end
    end
```

### Auth State Management

**Separation of Concerns**:
- `AuthContext`: Manages ONLY authentication session (session, user, isLoading, isAuthenticated)
- `useProfile()`: Separate hook for profile data fetching
- Index.tsx: Single source of routing truth based on auth + profile state

**Critical Pattern**: `AuthContext` uses `onAuthStateChange` as sole handler for auth state updates. Manual `getSession()` calls only check session existence, never directly update state.

### Route Protection

**3-Tier Route Structure**:

1. **Public Routes** (no auth required):
   - `/` - Landing page
   - `/auth` - Login/signup
   - `/install` - PWA installation guide
   - `/recipe/:shareToken` - Shared recipe links

2. **Protected Routes** (auth required via ProtectedRoute):
   - `/app` - Main app (onboarding or dashboard)
   - `/inventory` - Inventory management
   - `/recipes` - Recipe book
   - `/meal-planner` - Meal planning
   - `/analytics` - Nutrition analytics
   - `/household` - Household management
   - `/settings` - User settings
   - `/household/join/:inviteCode` - Join household

3. **Admin Routes** (auth + admin role required via AdminRoute):
   - `/admin` - Admin dashboard

**ProtectedRoute Component**:
```typescript
// Redirects to /auth if not authenticated
// Loads before Index.tsx to prevent flash
<Route element={<ProtectedRoute />}>
  <Route element={<AuthenticatedLayout />}>
    {/* Protected routes here */}
  </Route>
</Route>
```

**AdminRoute Component**:
```typescript
// Checks has_role(auth.uid(), 'admin')
// Redirects to /app if not admin
```

### Row Level Security (RLS)

**Household-Based Policies**: Most tables use household membership for access control

**profiles**:
```sql
-- Users can view/update own profile
POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
```

**households**:
```sql
-- Owners can manage own household
POLICY "Owners can manage own household" ON households FOR ALL USING (auth.uid() = owner_id);
-- Members can view their household
POLICY "Members can view their household" ON households FOR SELECT 
  USING (id IN (SELECT current_household_id FROM profiles WHERE id = auth.uid()));
```

**household_memberships**:
```sql
-- Users can view their own memberships
POLICY "Users can view their own memberships" ON household_memberships FOR SELECT 
  USING (auth.uid() = user_id);
-- Owners can view/manage members
POLICY "Household owners can view members" ON household_memberships FOR SELECT 
  USING (household_id IN (SELECT id FROM households WHERE owner_id = auth.uid()));
```

**inventory** (household-level):
```sql
-- Household members can CRUD inventory
POLICY "Household members can view inventory" ON inventory FOR SELECT 
  USING (household_id IN (
    SELECT household_id FROM household_memberships WHERE user_id = auth.uid()
  ));
-- Similar policies for INSERT, UPDATE, DELETE
```

**recipes** (household-level):
```sql
-- Household members can CRUD recipes
POLICY "Household members can view recipes" ON recipes FOR SELECT 
  USING (household_id IN (
    SELECT household_id FROM household_memberships WHERE user_id = auth.uid()
  ));
-- Anyone can view public recipes
POLICY "Anyone can view public recipes" ON recipes FOR SELECT 
  USING (is_public = true OR household_id IN (...));
```

**meal_logs** (user-level):
```sql
-- Users can only CRUD their own meal logs
POLICY "Users can manage own meal logs" ON meal_logs FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

**notifications** (user-level):
```sql
-- Users can view/update their own notifications
POLICY "Users can view own notifications" ON notifications FOR SELECT 
  USING (auth.uid() = user_id);
-- Service role can insert notifications
POLICY "Service role can insert notifications" ON notifications FOR INSERT 
  WITH CHECK (true);
```

**user_roles**:
```sql
-- Users can view own roles
POLICY "Users can view own roles" ON user_roles FOR SELECT 
  USING (auth.uid() = user_id);
-- Admins can manage all roles
POLICY "Admins can manage roles" ON user_roles FOR ALL 
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
```

---

## Application Structure

### Directory Structure

```
kaeva/
├── public/                     # Static assets
│   ├── icon-generator.html     # Icon generation utility
│   ├── logo.svg                # App logo
│   ├── manifest.json           # PWA manifest
│   ├── robots.txt              # SEO
│   └── sounds/
│       └── wake.mp3            # Wake word audio
├── src/
│   ├── assets/                 # Build-time assets
│   ├── components/             # React components
│   │   ├── admin/              # Admin panel components (15 files)
│   │   ├── analytics/          # Analytics components (8 files)
│   │   ├── dashboard/          # Dashboard widgets (40+ files)
│   │   ├── household/          # Household management (5 files)
│   │   ├── inventory/          # Inventory UI (2 files)
│   │   ├── layout/             # Layout components (9 files)
│   │   ├── meal-planner/       # Meal planning (5 files)
│   │   ├── onboarding/         # Onboarding modules (10 files)
│   │   ├── recipes/            # Recipe UI (8 files)
│   │   ├── scanner/            # Scanner modes (20+ files)
│   │   ├── search/             # Global search (1 file)
│   │   ├── settings/           # Settings sheets (9 files)
│   │   ├── ui/                 # Shadcn UI primitives (40+ files)
│   │   ├── voice/              # Voice components (7 files)
│   │   └── [domain components] # Feature-specific (20+ files)
│   ├── contexts/               # React contexts
│   │   ├── RealtimeContext.tsx # Realtime subscriptions
│   │   └── VoiceAssistantContext.tsx # Voice provider
│   ├── hooks/                  # Custom hooks (17 files)
│   ├── integrations/
│   │   └── supabase/           # Supabase integration
│   │       ├── client.ts       # Supabase client (auto-generated)
│   │       └── types.ts        # Database types (auto-generated)
│   ├── lib/                    # Utility libraries (15 files)
│   ├── pages/                  # Route pages (14 files)
│   ├── App.tsx                 # Root component
│   ├── index.css               # Global styles + design tokens
│   ├── main.tsx                # Entry point
│   └── vite-env.d.ts           # Vite types
├── supabase/
│   ├── config.toml             # Supabase configuration
│   ├── functions/              # Edge functions (26 functions)
│   │   ├── _shared/            # Shared utilities (8 files)
│   │   ├── [function-name]/    # Individual functions
│   │   │   └── index.ts
│   │   └── ...
│   └── migrations/             # Database migrations (auto-managed)
├── docs/                       # Documentation
│   ├── diagrams/               # Mermaid diagrams (7 files)
│   └── [documentation files]   # Architecture docs
├── capacitor.config.ts         # Capacitor config (native apps)
├── index.html                  # HTML entry point
├── package.json                # Dependencies
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript config
└── vite.config.ts              # Vite configuration
```

### Code Organization Patterns

**Component Structure**:
- Small, focused components (not monolithic files)
- Domain-specific folders (dashboard/, scanner/, recipes/, etc.)
- Shared UI primitives in `ui/` following Shadcn pattern
- Layout components separate from feature components

**State Management**:
- React Context for global state (Auth, Voice, Realtime)
- TanStack Query for server state (automatic caching, refetching)
- Local state via useState/useReducer for UI state
- Custom hooks for reusable logic

**Styling**:
- Tailwind CSS with semantic design tokens
- No inline styles or CSS modules
- All colors via CSS variables (HSL format)
- Responsive design with mobile-first approach

**Type Safety**:
- Strict TypeScript enabled
- Auto-generated types from Supabase schema
- Zod schemas for runtime validation (forms, API responses)
- No `any` types (eslint enforced)

---

## Pages & Routes

### Route Configuration

```typescript
// App.tsx
<BrowserRouter>
  <VoiceAssistantProvider> {/* Inside router for useNavigate */}
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicShell />}>
        <Route path="/" element={<Landing />} />
        <Route path="/install" element={<Install />} />
        <Route path="/recipe/:shareToken" element={<SharedRecipe />} />
      </Route>
      
      {/* Auth Route */}
      <Route element={<UniversalShell />}>
        <Route path="/auth" element={<Auth />} />
      </Route>
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}> {/* Lazy loads Voice SDK */}
          <Route element={<UniversalShell />}>
            <Route path="/app" element={<Index />} />
            <Route path="/household/join/:inviteCode" element={<HouseholdInviteAccept />} />
          </Route>
          
          <Route element={<AppShell />}>
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/recipes" element={<RecipeBook />} />
            <Route path="/meal-planner" element={<MealPlanner />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/household" element={<Household />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
        
        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route element={<AppShell />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </VoiceAssistantProvider>
</BrowserRouter>
```

### Page Descriptions

#### `/` - Landing Page
**File**: `src/pages/Landing.tsx`  
**Layout**: `PublicShell`  
**Auth**: Public

**Features**:
- Marketing homepage with hero section
- Value proposition: "Your Home. On Autopilot"
- Feature showcase (6-card bento grid)
- Testimonials section
- FAQ accordion
- CTA buttons: "Start Free" → /auth, "Install App" → /install

**Design**:
- Manrope + Space Grotesk typography
- Autumn Gold (#D69E2E) + Electric Sage (#70E098) gradient
- Framer Motion animations (viewport-triggered)
- Mobile-responsive grid layout

**Routing**:
- Redirects authenticated users to `/app` on mount

#### `/auth` - Authentication
**File**: `src/pages/Auth.tsx`  
**Layout**: `UniversalShell`  
**Auth**: Public (redirects if authenticated)

**Features**:
- Email/password signup and login forms
- Form validation with Zod
- Error handling and toast notifications
- "Forgot password" flow

**Design**:
- Gold primary button with gold shadow
- Glass card styling
- Sage/gold branding

**Routing**:
- Successful login redirects to `/app`

#### `/install` - PWA Installation Guide
**File**: `src/pages/Install.tsx`  
**Layout**: `PublicShell`  
**Auth**: Public

**Features**:
- Platform-specific installation instructions
- iOS Safari instructions (Add to Home Screen)
- Android Chrome instructions
- Desktop browser instructions
- Icon preview

**Design**:
- Step-by-step guide with screenshots
- Platform detection for smart defaults

#### `/recipe/:shareToken` - Shared Recipe
**File**: `src/pages/SharedRecipe.tsx`  
**Layout**: `PublicShell`  
**Auth**: Public (via share_token)

**Features**:
- Public recipe viewing
- Ingredients list
- Step-by-step instructions
- Cooking time, difficulty, servings
- "Save to My Recipes" CTA (requires auth)

**Security**:
- Uses `share_token` instead of recipe ID
- RLS policy allows public access when `is_public = true`

#### `/app` - Main App Entry
**File**: `src/pages/Index.tsx`  
**Layout**: `UniversalShell`  
**Auth**: Protected (ProtectedRoute)

**Purpose**: Single source of routing truth for authenticated users

**Logic**:
```typescript
const { profile, isLoading } = useProfile();

if (isLoading) return <Splash />;

if (!profile?.onboarding_completed) {
  return <VoiceOnboarding />;
}

if (!profile?.current_household_id) {
  return <HouseholdSetup />;
}

return <Dashboard />;
```

**Flows**:
1. **First-time users**: Splash → Onboarding → HouseholdSetup → Dashboard
2. **Returning users**: Splash → Dashboard
3. **Incomplete onboarding**: Splash → Onboarding
4. **No household**: Splash → HouseholdSetup

#### `/inventory` - Inventory Management
**File**: `src/pages/Inventory.tsx`  
**Layout**: `AppShell`  
**Auth**: Protected

**Features**:
- Category tabs (All, Fridge, Pantry, Beauty, Pets)
- Search and filter
- Grid view with item cards
- Fill level indicators
- Expiry date warnings
- Edit/delete actions
- "Scan to Add" FAB

**Widgets**:
- InventoryItemCard: Item display with image, quantity, status
- EditItemModal: Edit item details

#### `/recipes` - Recipe Book
**File**: `src/pages/RecipeBook.tsx`  
**Layout**: `AppShell`  
**Auth**: Protected

**Features**:
- Recipe grid with cards
- Search by name, ingredients
- Filter by difficulty, cooking time, cuisine
- Bookmark/unbookmark recipes
- Recipe detail view with cooking mode
- YouTube video tutorials
- Share recipe publicly

**Widgets**:
- RecipeCard: Recipe preview
- RecipeDetail: Full recipe view
- CookingMode: Step-by-step cooking interface
- RecipeVideoSection: YouTube tutorials

#### `/meal-planner` - Weekly Meal Planning
**File**: `src/pages/MealPlanner.tsx`  
**Layout**: `AppShell`  
**Auth**: Protected

**Features**:
- Weekly calendar view (swipeable)
- Drag-and-drop meal assignment
- AI meal plan generation with customization
- Recipe selection for meal slots
- Shopping list generation from meal plan
- Meal plan sharing with household

**Widgets**:
- WeeklyCalendar: 7-day grid with meal slots
- MealPlanCard: Meal preview
- MealPlanCustomizationDialog: AI generation preferences
- RecipeSelector: Choose recipes for meals
- ShoppingPreviewSheet: Shopping list from plan

#### `/analytics` - Nutrition Analytics
**File**: `src/pages/Analytics.tsx`  
**Layout**: `AppShell`  
**Auth**: Protected

**Features**:
- BMI gauge visualization
- Calorie chart (daily/weekly)
- Macro breakdown chart (protein/carbs/fat)
- Calendar view with daily summaries
- Weekly report cards
- Progress sharing (social media)
- Streak display

**Widgets**:
- BMIGaugeCard: BMI calculation and visualization
- CalorieChart: Line chart of calorie intake
- MacroChart: Pie chart of macronutrient distribution
- CalendarView: Monthly meal log calendar
- WeeklyReportCard: Weekly summary
- ShareProgressSheet: Social sharing

#### `/household` - Household Management
**File**: `src/pages/Household.tsx`  
**Layout**: `AppShell`  
**Auth**: Protected

**Features**:
- Hero banner with household name
- Members section with compact rows
- Member detail sheets (biometrics, allergies)
- Preferences section (household settings)
- Invite members button
- Notification toggles
- Member role management (owner only)

**Widgets**:
- HeroHeaderBanner: Gradient header
- CompactMemberRow: Member list item
- MemberDetailSheet: Full member profile
- HouseholdPreferencesSection: Settings

#### `/settings` - User Settings
**File**: `src/pages/Settings.tsx`  
**Layout**: `AppShell`  
**Auth**: Protected

**Features**:
- Quick action cards (Profile, Household, Analytics)
- Settings sections (Profile, Dietary, Beauty, Goals, Account)
- Bottom sheets for editing
- Time-based greeting
- App version info
- Account deletion

**Widgets**:
- QuickActionCard: Shortcut cards
- SettingsRow: Reusable row component
- ProfileEditSheet: Edit profile
- DietarySheet: Edit dietary preferences
- BeautySheet: Edit beauty profile
- GoalsSheet: Edit health/lifestyle goals
- NutritionGoalsSheet: Edit nutrition goals
- NotificationSettingsSheet: Manage notifications
- ConversationHistorySheet: View conversation logs
- AccountSheet: Account management

#### `/admin` - Admin Dashboard
**File**: `src/pages/Admin.tsx`  
**Layout**: `AppShell`  
**Auth**: Admin role required

**Features**:
- 9 tabbed sections
- Agent provisioning and management
- Conversation monitoring
- Database inspection
- System logs
- Analytics
- User management
- Accessibility audit
- Testing tools
- Deployment checklist

**Tabs**:
1. **Overview**: System health
2. **Agent**: ElevenLabs agent provisioning
3. **Conversations**: Conversation event logs
4. **Database**: SQL inspector
5. **Logs**: Tool call logs
6. **Analytics**: Usage metrics
7. **Users**: User/role management
8. **Accessibility**: WCAG audit
9. **Testing**: Test panel
10. **Deploy**: Deployment checklist

**Widgets** (15 components in `src/components/admin/`):
- AgentProvisioning: Create/update agents
- AgentStatus: Agent configuration status
- AgentTestPanel: Test agent interactions
- AgentHealthDashboard: Agent performance metrics
- ConversationMonitor: Real-time conversation logs
- DatabaseInspector: SQL query interface
- SystemLogs: Edge function logs
- ToolCallLogs: Client tool invocation logs
- Analytics: Usage analytics
- UserManagement: User/role CRUD
- AccessibilityAudit: WCAG compliance check
- TestingTools: Manual testing utilities
- DeploymentChecklist: Pre-launch checks
- ContextPreview: Agent context visualization
- PWAIconGenerator: Generate PWA icons

#### `/household/join/:inviteCode` - Join Household
**File**: `src/pages/HouseholdInviteAccept.tsx`  
**Layout**: `UniversalShell`  
**Auth**: Protected

**Features**:
- JWT invite code validation
- Household preview (name, member count)
- Join confirmation
- Success/error states

**Flow**:
1. Validate invite code via `accept-household-invite` edge function
2. Show household preview
3. User confirms join
4. Add to `household_memberships`
5. Update `profiles.current_household_id`
6. Redirect to `/app`

### Layout Components

#### `PublicShell`
**File**: `src/components/layout/PublicShell.tsx`

**Purpose**: Layout for public marketing pages

**Features**:
- Navigation bar with logo
- Footer with links
- Full-height viewport with safe areas
- No authentication UI

#### `UniversalShell`
**File**: `src/components/layout/UniversalShell.tsx`

**Purpose**: Universal layout handling mobile viewport and safe areas

**Features**:
- `h-[100dvh]` dynamic viewport height (Safari address bar fix)
- `env(safe-area-inset-*)` for notches/home bars
- Fixed inset-0 positioning to lock body
- `overscroll-none` to disable iOS rubber-band
- Internal scrollable zone with `overflow-y-auto`
- Prevents whole-page scrolling
- Two-layer structure: background + floating dock

**Critical Pattern**: All pages must use UniversalShell (or AppShell) to prevent mobile viewport issues

#### `AppShell`
**File**: `src/components/layout/AppShell.tsx`

**Purpose**: Layout for authenticated app pages with navigation dock

**Features**:
- Extends UniversalShell
- Floating command dock at bottom (72px height, 320px width)
- Living Aperture (gold hero button) with satellite architecture
- Settings button (left), Profile button (right)
- Safe area bottom padding
- Page transition animations

**Floating Dock**:
```typescript
// Satellite Architecture Pattern
<div className="glass-capsule"> {/* Background layer */}
  <Button>Settings</Button>
  <Button>Profile</Button>
</div>
<div className="living-aperture absolute -top-6"> {/* Overlapping layer */}
  <KaevaAperture /> {/* 64-72px gold breathing button */}
</div>
```

#### `AuthenticatedLayout`
**File**: `src/components/layout/AuthenticatedLayout.tsx`

**Purpose**: Lazy loads voice SDK for protected routes

**Features**:
- Dynamically imports VoiceAssistantProvider
- Prevents voice SDK loading on public routes
- Reduces initial bundle by ~100KB for unauthenticated users

---

## Components Architecture

### 6-View Dashboard Architecture

**File**: `src/pages/Dashboard.tsx`  
**Pattern**: Horizontal swipeable views with circular wrap navigation

**Views**:
1. **PULSE** (Wellness Hub):
   - WelcomeBanner: Time-based greeting
   - PulseHeader: System health ring (0-100% from nutrition + inventory)
   - SafetyShield: Active protections count
   - DashboardHeader: Quick stats

2. **FUEL** (Nutrition Center):
   - NutritionWidget: Daily macro progress
   - WaterTrackingWidget: Hydration tracking
   - StreakWidget: Meal logging streaks
   - MealLogCard: Recent meals

3. **PANTRY** (Food Inventory):
   - InventoryMatrix: 2x2 grid (Fridge, Pantry, Beauty, Pets)
   - ExpiringItemsRecipes: Items nearing expiry with recipe suggestions
   - SmartCartWidget: Shopping cart status
   - SpoilageReview: Likely spoiled items

4. **GLOW** (Beauty Station):
   - BeautySummaryCard: Beauty inventory overview
   - BeautyInventoryList: Beauty products
   - ExpiringItemsRecipes: Expiring beauty products

5. **PETS** (Pet Care Hub):
   - PetRosterCard: Household pets
   - PetSuppliesStatus: Pet food/supplies inventory
   - ToxicFoodMonitor: Toxic food warnings
   - PetCareTipsWidget: Species-specific care tips

6. **HOME** (Household Hub):
   - HouseholdQuickAccess: Household shortcuts
   - RecipeFeed: Suggested recipes
   - HouseholdActivityFeed: Recent household activity
   - MealPlanWidget: Upcoming meals

**Navigation**:
- Horizontal swipe gestures (useSwipeNavigation hook)
- Haptic feedback on view change
- Pagination dots with labels/icons at bottom
- Clickable dots for direct navigation
- Circular wrap (HOME → PULSE)
- SwipeEdgeIndicator: Shows adjacent view labels during swipe

**Design**:
- Each view has domain-specific color accent
- Entrance animations with staggered children
- Empty states with contextual CTAs
- Consistent spacing (space-y-4)

### Admin Components (15 files)

Located in `src/components/admin/`:

1. **AccessibilityAudit.tsx**: WCAG compliance checker
2. **AgentHealthDashboard.tsx**: Agent performance metrics with charts
3. **AgentProvisioning.tsx**: Create/update ElevenLabs agents
4. **AgentStatus.tsx**: Agent configuration status cards
5. **AgentTestPanel.tsx**: Test agent interactions
6. **Analytics.tsx**: Usage analytics dashboard
7. **ContextPreview.tsx**: Agent context visualization
8. **ConversationMonitor.tsx**: Real-time conversation logs
9. **DatabaseInspector.tsx**: SQL query interface
10. **DeploymentChecklist.tsx**: Pre-launch verification
11. **PWAIconGenerator.tsx**: AI-powered icon generation
12. **SystemLogs.tsx**: Edge function logs viewer
13. **TestingTools.tsx**: Manual testing utilities
14. **ToolCallLogs.tsx**: Client tool invocation logs
15. **UserManagement.tsx**: User/role CRUD

### Dashboard Widgets (40+ files)

Located in `src/components/dashboard/`:

**Core Widgets**:
- AIInsightsWidget: Daily digest insights (top 3-4 priority cards)
- DashboardHeader: Quick stats bar
- DashboardViewIndicator: Current view indicator
- PulseHeader: System health ring with greeting
- WelcomeBanner: Personalized welcome message

**Inventory**:
- InventoryCard: Single inventory item display
- InventoryMatrix: 2x2 category grid (Fridge, Pantry, Beauty, Pets)
- InventoryMatrixSkeleton: Loading skeleton
- BeautyInventoryList: Beauty product list
- BeautySummaryCard: Beauty inventory summary
- ExpiringItemsRecipes: Expiring items with recipe suggestions
- SpoilageReview: Likely spoiled items
- BuildingCartOverlay: Instacart cart building animation

**Nutrition**:
- NutritionWidget: Daily macro progress (calories, protein, carbs, fat)
- WaterTrackingWidget: Hydration tracking with circular dial
- StreakWidget: Meal logging streak display
- MealLogCard: Recent meal display

**Recipes & Meals**:
- RecipeFeed: AI-suggested recipes
- MealPlanWidget: Upcoming meals from meal plan

**Shopping**:
- SmartCartWidget: Shopping cart status and Instacart integration
- ShoppingManifest: Grouped shopping list (auto-refill, recipe, manual)
- ProductSelector: Product search and selection
- StoreSelector: Instacart retailer selection

**Household**:
- HouseholdQuickAccess: Household member shortcuts
- HouseholdActivityFeed: Recent household events
- PetRosterCard: Pet cards
- PetSuppliesStatus: Pet inventory status
- PetCareTipsWidget: Species-specific care tips
- ToxicFoodMonitor: Toxic food warnings for pets

**Safety & Alerts**:
- SafetyShield: Active protections counter
- ShieldStatus: Safety features status

**UI Elements**:
- FloatingActionButton: Multi-action FAB (Voice, Scanner)
- QuickActions: Action shortcuts
- RecentActivity: Recent user actions
- VisionSpotlight: Scanner trigger button
- SocialImport: Social recipe import
- TetheredTag: AR-style floating labels

**Skeletons** (loading states):
- AIInsightsWidgetSkeleton
- InventoryCardSkeleton
- InventoryMatrixSkeleton

### Scanner Components (20+ files)

Located in `src/components/scanner/`:

**Core Scanner**:
- SmartScanner: Main scanner component with camera
- ScannerHUD: Technical HUD overlay (corner brackets, scan line, grid)
- ScanModeCarousel: Swipeable mode selector
- ModeSelector: Mode picker
- ScannerToolbar: Top toolbar with flash/flip controls
- CaptureButton: Gold capture button with haptic feedback
- ScanResults: Result display with parsed data
- ScannerSummaryCard: Scan summary card

**Scanner Modes**:
- IntentPresetPicker: Quick intent selection
- BarcodeOverlay: Barcode detection visual

**Result Modes** (in `src/components/scanner/result-modes/`):
- ApplianceScanResult: Appliance identification
- InventorySweepResult: Multi-item inventory scan
- NutritionTrackResult: Meal analysis result
- PetIdResult: Pet identification via microchip/tag
- ProductAnalysisResult: Single product analysis
- VanitySweepResult: Beauty product batch scan
- FixResultSheet: Manual correction sheet

**Meal Logging**:
- VoiceMealInput: Voice-activated meal logging
- MealTemplateSheet: Saved meal templates
- SaveTemplateDialog: Save current meal as template
- DuplicateItemModal: Handle duplicate inventory detection

**Beauty**:
- BeautyInspirationSheet: Beauty looks and routines
- PhotoEditModal: Photo editing before save

**Toxicity**:
- ToxicityAlert: Pet toxicity warnings

### Recipe Components (8 files)

Located in `src/components/recipes/`:

1. **RecipeCard.tsx**: Recipe preview card
2. **RecipeDetail.tsx**: Full recipe view
3. **CookingMode.tsx**: Step-by-step cooking interface
4. **CookingStepCard.tsx**: Individual cooking step
5. **TimerPill.tsx**: Inline timer for cooking steps
6. **PostCookingSheet.tsx**: Post-meal engagement (photo, rating)
7. **RecipeVideoSection.tsx**: YouTube tutorial videos
8. **RecipeShareSheet.tsx**: Share recipe publicly

### Meal Planner Components (5 files)

Located in `src/components/meal-planner/`:

1. **WeeklyCalendar.tsx**: 7-day meal calendar with swipe navigation
2. **MealPlanCard.tsx**: Single meal preview
3. **MealPlanCustomizationDialog.tsx**: AI generation preferences
4. **RecipeSelector.tsx**: Choose recipes for meals
5. **ShoppingPreviewSheet.tsx**: Shopping list from meal plan

### Onboarding Components (10 files)

Located in `src/components/onboarding/`:

**Core**:
- ModularOnboardingPrompt: Prompt to complete modules
- OnboardingModuleSheet: Module selection sheet

**Forms** (in `src/components/onboarding/forms/`):
- CoreOnboardingForm: Basic user info (age, weight, height, gender)
- NutritionOnboardingForm: Nutrition goals and preferences
- PantryOnboardingForm: Pantry setup
- BeautyOnboardingForm: Beauty profile (skin type, hair type)
- HouseholdOnboardingForm: Household members
- PetsOnboardingForm: Pet profiles

**Voice** (in `src/components/onboarding/voice/`):
- ModuleVoiceSession: Voice conversation for module
- WakeWordIndicator: "Hey Kaeva" listening indicator

**Other**:
- VoiceOnboarding: Main voice onboarding flow
- Splash: Splash screen animation

### Voice Components (7 files)

Located in `src/components/voice/`:

1. **VoiceAssistant.tsx**: Main voice assistant component (forwardRef for parent control)
2. **ConversationOverlay.tsx**: Full-screen conversation UI
3. **SleepingIndicator.tsx**: Idle state indicator
4. **ConceptCard.tsx**: Visual confirmation cards during onboarding
5. **SmartChips.tsx**: Quick-reply buttons for silent interaction
6. **KeywordFeedback.tsx**: Keyword detection visual feedback
7. **OnboardingStatus.tsx**: Onboarding progress display

### Household Components (5 files)

Located in `src/components/household/`:

1. **HeroHeaderBanner.tsx**: Gradient header with household name
2. **CompactMemberRow.tsx**: Member list item
3. **MemberAvatarCircle.tsx**: Abstract avatar generation
4. **MemberDetailSheet.tsx**: Full member profile sheet
5. **HouseholdPreferencesSection.tsx**: Household settings

### Analytics Components (8 files)

Located in `src/components/analytics/`:

1. **BMIGaugeCard.tsx**: BMI calculation and gauge
2. **CalorieChart.tsx**: Daily/weekly calorie line chart
3. **MacroChart.tsx**: Macronutrient pie chart
4. **CalendarView.tsx**: Monthly meal log calendar
5. **DayDetailModal.tsx**: Single day meal detail
6. **WeeklyReportCard.tsx**: Weekly summary card
7. **NutritionInsights.tsx**: AI-generated nutrition insights
8. **ShareProgressSheet.tsx**: Social media sharing

### Settings Components (9 files)

Located in `src/components/settings/`:

1. **QuickActionCard.tsx**: Shortcut card
2. **SettingsRow.tsx**: Reusable settings row
3. **ProfileEditSheet.tsx**: Edit profile
4. **DietarySheet.tsx**: Edit dietary preferences
5. **BeautySheet.tsx**: Edit beauty profile
6. **GoalsSheet.tsx**: Edit health/lifestyle goals
7. **NutritionGoalsSheet.tsx**: Edit nutrition goals
8. **NotificationSettingsSheet.tsx**: Manage notifications
9. **ConversationHistorySheet.tsx**: View conversation logs
10. **AccountSheet.tsx**: Account management

### Universal Components (reusable across domains)

Located in `src/components/ui/`:

**KAEVA-specific**:
1. **ProgressRing.tsx**: Circular progress indicator
2. **HintCard.tsx**: Contextual hints
3. **BookmarkButton.tsx**: Bookmark/unbookmark action
4. **MultiModalInput.tsx**: Text + voice + image input
5. **CircularDialPicker.tsx**: Rotary dial for numerical values
6. **UniversalFixSheet.tsx**: Manual correction sheet
7. **UniversalLibrary.tsx**: Domain-specific tab structures for browsing items
8. **EmojiGridSelector.tsx**: Emoji-based mood/preference selector
9. **SyncIndicator.tsx**: Real-time sync status
10. **NotificationBell.tsx**: Notification center

**Shadcn UI Primitives** (40+ files):
- accordion, alert-dialog, alert, avatar, badge, button, calendar, card, carousel, chart, checkbox, collapsible, dialog, drawer, dropdown-menu, error-fallback, form, icon, input, label, popover, progress, radio-group, scroll-area, select, separator, sheet, skeleton, slider, sonner (toast), switch, table, tabs, textarea, toast, toaster, tooltip

### Layout Helper Components

Located in `src/components/layout/`:

1. **PageHeader.tsx**: Standard page header (back button, title, home button)
2. **BottomTabBar.tsx**: Bottom navigation tabs for secondary pages
3. **PageIndicator.tsx**: Page position indicator (pagination dots)
4. **PageTransition.tsx**: Page transition wrapper (slide + fade)
5. **ActionPickerDialog.tsx**: Multi-action picker modal

### Misc Components

Located in `src/components/`:

1. **AdminRoute.tsx**: Admin role protection
2. **ProtectedRoute.tsx**: Authentication protection
3. **PublicRoute.tsx**: Public route wrapper
4. **AuroraBackground.tsx**: Animated aurora background
5. **KaevaAperture.tsx**: Living Aperture hero button
6. **Dashboard.tsx**: Main dashboard (6 views)
7. **DigitalTwinCard.tsx**: Digital twin summary
8. **DigitalTwinSummary.tsx**: Digital twin details
9. **HouseholdMemberCard.tsx**: Household member card
10. **HouseholdMemberForm.tsx**: Add/edit household member
11. **HouseholdSetup.tsx**: Initial household creation
12. **PermissionRequest.tsx**: Permission request UI
13. **TutorialOverlay.tsx**: Feature tutorials
14. **ValuePropCarousel.tsx**: Landing page value props
15. **VolumeControl.tsx**: Audio volume control
16. **NavLink.tsx**: Navigation link component
17. **ConversationHistory.tsx**: Conversation history viewer

**Domain Clusters** (7 files for future modularity):
- ClusterBeauty, ClusterBiometrics, ClusterHousehold, ClusterLanguage, ClusterMission, ClusterSafety

### Component Design Patterns

**Glass Card Pattern**:
```typescript
<div className="glass-card p-4 rounded-3xl border border-border/20">
  {/* Content */}
</div>
```

**Skeleton Loading**:
```typescript
if (isLoading) return <ComponentSkeleton />;
```

**Error Boundaries**:
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>
```

**Empty States**:
```typescript
if (items.length === 0) {
  return <EmptyState icon={<Icon />} message="No items yet" action={<Button />} />;
}
```

**Responsive Design**:
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Items */}
</div>
```

---

## Hooks & Custom Logic

### Custom Hooks (17 files)

Located in `src/hooks/`:

#### `useAssistantVoice.ts`
**Purpose**: In-app voice assistant (Jarvis) using ElevenLabs SDK

**Features**:
- `useConversation` from @11labs/react
- Client tools registration (check_inventory, get_recipes, add_to_shopping_list, etc.)
- Real-time contextual updates via Supabase subscriptions
- Audio amplitude visualization
- User/AI transcript tracking
- Aperture state management (idle, listening, speaking)

**Client Tools**:
1. `check_inventory({ category })`: Query inventory by category
2. `get_recipes({ dietary_restrictions, max_cooking_time })`: Find recipes
3. `add_to_shopping_list({ items })`: Add items to shopping list
4. `check_expiring_items()`: Get items nearing expiry
5. `get_nutrition_status()`: Current day nutrition progress
6. `get_household_info()`: Household members, pets, allergies

**Contextual Updates**:
- Inventory changes (items added, low stock, expiring)
- Shopping list changes
- Household member allergies
- Pet dietary restrictions
- Current cart contents

**Returns**:
```typescript
{
  apertureState: 'idle' | 'listening' | 'speaking',
  audioAmplitude: number,
  userTranscript: string,
  aiTranscript: string,
  showConversation: boolean,
  status: 'connected' | 'disconnected' | 'connecting',
  isSpeaking: boolean,
  startConversation: () => Promise<void>,
  endConversation: () => void,
  sendContextualUpdate: (context: string) => void
}
```

#### `useOnboardingVoice.ts`
**Purpose**: Voice-based onboarding flow using ElevenLabs SDK

**Features**:
- Separate agent from assistant (different prompt/tools)
- Client tools for profile updates
- Household member and pet creation
- TDEE calculation integration
- Concept card triggering
- Onboarding completion handling

**Client Tools**:
1. `updateProfile({ userName, userAge, ... })`: Update profile fields with TDEE calculation
2. `saveHouseholdMember({ name, age, ... })`: Add household member
3. `savePet({ name, species, ... })`: Add pet
4. `completeConversation()`: Mark onboarding complete, create household

**Returns**: Same shape as useAssistantVoice

#### `useModularOnboarding.ts`
**Purpose**: Manage 6-module onboarding completion tracking

**Modules**:
- `core`: Basic user info (required for dashboard access)
- `nutrition`: Nutrition goals and preferences
- `pantry`: Pantry setup
- `beauty`: Beauty profile
- `pets`: Pet profiles
- `household`: Household members

**State**:
```typescript
{
  core: boolean,
  nutrition: boolean,
  pantry: boolean,
  beauty: boolean,
  pets: boolean,
  household: boolean
}
```

**Functions**:
- `isModuleComplete(module: OnboardingModule): boolean`
- `completeModule(module: OnboardingModule): Promise<boolean>`
- `isDismissedThisSession(module: OnboardingModule): boolean`
- `dismissPrompt(module: OnboardingModule): void`
- `allModulesComplete(): boolean`
- `completionPercentage(): number`

**Storage**:
- Completion state: `profiles.onboarding_modules` (JSONB)
- Session dismissals: `sessionStorage`

#### `useSwipeNavigation.ts`
**Purpose**: Horizontal swipe gestures between pages

**Parameters**:
- `onSwipeLeft?: () => void`
- `onSwipeRight?: () => void`
- `threshold?: number` (default 50px)

**Features**:
- Touch event listeners
- Swipe distance threshold
- Haptic feedback (haptics.selection())
- Prevents accidental swipes

**Usage**:
```typescript
const { handleTouchStart, handleTouchEnd } = useSwipeNavigation({
  onSwipeLeft: () => navigate('/next-page'),
  onSwipeRight: () => navigate('/prev-page'),
  threshold: 80
});

return <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>...</div>;
```

#### `useRealtimeInventory.ts`
**Purpose**: Real-time inventory subscriptions and updates

**Features**:
- Initial data fetch from Supabase
- TanStack Query cache subscription
- Real-time updates via Supabase Realtime
- Automatic refetch on cache invalidation

**Returns**:
```typescript
{
  items: InventoryItem[],
  isLoading: boolean
}
```

**Realtime Setup**:
```typescript
// RealtimeContext.tsx
supabase
  .channel('inventory-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  })
  .subscribe();
```

#### `useRealtimeNotifications.ts`
**Purpose**: Real-time notification subscriptions

**Features**:
- Fetch recent notifications
- Real-time updates via Supabase Realtime
- Unread count calculation
- Mark as read functionality
- Delete notifications

**Returns**:
```typescript
{
  notifications: Notification[],
  unreadCount: number,
  isLoading: boolean,
  markAsRead: (id: string) => Promise<void>,
  markAllAsRead: () => Promise<void>,
  deleteNotification: (id: string) => Promise<void>
}
```

#### `useHouseholdActivity.ts`
**Purpose**: Fetch household activity feed

**Returns**:
```typescript
{
  activities: HouseholdActivity[],
  isLoading: boolean
}
```

#### `useWakeWordDetection.ts`
**Purpose**: "Hey Kaeva" wake word detection

**Features**:
- Web Speech API integration
- Fuzzy matching ("Kaeva", "Hey Kaeva", "OK Kaeva")
- Auto-restart on errors
- Opt-in via settings toggle
- Battery level check (auto-disable at low battery)

**Returns**:
```typescript
{
  isListening: boolean,
  startListening: () => void,
  stopListening: () => void
}
```

#### `useVoiceCooking.ts`
**Purpose**: Voice-guided cooking mode

**Features**:
- Step-by-step voice guidance
- Timer announcements
- Temperature callouts
- Next/previous step commands

#### `useVoiceMealLog.ts`
**Purpose**: Voice meal logging

**Features**:
- Voice-activated meal entry
- Food item detection
- Quantity parsing
- Meal type classification

#### `useKaevaMotion.ts`
**Purpose**: Living Aperture animation state management

**States**:
- `idle`: Slow breathing pulse
- `listening`: Expanded with pulse
- `speaking`: Sync with audio amplitude
- `thinking`: Spinning animation

#### `useVisionCapture.ts`
**Purpose**: Camera/scanner functionality

**Features**:
- react-webcam integration
- Photo capture
- Flash toggle
- Camera flip (front/back)
- Permission handling

#### `usePrefetch.ts`
**Purpose**: Route prefetching for faster navigation

**Features**:
- Prefetch routes on hover/focus
- Smart prefetching (only on desktop)

#### `useDebouncedValue.ts`
**Purpose**: Debounce utility for search inputs

**Usage**:
```typescript
const debouncedSearch = useDebouncedValue(searchTerm, 300);
```

#### `use-mobile.tsx`
**Purpose**: Mobile device detection

**Returns**:
```typescript
{
  isMobile: boolean
}
```

**Logic**: Checks `window.matchMedia('(max-width: 768px)')`

#### `use-toast.ts`
**Purpose**: Toast notification helper (Shadcn sonner)

**Usage**:
```typescript
const { toast } = useToast();
toast({
  title: "Success",
  description: "Item added to inventory",
  variant: "default" | "destructive"
});
```

### Context Providers (2 files)

Located in `src/contexts/`:

#### `RealtimeContext.tsx`
**Purpose**: Global Supabase Realtime subscriptions

**Subscriptions**:
- `inventory`: Inventory table changes
- `notifications`: Notification table changes
- `household_activity`: Household activity table changes

**Features**:
- Auto-invalidates TanStack Query cache on changes
- Single subscription per table (no duplicates)
- Cleanup on unmount

#### `VoiceAssistantContext.tsx`
**Purpose**: Voice assistant provider wrapping useAssistantVoice

**Features**:
- Exposes voice assistant state globally
- Positioned inside BrowserRouter (for useNavigate)
- Lazy loaded via AuthenticatedLayout (only for authenticated users)

**Usage**:
```typescript
const { startConversation, sendContextualUpdate } = useVoiceAssistant();
```

---

## Utility Libraries

Located in `src/lib/`:

### `authUtils.ts`
**Purpose**: Authentication helpers

**Functions**:
- `getActiveSession()`: Get current session
- `refreshSession()`: Refresh expired session
- `signOut()`: Sign out user

### `contextBuilder.ts`
**Purpose**: Build context for voice agents

**Functions**:
- `buildAssistantContext(profile, inventory, recipes, household)`: Construct agent context string
- `buildOnboardingContext(profile)`: Construct onboarding context

**Context Includes**:
- User profile data
- Household members and pets
- Allergies and dietary restrictions
- Inventory summary
- Recent meals
- Shopping list

### `conversationLogger.ts`
**Purpose**: Log voice conversations to database

**Functions**:
- `logMessage(conversationId, role, message, metadata)`: Insert conversation_history entry
- `logEvent(conversationId, agentType, eventType, eventData)`: Insert conversation_events entry

### `conversationUtils.ts`
**Purpose**: Conversation helpers

**Functions**:
- `generateConversationId()`: Generate UUID for new conversation
- `formatConversationTimestamp(timestamp)`: Format timestamp display

### `elevenLabsAudio.ts`
**Purpose**: ElevenLabs audio utilities

**Functions**:
- `initializeAudioContext()`: Create Web Audio API context
- `playAudioStream(stream)`: Play audio stream from ElevenLabs

### `exportUtils.ts`
**Purpose**: Data export utilities

**Functions**:
- `exportToCSV(data, filename)`: Export data to CSV
- `exportToJSON(data, filename)`: Export data to JSON
- `shareData(data, platform)`: Share data to social media

### `goalCalculators.ts`
**Purpose**: Nutrition goal calculations

**Functions**:
- `calculateMacroGoals(tdee, dietType)`: Calculate protein/carbs/fat goals
- `calculateWaterGoal(weight)`: Calculate daily water intake
- `calculateBMI(weight, height)`: BMI calculation
- `getBMICategory(bmi)`: BMI category (underweight, normal, overweight, obese)

### `haptics.ts`
**Purpose**: Haptic feedback using Capacitor Haptics

**Functions**:
- `haptics.impact()`: Impact feedback (light, medium, heavy)
- `haptics.notification()`: Notification feedback (success, warning, error)
- `haptics.selection()`: Selection feedback (tick)

**Usage**:
```typescript
import { haptics } from '@/lib/haptics';

haptics.impact('medium'); // Button press
haptics.notification('success'); // Success action
haptics.selection(); // List scroll
```

### `inventoryUtils.ts`
**Purpose**: Inventory helpers

**Functions**:
- `calculateFillLevel(current, original)`: 0-100 fill percentage
- `determineStatus(fillLevel, reorderThreshold)`: Status enum
- `formatExpiryDate(date)`: Human-readable expiry ("2 days", "Expired")
- `groupByCategory(items)`: Group inventory by category

### `onboardingSave.ts`
**Purpose**: Save onboarding data to database

**Functions**:
- `saveOnboardingData(formData)`: Save all onboarding data
  - Updates profiles
  - Calculates TDEE
  - Creates household
  - Creates household_memberships
  - Batch inserts household_members and pets
  - Sets onboarding_completed = true

### `onboardingTransforms.ts`
**Purpose**: Transform voice data to database format

**Functions**:
- `transformVoiceToProfile(voiceData)`: Convert voice input to profile format
- `transformVoiceToHouseholdMember(voiceData)`: Convert voice input to household_member
- `transformVoiceToPet(voiceData)`: Convert voice input to pet

### `petCareData.ts`
**Purpose**: Pet care tips and toxic food data

**Data**:
- `TOXIC_FOODS_BY_SPECIES`: Map of species → toxic foods
- `PET_CARE_TIPS`: Species-specific care guidelines
- `FEEDING_SCHEDULES`: Age-based feeding recommendations

### `shareUtils.ts`
**Purpose**: Social sharing utilities

**Functions**:
- `shareRecipe(recipe, platform)`: Share recipe to social media
- `shareProgress(stats, platform)`: Share nutrition progress
- `generateShareImage(data)`: Generate share image with stats

### `streakUtils.ts`
**Purpose**: Streak calculation

**Functions**:
- `calculateStreak(lastLogDate, currentStreakstart)`: Calculate current streak
- `updateStreak(userId)`: Update user's streak on meal log
- `isStreakActive(lastLogDate)`: Check if streak is still active

### `tdeeCalculator.ts`
**Purpose**: TDEE (Total Daily Energy Expenditure) calculation

**Formulas**:
- Mifflin-St Jeor Equation for BMR
- Activity multipliers (sedentary, light, moderate, very active, extremely active)

**Functions**:
- `calculateTDEE(age, weight, height, gender, activityLevel)`: Calculate TDEE
- `calculateBMR(age, weight, height, gender)`: Calculate Basal Metabolic Rate

### `utils.ts`
**Purpose**: General utilities

**Functions**:
- `cn(...classes)`: Class name merger using clsx + tailwind-merge
- `formatDate(date, format)`: Date formatting
- `formatCurrency(amount)`: Currency formatting
- `slugify(text)`: Convert text to URL-safe slug

### `voiceLogger.ts`
**Purpose**: Voice interaction logging

**Functions**:
- `logVoiceInteraction(userId, intent, confidence, duration)`: Log voice interaction
- `logToolCall(userId, toolName, params, result)`: Log client tool invocation

### Error Boundary

**File**: `src/lib/ErrorBoundary.tsx`

**Features**:
- Global error catching
- Error fallback UI
- Error reporting (console.error)
- Recovery button

**Usage**:
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

---

## Edge Functions

### Overview

**Location**: `supabase/functions/`  
**Count**: 26 functions  
**Runtime**: Deno  
**Authentication**: Most require JWT verification (set in `supabase/config.toml`)

### Shared Utilities

**Location**: `supabase/functions/_shared/`

1. **allergenDetection.ts**: Allergen detection logic
2. **apiClients.ts**: API client factories (FatSecret, USDA, YouTube, Instacart, Gemini)
3. **beautyAnalyzer.ts**: Beauty product analysis
4. **contextHydration.ts**: Build agent context from database
5. **deceptionAnalyzer.ts**: Product deception detection (marketing claims vs reality)
6. **oauth1.ts**: OAuth 1.0 signature generation (FatSecret, Instacart)
7. **petCareData.ts**: Pet care tips and toxic foods
8. **productProcessors.ts**: Product identification and enrichment
9. **rateLimiter.ts**: Rate limiting logic
10. **schemas.ts**: Zod validation schemas
11. **usdaApi.ts**: USDA FoodData Central API client

### Edge Function Descriptions

#### `accept-household-invite`
**File**: `supabase/functions/accept-household-invite/index.ts`  
**Auth**: Required  
**Purpose**: Join household via invite code

**Input**:
```json
{
  "inviteCode": "jwt-signed-code"
}
```

**Process**:
1. Verify JWT signature
2. Check invite validity (expiration, max uses)
3. Add user to `household_memberships` with role 'member'
4. Update `profiles.current_household_id`
5. Increment `household_invites.times_used`
6. Log activity to `household_activity`

**Output**:
```json
{
  "success": true,
  "householdId": "uuid",
  "householdName": "Smith Family"
}
```

**Errors**:
- `INVALID_CODE`: JWT verification failed
- `EXPIRED_CODE`: Invite expired
- `MAX_USES_REACHED`: Invite fully redeemed
- `ALREADY_MEMBER`: User already in household

#### `analyze-meal`
**File**: `supabase/functions/analyze-meal/index.ts`  
**Auth**: Required  
**Purpose**: Analyze meal photo for nutrition tracking

**Input**:
```json
{
  "imageUrl": "https://...",
  "mealType": "lunch"
}
```

**Process**:
1. Send image to Google Gemini Vision
2. Extract food items with quantities
3. Enrich each item via FatSecret/USDA/Gemini cascade
4. Calculate aggregate macros
5. Insert `meal_logs` entry
6. Update user streak

**Output**:
```json
{
  "items": [
    {
      "name": "Chicken breast",
      "quantity": 200,
      "unit": "g",
      "calories": 330,
      "protein": 62,
      "carbs": 0,
      "fat": 7,
      "fiber": 0
    }
  ],
  "totals": {
    "calories": 330,
    "protein": 62,
    "carbs": 0,
    "fat": 7,
    "fiber": 0
  },
  "mealLogId": "uuid"
}
```

#### `analyze-vision`
**File**: `supabase/functions/analyze-vision/index.ts`  
**Auth**: Required  
**Purpose**: Multi-intent vision analysis (barcode, OCR, visual features)

**Input**:
```json
{
  "imageData": "base64-string",
  "intent": "inventory" | "nutrition" | "beauty" | "pet" | "appliance"
}
```

**Process**:
1. Barcode detection (highest priority)
2. OCR text extraction from packaging
3. Visual features analysis (color, shape, text)
4. Nutrition label parsing
5. Confidence scoring for each method
6. Return best match with identification method

**Output**:
```json
{
  "identificationMethod": "barcode" | "ocr" | "visual" | "nutrition_label",
  "confidence": 0.95,
  "productName": "Coca-Cola Classic",
  "brandName": "Coca-Cola",
  "barcode": "049000042566",
  "category": "pantry",
  "extractedText": ["Coca-Cola", "Classic", "12 FL OZ"],
  "nutritionData": { ... }
}
```

#### `check-admin`
**File**: `supabase/functions/check-admin/index.ts`  
**Auth**: Required  
**Purpose**: Check if user has admin role

**Output**:
```json
{
  "isAdmin": true
}
```

#### `check-auto-restock`
**File**: `supabase/functions/check-auto-restock/index.ts`  
**Auth**: Required (cron job)  
**Purpose**: Evaluate inventory for auto-reorder triggers

**Process**:
1. Query inventory where `auto_order_enabled = true`
2. Check `fill_level` against `reorder_threshold`
3. Create `shopping_list` entries with source 'auto_reorder'
4. Send notification to user

**Output**:
```json
{
  "restockedItems": [
    {
      "itemName": "Milk",
      "fillLevel": 15,
      "threshold": 20,
      "addedToCart": true
    }
  ]
}
```

#### `cook-recipe`
**File**: `supabase/functions/cook-recipe/index.ts`  
**Auth**: Required  
**Purpose**: Start cooking mode for recipe

**Input**:
```json
{
  "recipeId": "uuid"
}
```

**Output**:
```json
{
  "recipe": {
    "name": "Spaghetti Carbonara",
    "ingredients": [...],
    "instructions": [
      {
        "step": 1,
        "description": "Boil water for pasta",
        "duration": 10,
        "temperature": null
      }
    ]
  }
}
```

#### `create-household-invite`
**File**: `supabase/functions/create-household-invite/index.ts`  
**Auth**: Required  
**Purpose**: Generate JWT-signed invite code

**Input**:
```json
{
  "householdId": "uuid",
  "expiresIn": 86400,
  "maxUses": 1
}
```

**Process**:
1. Verify user is household owner
2. Generate JWT with payload: `{ householdId, createdBy, expiresAt }`
3. Sign with `INVITE_JWT_SECRET`
4. Insert `household_invites` entry
5. Generate shareable URL

**Output**:
```json
{
  "inviteCode": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "inviteUrl": "https://app.kaeva.com/household/join/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2024-01-15T12:00:00Z"
}
```

#### `daily-ai-digest`
**File**: `supabase/functions/daily-ai-digest/index.ts`  
**Auth**: Required (cron job)  
**Purpose**: Generate proactive AI insights daily

**Trigger**: Cron job (daily at 7 AM user local time)

**Process**:
1. Query user profile, household, inventory, meal logs
2. Analyze expiring items (within 3 days)
3. Detect low stock items (fill_level < reorder_threshold)
4. Calculate nutrition gaps (calories/protein/carbs/fat vs goals)
5. Generate time-appropriate meal suggestions
6. Check allergen warnings
7. Send to Gemini for insight generation with reasoning
8. Limit to 3-5 insights, prioritize by urgency
9. Insert `daily_digests` entry
10. Create `notifications` entry

**Output** (stored in `daily_digests.insights`):
```json
{
  "insights": [
    {
      "type": "expiring_items",
      "title": "3 items expiring soon",
      "message": "Milk, Yogurt, and Chicken breast expire in 2 days",
      "priority": 1,
      "reasoning": "These items are perishable and approaching expiration. Consider using them in meals today to avoid waste."
    },
    {
      "type": "nutrition_gap",
      "title": "Low protein intake yesterday",
      "message": "You consumed 45g protein vs 150g goal",
      "priority": 2,
      "reasoning": "Yesterday's protein intake was 30% of your goal. Consider protein-rich breakfast options like eggs or Greek yogurt."
    }
  ]
}
```

**Insight Types**:
- `expiring_items`: Items approaching expiration
- `low_stock`: Items needing reorder
- `nutrition_gap`: Macro deficiencies
- `meal_suggestion`: Time-appropriate meal ideas
- `safety_alert`: Allergen or toxicity warnings

**Gemini Optimization**:
- Model: `gemini-2.0-flash`
- maxOutputTokens: 4096
- Request 2-3 insights instead of 3-5 to avoid truncation
- Limit context: 5 expiring items, 5 low stock items, 3 recent meals

#### `delete-account`
**File**: `supabase/functions/delete-account/index.ts`  
**Auth**: Required  
**Purpose**: Delete user account and all associated data

**Process**:
1. Delete from `household_members`
2. Delete from `pets`
3. Delete from `meal_logs`
4. Delete from `water_logs`
5. Delete from `conversation_history`
6. Delete from `notifications`
7. Delete from `bookmarks`
8. Delete from `learned_preferences`
9. Remove from `household_memberships`
10. Delete from `profiles`
11. Delete from `auth.users`

**Output**:
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

#### `detect-intent`
**File**: `supabase/functions/detect-intent/index.ts`  
**Auth**: Required  
**Purpose**: Detect user intent from voice/text input

**Input**:
```json
{
  "message": "Add milk to my shopping list"
}
```

**Process**:
1. Send to Gemini for intent classification
2. Extract intent and entities

**Output**:
```json
{
  "intent": "add_to_shopping_list",
  "confidence": 0.95,
  "entities": {
    "items": ["milk"]
  }
}
```

**Intents**:
- `add_to_shopping_list`: Add items to cart
- `check_inventory`: Query inventory
- `get_recipes`: Find recipes
- `track_meal`: Log meal
- `get_nutrition_status`: Check progress
- `check_expiring_items`: Find expiring items

#### `enrich-product`
**File**: `supabase/functions/enrich-product/index.ts`  
**Auth**: Required  
**Purpose**: Enrich product with nutrition data

**Input**:
```json
{
  "productName": "Coca-Cola Classic",
  "barcode": "049000042566"
}
```

**Process** (cascading fallback):
1. **FatSecret API** (primary):
   - Search by barcode or name
   - Return full nutrition data
2. **USDA FoodData Central** (secondary):
   - Search Survey (FNDDS) database
   - Search SR Legacy database
   - Return nutrition data
3. **Gemini Estimation** (tertiary):
   - AI-powered nutrition estimation
   - Lower confidence score

**Output**:
```json
{
  "fatsecretId": "12345",
  "nutritionData": {
    "servingSize": "12 fl oz",
    "calories": 140,
    "protein": 0,
    "carbs": 39,
    "fat": 0,
    "fiber": 0,
    "sugar": 39
  },
  "allergens": [],
  "dietaryFlags": ["vegan", "gluten-free"],
  "source": "fatsecret" | "usda" | "gemini_estimate"
}
```

#### `extract-social-recipe`
**File**: `supabase/functions/extract-social-recipe/index.ts`  
**Auth**: Required  
**Purpose**: Import recipe from social media URL

**Supported Platforms**:
- TikTok
- Instagram
- Pinterest
- YouTube

**Input**:
```json
{
  "url": "https://www.tiktok.com/@user/video/123456"
}
```

**Process**:
1. Fetch URL content
2. Extract video/image/text
3. Send to Gemini for recipe extraction
4. Parse ingredients and instructions
5. Cache in `social_recipe_cache` table (avoid re-parsing)
6. Return recipe data

**Output**:
```json
{
  "name": "TikTok Pasta",
  "ingredients": [
    { "name": "Cherry tomatoes", "quantity": 2, "unit": "cups" },
    { "name": "Feta cheese", "quantity": 8, "unit": "oz" }
  ],
  "instructions": [
    { "step": 1, "description": "Place tomatoes and feta in baking dish" },
    { "step": 2, "description": "Bake at 400°F for 30 minutes" }
  ],
  "cookingTime": 40,
  "difficulty": "easy",
  "servings": 4,
  "source": "tiktok",
  "sourceUrl": "https://..."
}
```

#### `generate-app-icons`
**File**: `supabase/functions/generate-app-icons/index.ts`  
**Auth**: None (public)  
**Purpose**: Generate PWA icons via Lovable AI Gateway

**Input**:
```json
{
  "prompt": "Kaeva K logo with gold gradient"
}
```

**Process**:
1. Call Lovable AI Gateway with prompt
2. Receive base64 image
3. Generate multiple sizes: 192x192, 512x512, 180x180 (Apple Touch), maskable variants
4. Return download links

**Output**:
```json
{
  "icons": {
    "icon-192": "data:image/png;base64,...",
    "icon-512": "data:image/png;base64,...",
    "apple-touch-icon": "data:image/png;base64,...",
    "icon-maskable-192": "data:image/png;base64,...",
    "icon-maskable-512": "data:image/png;base64,..."
  }
}
```

#### `generate-beauty-inspiration`
**File**: `supabase/functions/generate-beauty-inspiration/index.ts`  
**Auth**: Required  
**Purpose**: Generate beauty looks and routines

**Input**:
```json
{
  "products": [
    { "name": "Glossier Boy Brow", "category": "makeup" }
  ],
  "style": "natural" | "glam" | "professional" | "bold"
}
```

**Process**:
1. Analyze user's beauty inventory
2. Send to Gemini for look generation
3. Search YouTube for tutorial videos
4. Return look with products and videos

**Output**:
```json
{
  "looks": [
    {
      "name": "Natural Everyday Look",
      "products": [
        { "name": "Glossier Boy Brow", "step": 1, "instruction": "Brush brows upward" }
      ],
      "steps": ["Prep skin", "Apply foundation", ...],
      "videoTutorials": [
        {
          "title": "Natural Makeup Tutorial",
          "channelTitle": "Beauty Guru",
          "videoId": "abc123",
          "thumbnail": "https://..."
        }
      ]
    }
  ]
}
```

#### `generate-meal-plan`
**File**: `supabase/functions/generate-meal-plan/index.ts`  
**Auth**: Required  
**Purpose**: Generate weekly meal plan with AI

**Input**:
```json
{
  "startDate": "2024-01-15",
  "cuisines": ["Italian", "Mexican"],
  "avoidIngredients": ["mushrooms"],
  "maxCookingTime": 45,
  "dietaryRestrictions": ["vegetarian"]
}
```

**Process**:
1. Fetch user profile, household members, inventory
2. Calculate household TDEE and nutrition goals
3. Send to Gemini for meal plan generation
4. Generate 7 days × 3 meals (breakfast, lunch, dinner)
5. Match recipes from inventory
6. Return meal plan with shopping list

**Output**:
```json
{
  "mealPlan": [
    {
      "date": "2024-01-15",
      "meals": {
        "breakfast": {
          "name": "Avocado Toast",
          "recipeId": "uuid",
          "ingredients": [...],
          "calories": 350
        },
        "lunch": { ... },
        "dinner": { ... }
      }
    }
  ],
  "shoppingList": [
    { "item": "Avocados", "quantity": 7, "unit": "count" }
  ]
}
```

#### `generate-signed-url`
**File**: `supabase/functions/generate-signed-url/index.ts`  
**Auth**: Required  
**Purpose**: Generate signed URL for file upload

**Input**:
```json
{
  "bucket": "app-assets",
  "path": "meal-photos/123.jpg",
  "expiresIn": 3600
}
```

**Output**:
```json
{
  "signedUrl": "https://...",
  "expiresAt": "2024-01-01T13:00:00Z"
}
```

#### `get-place-hours`
**File**: `supabase/functions/get-place-hours/index.ts`  
**Auth**: None (public)  
**Purpose**: Get store hours from Google Places API

**Input**:
```json
{
  "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4"
}
```

**Output**:
```json
{
  "hours": {
    "monday": "8:00 AM - 9:00 PM",
    "tuesday": "8:00 AM - 9:00 PM",
    ...
  },
  "openNow": true
}
```

#### `identify-product`
**File**: `supabase/functions/identify-product/index.ts`  
**Auth**: Required  
**Purpose**: Identify product from image (barcode-first, then visual)

**Input**:
```json
{
  "imageData": "base64-string"
}
```

**Process**:
1. Barcode detection
2. If no barcode: OCR + visual analysis
3. Return product identification

**Output**:
```json
{
  "productName": "Tide Laundry Detergent",
  "barcode": "037000850984",
  "category": "household",
  "confidence": 0.98
}
```

#### `instacart-create-cart`
**File**: `supabase/functions/instacart-create-cart/index.ts`  
**Auth**: Required  
**Purpose**: Create Instacart cart from shopping list

**Input**:
```json
{
  "items": [
    { "name": "Milk", "quantity": 1 }
  ],
  "retailerId": "123"
}
```

**Output**:
```json
{
  "cartUrl": "https://www.instacart.com/store/checkout/...",
  "cartId": "abc123"
}
```

#### `instacart-service`
**File**: `supabase/functions/instacart-service/index.ts`  
**Auth**: Required  
**Purpose**: Instacart API service wrapper

**Endpoints**:
- `GET /retailers`: List available retailers
- `GET /retailers/:id/products`: Search products
- `POST /carts`: Create cart
- `PUT /carts/:id`: Update cart

#### `notify-spoilage`
**File**: `supabase/functions/notify-spoilage/index.ts`  
**Auth**: Required (cron job)  
**Purpose**: Check for spoiled items and notify users

**Process**:
1. Call `check_spoilage()` database function
2. For each spoiled item:
   - Call `mark_spoilage()` to update status
   - Create notification entry
3. Send push notification (if configured)

#### `provision-agents`
**File**: `supabase/functions/provision-agents/index.ts`  
**Auth**: Required  
**Purpose**: Create/update ElevenLabs agents

**Known Agent IDs**:
- Onboarding: `agent_0501kakwnx5rffaby5px9y1pskkb`
- Assistant: `agent_2601kaqwv4ejfhets9fyyafzj2e6`

**Input**:
```json
{
  "agentType": "onboarding" | "assistant"
}
```

**Process**:
1. Fetch user profile for context
2. Build agent prompt from template
3. Define client tools in ElevenLabs format
4. Attempt PATCH to update existing agent (by known ID)
5. If 404, POST to create new agent
6. Update `profiles.agent_configured = true`

**Onboarding Tools**:
- `updateProfile`: Named parameters (userName, userAge, userWeight, ...)
- `saveHouseholdMember`: Named parameters (name, age, allergies, ...)
- `savePet`: Named parameters (name, species, breed, ...)
- `completeConversation`: No parameters

**Assistant Tools**:
- `check_inventory`: `{ category: string }`
- `get_recipes`: `{ dietary_restrictions: string[], max_cooking_time: number }`
- `add_to_shopping_list`: `{ items: string[] }`
- `check_expiring_items`: No parameters

**Tool Format** (ElevenLabs API):
```json
{
  "type": "client",
  "name": "updateProfile",
  "description": "Update user profile fields",
  "parameters": {
    "type": "object",
    "properties": {
      "userName": { "type": "string", "description": "User's name" },
      "userAge": { "type": "number", "description": "User's age" }
    }
  }
}
```

**Output**:
```json
{
  "success": true,
  "agentId": "agent_0501kakwnx5rffaby5px9y1pskkb",
  "message": "Onboarding agent configured successfully"
}
```

#### `search-recipe-videos`
**File**: `supabase/functions/search-recipe-videos/index.ts`  
**Auth**: Required  
**Purpose**: Search YouTube for recipe tutorial videos

**Input**:
```json
{
  "recipeName": "Spaghetti Carbonara"
}
```

**Process**:
1. Call YouTube Data API v3 search endpoint
2. Filter for medium-duration cooking videos
3. Fetch video metadata (title, channel, thumbnail)
4. Return top 3 results

**Output**:
```json
{
  "videos": [
    {
      "videoId": "abc123",
      "title": "Perfect Spaghetti Carbonara",
      "channelTitle": "Chef John",
      "thumbnail": "https://i.ytimg.com/vi/abc123/mqdefault.jpg",
      "duration": "PT12M34S",
      "estimatedCookTime": 25
    }
  ]
}
```

#### `suggest-recipes`
**File**: `supabase/functions/suggest-recipes/index.ts`  
**Auth**: Required  
**Purpose**: AI-powered recipe suggestions

**Input**:
```json
{
  "dietary_restrictions": ["vegetarian"],
  "max_cooking_time": 30,
  "ingredients": ["pasta", "tomatoes"]
}
```

**Process**:
1. Fetch user inventory, preferences, household data
2. Send to Gemini for recipe generation
3. Calculate ingredient match score (0-100%)
4. Add explanation field (why this recipe is recommended)
5. Search YouTube for tutorial videos
6. Return 3-5 recipes

**Output**:
```json
{
  "recipes": [
    {
      "name": "Quick Pasta Primavera",
      "ingredients": [...],
      "instructions": [...],
      "cookingTime": 25,
      "difficulty": "easy",
      "matchScore": 85,
      "explanation": "This recipe uses 85% of your current pantry items (pasta, tomatoes, garlic, olive oil) and aligns with your vegetarian preference. Quick cooking time fits your busy schedule.",
      "videoTutorials": [...]
    }
  ]
}
```

**Explanation Field**: Transparent reasoning for why recipe is suggested
- Ingredient match percentage
- Nutritional alignment
- Household preferences
- Time constraints
- Dietary compatibility

### Edge Function Configuration

**File**: `supabase/config.toml`

```toml
project_id = "btgmvuieishjiybgcmpj"

[functions.generate-app-icons]
verify_jwt = false

[functions.get-place-hours]
verify_jwt = false

[functions.analyze-vision]
verify_jwt = true

[functions.daily-ai-digest]
verify_jwt = true

[functions.check-auto-restock]
verify_jwt = true

[functions.search-recipe-videos]
verify_jwt = true

[functions.generate-meal-plan]
verify_jwt = true

[functions.generate-beauty-inspiration]
verify_jwt = true

[functions.create-household-invite]
verify_jwt = true

[functions.generate-signed-url]
verify_jwt = true

[functions.provision-agents]
verify_jwt = true

[functions.instacart-create-cart]
verify_jwt = true

[functions.check-admin]
verify_jwt = true

[functions.enrich-product]
verify_jwt = true

[functions.identify-product]
verify_jwt = true

[functions.cook-recipe]
verify_jwt = true

[functions.notify-spoilage]
verify_jwt = true

[functions.delete-account]
verify_jwt = true
```

### Edge Function Best Practices

**CORS Headers** (required for web app calls):
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle preflight
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

**Supabase Client** (always use client methods, not raw HTTP):
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ✅ CORRECT
const { data, error } = await supabase.from('table').select();

// ❌ NEVER
fetch(`${SUPABASE_URL}/rest/v1/table`);
```

**Authentication**:
```typescript
const authHeader = req.headers.get('Authorization')!;
const token = authHeader.replace('Bearer ', '');

const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: corsHeaders
  });
}
```

**Error Handling**:
```typescript
try {
  // ... logic
  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
} catch (error) {
  console.error('Error:', error);
  return new Response(JSON.stringify({ error: error.message }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

**Logging**:
```typescript
console.log('Function started', { userId, timestamp: new Date().toISOString() });
console.error('Error occurred', { error, context });
```

---

## API Integrations

### FatSecret API (Primary Nutrition)

**Purpose**: Nutrition data enrichment  
**Endpoint**: `https://platform.fatsecret.com/rest/server.api`  
**Authentication**: OAuth 1.0  
**Rate Limit**: 1000 requests/day

**Key Methods**:
- `foods.search`: Search foods by name/barcode
- `food.get.v2`: Get detailed nutrition data

**Fallback Chain**: FatSecret → USDA → Gemini estimation

### USDA FoodData Central (Secondary Nutrition)

**Purpose**: Nutrition data fallback  
**Endpoint**: `https://api.nal.usda.gov/fdc/v1/`  
**Authentication**: API Key  
**Rate Limit**: 1000 requests/hour

**Databases**:
- Survey (FNDDS): Food and Nutrient Database for Dietary Studies
- SR Legacy: Standard Reference Legacy

**Key Endpoints**:
- `/foods/search`: Search foods by query
- `/food/{fdcId}`: Get food details

### YouTube Data API v3

**Purpose**: Recipe video tutorial search  
**Endpoint**: `https://www.googleapis.com/youtube/v3/`  
**Authentication**: API Key  
**Rate Limit**: 10,000 quota units/day

**Key Endpoints**:
- `/search`: Search videos by query
- `/videos`: Get video details

**Search Parameters**:
```typescript
{
  part: 'snippet',
  q: 'Spaghetti Carbonara recipe',
  type: 'video',
  videoDuration: 'medium', // 4-20 minutes
  maxResults: 3
}
```

### Google Gemini API

**Purpose**: Vision analysis, meal analysis, recipe generation, intent detection  
**Model**: `gemini-2.0-flash`  
**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/`  
**Authentication**: API Key

**Use Cases**:
- Vision analysis (product identification, OCR)
- Meal photo analysis
- Recipe generation
- AI digest generation
- Intent detection

**Key Parameters**:
- `maxOutputTokens`: 4096 (prevent truncation)
- `temperature`: 0.7 (balanced creativity)
- `topP`: 0.9
- `topK`: 40

**Example** (vision analysis):
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: "Identify the food items in this image with quantities" },
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]
      }],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7
      }
    })
  }
);
```

### Lovable AI Gateway

**Purpose**: PWA icon generation, image editing  
**Endpoint**: `https://ai.gateway.lovable.dev/v1/`  
**Authentication**: API Key (LOVABLE_API_KEY)

**Models**:
- `google/gemini-2.5-flash-image-preview`: Image generation

**Example** (generate image):
```typescript
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash-image-preview',
    messages: [{
      role: 'user',
      content: 'Generate Kaeva K logo with gold gradient'
    }],
    modalities: ['image', 'text']
  })
});

const data = await response.json();
const imageUrl = data.choices[0].message.images[0].image_url.url; // base64 data URL
```

### Instacart API

**Purpose**: Shopping cart creation  
**Endpoint**: `https://connect.instacart.com/v2/`  
**Authentication**: OAuth 1.0  
**Rate Limit**: 100 requests/minute

**Key Endpoints**:
- `/retailers`: List available retailers
- `/retailers/{id}/products`: Search products
- `/carts`: Create cart
- `/carts/{id}/items`: Add items to cart

**Environment**: Sandbox vs Production (controlled via `INSTACART_ENVIRONMENT`)

### Google Places API

**Purpose**: Store hours lookup  
**Endpoint**: `https://maps.googleapis.com/maps/api/place/`  
**Authentication**: API Key  
**Rate Limit**: Varies by plan

**Key Endpoints**:
- `/details/json`: Get place details including hours

### ElevenLabs API

**Purpose**: Voice agent provisioning  
**Endpoint**: `https://api.elevenlabs.io/v1/`  
**Authentication**: API Key  
**Rate Limit**: Varies by plan

**Key Endpoints**:
- `POST /convai/agents`: Create conversational AI agent
- `PATCH /convai/agents/{agentId}`: Update agent
- `GET /convai/agents/{agentId}`: Get agent details

**Agent Configuration**:
```typescript
{
  name: "KAEVA Onboarding",
  conversation_config: {
    agent: {
      prompt: {
        prompt: "You are Kaeva, a friendly home assistant...",
        tools: [
          {
            type: "client",
            name: "updateProfile",
            description: "Update user profile",
            parameters: {
              type: "object",
              properties: {
                userName: { type: "string", description: "User's name" }
              }
            }
          }
        ]
      }
    }
  }
}
```

### API Error Handling Patterns

**Cascading Fallback** (nutrition enrichment):
```typescript
async function enrichProduct(name: string) {
  try {
    return await fetchFromFatSecret(name);
  } catch (error) {
    console.warn('FatSecret failed, trying USDA:', error);
    try {
      return await fetchFromUSDA(name);
    } catch (error) {
      console.warn('USDA failed, using Gemini estimation:', error);
      return await estimateWithGemini(name);
    }
  }
}
```

**Rate Limiting**:
```typescript
// Check rate limit before API call
const isAllowed = await checkRateLimit(userId, endpoint);
if (!isAllowed) {
  return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
    status: 429
  });
}

// Increment counter after successful call
await incrementRateLimit(userId, endpoint);
```

**Caching**:
```typescript
// Check cache first
const cached = await supabase
  .from('product_cache')
  .select('*')
  .eq('search_term', normalized)
  .gt('expires_at', new Date().toISOString())
  .single();

if (cached.data) {
  return cached.data.fatsecret_response;
}

// Fetch from API
const response = await fetchFromAPI(query);

// Cache for 30 days
await supabase.from('product_cache').insert({
  search_term: normalized,
  fatsecret_response: response,
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
});
```

---

## Voice AI System

### Dual-Agent Architecture

KAEVA uses two separate ElevenLabs conversational AI agents:

1. **Onboarding Agent** (`agent_0501kakwnx5rffaby5px9y1pskkb`):
   - Purpose: Guide new users through initial setup
   - Prompt: Friendly, educational, patient
   - Tools: Profile updates, household member creation, pet creation
   - Lifecycle: One-time use until onboarding complete

2. **Assistant Agent** (`agent_2601kaqwv4ejfhets9fyyafzj2e6`):
   - Purpose: In-app assistance (Jarvis)
   - Prompt: Helpful, proactive, context-aware
   - Tools: Inventory queries, recipe search, shopping list management
   - Lifecycle: Persistent throughout app usage

### Voice SDK Integration

**Package**: `@11labs/react` v0.2.0

**Core Hook**: `useConversation`

```typescript
import { useConversation } from '@11labs/react';

const conversation = useConversation({
  onConnect: () => setApertureState('listening'),
  onDisconnect: () => setApertureState('idle'),
  onError: (error) => console.error(error),
  onMessage: (message) => {
    if (message.type === 'user_transcript') {
      setUserTranscript(message.message);
    } else if (message.type === 'agent_response') {
      setAiTranscript(message.message);
    }
  },
  clientTools: {
    updateProfile: async ({ userName, userAge, ... }) => {
      // Update profile in Supabase
      // Calculate TDEE
      // Return confirmation
      return { success: true };
    },
    check_inventory: async ({ category }) => {
      // Query inventory
      return { items: [...] };
    }
  }
});
```

### Client Tools Pattern

**Critical**: Tools defined **inline** within `useConversation` configuration to avoid stale closures

**Onboarding Tools**:
```typescript
clientTools: {
  updateProfile: async ({
    userName,
    userAge,
    userWeight,
    userHeight,
    userGender,
    userActivityLevel,
    dietaryPreferences,
    allergies,
    skinType,
    hairType,
    householdAdults,
    householdKids,
    healthGoals,
    lifestyleGoals
  }) => {
    // Calculate TDEE
    const tdee = calculateTDEE(userAge, userWeight, userHeight, userGender, userActivityLevel);
    
    // Update profiles table
    await supabase.from('profiles').update({
      user_name: userName,
      user_age: userAge,
      user_weight: userWeight,
      user_height: userHeight,
      user_gender: userGender,
      user_activity_level: userActivityLevel,
      calculated_tdee: tdee,
      dietary_preferences: dietaryPreferences,
      allergies: allergies,
      beauty_profile: { skin_type: skinType, hair_type: hairType },
      household_adults: householdAdults,
      household_kids: householdKids,
      health_goals: healthGoals,
      lifestyle_goals: lifestyleGoals
    }).eq('id', user.id);
    
    // Trigger concept card
    onShowConceptCard({ type: 'profile', data: { userName, tdee } });
    
    return { success: true, tdee };
  },
  
  saveHouseholdMember: async ({
    name,
    age,
    gender,
    weight,
    height,
    activityLevel,
    allergies,
    dietaryRestrictions,
    healthConditions
  }) => {
    const tdee = calculateTDEE(age, weight, height, gender, activityLevel);
    
    await supabase.from('household_members').insert({
      user_id: user.id,
      member_type: 'other',
      name,
      age,
      gender,
      weight,
      height,
      activity_level: activityLevel,
      calculated_tdee: tdee,
      allergies,
      dietary_restrictions: dietaryRestrictions,
      health_conditions: healthConditions
    });
    
    return { success: true, memberName: name };
  },
  
  savePet: async ({ name, species, breed, age, toxicFlagsEnabled }) => {
    await supabase.from('pets').insert({
      user_id: user.id,
      name,
      species,
      breed,
      age,
      toxic_flags_enabled: toxicFlagsEnabled
    });
    
    return { success: true, petName: name };
  },
  
  completeConversation: async () => {
    // Create household
    const household = await supabase.from('households').insert({
      name: `${profile.user_name}'s Household`,
      owner_id: user.id
    }).select().single();
    
    // Add membership
    await supabase.from('household_memberships').insert({
      household_id: household.data.id,
      user_id: user.id,
      role: 'owner'
    });
    
    // Update profile
    await supabase.from('profiles').update({
      onboarding_completed: true,
      current_household_id: household.data.id
    }).eq('id', user.id);
    
    return { success: true };
  }
}
```

**Assistant Tools**:
```typescript
clientTools: {
  check_inventory: async ({ category }) => {
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .eq('household_id', profile.current_household_id)
      .eq('category', category);
    
    return {
      items: data.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        status: item.status
      }))
    };
  },
  
  get_recipes: async ({ dietary_restrictions, max_cooking_time }) => {
    const { data } = await supabase.functions.invoke('suggest-recipes', {
      body: { dietary_restrictions, max_cooking_time }
    });
    
    return { recipes: data.recipes };
  },
  
  add_to_shopping_list: async ({ items }) => {
    const entries = items.map(item => ({
      household_id: profile.current_household_id,
      item_name: item,
      source: 'voice_request',
      status: 'pending'
    }));
    
    await supabase.from('shopping_list').insert(entries);
    
    return { success: true, itemCount: items.length };
  },
  
  check_expiring_items: async () => {
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .eq('household_id', profile.current_household_id)
      .lte('expiry_date', threeDaysFromNow.toISOString())
      .order('expiry_date', { ascending: true });
    
    return { expiringItems: data };
  }
}
```

### Contextual Updates

**Pattern**: Send real-time household context to agent during active conversation

**Trigger**: Supabase Realtime subscriptions

**Implementation**:
```typescript
// useAssistantVoice.ts
useEffect(() => {
  if (!showConversation || !sendContextualUpdate) return;
  
  const channel = supabase
    .channel('inventory-updates')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'inventory', filter: `household_id=eq.${householdId}` },
      async (payload) => {
        // Build context update
        const { data: inventory } = await supabase.from('inventory')
          .select('*')
          .eq('household_id', householdId)
          .eq('status', 'low')
          .limit(5);
        
        const { data: expiring } = await supabase.from('inventory')
          .select('*')
          .eq('household_id', householdId)
          .lte('expiry_date', threeDaysFromNow)
          .limit(5);
        
        const contextUpdate = `
          Inventory Update:
          - Low stock items: ${inventory.map(i => i.name).join(', ')}
          - Expiring soon: ${expiring.map(i => `${i.name} (${formatExpiryDate(i.expiry_date)})`).join(', ')}
        `;
        
        sendContextualUpdate(contextUpdate);
      }
    )
    .subscribe();
  
  return () => {
    channel.unsubscribe();
  };
}, [showConversation, sendContextualUpdate, householdId]);
```

**Context Types**:
- Inventory changes (items added, low stock, expiring)
- Shopping list changes
- Household member allergies
- Pet dietary restrictions
- Current cart contents
- Nutrition progress

### Aperture State Management

**States**:
- `idle`: Slow breathing pulse (2s cycle)
- `listening`: Expanded with pulse
- `speaking`: Synced with audio amplitude
- `thinking`: Spinning animation

**State Transitions**:
```typescript
const [apertureState, setApertureState] = useState<ApertureState>('idle');

useEffect(() => {
  if (isSpeaking) {
    setApertureState('speaking');
  } else if (status === 'connected' && !isSpeaking) {
    setApertureState('listening');
  } else {
    setApertureState('idle');
  }
}, [isSpeaking, status]);
```

### Audio Amplitude Visualization

**Pattern**: Track audio amplitude for visual feedback

```typescript
const [audioAmplitude, setAudioAmplitude] = useState(0);

useEffect(() => {
  if (!conversation.audioRef.current) return;
  
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaElementSource(conversation.audioRef.current);
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  const updateAmplitude = () => {
    analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / bufferLength;
    setAudioAmplitude(average / 255); // Normalize to 0-1
    requestAnimationFrame(updateAmplitude);
  };
  
  updateAmplitude();
}, [conversation.audioRef]);
```

### Wake Word Detection

**Pattern**: "Hey Kaeva" detection using Web Speech API

**Implementation**: `useWakeWordDetection.ts`

```typescript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = true;
recognition.interimResults = true;

recognition.onresult = (event) => {
  const transcript = Array.from(event.results)
    .map(result => result[0].transcript)
    .join('')
    .toLowerCase();
  
  const wakeWords = ['kaeva', 'hey kaeva', 'ok kaeva'];
  const detected = wakeWords.some(word => transcript.includes(word));
  
  if (detected) {
    haptics.notification('success');
    onWakeWordDetected();
  }
};

recognition.onerror = (event) => {
  console.error('Speech recognition error:', event.error);
  // Auto-restart on errors
  setTimeout(() => recognition.start(), 1000);
};
```

**Settings Integration**:
- Opt-in via `profiles.notification_preferences.wake_word_enabled`
- Visual indicator when listening (WakeWordIndicator component)
- Auto-disable at low battery (<20%)

### Voice UI Components

**ConversationOverlay**:
- Full-screen overlay during active conversation
- Living Aperture with state-based animation
- User transcript display (bottom)
- AI transcript display (top)
- Close button (ESC or tap outside)

**SleepingIndicator**:
- Subtle pulsing indicator when assistant is idle
- Small gold dot with breathing animation

**ConceptCard**:
- Visual confirmation cards during onboarding
- Slide in from right on data confirmation
- Auto-dismiss after 2 seconds
- Glass styling with sage border

**SmartChips**:
- Quick-reply buttons for silent interaction
- "Yes", "No", "Skip" predefined responses
- Glass design with primary accent
- Sends contextual update on click

### Voice Activation Entry Points

**3 Activation Methods**:

1. **Mic Button** (AppShell navigation dock):
   - Bottom dock mic icon
   - Triggers `startConversation()`

2. **Living Aperture** (FloatingActionButton):
   - Center gold hero button
   - Primary voice activation point
   - Triggers modal picker → Voice option

3. **Keyboard Shortcut** (global):
   - `Cmd+Shift+K` (Mac) / `Ctrl+Shift+K` (Windows)
   - Triggers `startConversation()`

### Voice Assistant Lifecycle

**Onboarding Flow**:
1. User completes signup
2. `Index.tsx` checks `onboarding_completed = false`
3. Shows `VoiceOnboarding` component
4. Agent guides through profile setup
5. `completeConversation` tool marks `onboarding_completed = true`
6. Creates household and household_membership
7. Redirects to Dashboard

**In-App Assistance**:
1. User triggers voice via one of 3 entry points
2. `VoiceAssistant` component loads (forwardRef pattern)
3. `useAssistantVoice` hook establishes ElevenLabs connection
4. User speaks query
5. Agent processes with client tools
6. Contextual updates sent via realtime subscriptions
7. User ends conversation or times out

### Agent Provisioning Flow

**File**: `supabase/functions/provision-agents/index.ts`

**Process**:
1. Admin clicks "Provision Agents" in Admin Dashboard
2. Fetches user profile for context building
3. For each agent type (onboarding, assistant):
   - Build agent prompt from template
   - Define client tools in ElevenLabs format
   - Attempt PATCH to known agent ID
   - If 404, POST to create new agent
4. Update `profiles.agent_configured = true`
5. Display success/error in UI

**Agent Prompt Template** (onboarding):
```
You are Kaeva, a friendly and helpful home assistant. Your goal is to help the user set up their profile through natural conversation.

User Context:
- Name: ${profile.user_name || 'not set'}
- Current household: ${profile.current_household_id ? 'exists' : 'needs creation'}

Your Tasks:
1. Gather basic user info (name, age, weight, height, gender, activity level)
2. Ask about dietary preferences and allergies
3. Ask about household members and pets
4. Ask about beauty preferences (skin type, hair type)
5. Confirm all information before saving

Tools Available:
- updateProfile: Update user profile fields
- saveHouseholdMember: Add household member
- savePet: Add pet
- completeConversation: Mark onboarding complete

Be conversational, friendly, and patient. Confirm each piece of information before moving to the next.
```

**Agent Prompt Template** (assistant):
```
You are Kaeva, a proactive home assistant helping the user manage their household.

User Context:
- Name: ${profile.user_name}
- Household: ${householdName}
- Dietary preferences: ${profile.dietary_preferences}
- Allergies: ${profile.allergies}
- Household members: ${householdMembers.map(m => m.name).join(', ')}
- Pets: ${pets.map(p => `${p.name} (${p.species})`).join(', ')}

Current Household State:
- Low stock items: ${lowStockItems}
- Expiring soon: ${expiringItems}
- Today's nutrition: ${todayNutrition}
- Shopping list: ${shoppingListItems}

Tools Available:
- check_inventory: Query inventory by category
- get_recipes: Find recipes matching criteria
- add_to_shopping_list: Add items to shopping list
- check_expiring_items: Get items nearing expiry

Be proactive, helpful, and context-aware. Use the real-time household data to provide personalized assistance.
```

---

## Smart Scanner System

### Multi-Intent Architecture

**File**: `src/components/scanner/SmartScanner.tsx`

**Intents**:
1. **Inventory**: Add/update inventory items
2. **Nutrition**: Track meal for nutrition logging
3. **Beauty**: Analyze beauty products
4. **Pets**: Check pet food/product safety
5. **Appliances**: Identify appliances for manual lookup

### Scanner UI Components

**ScanModeCarousel**:
- Horizontal swipeable mode selector
- Shows 3 modes at once (previous, current, next)
- Active mode centered and highlighted
- Positioned beneath capture button
- Embla carousel for smooth gestures

**ScannerHUD**:
- Technical AR-style overlay
- Corner brackets (SVG)
- Animated scan line (Autumn Gold #D69E2E)
- Fine grid overlay (subtle)
- Fleeting hint text

**CaptureButton**:
- Fixed 72px gold circular button
- Center of screen
- Haptic feedback on tap
- Gold glow shadow

**ScannerToolbar**:
- Top toolbar with controls
- Flash toggle
- Camera flip (front/back)
- Close button

### Product Identification Cascade

**Multi-Modal Strategy**:

1. **Barcode Detection** (highest confidence):
   - Scan barcode from image
   - Query product database by barcode
   - Confidence: 0.95+

2. **OCR Text Extraction**:
   - Extract text from packaging via Gemini Vision
   - Search product database by text
   - Confidence: 0.7-0.9

3. **Visual Features Analysis**:
   - Analyze color, shape, packaging design
   - Match against product database
   - Confidence: 0.5-0.8

4. **Nutrition Label Parsing**:
   - Extract nutrition facts table
   - Match nutrition profile to products
   - Confidence: 0.6-0.9

**Identification Method Display**:
- UI shows which method was used (barcode icon, text icon, eye icon, label icon)
- Transparency for user trust

### Scanner Result Modes

**Located**: `src/components/scanner/result-modes/`

#### `ProductAnalysisResult.tsx`
**Intent**: Inventory, Beauty, Pets

**Features**:
- Product name, brand, image
- Category classification
- Nutrition data (if food)
- Allergen warnings
- Toxicity warnings (for pets)
- Safety score (0-100)
- "Add to Inventory" button
- "View Similar Products" link

#### `NutritionTrackResult.tsx`
**Intent**: Nutrition

**Features**:
- Detected food items with quantities
- Individual item macros
- Aggregate meal macros
- Meal type selector (breakfast, lunch, dinner, snack)
- "Log Meal" button
- "Save as Template" button

#### `InventorySweepResult.tsx`
**Intent**: Inventory (multi-item)

**Features**:
- Grid view of detected items
- Checkbox selection
- Batch add to inventory
- Category assignment per item

#### `VanitySweepResult.tsx`
**Intent**: Beauty (multi-item)

**Features**:
- Beauty product grid
- Skin compatibility indicators
- Expiry date detection
- Batch add to beauty inventory

#### `PetIdResult.tsx`
**Intent**: Pets

**Features**:
- Pet identification via microchip/tag scan
- Pet profile display
- Food compatibility check
- Toxic food warnings

#### `ApplianceScanResult.tsx`
**Intent**: Appliances

**Features**:
- Appliance identification
- Manual link generation
- Model number extraction
- "Search for Manual" button

#### `FixResultSheet.tsx`
**Universal**:
- Manual correction interface
- Edit detected values
- Override classification
- Force save

### Duplicate Detection

**Component**: `DuplicateItemModal.tsx`

**Logic**:
```typescript
// Check for duplicates before adding to inventory
const { data: existing } = await supabase
  .from('inventory')
  .select('*')
  .eq('household_id', householdId)
  .eq('name', productName)
  .eq('category', category)
  .single();

if (existing) {
  // Show modal: Update quantity or Add new?
  setShowDuplicateModal(true);
}
```

**Options**:
1. **Update Existing**: Increase quantity of existing item
2. **Add New**: Create separate inventory entry (different location/brand)
3. **Cancel**: Abort scan

### Toxicity Detection

**Component**: `ToxicityAlert.tsx`

**Logic**:
```typescript
import { TOXIC_FOODS_BY_SPECIES } from '@/lib/petCareData';

const checkToxicity = (productName: string, pets: Pet[]) => {
  for (const pet of pets) {
    if (!pet.toxic_flags_enabled) continue;
    
    const toxicFoods = TOXIC_FOODS_BY_SPECIES[pet.species] || [];
    const isToxic = toxicFoods.some(toxic => 
      productName.toLowerCase().includes(toxic.toLowerCase())
    );
    
    if (isToxic) {
      return {
        isToxic: true,
        petName: pet.name,
        species: pet.species,
        toxicFood: productName
      };
    }
  }
  
  return { isToxic: false };
};
```

**Alert Display**:
- Full-screen overlay with Terracotta (#D97757) accent
- Shield icon with warning symbol
- Pet name and species
- Toxic food name
- "Do not feed" message
- Double heavy vibration (haptics)

### Voice Meal Logging

**Component**: `VoiceMealInput.tsx`

**Flow**:
1. User taps "Log Meal by Voice"
2. Microphone opens
3. User describes meal: "I had chicken breast with broccoli and rice"
4. Speech-to-text conversion
5. Send to Gemini for food item extraction
6. Enrich each item via FatSecret/USDA/Gemini
7. Calculate macros
8. Show `NutritionTrackResult`
9. User confirms and logs

### Meal Templates

**Components**: `MealTemplateSheet.tsx`, `SaveTemplateDialog.tsx`

**Purpose**: Quick logging of repeated meals

**Flow**:
1. User scans/logs meal
2. Taps "Save as Template"
3. Names template (e.g., "Breakfast Smoothie")
4. Template saved to `meal_templates` table
5. Later: Tap template from sheet → instant log

### Beauty Inspiration

**Component**: `BeautyInspirationSheet.tsx`

**Trigger**: User scans 3+ beauty products

**Process**:
1. Detect batch beauty scan
2. Call `generate-beauty-inspiration` edge function
3. Gemini analyzes products and generates looks
4. Search YouTube for tutorial videos
5. Display looks with product usage steps
6. Link to video tutorials

**Output**:
- 2-3 suggested looks (natural, glam, professional)
- Product usage per look
- Step-by-step instructions
- YouTube tutorial videos

---

## Design System

### "Engineered Organic" Philosophy

**Visual Language Metaphor**: "Glass & Light" - UI acts as transparent intelligent lens

**Principles**:
- Precision with calming organic warmth
- Heavy glassmorphism with crisp thin borders
- Depth via inner glows and layering
- Avoiding heavy shadows (prefer glows and gradients)
- Dark mode default (eye strain reduction, battery savings)

### "Seattle Fall Nano" Color Palette

**5 Core Colors** (semantic purpose):

1. **Autumn Gold** (#D69E2E) - Primary action color
   - Usage: Buttons, Living Aperture, primary CTAs, scan line
   - Role: Commands user attention, represents primary actions
   
2. **Electric Sage** (#70E098) - Success/safety
   - Usage: Success states, safety indicators, positive feedback
   - Role: Food/success/safety semantic meaning
   
3. **Terracotta** (#D97757) - Warnings/beauty/heat
   - Usage: Alerts, toxicity warnings, beauty accents
   - Role: Alert/beauty/heat semantic meaning
   
4. **Electric Sky** (#38BDF8) - Data/tech/medical
   - Usage: Health metrics, data visualizations, technical info
   - Role: Tech/medical/logistics semantic meaning
   
5. **Mist White** (#E2E8F0) - Neutral text/home
   - Usage: Primary text, foreground elements
   - Role: Neutral text/home semantic meaning

**Background Colors**:
- **Void** (#08080A) - Main background
- **Deep Slate** (#0F172A) - Secondary background

### Color System Implementation

**Design Tokens** (`index.css`):
```css
:root {
  /* Primary Colors */
  --primary: 44 84% 52%; /* Autumn Gold #D69E2E */
  --secondary: 142 71% 69%; /* Electric Sage #70E098 */
  --destructive: 12 70% 60%; /* Terracotta #D97757 */
  --accent: 199 89% 61%; /* Electric Sky #38BDF8 */
  
  /* Background */
  --background: 240 10% 3%; /* Void #08080A */
  --foreground: 210 20% 90%; /* Mist #E2E8F0 */
  
  /* UI Elements */
  --card: 222 47% 11%; /* Deep Slate */
  --border: 217 33% 17%;
  --input: 217 33% 17%;
  
  /* Shadows & Glows */
  --glow: 0 0 40px hsl(44 84% 52% / 0.4); /* Gold glow */
  --glass: inset 0 1px 0 hsl(0 0% 100% / 0.1); /* Glass border */
  --dock: 0 10px 30px hsl(0 0% 0% / 0.3); /* Floating elevation */
}
```

**Tailwind Config** (`tailwind.config.ts`):
```typescript
theme: {
  extend: {
    colors: {
      primary: 'hsl(var(--primary))',
      secondary: 'hsl(var(--secondary))',
      destructive: 'hsl(var(--destructive))',
      accent: 'hsl(var(--accent))',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      // ... more
    },
    boxShadow: {
      glow: 'var(--glow)',
      glass: 'var(--glass)',
      dock: 'var(--dock)'
    }
  }
}
```

**Usage in Components**:
```typescript
// ✅ CORRECT: Use semantic tokens
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Action
</Button>

// ❌ WRONG: Direct colors
<Button className="bg-[#D69E2E] text-white">
  Action
</Button>
```

### Typography System

**3 Font Families**:

1. **Manrope** (Sans) - Body text and display headers
   - Weights: 400, 500, 600, 700
   - Usage: Paragraphs, UI labels, headings
   
2. **Space Grotesk** (Mono) - Technical headers and data labels
   - Weights: 400, 500, 700
   - Usage: Technical data, code-like elements, monospace needs
   
3. **JetBrains Mono** (Mono) - Prices/quantities/metrics
   - Weights: 400, 500
   - Usage: Numerical data, prices, metrics

**Type Scale**:
```css
.text-display { /* 2.5rem / 40px */
  font-family: 'Manrope', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.text-body { /* 1rem / 16px */
  font-family: 'Manrope', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
}

.text-data { /* 0.875rem / 14px */
  font-family: 'Space Grotesk', monospace;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
}

.text-micro { /* 0.75rem / 12px */
  font-family: 'Manrope', sans-serif;
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.3;
}
```

### Spacing System

**Consistent Vertical Rhythm**:
- `space-y-4` (1rem / 16px): Default section gaps
- `space-y-6` (1.5rem / 24px): Larger section gaps
- `mb-3` (0.75rem / 12px): Header-to-content gap

**Container Padding**:
- `p-4` (1rem): Card padding
- `p-6` (1.5rem): Page padding

**Border Radius**:
- `24px`: Large cards, modals
- `12px`: Medium cards, inputs
- `8px`: Small cards, buttons

### Glass Morphism Pattern

**Glass Card**:
```typescript
<div className="glass-card p-4 rounded-3xl border border-border/20 backdrop-blur-xl bg-card/30">
  {/* Content */}
</div>
```

**CSS Definition**:
```css
.glass-card {
  background: hsl(var(--card) / 0.3);
  backdrop-filter: blur(12px);
  border: 1px solid hsl(var(--border) / 0.2);
  box-shadow: var(--glass);
}
```

### Living Aperture Design

**Component**: `KaevaAperture.tsx`

**States**:
1. **Idle**: Slow breathing pulse (2s cycle, scale 1.0 → 1.05)
2. **Listening**: Expanded with pulse (scale 1.1)
3. **Speaking**: Sync with audio amplitude (dynamic scale)
4. **Thinking**: Spinning animation (360° rotation)

**Visual**:
- 64-72px circular button
- Autumn Gold (#D69E2E) solid fill
- Gold glow shadow: `drop-shadow(0 0 40px rgba(214, 158, 46, 0.4))`
- Border: 4px solid background (void cutout effect)
- Center dot with gradient

**Animation**:
```typescript
<motion.div
  animate={{
    scale: apertureState === 'idle' ? [1, 1.05, 1] : 1.1,
    rotate: apertureState === 'thinking' ? 360 : 0
  }}
  transition={{
    scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    rotate: { duration: 1, repeat: Infinity, ease: 'linear' }
  }}
  className="w-16 h-16 rounded-full bg-primary shadow-glow"
/>
```

### Floating Command Dock (Satellite Architecture)

**Two-Layer Structure**:

1. **Glass Capsule** (background layer):
   - Fixed 320px width × 72px height
   - Positioned bottom-[calc(1rem+env(safe-area-inset-bottom))]
   - Glass styling with backdrop blur
   - Contains Settings and Profile buttons
   - `justify-between` for perfect symmetry

2. **Living Aperture** (overlapping layer):
   - Absolute positioned `-top-6` (breaks out of capsule)
   - `left-1/2 -translate-x-1/2` (centered)
   - Border: 4px solid background (void cutout)
   - 64-72px circular gold button
   - Overlaps capsule creating depth

**Code**:
```typescript
<div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50">
  {/* Glass Capsule */}
  <div className="relative w-80 h-18 glass-card rounded-full flex items-center justify-between px-6">
    <Button variant="ghost" size="icon">
      <Settings className="w-5 h-5" />
    </Button>
    
    <Button variant="ghost" size="icon">
      <User className="w-5 h-5" />
    </Button>
  </div>
  
  {/* Living Aperture */}
  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
    <div className="border-4 border-background rounded-full">
      <KaevaAperture state={apertureState} amplitude={audioAmplitude} />
    </div>
  </div>
</div>
```

### Micro-Interactions & Animations

**Page Transitions**:
```typescript
<PageTransition>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
</PageTransition>
```

**Staggered Children**:
```typescript
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }}
>
  {items.map((item, i) => (
    <motion.div
      key={i}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {item}
    </motion.div>
  ))}
</motion.div>
```

**Haptic Feedback**:
- Success: `haptics.notification('success')` - sharp vibration
- Warning: `haptics.notification('warning')` - double heavy vibration
- Selection: `haptics.selection()` - light tick
- Impact: `haptics.impact('medium')` - medium vibration

### Loading States (Skeleton Screens)

**Pattern**: Shimmering shapes matching final layout

```typescript
const InventoryCardSkeleton = () => (
  <div className="glass-card p-4 rounded-2xl animate-pulse">
    <div className="h-32 bg-muted/20 rounded-xl mb-3" />
    <div className="h-4 bg-muted/20 rounded w-3/4 mb-2" />
    <div className="h-3 bg-muted/20 rounded w-1/2" />
  </div>
);
```

### Empty States

**Pattern**: Icon + message + CTA

```typescript
const EmptyInventory = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
      <Package className="w-8 h-8 text-primary" />
    </div>
    <h3 className="text-lg font-semibold mb-2">No items yet</h3>
    <p className="text-sm text-muted-foreground mb-6">
      Scan your first item to get started
    </p>
    <Button onClick={onScan}>
      <Camera className="w-4 h-4 mr-2" />
      Scan Item
    </Button>
  </div>
);
```

### Responsive Design

**Mobile-First Approach**:
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Items */}
</div>
```

**Safe Areas** (iOS notches, Android gesture bars):
```css
.app-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

**Dynamic Viewport Height** (Safari address bar):
```css
.full-height {
  height: 100dvh; /* Dynamic viewport height */
}
```

### Accessibility

**WCAG AA Compliance**:
- Mist White (#E2E8F0) on Deep Slate (#0F172A): 13.5:1 contrast (exceeds 4.5:1)
- Touch targets: Minimum 44px × 44px
- Focus indicators: 2px solid primary with offset
- aria-labels on all interactive elements
- Keyboard navigation support

**Voice Fallbacks**:
- Every voice interaction has visual UI fallback
- Buttons/text inputs for silent environments
- Non-negotiable for inclusive design

---

## User Flows

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant L as Landing
    participant A as Auth
    participant S as Supabase
    participant I as Index
    
    U->>L: Visit /
    L->>L: Check auth
    alt Authenticated
        L->>I: Redirect to /app
    else Unauthenticated
        L->>L: Show hero
    end
    
    U->>A: Click "Start Free" → /auth
    U->>A: Enter email/password
    A->>S: signUp()
    S->>S: Create user
    S->>S: Trigger handle_new_user()
    S->>S: Create profile
    S->>S: Assign 'user' role
    S-->>A: Session
    A->>I: Redirect to /app
```

### Onboarding Flow

```mermaid
flowchart TD
    A[/app Route] --> B{Onboarding<br/>Complete?}
    B -->|No| C[Show Splash]
    C --> D[Start VoiceOnboarding]
    
    D --> E[Kaeva Greeting]
    E --> F[Collect Basic Info]
    F --> G[Calculate TDEE]
    G --> H[Collect Dietary Prefs]
    H --> I[Collect Beauty Profile]
    I --> J[Add Household Members]
    J --> K[Add Pets]
    K --> L[Confirm All Data]
    L --> M[completeConversation Tool]
    
    M --> N[Create Household]
    N --> O[Add Membership]
    O --> P[Set onboarding_completed=true]
    P --> Q[Set current_household_id]
    Q --> R[Redirect to Dashboard]
    
    B -->|Yes| S{Has<br/>Household?}
    S -->|No| T[HouseholdSetup]
    T --> N
    S -->|Yes| R
```

### Modular Onboarding Flow

```mermaid
flowchart TD
    A[Dashboard] --> B{Core<br/>Complete?}
    B -->|No| C[Block Access]
    C --> D[Prompt: Complete Core]
    D --> E[CoreOnboardingForm<br/>or Voice]
    
    B -->|Yes| F[Show Dashboard]
    F --> G{Visit<br/>Domain?}
    
    G -->|Nutrition| H{Nutrition<br/>Module?}
    H -->|No| I[Prompt: Complete Nutrition]
    I --> J[NutritionOnboardingForm<br/>or Voice]
    H -->|Yes| K[Show Nutrition Features]
    
    G -->|Beauty| L{Beauty<br/>Module?}
    L -->|No| M[Prompt: Complete Beauty]
    M --> N[BeautyOnboardingForm<br/>or Voice]
    L -->|Yes| O[Show Beauty Features]
    
    G -->|Pets| P{Pets<br/>Module?}
    P -->|No| Q[Prompt: Complete Pets]
    Q --> R[PetsOnboardingForm<br/>or Voice]
    P -->|Yes| S[Show Pet Features]
    
    J --> T[Update profiles.onboarding_modules]
    N --> T
    R --> T
    T --> F
```

### Household Invite Flow

```mermaid
sequenceDiagram
    participant O as Owner
    participant H as Household Page
    participant E as Edge Function
    participant I as Invitee
    participant A as Accept Page
    
    O->>H: Click "Invite Members"
    H->>E: create-household-invite
    E->>E: Generate JWT
    E->>E: Insert household_invites
    E-->>H: Return invite URL
    H->>O: Show URL + QR code
    
    O->>I: Share URL
    I->>A: Visit /household/join/:code
    A->>E: accept-household-invite
    E->>E: Verify JWT
    E->>E: Check expiration
    E->>E: Check max uses
    E->>E: Add to household_memberships
    E->>E: Update current_household_id
    E->>E: Increment times_used
    E->>E: Log activity
    E-->>A: Success
    A->>I: Redirect to /app
```

### Daily AI Digest Flow

```mermaid
flowchart TD
    A[Cron Job 7 AM] --> B[For Each User]
    B --> C[Fetch Profile]
    C --> D[Fetch Household]
    D --> E[Fetch Inventory]
    E --> F[Fetch Recent Meals]
    
    F --> G[Analyze Expiring Items<br/>≤3 days]
    G --> H[Detect Low Stock<br/>fill_level < threshold]
    H --> I[Calculate Nutrition Gaps<br/>vs goals]
    I --> J[Check Allergen Warnings]
    J --> K[Generate Time-Appropriate<br/>Meal Suggestions]
    
    K --> L[Send to Gemini 2.0 Flash]
    L --> M{Output<br/>Tokens?}
    M -->|Under 4096| N[Parse Insights]
    M -->|Truncated| O[Return Default Insights]
    
    N --> P[Prioritize by Urgency]
    P --> Q[Insert daily_digests]
    Q --> R[Create Notification]
    R --> S[Send Push if Configured]
    
    S --> T[User Opens App]
    T --> U[AIInsightsWidget Displays]
    U --> V[User Views Insights]
    V --> W[Update viewed_at]
```

### Scanner Flow (Inventory)

```mermaid
flowchart TD
    A[User Opens Scanner] --> B[Select Intent: Inventory]
    B --> C[Camera Active]
    C --> D[Tap Capture]
    D --> E[Capture Photo]
    
    E --> F[analyze-vision Edge Function]
    F --> G[Try Barcode Detection]
    G -->|Found| H[Query by Barcode]
    G -->|Not Found| I[Try OCR]
    I --> J[Extract Text]
    J --> K[Query by Text]
    
    H --> L{Product<br/>Found?}
    K --> L
    L -->|Yes| M[enrich-product]
    L -->|No| N[Gemini Visual Analysis]
    N --> M
    
    M --> O[FatSecret API]
    O -->|Success| P[Return Nutrition Data]
    O -->|Fail| Q[USDA API]
    Q -->|Success| P
    Q -->|Fail| R[Gemini Estimation]
    R --> P
    
    P --> S[Check for Duplicates]
    S -->|Found| T[DuplicateItemModal]
    T -->|Update| U[Increase Quantity]
    T -->|Add New| V[Insert Inventory]
    S -->|Not Found| V
    
    V --> W[Log Household Activity]
    W --> X[Show Success Toast]
    X --> Y[Return to Scanner]
```

### Recipe Suggestion Flow

```mermaid
flowchart TD
    A[User Requests Recipes] --> B[Fetch User Profile]
    B --> C[Fetch Household Members]
    C --> D[Fetch Inventory]
    D --> E[Fetch Learned Preferences]
    
    E --> F[Build Context]
    F --> G[suggest-recipes Edge Function]
    G --> H[Send to Gemini]
    
    H --> I[Generate 3-5 Recipes]
    I --> J[Calculate Match Score<br/>0-100%]
    J --> K[Add Explanation Field]
    K --> L[Search YouTube Videos]
    
    L --> M{Video<br/>Found?}
    M -->|Yes| N[Attach Video Metadata]
    M -->|No| O[Skip Video]
    
    N --> P[Return Recipes]
    O --> P
    P --> Q[Display in RecipeFeed]
    Q --> R[User Selects Recipe]
    R --> S[RecipeDetail View]
    S --> T{Action?}
    
    T -->|Save| U[Insert recipes]
    T -->|Cook| V[CookingMode]
    T -->|Shop| W[Generate Shopping List]
```

### Meal Planning Flow

```mermaid
flowchart TD
    A[User Opens Meal Planner] --> B[WeeklyCalendar View]
    B --> C{Action?}
    
    C -->|Generate Plan| D[MealPlanCustomizationDialog]
    D --> E[Select Cuisines]
    E --> F[Avoid Ingredients]
    F --> G[Max Cooking Time]
    G --> H[Dietary Restrictions]
    H --> I[generate-meal-plan]
    
    I --> J[Fetch Household Data]
    J --> K[Calculate TDEE]
    K --> L[Send to Gemini]
    L --> M[Generate 7 Days × 3 Meals]
    M --> N[Match Recipes from Inventory]
    N --> O[Return Meal Plan]
    O --> P[Insert meal_plans]
    P --> Q[Display in Calendar]
    
    C -->|Manual Assign| R[Select Date + Meal Type]
    R --> S[RecipeSelector]
    S --> T[Choose Recipe]
    T --> P
    
    C -->|Generate Shopping List| U[Aggregate Ingredients]
    U --> V[Check Inventory]
    V --> W[Calculate Missing Items]
    W --> X[Insert shopping_list]
    X --> Y[ShoppingPreviewSheet]
    Y --> Z[Create Instacart Cart]
```

### Shopping Flow

```mermaid
flowchart TD
    A[User Views Shopping List] --> B{Source?}
    
    B -->|Auto-Reorder| C[check-auto-restock Cron]
    C --> D[Query Inventory<br/>auto_order_enabled=true]
    D --> E[Check fill_level<br/>vs reorder_threshold]
    E -->|Below| F[Insert shopping_list<br/>source='auto_reorder']
    
    B -->|Recipe| G[Meal Plan Shopping]
    G --> H[Aggregate Recipe Ingredients]
    H --> I[Check Inventory]
    I --> J[Calculate Missing]
    J --> F
    
    B -->|Voice| K[Voice Assistant]
    K --> L[add_to_shopping_list Tool]
    L --> F
    
    B -->|Manual| M[User Adds Manually]
    M --> F
    
    F --> N[SmartCartWidget]
    N --> O[Group by Source]
    O --> P[User Reviews]
    P --> Q[Tap "Create Cart"]
    Q --> R[Show BuildingCartOverlay]
    R --> S[instacart-create-cart]
    S --> T[Create Cart via API]
    T --> U[Return Deep Link]
    U --> V[Open Instacart App]
```

### Voice Assistant Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as FloatingActionButton
    participant V as VoiceAssistant
    participant E as ElevenLabs
    participant T as Client Tools
    participant S as Supabase
    
    U->>F: Tap Living Aperture
    F->>V: startConversation()
    V->>E: Connect WebSocket
    E-->>V: onConnect
    V->>V: Set apertureState='listening'
    V->>V: Show ConversationOverlay
    
    U->>V: Speak: "What's in my fridge?"
    V->>E: Audio stream
    E->>E: Speech-to-text
    E-->>V: onMessage (user_transcript)
    V->>V: Display user transcript
    
    E->>E: Process intent
    E->>T: Tool call: check_inventory({ category: 'fridge' })
    T->>S: Query inventory
    S-->>T: Return items
    T-->>E: Tool result
    
    E->>E: Generate response
    E-->>V: onMessage (agent_response)
    V->>V: Display AI transcript
    E-->>V: Audio stream
    V->>V: Set apertureState='speaking'
    V->>V: Update audioAmplitude
    
    Note over V,S: Realtime subscription active
    S->>V: Inventory change event
    V->>E: sendContextualUpdate("New item added: Milk")
    E->>E: Update context
    
    U->>V: Tap Close
    V->>E: Disconnect
    E-->>V: onDisconnect
    V->>V: Set apertureState='idle'
    V->>V: Hide ConversationOverlay
```

### Account Deletion Flow

```mermaid
flowchart TD
    A[User Opens Settings] --> B[Tap Account]
    B --> C[AccountSheet]
    C --> D[Scroll to Delete Account]
    D --> E[Tap "Delete Account"]
    E --> F[Confirmation Dialog]
    F --> G{Confirm?}
    
    G -->|No| H[Cancel]
    G -->|Yes| I[delete-account Edge Function]
    
    I --> J[Delete household_members]
    J --> K[Delete pets]
    K --> L[Delete meal_logs]
    L --> M[Delete water_logs]
    M --> N[Delete conversation_history]
    N --> O[Delete notifications]
    O --> P[Delete bookmarks]
    P --> Q[Delete learned_preferences]
    Q --> R[Remove household_memberships]
    R --> S[Delete profiles]
    S --> T[Delete auth.users]
    
    T --> U[Sign Out]
    U --> V[Redirect to /auth]
    V --> W[Show Success Toast]
```

---

## Security & RLS Policies

### Authentication Security

**Password Requirements**:
- Minimum 8 characters
- No complexity requirements (per NIST guidelines)
- Auto-confirm email enabled (non-production)

**Session Management**:
- Auto-refresh tokens
- Persistent sessions via localStorage
- 1-hour session timeout
- Manual refresh on auth state change

**Admin Access**:
- Role-based via `user_roles` table
- `has_role()` database function
- Admin panel restricted by AdminRoute
- Service role operations use `SECURITY DEFINER`

### Row Level Security Policies

**Key Patterns**:

1. **User-Level Data** (meal_logs, water_logs, notifications):
```sql
POLICY "Users can manage own data" ON table_name FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

2. **Household-Level Data** (inventory, recipes, shopping_list):
```sql
POLICY "Household members can manage data" ON table_name FOR ALL
USING (household_id IN (
  SELECT household_id FROM household_memberships WHERE user_id = auth.uid()
))
WITH CHECK (household_id IN (
  SELECT household_id FROM household_memberships WHERE user_id = auth.uid()
));
```

3. **Owner-Only Operations** (household management):
```sql
POLICY "Owners can manage household" ON households FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);
```

4. **Public Data** (shared recipes):
```sql
POLICY "Anyone can view public recipes" ON recipes FOR SELECT
USING (is_public = true OR household_id IN (...));
```

5. **Service Role** (notifications, digests):
```sql
POLICY "Service can insert notifications" ON notifications FOR INSERT
WITH CHECK (true);
```

### Rate Limiting

**Implementation**: `rate_limits` table + `rateLimiter.ts` shared utility

**Limits**:
- Vision API: 100 requests/hour per user
- Nutrition API: 50 requests/hour per user
- Recipe generation: 20 requests/hour per user

**Enforcement**:
```typescript
// Edge function
const isAllowed = await checkRateLimit(userId, 'analyze-vision');
if (!isAllowed) {
  return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
    status: 429
  });
}

await incrementRateLimit(userId, 'analyze-vision');
```

**Cleanup**: `clean_old_rate_limits()` removes windows >1 hour old

### Input Validation

**Zod Schemas** (`supabase/functions/_shared/schemas.ts`):
```typescript
const ProfileUpdateSchema = z.object({
  user_name: z.string().min(1).max(100),
  user_age: z.number().int().min(1).max(120),
  user_weight: z.number().positive().max(500),
  user_height: z.number().positive().max(300),
  allergies: z.array(z.string()).max(50),
  dietary_preferences: z.array(z.string()).max(20)
});

// Usage in edge function
const validated = ProfileUpdateSchema.parse(requestBody);
```

**Frontend Validation** (React Hook Form + Zod):
```typescript
const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema)
});
```

### Sensitive Data Protection

**Secrets Management**:
- API keys stored in Supabase Edge Function environment variables
- Never exposed to client
- JWT tokens for household invites (signed with `INVITE_JWT_SECRET`)

**PII Handling**:
- User data encrypted at rest (Supabase default)
- No client-side caching of sensitive data
- HTTPS only (enforced by Supabase)

**Audit Logging**:
- `conversation_events`: All voice interactions
- `household_activity`: All household actions
- Edge function logs: System logs for admin review

### CORS Configuration

**Edge Functions**:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

**Storage Buckets**:
- `app-assets`: Public read, authenticated write
- CORS enabled for client uploads

### SQL Injection Prevention

**Critical Rule**: Edge functions NEVER execute raw SQL

**Correct Pattern**:
```typescript
// ✅ CORRECT: Supabase client methods
const { data, error } = await supabase
  .from('inventory')
  .select('*')
  .eq('household_id', householdId);
```

**Forbidden Pattern**:
```typescript
// ❌ FORBIDDEN: Raw SQL
await supabase.rpc('execute_sql', { 
  query: `SELECT * FROM inventory WHERE household_id = '${householdId}'` 
});
```

### Content Security Policy

**index.html**:
```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; 
           script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
           style-src 'self' 'unsafe-inline'; 
           img-src 'self' data: https:; 
           connect-src 'self' https://btgmvuieishjiybgcmpj.supabase.co https://api.elevenlabs.io;">
```

---

## Environment Variables

### Supabase (auto-configured)

**Client-Side** (`.env`):
```env
VITE_SUPABASE_URL=https://btgmvuieishjiybgcmpj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=btgmvuieishjiybgcmpj
```

**Edge Functions** (auto-injected):
```env
SUPABASE_URL=https://btgmvuieishjiybgcmpj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.btgmvuieishjiybgcmpj.supabase.co:5432/postgres
```

### External APIs (Secrets)

**Required Secrets**:
```env
# Nutrition APIs
FATSECRET_CLIENT_ID=<from FatSecret Platform>
FATSECRET_CLIENT_SECRET=<from FatSecret Platform>
USDA_API_KEY=<from USDA FoodData Central>

# AI/ML
GOOGLE_GEMINI_API_KEY=<from Google AI Studio>
LOVABLE_API_KEY=<from Lovable AI Gateway>

# Voice AI
ELEVENLABS_API_KEY=<from ElevenLabs>
ELEVENLABS_WEBHOOK_SECRET=<from ElevenLabs>

# Shopping
INSTACART_ENVIRONMENT=sandbox
# INSTACART_CLIENT_ID=<from Instacart Developer Portal>
# INSTACART_CLIENT_SECRET=<from Instacart Developer Portal>

# Utilities
YOUTUBE_API_KEY=<from Google Cloud Console>
GOOGLE_PLACES_API_KEY=<from Google Cloud Console>
INVITE_JWT_SECRET=<random 32-character string>
```

**Optional Secrets**:
```env
OPENAI_API_KEY=<deprecated - using Gemini>
```

### Secret Management

**Adding Secrets**:
1. Admin opens Admin Dashboard → Agent tab
2. System prompts for missing secrets
3. User enters secret values securely
4. Secrets encrypted and stored in Supabase

**Accessing Secrets** (Edge Functions):
```typescript
const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
if (!apiKey) {
  return new Response(JSON.stringify({ 
    error: 'Missing API key',
    details: { missing: 'GOOGLE_GEMINI_API_KEY' }
  }), { status: 500 });
}
```

---

## Deployment & Configuration

### Build Configuration

**Vite Config** (`vite.config.ts`):
```typescript
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'KAEVA - Smart Home Assistant',
        short_name: 'KAEVA',
        theme_color: '#D69E2E',
        icons: [...]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', ...],
          'animation-vendor': ['framer-motion'],
          'chart-vendor': ['recharts'],
          'supabase-vendor': ['@supabase/supabase-js', '@tanstack/react-query']
        }
      }
    }
  }
});
```

**Target Bundle Sizes** (gzipped):
- react-vendor: ~45KB
- ui-vendor: ~60KB
- animation-vendor: ~40KB
- chart-vendor: ~30KB
- supabase-vendor: ~35KB
- Main bundle: ~40KB
- **Total**: ~250-300KB (down from 680KB)

### Supabase Configuration

**File**: `supabase/config.toml`

**Project ID**: `btgmvuieishjiybgcmpj`

**Edge Function JWT Verification**: See [Edge Functions](#edge-functions) section

**Database Migrations**: Auto-managed, never edit manually

**Realtime Subscriptions**: Enabled for `inventory`, `notifications`, `household_activity`

### PWA Configuration

**Manifest** (`public/manifest.json`):
```json
{
  "name": "KAEVA - Smart Home Assistant",
  "short_name": "KAEVA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#08080A",
  "theme_color": "#D69E2E",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png" },
    { "src": "/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**Service Worker**: Auto-generated by Vite PWA plugin

**Installation Prompt**: Handled by browser (Chrome, Safari)

### Deployment Checklist

**Pre-Launch** (see Admin Dashboard → Deploy tab):
1. ✅ All edge functions deployed
2. ✅ All secrets configured
3. ✅ ElevenLabs agents provisioned
4. ✅ Database migrations applied
5. ✅ RLS policies verified
6. ✅ PWA icons generated
7. ✅ Accessibility audit passed
8. ✅ Rate limiting configured
9. ✅ Error tracking enabled (if using Sentry)
10. ✅ Analytics configured (if using external service)

**Post-Launch**:
1. Monitor edge function logs
2. Check conversation_events for voice errors
3. Review household_activity for anomalies
4. Monitor rate_limits table for abuse
5. Check daily_digests generation success

### Monitoring & Logging

**Admin Dashboard**:
- System Logs: Edge function logs
- Tool Call Logs: Client tool invocations
- Conversation Monitor: Real-time conversation events
- Agent Health: Agent performance metrics

**Supabase Logs**:
- Database logs: SQL queries, slow queries
- Edge function logs: Console output, errors
- Auth logs: Login attempts, failures

**Client-Side Logging**:
- Console errors (captured by ErrorBoundary)
- Voice interaction logs (conversation_history)
- User actions (household_activity)

---

## Conclusion

This document represents the complete technical architecture of KAEVA as of the current implementation. It covers all major systems, components, flows, and design decisions. For specific implementation details, refer to the source code and inline comments.

**Key Files**:
- `KAEVA_MASTER_BLUEPRINT.md`: Product vision and feature roadmap
- `docs/ARCHITECTURE.md`: High-level architecture overview
- `docs/COMPONENTS.md`: Component catalog
- `docs/HOOKS.md`: Hook documentation
- `docs/EDGE_FUNCTIONS.md`: Edge function reference
- `docs/USER_JOURNEYS.md`: User flow diagrams

**Last Updated**: 2025-01-27

**Version**: 1.0.0 (Production Ready)
