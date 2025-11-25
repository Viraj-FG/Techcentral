# Component Reference

Complete reference for all components in the Kaeva application.

## Screen Pages

| Component | Route | Shell | Purpose | Data Sources |
|-----------|-------|-------|---------|--------------|
| **Landing.tsx** | `/` | PublicShell | Marketing homepage with hero, features, testimonials, FAQ | None (static content) |
| **Auth.tsx** | `/auth` | UniversalShell | Email/password authentication (login/signup) | Supabase Auth |
| **Index.tsx** | `/app` | UniversalShell | Entry point for authenticated users, routes to onboarding or dashboard | `profiles` table |
| **Dashboard.tsx** | `/app` (after auth) | AppShell | Main dashboard with inventory status, nutrition, recipes | `inventory`, `meal_logs`, `recipes`, `household_activity` |
| **Inventory.tsx** | `/inventory` | AppShell | Full inventory management with category filters and item editing | `inventory` table (realtime) |
| **RecipeBook.tsx** | `/recipes` | AppShell | Recipe discovery and cooking mode | `recipes`, `inventory` tables |
| **Analytics.tsx** | `/analytics` | AppShell | Nutrition tracking with calendar, charts, and daily breakdown | `meal_logs`, `profiles` (TDEE calculation) |
| **Household.tsx** | `/household` | AppShell | Household member management, pet profiles, invite generation | `household_members`, `pets`, `households`, `household_memberships` |
| **Settings.tsx** | `/settings` | AppShell | User profile editing, preferences, logout | `profiles` table |
| **Admin.tsx** | `/admin` | AppShell | Admin dashboard with agent provisioning, user management, analytics | `user_roles`, `conversation_events`, `conversation_history` |
| **HouseholdInviteAccept.tsx** | `/household/join` | UniversalShell | Accept household invites via secure invite code | `household_invites`, `household_memberships` |

## Layout Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **UniversalShell.tsx** | Base viewport container for all authenticated app pages | Dynamic viewport height (`h-[100dvh]`), safe area support, fixed positioning, overscroll prevention |
| **PublicShell.tsx** | Wrapper for public marketing pages (landing, auth) | Same viewport handling as UniversalShell without navigation dock |
| **AppShell.tsx** | Authenticated app layout with bottom navigation dock | Bottom dock with 5 nav items, fixed positioning at `bottom-[calc(1rem+env(safe-area-inset-bottom))]`, integrates with VoiceAssistant |

## Dashboard Components

| Component | Location | Purpose | Data Sources |
|-----------|----------|---------|--------------|
| **PulseHeader.tsx** | `src/components/dashboard/` | Header with personalized greeting, streak tracking | `profiles` table |
| **InventoryMatrix.tsx** | `src/components/dashboard/` | 2x2 grid showing inventory status by category (Fridge, Pantry, Beauty, Pets) | `inventory` table grouped by category |
| **InventoryCard.tsx** | `src/components/dashboard/` | Individual category card with top 3 items and fill levels | `inventory` table filtered by category |
| **NutritionWidget.tsx** | `src/components/dashboard/` | Today's calorie/macro tracking with TDEE comparison | `meal_logs` for today, `profiles.calculated_tdee` |
| **RecipeFeed.tsx** | `src/components/dashboard/` | Suggested recipes based on current inventory | `recipes` table, `suggest-recipes` edge function |
| **HouseholdActivityFeed.tsx** | `src/components/dashboard/` | Live activity feed of household actions | `household_activity` table (realtime) |
| **SafetyShield.tsx** | `src/components/dashboard/` | Pet safety alerts for toxic items | `inventory.allergens`, `pets.toxic_flags_enabled` |
| **SmartCartWidget.tsx** | `src/components/dashboard/` | Shopping list preview with Instacart integration | `shopping_list` table |
| **FloatingActionButton.tsx** | `src/components/dashboard/` | Fixed bottom-right FAB with voice and scanner actions | Triggers VoiceAssistant and VisionSpotlight |
| **WelcomeBanner.tsx** | `src/components/dashboard/` | First-time user welcome message with onboarding tips | `profiles.onboarding_completed` |
| **ShieldStatus.tsx** | `src/components/dashboard/` | Safety status indicator (pet toxicity, allergens) | `household_members.allergies`, `pets` |
| **TetheredTag.tsx** | `src/components/dashboard/` | Household member tags with dietary restrictions | `household_members` |

## Voice Components

| Component | Location | Purpose | AI Integration |
|-----------|----------|---------|----------------|
| **VoiceAssistant.tsx** | `src/components/voice/` | Main voice assistant UI with conversation overlay | ElevenLabs Conversational AI (assistant agent) |
| **VoiceOnboarding.tsx** | `src/components/` | Voice-first onboarding experience | ElevenLabs Conversational AI (onboarding agent) |
| **ConversationOverlay.tsx** | `src/components/voice/` | Full-screen voice interaction UI with animated orb | None (presentational) |
| **SleepingIndicator.tsx** | `src/components/voice/` | Small indicator showing voice assistant is listening | None (presentational) |
| **KeywordFeedback.tsx** | `src/components/voice/` | Visual feedback when wake word detected | None (presentational) |
| **OnboardingStatus.tsx** | `src/components/voice/` | Progress tracker for onboarding clusters | None (presentational) |
| **KaevaAperture.tsx** | `src/components/` | Animated iris/aperture button for voice activation | None (animated button) |

## Scanner Components

| Component | Location | Purpose | AI Integration |
|-----------|----------|---------|----------------|
| **SmartScanner.tsx** | `src/components/scanner/` | Main camera scanner with mode selection | Google Gemini 2.5 Pro (vision) via `analyze-vision` edge function |
| **VisionSpotlight.tsx** | `src/components/dashboard/` | Scanner wrapper with slide-up animation | None (wrapper) |
| **ScanModeCarousel.tsx** | `src/components/scanner/` | Swipeable mode picker (Inventory, Nutrition, Beauty, Pets, Appliances) | None (UI carousel) |
| **CaptureButton.tsx** | `src/components/scanner/` | Fixed center button for capturing images | None (button) |
| **ScannerToolbar.tsx** | `src/components/scanner/` | Top toolbar with back button and mode indicator | None (toolbar) |
| **ScanResults.tsx** | `src/components/scanner/` | Modal displaying scan results with actions | None (results display) |
| **BarcodeOverlay.tsx** | `src/components/scanner/` | Barcode detection hints overlay | None (visual guide) |
| **ToxicityAlert.tsx** | `src/components/scanner/` | Full-screen red alert for pet-toxic items | None (alert modal) |
| **ModeSelector.tsx** | `src/components/scanner/` | Legacy mode selector (replaced by carousel) | None (deprecated) |
| **IntentPresetPicker.tsx** | `src/components/scanner/` | Quick action presets for scan intents | None (preset buttons) |
| **ProductAnalysisResult.tsx** | `src/components/scanner/result-modes/` | Result view for product scans | None (results formatting) |
| **NutritionTrackResult.tsx** | `src/components/scanner/result-modes/` | Result view for meal logging | None (results formatting) |

## Onboarding Components

| Component | Location | Purpose | Data Target |
|-----------|----------|---------|-------------|
| **VoiceOnboarding.tsx** | `src/components/` | Voice-first onboarding experience | `profiles` table via `updateProfile` client tool |
| **ClusterMission.tsx** | `src/components/` | First cluster: user goals and mission | `profiles.health_goals`, `profiles.lifestyle_goals` |
| **ClusterBiometrics.tsx** | `src/components/` | Second cluster: age, weight, height, activity level | `profiles.user_age`, `profiles.user_weight`, etc. |
| **ClusterLanguage.tsx** | `src/components/` | Third cluster: language and dietary preferences | `profiles.language`, `profiles.dietary_preferences` |
| **ClusterHousehold.tsx** | `src/components/` | Fourth cluster: household members and pets | `household_members`, `pets` tables |
| **ClusterBeauty.tsx** | `src/components/` | Fifth cluster: skin type, hair type | `profiles.beauty_profile` |
| **ClusterSafety.tsx** | `src/components/` | Sixth cluster: allergies, health conditions | `profiles.allergies`, `household_members.allergies` |
| **HouseholdSetup.tsx** | `src/components/` | Post-onboarding household creation | `households`, `household_memberships` tables |

## Household Components

| Component | Location | Purpose | Data Sources |
|-----------|----------|---------|--------------|
| **HouseholdMemberCard.tsx** | `src/components/` | Display card for household members | `household_members` table |
| **HouseholdMemberForm.tsx** | `src/components/` | Form for adding/editing household members | `household_members` table |
| **DigitalTwinCard.tsx** | `src/components/` | Pet profile card | `pets` table |
| **DigitalTwinSummary.tsx** | `src/components/` | Pet summary with dietary info | `pets` table |
| **HouseholdQuickAccess.tsx** | `src/components/dashboard/` | Quick access to household member profiles | `household_members` table |

## Analytics Components

| Component | Location | Purpose | Data Sources |
|-----------|----------|---------|--------------|
| **CalendarView.tsx** | `src/components/analytics/` | Monthly calendar showing logged days | `meal_logs` grouped by day |
| **CalorieChart.tsx** | `src/components/analytics/` | Line chart of daily calories vs TDEE | `meal_logs`, `profiles.calculated_tdee` |
| **MacroChart.tsx** | `src/components/analytics/` | Stacked bar chart of macronutrients | `meal_logs` (protein, carbs, fat) |
| **DayDetailModal.tsx** | `src/components/analytics/` | Modal showing detailed meal breakdown for selected day | `meal_logs` filtered by date |

## Admin Components

| Component | Location | Purpose | Data Sources |
|-----------|----------|---------|--------------|
| **AgentProvisioning.tsx** | `src/components/admin/` | Provision ElevenLabs agents (onboarding, assistant) | `provision-agents` edge function |
| **AgentStatus.tsx** | `src/components/admin/` | View agent configuration status | `profiles.agent_configured` |
| **AgentTestPanel.tsx** | `src/components/admin/` | Test voice agent functionality | ElevenLabs API |
| **ConversationMonitor.tsx** | `src/components/admin/` | Live conversation event stream | `conversation_events` table (realtime) |
| **UserManagement.tsx** | `src/components/admin/` | Manage user roles and permissions | `user_roles`, `profiles` tables |
| **Analytics.tsx** | `src/components/admin/` | System-wide analytics and usage stats | All tables (aggregated) |
| **DatabaseInspector.tsx** | `src/components/admin/` | Direct database query interface | Supabase client (all tables) |
| **ToolCallLogs.tsx** | `src/components/admin/` | View voice agent tool execution logs | `conversation_events` filtered by tool calls |
| **SystemLogs.tsx** | `src/components/admin/` | Edge function logs and errors | Supabase logs API |
| **DeploymentChecklist.tsx** | `src/components/admin/` | Pre-launch checklist for production | None (checklist UI) |
| **AgentHealthDashboard.tsx** | `src/components/admin/` | Monitor agent performance metrics | `conversation_events` aggregated |
| **TestingTools.tsx** | `src/components/admin/` | Tools for testing edge functions | Edge function direct calls |
| **ContextPreview.tsx** | `src/components/admin/` | Preview agent context for debugging | `profiles`, `household_members`, `inventory` |

## Search Components

| Component | Location | Purpose | Data Sources |
|-----------|----------|---------|--------------|
| **GlobalSearch.tsx** | `src/components/search/` | Command palette (Cmd+K) for quick navigation | All tables (fuzzy search) |

## UI Components (shadcn/ui)

All UI components are located in `src/components/ui/` and follow the shadcn/ui pattern:

- **accordion.tsx** - Collapsible sections
- **alert.tsx** - Alert messages
- **alert-dialog.tsx** - Confirmation dialogs
- **avatar.tsx** - User avatars
- **badge.tsx** - Status badges
- **button.tsx** - Primary button component
- **calendar.tsx** - Date picker calendar
- **card.tsx** - Card container
- **checkbox.tsx** - Checkbox input
- **collapsible.tsx** - Collapsible content
- **command.tsx** - Command palette
- **context-menu.tsx** - Right-click context menu
- **dialog.tsx** - Modal dialogs
- **drawer.tsx** - Bottom drawer (mobile)
- **dropdown-menu.tsx** - Dropdown menus
- **form.tsx** - Form wrapper (react-hook-form)
- **input.tsx** - Text input
- **label.tsx** - Form label
- **popover.tsx** - Popover tooltips
- **progress.tsx** - Progress bars
- **radio-group.tsx** - Radio button group
- **scroll-area.tsx** - Custom scrollable area
- **select.tsx** - Select dropdown
- **separator.tsx** - Visual separator line
- **sheet.tsx** - Side sheet/drawer
- **skeleton.tsx** - Loading skeleton
- **slider.tsx** - Range slider
- **switch.tsx** - Toggle switch
- **table.tsx** - Data table
- **tabs.tsx** - Tab navigation
- **textarea.tsx** - Multi-line text input
- **toast.tsx** - Toast notifications
- **tooltip.tsx** - Hover tooltips

### Custom UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **NotificationBell.tsx** | `src/components/ui/` | Bell icon with unread count badge |
| **SyncIndicator.tsx** | `src/components/ui/` | Realtime connection status indicator |
| **Icon.tsx** | `src/components/ui/` | Wrapper for Lucide icons with consistent sizing |

## Utility Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **AdminRoute.tsx** | `src/components/` | Route guard requiring admin role |
| **PermissionRequest.tsx** | `src/components/` | Request camera/microphone permissions |
| **Splash.tsx** | `src/components/` | Initial loading splash screen |
| **TutorialOverlay.tsx** | `src/components/` | First-time user tutorial overlay |
| **AuroraBackground.tsx** | `src/components/` | Animated gradient background |
| **ValuePropCarousel.tsx** | `src/components/` | Pre-auth value proposition carousel |
| **VolumeControl.tsx** | `src/components/` | Voice assistant volume control |
| **ConversationHistory.tsx** | `src/components/` | View past voice conversations |
| **NavLink.tsx** | `src/components/` | Active navigation link with indicator |

## Component Patterns

### Realtime Components

Components that subscribe to realtime updates:
- **InventoryMatrix.tsx** - via `useRealtimeInventory()` hook
- **HouseholdActivityFeed.tsx** - via `useHouseholdActivity()` hook
- **SmartCartWidget.tsx** - subscribes to `shopping_list` changes
- **ConversationMonitor.tsx** (admin) - subscribes to `conversation_events`

### Voice-Enabled Components

Components that integrate with voice assistant:
- **VoiceAssistant.tsx** - via `useAssistantVoice()` hook
- **VoiceOnboarding.tsx** - via `useOnboardingVoice()` hook
- Client tools registered inline in hooks for context awareness

### Vision-Enabled Components

Components that use camera and AI vision:
- **SmartScanner.tsx** - via `useVisionCapture()` hook
- Calls `analyze-vision` edge function with captured image
- Results processed based on selected scan mode

### Form Components

Components using react-hook-form + zod validation:
- **HouseholdMemberForm.tsx**
- **Settings.tsx** (profile editing)
- All forms in onboarding clusters

---

For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md)

For custom hooks reference, see [HOOKS.md](./HOOKS.md)

For database schema, see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
