# KAEVA - Potential Improvements

> **Updated:** November 26, 2025

---

## Voice/Mic Performance Optimization

### Problem
When enabling mic and voice modules, performance drops significantly due to:

1. **Continuous Speech Recognition** (`useWakeWordDetection.ts`)
   - `continuous = true` + `interimResults = true` keeps the mic processing 24/7
   - Auto-restart on `onend` creates endless listening loop
   - High CPU usage from constant audio processing

2. **Always-On Wake Word Detection** (`AppShell.tsx`)
   - `enabled: true` is hardcoded - runs even when voice isn't needed
   - No user preference to disable it

3. **Heavy ElevenLabs Hook** (`useAssistantVoice.ts`)
   - 755 lines of complex logic
   - Initializes realtime subscriptions immediately
   - Multiple database queries on connect

### Proposed Solutions

#### Option A: Lazy Enable Wake Word Detection (Quick Fix)
Only enable when user explicitly wants voice features via settings toggle.

#### Option B: Push-to-Talk Mode (Best UX Balance)
Replace continuous listening with a button - user presses mic to start, releases to stop. No background CPU usage.

#### Option C: Web Worker for Audio Processing
Move speech recognition to a Web Worker to avoid blocking main thread.

#### Option D: Visibility-Based Pausing
Pause wake word detection when browser tab is hidden, resume when visible.

### Recommendation
1. **Quick win**: Add a setting to disable wake word (Option A)
2. **Long term**: Offer push-to-talk as an alternative (Option B)
