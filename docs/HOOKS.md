# Custom Hooks Reference

Complete reference for all custom React hooks in the Kaeva application.

## Voice Hooks

### useAssistantVoice.ts

**Purpose**: Main voice assistant hook for in-app voice interactions

**Location**: `src/hooks/useAssistantVoice.ts`

**Returns**:
```typescript
{
  startConversation: () => void,
  endConversation: () => void,
  status: 'disconnected' | 'connecting' | 'connected',
  isSpeaking: boolean,
  messages: ConversationMessage[],
  conversationId: string | null
}
```

**Key Features**:
- Integrates ElevenLabs Conversational AI (assistant agent)
- Registers client tools inline to avoid stale closures
- Sends contextual updates when inventory/shopping list changes
- Persists conversation to `conversation_history` table
- Logs events to `conversation_events` for admin monitoring

**Client Tools**:
- `check_inventory`: Query household inventory by category or search term
- `get_recipes`: Get recipe suggestions based on current inventory
- `add_to_shopping_list`: Add items to shared shopping list
- `check_expiring_items`: Find items expiring within X days
- `get_nutrition_today`: Get today's calorie and macro totals
- `search_products`: Search for products in database or external APIs

**Contextual Updates**:
```typescript
// Triggered by RealtimeContext subscriptions
sendContextualUpdate({
  inventorySummary: { fridge: 15, pantry: 32, beauty: 8, pets: 5 },
  lowStockItems: ['Milk', 'Eggs'],
  expiringItems: ['Yogurt (expires tomorrow)', 'Strawberries (expires today)'],
  householdAllergies: ['peanuts', 'shellfish'],
  pets: [{ name: 'Max', species: 'dog', toxicFlags: true }],
  shoppingCart: ['Milk', 'Bread', 'Coffee']
});
```

**Usage Example**:
```typescript
const { startConversation, endConversation, status } = useAssistantVoice();

// Trigger via button
<Button onClick={startConversation}>
  Start Voice
</Button>
```

### useOnboardingVoice.ts

**Purpose**: Voice-guided onboarding experience

**Location**: `src/hooks/useOnboardingVoice.ts`

**Returns**:
```typescript
{
  startConversation: () => void,
  endConversation: () => void,
  status: 'disconnected' | 'connecting' | 'connected',
  isSpeaking: boolean,
  messages: ConversationMessage[],
  currentCluster: string | null
}
```

**Key Features**:
- Separate agent configuration from assistant
- Persists data immediately via client tools
- Guides user through 6 onboarding clusters
- Auto-creates household during onboarding

**Client Tools**:
- `updateProfile`: Update user profile fields (userName, userAge, userWeight, userHeight, userGender, userActivityLevel, dietaryPreferences, allergies, skinType, hairType, householdAdults, householdKids, healthGoals, lifestyleGoals)
- `saveHouseholdMember`: Add household member or pet to database

**Data Persistence**:
```typescript
// Tool executes immediately, not deferred
updateProfile: async ({ field, value }) => {
  await supabase
    .from('profiles')
    .update({ [field]: value })
    .eq('id', userId);
  
  return { success: true };
}
```

**Usage Example**:
```typescript
const { startConversation, currentCluster } = useOnboardingVoice();

useEffect(() => {
  startConversation(); // Auto-start on mount
}, []);
```

### useVoiceCommand.ts

**Purpose**: Simple voice command detection (legacy, mostly replaced by assistant)

**Location**: `src/hooks/useVoiceCommand.ts`

**Returns**:
```typescript
{
  isListening: boolean,
  transcript: string,
  startListening: () => void,
  stopListening: () => void,
  confidence: number
}
```

**Key Features**:
- Uses Web Speech API (browser native)
- No external API dependencies
- Keyword detection for wake words
- Fallback for browsers without ElevenLabs support

### useVoiceCooking.ts

**Purpose**: Voice-guided cooking mode for recipes

**Location**: `src/hooks/useVoiceCooking.ts`

**Returns**:
```typescript
{
  currentStep: number,
  totalSteps: number,
  isActive: boolean,
  startCooking: (recipeId: string) => void,
  nextStep: () => void,
  previousStep: () => void,
  repeatStep: () => void,
  pauseCooking: () => void,
  endCooking: () => void
}
```

**Key Features**:
- Integrates with `cook-recipe` edge function
- Voice commands: "next", "previous", "repeat", "pause"
- Timer management for timed steps
- Auto-deduct ingredients from inventory when complete

**Usage Example**:
```typescript
const { startCooking, nextStep, currentStep, totalSteps } = useVoiceCooking();

<Button onClick={() => startCooking(recipe.id)}>
  Start Cooking
</Button>

<div>Step {currentStep} of {totalSteps}</div>
```

## Realtime Hooks

### useRealtimeInventory.ts

**Purpose**: Subscribe to household inventory changes

**Location**: `src/hooks/useRealtimeInventory.ts`

**Parameters**: `householdId: string`

**Returns**:
```typescript
{
  inventory: InventoryItem[],
  isLoading: boolean,
  error: Error | null,
  refetch: () => void
}
```

**Key Features**:
- Subscribes to `inventory` table changes via Supabase Realtime
- Filters by household_id
- Updates local state on INSERT, UPDATE, DELETE
- Optimistic UI updates before server confirmation

**Subscription**:
```typescript
const channel = supabase
  .channel(`inventory-${householdId}`)
  .on(
    'postgres_changes',
    { 
      event: '*', 
      schema: 'public', 
      table: 'inventory',
      filter: `household_id=eq.${householdId}`
    },
    (payload) => {
      // Update local state based on payload.eventType
    }
  )
  .subscribe();
```

### useRealtimeNotifications.ts

**Purpose**: Subscribe to user notification changes

**Location**: `src/hooks/useRealtimeNotifications.ts`

**Returns**:
```typescript
{
  notifications: Notification[],
  unreadCount: number,
  markAsRead: (id: string) => void,
  deleteNotification: (id: string) => void
}
```

**Key Features**:
- Subscribes to `notifications` table
- Filters by user_id
- Real-time badge count updates
- Toast notifications for high-priority events

### useHouseholdActivity.ts

**Purpose**: Subscribe to household activity feed

**Location**: `src/hooks/useHouseholdActivity.ts`

**Parameters**: `householdId: string`

**Returns**:
```typescript
{
  activities: HouseholdActivity[],
  isLoading: boolean,
  hasMore: boolean,
  loadMore: () => void
}
```

**Key Features**:
- Subscribes to `household_activity` table
- Infinite scroll pagination
- Real-time activity appends to feed
- Relative timestamps ("2 minutes ago")

## Vision & Scanner Hooks

### useVisionCapture.ts

**Purpose**: Camera capture and image processing for scanner

**Location**: `src/hooks/useVisionCapture.ts`

**Returns**:
```typescript
{
  cameraRef: RefObject<Webcam>,
  captureImage: () => Promise<string>, // Returns base64
  isProcessing: boolean,
  error: string | null,
  requestPermissions: () => Promise<boolean>
}
```

**Key Features**:
- Webcam access via `react-webcam`
- Permission handling for camera
- Image capture and base64 encoding
- Error handling for denied permissions
- Mobile browser fallback strategy

**Permission Strategy**:
```typescript
// Progressive fallback
try {
  await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
} catch {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true }); // Video only
  } catch {
    // Fallback to file upload
  }
}
```

## Utility Hooks

### useDebouncedValue.ts

**Purpose**: Debounce value changes to reduce API calls

**Location**: `src/hooks/useDebouncedValue.ts`

**Parameters**: `value: T, delay: number`

**Returns**: `T` (debounced value)

**Usage Example**:
```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebouncedValue(searchTerm, 500);

useEffect(() => {
  // Only fires 500ms after user stops typing
  if (debouncedSearch) {
    searchProducts(debouncedSearch);
  }
}, [debouncedSearch]);
```

### useKaevaMotion.ts

**Purpose**: Consistent animation presets for framer-motion

**Location**: `src/hooks/useKaevaMotion.ts`

**Exports**:
```typescript
export const kaevaTransition = {
  type: "spring",
  stiffness: 260,
  damping: 20
};

export const kaevaFadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: kaevaTransition
};

export const kaevaSlideUp = {
  initial: { opacity: 0, y: 100 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 100 },
  transition: kaevaTransition
};

export const kaevaScale = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: kaevaTransition
};
```

**Usage Example**:
```typescript
import { kaevaFadeIn } from '@/hooks/useKaevaMotion';

<motion.div {...kaevaFadeIn}>
  Content
</motion.div>
```

### use-mobile.tsx

**Purpose**: Detect mobile viewport

**Location**: `src/hooks/use-mobile.tsx`

**Returns**: `boolean` (true if mobile)

**Breakpoint**: 768px

**Usage Example**:
```typescript
const isMobile = useMobile();

return isMobile ? <MobileNav /> : <DesktopNav />;
```

### use-toast.ts

**Purpose**: Toast notification system

**Location**: `src/hooks/use-toast.ts`

**Returns**:
```typescript
{
  toast: (options: ToastOptions) => void,
  toasts: Toast[],
  dismiss: (toastId: string) => void
}
```

**Usage Example**:
```typescript
const { toast } = useToast();

toast({
  title: "Item added",
  description: "Milk added to inventory",
  variant: "success"
});
```

**Variants**: "default", "success", "destructive"

## Profile & Auth Hooks

### useProfile (pattern, not a file)

**Purpose**: Load and manage user profile data separately from authentication

**Implementation**: Typically inline in components or context

**Pattern**:
```typescript
const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(data);
      setIsLoading(false);
    };

    fetchProfile();
  }, [user?.id]);

  return { profile, isLoading };
};
```

**Key Principle**: Profile loading is separated from auth to prevent auth state from blocking on profile fetch

## Hook Composition Patterns

### Voice + Realtime Integration

```typescript
// In VoiceAssistant component
const { startConversation, status } = useAssistantVoice();
const { inventory } = useRealtimeInventory(householdId);

// Send context updates when inventory changes
useEffect(() => {
  if (status === 'connected' && inventory.length > 0) {
    sendContextualUpdate({
      inventorySummary: groupBy(inventory, 'category')
    });
  }
}, [inventory, status]);
```

### Scanner + Voice Integration

```typescript
// In Dashboard
const { captureImage } = useVisionCapture();
const { startConversation } = useAssistantVoice();

const handleQuickScan = async () => {
  const image = await captureImage();
  const result = await analyzeVision(image);
  
  // Voice confirmation
  startConversation();
  // AI speaks: "I see you scanned milk. Added to fridge."
};
```

## Custom Hook Best Practices

1. **Separation of Concerns**: Each hook handles one responsibility
2. **Data Persistence**: Hooks that modify data (voice tools) persist immediately
3. **Realtime Integration**: Subscribe to Supabase channels, don't poll
4. **Error Handling**: Always return error state for UI handling
5. **Cleanup**: Unsubscribe from channels on unmount
6. **Inline Dependencies**: Voice client tools defined inline to access current state

## Testing Hooks

All hooks can be tested using React Testing Library:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory';

test('subscribes to inventory changes', () => {
  const { result } = renderHook(() => 
    useRealtimeInventory('household-123')
  );
  
  expect(result.current.inventory).toEqual([]);
  expect(result.current.isLoading).toBe(true);
});
```

---

For component integration, see [COMPONENTS.md](./COMPONENTS.md)

For architecture overview, see [ARCHITECTURE.md](./ARCHITECTURE.md)

For edge function usage, see [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md)
