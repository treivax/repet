# Next Steps: Multi-Speaker TTS Support

**Status:** Phonemizer blocked, path forward identified  
**Date:** 2025-01-15

## 🎯 Goal

Enable multi-speaker voice selection (Jessica + Pierre) for French TTS using the UPMC medium model.

## 🚧 Current Blocker

The `piper_phonemize.wasm` module cannot be used in the browser because:
- It's a CLI program that requires stdin/stdout
- Emscripten build doesn't support runtime stdin provision
- No library functions are exported

**Details:** See `docs/tech-notes/PIPER_PHONEMIZE_STDIN_LIMITATION.md`

## ✅ Recommended Solution

**Fork and patch `@mintplex-labs/piper-tts-web`** to expose the `speakerId` parameter.

### Why This Works

The package already:
- ✅ Includes a working phonemizer
- ✅ Runs ONNX inference correctly
- ✅ Works with our multi-speaker model
- ❌ Hardcodes `speakerId: 0` (Jessica only)

**Fix:** Simply expose `speakerId` as a parameter.

## 📋 Implementation Steps

### 1. Copy the Package Locally

```bash
mkdir -p src/lib
cp -r node_modules/@mintplex-labs/piper-tts-web src/lib/piper-tts-web-patched
```

### 2. Find the Hardcoded speakerId

Search for `speakerId` in the copied source:

```bash
cd src/lib/piper-tts-web-patched
grep -r "speakerId" .
```

Likely location: Where ONNX inference feeds are created.

### 3. Add Parameter to Synthesize Function

In the main synthesis/inference function, add:

```typescript
async function synthesize(
  text: string,
  modelPath: string,
  configPath: string,
  speakerId: number = 0  // Add this parameter
) {
  // ...
  const feeds = {
    input: inputTensor,
    input_lengths: lengthsTensor,
    scales: scalesTensor,
    sid: new ort.Tensor('int64', [BigInt(speakerId)], [1])  // Use the parameter
  }
  // ...
}
```

### 4. Update Provider to Pass speakerId

In `src/core/tts/providers/PiperNativeProvider.ts`, use the patched version:

```typescript
import { synthesize } from '@/lib/piper-tts-web-patched'

// In synthesize() method:
const speakerId = modelConfig.speakerId ?? 0
const audio = await synthesize(text, onnxPath, configPath, speakerId)
```

### 5. Test Both Voices

```typescript
// Should use Jessica (speakerId: 0)
const jessicaAudio = await provider.synthesize('Bonjour', 'jessica-fr')

// Should use Pierre (speakerId: 1)
const pierreAudio = await provider.synthesize('Bonjour', 'pierre-fr')
```

### 6. Verify in UI

- Open the app
- Select Jessica voice → should sound feminine
- Select Pierre voice → should sound masculine
- Both should use the same UPMC model file

## 🔄 Alternative: Recompile piper_phonemize

If you want full control and optimal performance:

### Requirements

- C++ compiler
- Emscripten SDK
- piper-phonemize source code

### Steps

1. Clone piper-phonemize
2. Modify to expose library functions
3. Compile with Emscripten flags for browser use
4. Integrate the new WASM module

**Effort:** 1-2 days  
**Benefit:** Best performance, no external dependencies

See `docs/tech-notes/PIPER_PHONEMIZE_STDIN_LIMITATION.md` for compilation flags.

## 📁 Key Files

- **Test page:** `public/test-phonemize.html` - Shows the stdin problem
- **Provider:** `src/core/tts/providers/PiperNativeProvider.ts` - TTS implementation
- **Phonemizer:** `src/core/tts/utils/PiperPhonemizer.ts` - Blocked wrapper
- **Tech note:** `docs/tech-notes/PIPER_PHONEMIZE_STDIN_LIMITATION.md` - Full analysis
- **Voice configs:** Lines 73-132 in `PiperNativeProvider.ts`

## 🎤 Voice Configuration

Current setup (ready to use once phonemizer works):

```typescript
{
  id: 'jessica-fr',
  name: 'fr_FR-upmc-medium (Jessica)',
  speakerId: 0,  // Female
  // ...
},
{
  id: 'pierre-fr',
  name: 'fr_FR-upmc-medium (Pierre)',
  speakerId: 1,  // Male
  // ...
}
```

Both use the same ONNX model: `fr_FR-upmc-medium.onnx`

## ⏱️ Time Estimates

| Approach | Effort | Risk | Benefit |
|----------|--------|------|---------|
| **Patch mintplex package** | 1-2 hours | Low | Quick multi-speaker support |
| Recompile piper_phonemize | 1-2 days | Medium | Full control, best performance |
| Use JS phonemizer | 3-4 hours | Medium | Pure JS, slower |

## 🚀 Quick Start (Recommended Path)

```bash
# 1. Copy package
mkdir -p src/lib
cp -r node_modules/@mintplex-labs/piper-tts-web src/lib/piper-tts-web-patched

# 2. Find speakerId hardcoding
cd src/lib/piper-tts-web-patched
grep -rn "speakerId.*0" .
# or
grep -rn "sid.*0" .

# 3. Edit the file to add speakerId parameter
# 4. Update imports in PiperNativeProvider.ts
# 5. Test!
```

## 📚 Documentation

- Full technical analysis: `docs/tech-notes/PIPER_PHONEMIZE_STDIN_LIMITATION.md`
- Original thread summary: `.thread/thread_summary.md`
- Test results: Run `public/test-phonemize.html` in browser

## ✨ Expected Outcome

After implementing the patch:
- ✅ Jessica voice (feminine) works
- ✅ Pierre voice (masculine) works
- ✅ Single model file serves both
- ✅ Voice selection in UI
- ✅ Character-voice matching based on gender

No changes needed to:
- ONNX model files (already downloaded)
- Voice assignment logic (already implemented)
- UI components (already support voice selection)

**Just need to unblock the phonemizer!** 🎯