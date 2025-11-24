# ElevenLabs Agent Webhook

This edge function handles tool calls from ElevenLabs conversational AI agents, providing server-side data persistence and reliable tool execution.

## Webhook URL

```
https://btgmvuieishjiybgcmpj.supabase.co/functions/v1/agent-webhook
```

## Supported Tools

### Onboarding Agent Tools

#### `updateProfile`
Saves user profile data immediately to the database.

**Parameters:**
- `field` (string): The profile field to update
- `value` (any): The value to save

**Supported Fields:**
- `userName` - User's name
- `userBiometrics` - Age, weight, height, gender, activity level (auto-calculates TDEE)
- `dietaryValues` - Dietary preferences
- `allergies` - Allergy list
- `beautyProfile` - Skin type, hair type
- `household` - Household members and pets (batch insert)
- `healthGoals` - Health goals array
- `lifestyleGoals` - Lifestyle goals array
- `language` - Preferred language

**Response:**
```json
{
  "success": true,
  "message": "Updated userName"
}
```

#### `completeConversation`
Marks onboarding as complete and triggers navigation to dashboard.

**Parameters:**
- `reason` (string): Reason for completion

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "action": "navigate",
  "destination": "/dashboard"
}
```

## ElevenLabs Agent Configuration

### Step 1: Configure Webhook in ElevenLabs Dashboard

1. Go to ElevenLabs Dashboard → Conversational AI → Your Agent
2. Navigate to "Tools & Functions" section
3. Set webhook URL: `https://btgmvuieishjiybgcmpj.supabase.co/functions/v1/agent-webhook`

### Step 2: Configure Tools

#### Onboarding Agent (`agent_0501kakwnx5rffaby5px9y1pskkb`)

**Tool 1: updateProfile**
```json
{
  "name": "updateProfile",
  "description": "Save user profile data. Call this immediately after collecting any profile information.",
  "parameters": {
    "type": "object",
    "properties": {
      "field": {
        "type": "string",
        "enum": ["userName", "userBiometrics", "dietaryValues", "allergies", "beautyProfile", "household", "healthGoals", "lifestyleGoals", "language"],
        "description": "The profile field to update"
      },
      "value": {
        "description": "The value to save - format depends on field type"
      }
    },
    "required": ["field", "value"]
  }
}
```

**Tool 2: completeConversation**
```json
{
  "name": "completeConversation",
  "description": "Mark onboarding as complete. Call this after all information is collected and confirmed.",
  "parameters": {
    "type": "object",
    "properties": {
      "reason": {
        "type": "string",
        "description": "Brief reason for completion"
      }
    },
    "required": ["reason"]
  }
}
```

## Testing the Webhook

### Test with cURL

```bash
# Test updateProfile
curl -X POST https://btgmvuieishjiybgcmpj.supabase.co/functions/v1/agent-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "updateProfile",
    "conversation_id": "test_conv_123",
    "agent_id": "agent_0501kakwnx5rffaby5px9y1pskkb",
    "parameters": {
      "field": "userName",
      "value": "Test User"
    }
  }'

# Test completeConversation
curl -X POST https://btgmvuieishjiybgcmpj.supabase.co/functions/v1/agent-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "completeConversation",
    "conversation_id": "test_conv_123",
    "agent_id": "agent_0501kakwnx5rffaby5px9y1pskkb",
    "parameters": {
      "reason": "All information collected"
    }
  }'
```

## Monitoring

### View Logs
```bash
# Using Supabase CLI
supabase functions logs agent-webhook --follow

# Or in Lovable admin panel
# Navigate to Admin → Edge Function Logs → agent-webhook
```

### Check Conversation Events
```sql
SELECT * FROM conversation_events 
WHERE conversation_id = 'your_conversation_id'
ORDER BY created_at DESC;
```

## Security

- Webhook does NOT require JWT authentication (set `verify_jwt = false`)
- User identification is done via conversation_id lookup
- All database operations use service role key
- Consider adding ElevenLabs signature validation for production

## Error Handling

The webhook returns appropriate HTTP status codes:
- `200` - Success
- `400` - Invalid request (unknown tool, missing user)
- `500` - Server error (database error, etc.)

All errors are logged to edge function logs for debugging.
