# Guide de Résolution : Erreurs de Chargement WASM

**Date** : 12 janvier 2025  
**Problème** : ONNX Runtime ne peut pas charger les fichiers WASM depuis le CDN  
**Commit Fix** : `94f107b`

---

## 🐛 Symptômes

```
Failed to fetch dynamically imported module: 
https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/ort-wasm-simd-threaded.jsep.mjs

Error: no available backend found. ERR: [wasm] TypeError: Failed to fetch...
```

**Comportement** :
- ❌ Pas de son lors de la lecture
- ❌ Erreurs répétées dans la console
- ❌ La lecture s'arrête après la première réplique
- ⚠️ Warnings "WebAssembly multi-threading is not supported"

---

## 🔍 Causes

1. **404 sur le CDN cloudflare** : Le fichier `.mjs` n'existe pas à cette URL
2. **Cross-Origin Isolation** : WASM multi-threading nécessite des headers CORS spécifiques
3. **Chemins par défaut** : piper-tts-web utilise des chemins CDN qui ne fonctionnent pas

---

## ✅ Solution Appliquée

### 1. Copie des Fichiers WASM en Local

**Installation du plugin** :
```bash
npm install --save-dev vite-plugin-static-copy
```

**Configuration Vite** (`vite.config.ts`) :
```typescript
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: 'wasm',
        },
        {
          src: 'node_modules/onnxruntime-web/dist/*.mjs',
          dest: 'wasm',
        },
      ],
    }),
  ],
})
```

**Résultat** : 21 fichiers WASM/MJS copiés dans `dist/wasm/`

---

### 2. Configuration ONNX Runtime

**Dans `PiperWASMProvider.ts`** :
```typescript
import * as ort from 'onnxruntime-web'

async initialize() {
  // Désactiver multi-threading (évite CORS)
  ort.env.wasm.numThreads = 1
  ort.env.wasm.simd = true
  
  // Utiliser fichiers locaux
  ort.env.wasm.wasmPaths = '/wasm/'
}
```

**Lors de création de TtsSession** :
```typescript
await TtsSession.create({
  voiceId: modelConfig.piperVoiceId,
  wasmPaths: {
    onnxWasm: '/wasm/',  // ← Chemins locaux
    piperData: 'https://cdn.jsdelivr.net/...',
    piperWasm: 'https://cdn.jsdelivr.net/...',
  },
})
```

---

### 3. Headers CORS (Dev Server)

**Dans `vite.config.ts`** :
```typescript
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
})
```

**Note** : Ces headers permettent SharedArrayBuffer mais ne sont pas strictement nécessaires car nous avons désactivé le multi-threading.

---

## 🧪 Vérification

### Après Redémarrage du Serveur

1. **Vérifier les fichiers WASM** :
```bash
ls dist/wasm/
# Devrait lister : ort-wasm-simd.wasm, ort-wasm-simd.mjs, etc.
```

2. **Vérifier dans le navigateur** :
   - Ouvrir DevTools → Network
   - Filtrer par "wasm"
   - Lancer une lecture
   - ✅ Vérifier que `/wasm/ort-wasm-simd.wasm` se charge avec status 200
   - ✅ Pas d'erreurs 404

3. **Vérifier la console** :
   - ✅ Plus de "Failed to fetch" errors
   - ✅ "[Piper TTS] New session" apparaît
   - ✅ Pas de "no available backend found"

---

## 🚀 Test de Fonctionnement

### Checklist Post-Fix

- [ ] Redémarrer le serveur dev : `npm run dev`
- [ ] Ouvrir une pièce
- [ ] Sélectionner "Piper" comme moteur TTS
- [ ] Lancer une lecture
- [ ] **Vérifier** :
  - [ ] Téléchargement du modèle Piper démarre
  - [ ] Progress bar s'affiche
  - [ ] Audio joue après téléchargement
  - [ ] Pas d'erreurs dans la console
  - [ ] Lectures suivantes fonctionnent

---

## 🔄 Pour Basculer sur Google (Test Comparatif)

Si Piper ne fonctionne toujours pas :

1. Aller dans les paramètres de la pièce
2. Sélectionner "Google / Web Speech API"
3. Lancer une lecture
4. **Comparer** : Google devrait fonctionner immédiatement

Si Google fonctionne mais pas Piper → Problème spécifique Piper  
Si Google ne fonctionne pas non plus → Problème plus général

---

## 🛠️ Dépannage Avancé

### Si WASM ne se charge toujours pas

1. **Vider le cache du navigateur** :
   - Chrome : DevTools → Application → Clear storage
   - Firefox : Ctrl+Shift+Del → Cocher "Cache"

2. **Vérifier les chemins** :
```javascript
// Dans la console du navigateur
fetch('/wasm/ort-wasm-simd.wasm')
  .then(r => console.log('Status:', r.status))
  .catch(e => console.error('Error:', e))
```

3. **Mode incognito** :
   - Tester dans une fenêtre incognito
   - Évite les problèmes de cache

4. **Vérifier la construction** :
```bash
npm run build
ls dist/wasm/  # Doit contenir les fichiers WASM
```

---

## 📊 Fichiers Modifiés

| Fichier | Changement |
|---------|------------|
| `package.json` | +1 devDependency (vite-plugin-static-copy) |
| `vite.config.ts` | +plugin static-copy, +CORS headers |
| `src/core/tts/providers/PiperWASMProvider.ts` | +config ONNX Runtime, +chemins locaux |

---

## 🎯 Résultat Attendu

✅ **ONNX Runtime charge depuis `/wasm/`**  
✅ **Pas d'erreurs 404**  
✅ **Piper TTS fonctionne**  
✅ **Audio joue correctement**  
✅ **Pas de warnings CORS**  

---

## 📞 Si le Problème Persiste

1. **Collecter les logs** :
   - Copier toutes les erreurs de la console
   - Network tab → copier les requêtes échouées

2. **Vérifier** :
   - Version Node.js : `node --version` (devrait être ≥18)
   - Version NPM : `npm --version` (devrait être ≥9)
   - Navigateur supporté (Chrome/Edge/Firefox récent)

3. **Tester avec build de production** :
```bash
npm run build
npm run preview
```

4. **Ouvrir un ticket** avec :
   - Logs de la console
   - Network tab screenshots
   - Sortie de `npm run build`

---

**Status** : ✅ **Fix déployé sur branche `piper-wasm`**  
**Prochaine étape** : Redémarrer le serveur et tester !