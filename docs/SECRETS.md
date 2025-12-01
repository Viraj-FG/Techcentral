# Secrets Configuration Guide

This document provides a comprehensive reference for all secrets used in KAEVA edge functions, their purposes, and setup instructions.

## Table of Contents

- [Overview](#overview)
- [Secret Categories](#secret-categories)
- [Setup Instructions](#setup-instructions)
- [Secret Reference](#secret-reference)
- [Edge Function Secret Matrix](#edge-function-secret-matrix)
- [Troubleshooting](#troubleshooting)

---

## Overview

KAEVA uses Supabase secrets management to securely store API keys and credentials. All secrets are accessed server-side through edge functions and are never exposed to the client.

**Total Secrets**: 17  
**Required for Core Functionality**: 9  
**Optional for Enhanced Features**: 8

---

## Secret Categories

### 🎙️ Voice & Conversation
Enables voice assistant and conversational AI features.

| Secret | Status | Purpose |
|--------|--------|---------|
| `ELEVENLABS_API_KEY` | **Required** | Powers Kaeva voice assistant conversations |
| `ELEVENLABS_WEBHOOK_SECRET` | **Required** | Validates ElevenLabs webhook events |

### 🤖 AI & Vision
Enables vision scanning, image generation, and AI-powered features.

| Secret | Status | Purpose |
|--------|--------|---------|
| `GOOGLE_GEMINI_API_KEY` | **Required** | Vision analysis, product identification, AI insights |
| `LOVABLE_API_KEY` | **Required** | Image generation (PWA icons, assets) |
| `OPENAI_API_KEY` | Optional | Alternative AI model (not currently used) |

### 🍎 Nutrition APIs
Enables nutrition data enrichment and food analysis.

| Secret | Status | Purpose |
|--------|--------|---------|
| `FATSECRET_CLIENT_ID` | **Required** | Primary nutrition database API (OAuth) |
| `FATSECRET_CLIENT_SECRET` | **Required** | Primary nutrition database API (OAuth) |
| `USDA_API_KEY` | **Required** | Fallback nutrition database (FoodData Central) |

### 📺 Video & Content
Enables recipe video tutorials and cooking guidance.

| Secret | Status | Purpose |
|--------|--------|---------|
| `YOUTUBE_API_KEY` | **Required** | Recipe tutorial video search |

### 🛒 Shopping & Location
Enables smart shopping and store information features.

| Secret | Status | Purpose |
|--------|--------|---------|
| `INSTACART_ENVIRONMENT` | Optional | Shopping cart integration (staging/production) |
| `GOOGLE_PLACES_API_KEY` | Optional | Store hours and location data |

### 🔐 Internal/System
Auto-configured by Lovable Cloud, no manual setup required.

| Secret | Status | Purpose |
|--------|--------|---------|
| `SUPABASE_URL` | Auto-configured | Supabase project URL |
| `SUPABASE_ANON_KEY` | Auto-configured | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-configured | Supabase admin operations |
| `SUPABASE_DB_URL` | Auto-configured | Direct database connection |
| `SUPABASE_PUBLISHABLE_KEY` | Auto-configured | Public client key |
| `INVITE_JWT_SECRET` | Auto-configured | Household invite token signing |

---

## Setup Instructions

### 1. Access Lovable Cloud Backend

```
Navigate to: Settings → Integrations → Lovable Cloud → View Backend
```

### 2. Add Secrets via UI

In the Lovable Cloud dashboard:
1. Go to **Edge Functions** → **Secrets**
2. Click **Add Secret**
3. Enter secret name (exact match from table above)
4. Paste API key value
5. Click **Save**

### 3. Verify Secret Configuration

After adding secrets, deploy your edge functions. Check logs for validation errors:

```
Error: Missing required secrets (3):
  - FATSECRET_CLIENT_ID
  - FATSECRET_CLIENT_SECRET
  - USDA_API_KEY
```

---

## Secret Reference

### ELEVENLABS_API_KEY

**Category**: Voice & Conversation  
**Required**: Yes  
**Provider**: [ElevenLabs](https://elevenlabs.io/)

**Setup**:
1. Sign up at elevenlabs.io
2. Navigate to Profile → API Keys
3. Generate new API key
4. Add to Supabase secrets as `ELEVENLABS_API_KEY`

**Used By**:
- `provision-agents`
- `generate-signed-url`

**Purpose**: Powers Kaeva voice assistant with natural conversational AI. Handles voice agent provisioning and real-time conversation management.

---

### ELEVENLABS_WEBHOOK_SECRET

**Category**: Voice & Conversation  
**Required**: Yes  
**Provider**: [ElevenLabs](https://elevenlabs.io/)

**Setup**:
1. In ElevenLabs dashboard, go to Webhooks
2. Copy webhook secret
3. Add to Supabase secrets as `ELEVENLABS_WEBHOOK_SECRET`

**Used By**:
- Voice webhook handlers (when implemented)

**Purpose**: Validates incoming webhook events from ElevenLabs to ensure authenticity.

---

### GOOGLE_GEMINI_API_KEY

**Category**: AI & Vision  
**Required**: Yes  
**Provider**: [Google AI Studio](https://makersuite.google.com/)

**Setup**:
1. Visit Google AI Studio
2. Create project and enable Gemini API
3. Generate API key
4. Add to Supabase secrets as `GOOGLE_GEMINI_API_KEY`

**Used By**:
- `analyze-vision`
- `identify-product`
- `detect-intent`
- `daily-ai-digest`
- `suggest-recipes`
- `generate-meal-plan`
- `analyze-meal`
- `enrich-product` (fallback)
- `extract-social-recipe`

**Purpose**: Powers vision analysis, product identification, intent detection, AI insights, recipe generation, and nutrition estimation fallback.

---

### LOVABLE_API_KEY

**Category**: AI & Vision  
**Required**: Yes (auto-configured)  
**Provider**: Lovable AI Gateway

**Setup**: Auto-configured by Lovable Cloud, no manual setup required.

**Used By**:
- `generate-app-icons`
- `generate-beauty-inspiration`

**Purpose**: Enables serverless image generation for PWA icons and AI-powered beauty recommendations.

---

### FATSECRET_CLIENT_ID & FATSECRET_CLIENT_SECRET

**Category**: Nutrition APIs  
**Required**: Yes  
**Provider**: [FatSecret Platform API](https://platform.fatsecret.com/)

**Setup**:
1. Register at platform.fatsecret.com
2. Create new application
3. Copy Client ID and Client Secret (OAuth 1.0)
4. Add both to Supabase secrets

**Used By**:
- `enrich-product`
- `analyze-meal`

**Purpose**: Primary nutrition database for food composition data, calories, macros, and allergen information.

---

### USDA_API_KEY

**Category**: Nutrition APIs  
**Required**: Yes  
**Provider**: [USDA FoodData Central](https://fdc.nal.usda.gov/)

**Setup**:
1. Visit fdc.nal.usda.gov
2. Sign up for API access
3. Generate API key
4. Add to Supabase secrets as `USDA_API_KEY`

**Used By**:
- `enrich-product` (fallback)

**Purpose**: Fallback nutrition database when FatSecret doesn't have data. Uses Survey (FNDDS) and SR Legacy databases.

---

### YOUTUBE_API_KEY

**Category**: Video & Content  
**Required**: Yes  
**Provider**: [Google Cloud Console](https://console.cloud.google.com/)

**Setup**:
1. Go to Google Cloud Console
2. Enable YouTube Data API v3
3. Create credentials (API Key)
4. Add to Supabase secrets as `YOUTUBE_API_KEY`

**Used By**:
- `search-recipe-videos`
- `generate-beauty-inspiration`

**Purpose**: Searches YouTube for recipe tutorial videos and beauty inspiration content to enhance cooking and beauty experiences.

---

### INSTACART_ENVIRONMENT

**Category**: Shopping & Location  
**Required**: No (optional)  
**Provider**: Instacart Developer Platform

**Setup**:
1. Contact Instacart for API access
2. Choose environment: `staging` or `production`
3. Add to Supabase secrets as `INSTACART_ENVIRONMENT`

**Used By**:
- `instacart-create-cart`

**Purpose**: Enables automatic shopping cart creation for inventory restocking and recipe shopping lists.

---

### GOOGLE_PLACES_API_KEY

**Category**: Shopping & Location  
**Required**: No (optional)  
**Provider**: [Google Cloud Console](https://console.cloud.google.com/)

**Setup**:
1. Go to Google Cloud Console
2. Enable Places API
3. Create credentials (API Key)
4. Add to Supabase secrets as `GOOGLE_PLACES_API_KEY`

**Used By**:
- `get-place-hours`

**Purpose**: Retrieves store hours and location information for shopping and meal planning features.

---

### INVITE_JWT_SECRET

**Category**: Internal/System  
**Required**: Yes (auto-configured)  
**Provider**: Auto-generated

**Setup**: Auto-configured by Lovable Cloud during household invite system setup.

**Used By**:
- `create-household-invite`
- `accept-household-invite`

**Purpose**: Signs and validates JWT tokens for secure household invite links with expiration and usage limits.

---

## Edge Function Secret Matrix

| Edge Function | Required Secrets | Optional Secrets |
|--------------|------------------|------------------|
| `provision-agents` | ELEVENLABS_API_KEY, OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | - |
| `generate-signed-url` | ELEVENLABS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | - |
| `analyze-vision` | GOOGLE_GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY | - |
| `identify-product` | GOOGLE_GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY | - |
| `detect-intent` | GOOGLE_GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY | - |
| `enrich-product` | FATSECRET_CLIENT_ID, FATSECRET_CLIENT_SECRET, USDA_API_KEY, GOOGLE_GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY | - |
| `analyze-meal` | FATSECRET_CLIENT_ID, FATSECRET_CLIENT_SECRET, GOOGLE_GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY | - |
| `daily-ai-digest` | GOOGLE_GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | - |
| `suggest-recipes` | GOOGLE_GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY | - |
| `generate-meal-plan` | GOOGLE_GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY | - |
| `extract-social-recipe` | GOOGLE_GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY | - |
| `generate-beauty-inspiration` | LOVABLE_API_KEY, GOOGLE_GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY | YOUTUBE_API_KEY |
| `search-recipe-videos` | YOUTUBE_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY | - |
| `get-place-hours` | GOOGLE_PLACES_API_KEY | - |
| `instacart-create-cart` | INSTACART_ENVIRONMENT, SUPABASE_URL, SUPABASE_ANON_KEY | - |
| `create-household-invite` | INVITE_JWT_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY | - |
| `accept-household-invite` | INVITE_JWT_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY | - |
| `cook-recipe` | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | - |
| `generate-app-icons` | LOVABLE_API_KEY | - |

---

## Troubleshooting

### Secret Validation Errors

**Error Message**:
```
Missing required secrets (2):
  - FATSECRET_CLIENT_ID
  - FATSECRET_CLIENT_SECRET
```

**Solution**:
1. Check secret name spelling (case-sensitive)
2. Verify secret is saved in Lovable Cloud backend
3. Redeploy edge functions after adding secrets

---

### Authentication Failures

**Error Message**:
```
ElevenLabs API error: 401 Unauthorized
```

**Solution**:
1. Verify API key is valid and active
2. Check if API key has necessary permissions
3. Regenerate API key if expired

---

### Rate Limiting

**Error Message**:
```
FatSecret API error: 429 Too Many Requests
```

**Solution**:
1. Check your API plan limits
2. Implement exponential backoff (planned)
3. Upgrade API tier if needed

---

### Environment-Specific Issues

**INSTACART_ENVIRONMENT**:
- Use `staging` for development/testing
- Use `production` for live shopping features
- Incorrect value causes cart creation failures

---

## Security Best Practices

1. **Never commit secrets to git** - All secrets are stored server-side
2. **Rotate keys regularly** - Update secrets every 90 days
3. **Use least privilege** - Only grant necessary API permissions
4. **Monitor usage** - Track API consumption in provider dashboards
5. **Audit access** - Review who has access to secrets management

---

## Additional Resources

- [Supabase Secrets Documentation](https://supabase.com/docs/guides/functions/secrets)
- [ElevenLabs API Docs](https://elevenlabs.io/docs)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [FatSecret Platform API Docs](https://platform.fatsecret.com/api/Default.aspx)
- [USDA FoodData Central API](https://fdc.nal.usda.gov/api-guide.html)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)

---

**Last Updated**: December 2024  
**Maintained By**: KAEVA Development Team
