# Piper Phonemize WASM: stdin/stdout Limitation

**Date:** 2025-01-15  
**Status:** BLOCKED - Cannot use piper_phonemize.wasm for browser-based phonemization  
**Impact:** Native Piper TTS provider with multi-speaker support is not functional

---

## Problem Summary

The `piper_phonemize.wasm` module we have is compiled as a **command-line interface (CLI) program** that:
- Reads text input from **stdin** (file descriptor 0)
- Writes JSON phoneme output to **stdout** (file descriptor 1)
- Cannot be provided with stdin at runtime in the browser environment

This makes it impossible to use for in-browser text-to-speech phonemization without recompiling.

---

## Technical Details

### What We Discovered

Through extensive testing (see `public/test-phonemize.html`), we found:

1. **Only `_main` is exported**
   - The WASM module exports only the `_main` function
   - No library functions like `phonemize_text()` are available
   - No `cwrap` or `ccall` utilities are present
   - Cannot call phonemization directly

2. **stdin callbacks don't work**
   - Passing `stdin` callback to `createPiperPhonemize()` has no effect
   - The module's `FS.init()` is called during initialization with default streams
   - Cannot call `FS.init()` again (throws "FS error")
   - Runtime stdin redirection is not supported in this build

3. **File-based I/O doesn't work**
   - `--input` and `--output` flags are not recognized by the program
   - The CLI only supports stdin/stdout (confirmed via `--help` output)
   - Attempting to use files results in exception `404048` (memory pointer)

4. **TTY hooks don't work**
   - Custom TTY device operations registered via `preRun` are not invoked
   - Stream redirection via `FS.streams[]` is not accessible/functional
   - PIPE filesystem approach fails with descriptor manipulation errors

### Help Output

Running with `--help` shows:

```
usage: ./this.program [options]

options:
   -h        --help              show this message and exit
   -l  LANG  --language     LANG  language of input text (required)
   --espeak_data           DIR   path to espeak-ng data directory
   --tashkeel_model        FILE  path to libtashkeel onnx model (arabic)
   -j        --json_input        input is JSONL instead of plain text
   --allow_missing_phonemes      don't fail when phonemes are not recognized
```

**Note:** No `--input` or `--output` options exist.

### Why It Doesn't Work

The `piper_phonemize` binary is a standalone C++ program compiled to WASM. Emscripten provides:
- Default stdio streams that connect to the browser console (`print`/`printErr`)
- No way to intercept or redirect stdin/stdout after module initialization
- The `stdin` option only works if the program was compiled with specific flags

The build we have was **not compiled for library use** - it's a pure CLI tool.

---

## Attempted Solutions (All Failed)

### ✗ Approach 1: `stdin` callback in module options
```javascript
createPiperPhonemize({
  stdin: () => { return charCode },  // NOT CALLED
  stdout: (char) => { /* ... */ },    // NOT CALLED
})
```
**Result:** Callbacks never invoked.

### ✗ Approach 2: `FS.init()` after module creation
```javascript
module.FS.init(stdinFn, stdoutFn, stderrFn)
```
**Result:** `ErrnoError: FS error` - can only be called once, already called during init.

### ✗ Approach 3: File-based I/O with `--input`/`--output`
```javascript
module.callMain(['--input', '/tmp/in.txt', '--output', '/tmp/out.txt'])
```
**Result:** Exception `404048`, no output file created. Flags don't exist.

### ✗ Approach 4: Stream redirection via `FS.streams`
```javascript
module.FS.streams[0] = inputStream
module.FS.streams[1] = outputStream
```
**Result:** `FS.streams` is undefined or not accessible.

### ✗ Approach 5: Custom TTY devices in `preRun`
```javascript
preRun: [function(m) {
  m.FS.registerDevice(m.FS.makedev(5, 0), customStdinOps)
}]
```
**Result:** Device registered but never used; stdin not read from custom device.

---

## Root Cause

The `piper_phonemize.wasm` was compiled with Emscripten **without**:
- `MODULARIZE=1` and `EXPORT_ES6=1` for proper ES module support
- Exported C functions (e.g., via `EMSCRIPTEN_KEEPALIVE`)
- Runtime stdin/stdout configuration support
- `cwrap`/`ccall` utilities for calling C functions from JS

It's a **monolithic CLI program**, not a library.

---

## Solutions

### Option 1: Recompile `piper_phonemize` for Web ✅ RECOMMENDED

Recompile from source with:

```bash
emcc -O3 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s EXPORTED_FUNCTIONS='["_phonemize_text", "_free", "_malloc"]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap", "ccall", "UTF8ToString", "stringToUTF8"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  --preload-file espeak-ng-data@/espeak-ng-data \
  -o piper_phonemize_lib.js \
  src/phonemize.cpp
```

Then expose a library function:

```cpp
#include <emscripten.h>

extern "C" {
  EMSCRIPTEN_KEEPALIVE
  char* phonemize_text(const char* text, const char* language) {
    // Phonemization logic here
    return result_json;
  }
}
```

**Effort:** High - requires C++ knowledge and build setup  
**Benefit:** Full control, optimal performance, multi-speaker support

### Option 2: Fork `@mintplex-labs/piper-tts-web` ⚡ QUICK WIN

The `@mintplex-labs/piper-tts-web` package already works but hardcodes `speakerId = 0`.

**Steps:**
1. Copy the package to `src/lib/piper-tts-web-patched/`
2. Find where `speakerId` is set to 0
3. Add it as a parameter to the synthesis function
4. Update imports to use the patched version

**Effort:** Low - just modify existing working code  
**Benefit:** Quick solution, maintains existing architecture

### Option 3: Use JavaScript-based Phonemizer 🐌 FALLBACK

Use a pure JS phonemizer like `espeak.js` or `phonemizer.js`.

**Pros:** No compilation needed  
**Cons:** Slower, larger bundle, may not match Piper's exact phoneme set

---

## Current Status

- ✅ `PiperNativeProvider` class exists but **is non-functional**
- ✅ Multi-speaker models (Jessica/Pierre) are defined
- ✅ ONNX Runtime Web integration works
- ❌ Phonemization step is blocked
- ✅ Fallback to `@mintplex-labs/piper-tts-web` works (Jessica only)

---

## Recommendation

**Proceed with Option 2**: Fork `@mintplex-labs/piper-tts-web`.

### Why?
1. **Fastest path to multi-speaker support** (1-2 hours vs days)
2. **Lowest risk** - already proven to work
3. **Minimal code changes** - just expose an existing parameter
4. **Can upgrade later** to Option 1 if needed

### Next Steps
1. Copy `@mintplex-labs/piper-tts-web` to local `src/lib/`
2. Locate the `speakerId: 0` hardcoding
3. Add `speakerId` parameter to the provider's synthesize function
4. Test with Pierre (speakerId: 1)
5. Update voice configurations to use the new provider

---

## Files Reference

- Test page: `public/test-phonemize.html`
- Provider implementation: `src/core/tts/providers/PiperNativeProvider.ts`
- Phonemizer wrapper: `src/core/tts/utils/PiperPhonemizer.ts`
- Thread summary: `.thread/thread_summary.md`
- WASM files: `public/wasm/piper_phonemize.{js,wasm,data}`

---

## Lessons Learned

1. **Check WASM exports first** - Before assuming a WASM module is usable, inspect what it exports
2. **CLI ≠ Library** - A CLI program compiled to WASM is fundamentally different from a library
3. **stdin/stdout is hard** - Emscripten's stdio redirection is complex and build-dependent
4. **Don't fight the architecture** - Sometimes forking/patching existing code is faster than building from scratch
5. **Test early** - We could have discovered this limitation much sooner with basic export inspection

---

## See Also

- [Emscripten stdio documentation](https://emscripten.org/docs/api_reference/Filesystem-API.html)
- [piper-phonemize source](https://github.com/rhasspy/piper-phonemize)
- Original thread: `@Piper Native Integration Phonemizer Errors`
