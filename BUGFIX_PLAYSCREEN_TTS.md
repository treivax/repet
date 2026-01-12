# Bug Fix: PlayScreen TTS Integration

**Date**: 12 janvier 2025  
**Commit**: `097f629`  
**Severity**: 🔴 CRITICAL  
**Status**: ✅ FIXED

---

## 🐛 Problem Description

### Symptom
Regardless of the TTS provider selected (Piper or Google), **only the Google Web Speech API was being used** with a single voice. The Piper-WASM provider was completely bypassed during playback.

### Root Cause
The `PlayScreen.tsx` component was using the **legacy Web Speech API directly** (`window.speechSynthesis`) instead of utilizing the newly implemented multi-provider architecture (`ttsEngine` and `ttsProviderManager`).

**Problematic code**:
```typescript
// OLD - Direct Web Speech API usage
const utterance = new SpeechSynthesisUtterance(line.text)
utterance.voice = selectedVoice
window.speechSynthesis.speak(utterance)
```

This completely bypassed:
- ✗ TTSProviderManager
- ✗ PiperWASMProvider  
- ✗ Voice assignments (characterVoicesPiper/characterVoicesGoogle)
- ✗ Provider selection from settings
- ✗ AudioCacheService

### Impact
- 🚫 Piper voices were never used
- 🚫 Voice assignments were ignored
- 🚫 Provider selection had no effect
- 🚫 Audio caching didn't work
- ⚠️ Users couldn't benefit from high-quality neural voices

---

## ✅ Solution

### Changes Made

#### 1. Replace Direct Web Speech API with ttsEngine

**Before**:
```typescript
const utterance = new SpeechSynthesisUtterance(line.text)
if (selectedVoice) utterance.voice = selectedVoice
utterance.rate = ...
utterance.volume = ...
window.speechSynthesis.speak(utterance)
```

**After**:
```typescript
ttsEngine.speak({
  text: line.text,
  voiceURI: voiceId,
  rate,
  pitch: 1.0,
  volume,
  lineId: globalLineIndex.toString(),
})
```

#### 2. Use Voice Assignments from PlaySettings

**Before**:
```typescript
// Used old voiceManager to select voice by gender
let selectedVoice: SpeechSynthesisVoice | null = null
const gender = playSettings.characterVoices[line.characterId]
selectedVoice = voiceManager.selectVoiceForGender(gender)
```

**After**:
```typescript
// Use assigned voice from provider-specific map
const assignmentMap = playSettings.ttsProvider === 'piper-wasm'
  ? playSettings.characterVoicesPiper
  : playSettings.characterVoicesGoogle

let voiceId = assignmentMap[line.characterId] || ''

// Fallback to first matching voice by gender if no assignment
if (!voiceId && playSettings.characterVoices[line.characterId]) {
  const gender = playSettings.characterVoices[line.characterId]
  const voices = ttsProviderManager.getVoices()
  const matchingVoice = voices.find(v => v.gender === gender)
  if (matchingVoice) voiceId = matchingVoice.id
}
```

#### 3. Initialize TTS Provider on Mount

**New code**:
```typescript
useEffect(() => {
  const initializeTTS = async () => {
    if (!playId) return
    
    const settings = getPlaySettings(playId)
    const provider = settings.ttsProvider || 'piper-wasm'
    
    try {
      await ttsProviderManager.initialize(provider)
      console.warn(`TTS Provider initialisé: ${provider}`)
    } catch (error) {
      console.error('Erreur initialisation TTS provider:', error)
    }
  }
  
  initializeTTS()
}, [playId, getPlaySettings])
```

#### 4. Update Control Functions

**Before**:
```typescript
const stopPlayback = () => {
  window.speechSynthesis.cancel()
  // ...
}

const pausePlayback = () => {
  if (window.speechSynthesis.speaking && !isPaused) {
    window.speechSynthesis.pause()
  }
}
```

**After**:
```typescript
const stopPlayback = () => {
  ttsEngine.stop()
  // ...
}

const pausePlayback = () => {
  if (ttsEngine.isSpeaking() && !isPaused) {
    ttsEngine.pause()
  }
}
```

#### 5. Fix TTSProviderManager Re-initialization

**Enhancement to `TTSProviderManager.initialize()`**:
```typescript
async initialize(providerType: TTSProviderType = 'piper-wasm'): Promise<void> {
  // Si déjà initialisé avec le même provider, ne rien faire
  if (this.initialized && this.activeProvider?.type === providerType) {
    return
  }
  
  // Si déjà initialisé avec un autre provider, switch
  if (this.initialized && this.activeProvider?.type !== providerType) {
    await this.switchProvider(providerType)
    return
  }
  
  // ... rest of initialization
}
```

---

## 📊 Files Modified

| File | Lines Changed | Type |
|------|---------------|------|
| `src/screens/PlayScreen.tsx` | ~120 modified | Refactor |
| `src/core/tts/providers/TTSProviderManager.ts` | +10 | Enhancement |

---

## 🧪 Testing

### Before Fix
- [x] ❌ Selecting Piper → used Google voice
- [x] ❌ Voice assignments ignored
- [x] ❌ Only one voice used for all characters

### After Fix
- [x] ✅ Selecting Piper → uses Piper voices
- [x] ✅ Selecting Google → uses Google voices
- [x] ✅ Voice assignments respected
- [x] ✅ Different voices per character (2M, 2F)
- [x] ✅ Audio caching works
- [x] ✅ Provider switching works

### Test Procedure
1. Open a play with 4 characters (2 male, 2 female)
2. Go to play settings
3. Select "Piper" as TTS provider
4. Verify voice assignments (should show Piper voices)
5. Start playback
6. Verify audio uses Piper synthesis (different quality than Google)
7. Open model manager, verify stats update
8. Switch to "Google" provider
9. Verify playback uses Google voices
10. Switch back to Piper
11. Verify previous assignments restored

---

## 🎯 Result

### What Now Works
✅ **Multi-provider architecture fully functional**
- Piper and Google providers both work
- Provider selection is honored
- Smooth switching between providers

✅ **Voice assignments respected**
- Each character gets assigned voice
- Assignments persist per provider
- Manual overrides work

✅ **Audio caching operational**
- Synthesized audio cached in IndexedDB
- Instant playback for repeated lines
- Cache stats visible in UI

✅ **Full feature parity**
- All TTS features work with both providers
- Italian mode works
- Speed controls work
- Volume controls work

---

## 📝 Lessons Learned

### Why This Happened
1. **Legacy code remained**: Old Web Speech API code wasn't refactored when adding multi-provider support
2. **Two codepaths**: PlayDetailScreen used new system, PlayScreen used old system
3. **Testing gap**: Tests focused on settings UI, not actual playback

### Prevention
1. ✅ Grep for `window.speechSynthesis` usage before merging
2. ✅ Test actual playback, not just UI
3. ✅ Deprecate old `voiceManager` to prevent usage
4. ✅ Add integration tests for TTS playback

---

## 🔗 Related

- **Feature**: Phase 2-POC Piper-WASM Integration
- **Doc**: `PHASE2_COMPLETION_SUMMARY.md`
- **Tracker**: `plan/IMPLEMENTATION_TRACKER.md`
- **Previous commit**: `9e32b4c` (Phase 2 completion)
- **Fix commit**: `097f629` (This bug fix)

---

## ✅ Verification Checklist

- [x] Type-check passes
- [x] Lint passes
- [x] Build succeeds
- [x] Manual testing completed
- [x] Both providers work
- [x] Voice assignments respected
- [x] Audio caching functional
- [x] No regressions
- [x] Committed and pushed

---

**Status**: ✅ **RESOLVED**  
**Piper-WASM is now fully operational in playback!** 🎉