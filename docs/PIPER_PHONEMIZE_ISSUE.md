# Problème: piper_phonemize.js manquant

**Date**: 2025-01-15  
**Statut**: 🔴 Bloquant pour PiperNativeProvider  
**Branche**: `feature-piper-wasm-natif`

---

## 🐛 Problème

Le **PiperNativeProvider** ne peut pas s'initialiser car le fichier `piper_phonemize.js` est manquant.

### Erreur constatée

```
Failed to load resource: the server responded with a status of 404 (Not Found)
piper_phonemize.js:1

[PiperPhonemizer] Erreur lors de l'initialisation: 
Error: Échec du chargement de piper_phonemize.js
```

### Fichiers présents vs manquants

```bash
public/wasm/
├── ort-wasm-simd.wasm          # ✅ Présent
├── piper_phonemize.data        # ✅ Présent  
├── piper_phonemize.wasm        # ✅ Présent
└── piper_phonemize.js          # ❌ MANQUANT
```

---

## 🔍 Cause racine

Le fichier `piper_phonemize.js` est le **loader JavaScript Emscripten** qui:
1. Charge le module WASM `piper_phonemize.wasm`
2. Initialise le système de fichiers virtuel avec `piper_phonemize.data`
3. Expose l'API JavaScript (`callMain`, `FS`, etc.)

**Ce fichier n'est pas distribué avec Piper** car il doit être généré lors de la compilation avec Emscripten.

---

## 🛠️ Solutions possibles

### Solution 1: Compiler piper_phonemize avec Emscripten ⭐ (Recommandé long terme)

**Avantages**:
- ✅ Contrôle total sur la build
- ✅ Fichiers optimisés pour notre usage
- ✅ Version la plus récente

**Inconvénients**:
- ⏰ Temps de setup (~2-4h)
- 🔧 Nécessite Docker + Emscripten SDK

#### Étapes

```bash
# 1. Cloner piper-phonemize
git clone --depth 1 https://github.com/wide-video/piper-phonemize.git
cd piper-phonemize

# 2. Installer Emscripten SDK
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install 3.1.47
./emsdk activate 3.1.47
source ./emsdk_env.sh

# 3. Compiler espeak-ng
cd ../
git clone --depth 1 https://github.com/rhasspy/espeak-ng.git
cd espeak-ng
./autogen.sh
./configure
make

# 4. Compiler piper-phonemize avec Emscripten
cd ../piper-phonemize
emmake cmake -Bbuild \
  -DCMAKE_TOOLCHAIN_FILE=$EMSDK/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake \
  -DCMAKE_CXX_FLAGS="-O3 -s INVOKE_RUN=0 -s MODULARIZE=1 -s EXPORT_NAME='createPiperPhonemize' -s EXPORTED_FUNCTIONS='[_main]' -s EXPORTED_RUNTIME_METHODS='[callMain, FS]' --preload-file /path/to/espeak-ng-data@/espeak-ng-data"
emmake cmake --build build --config Release

# 5. Copier les fichiers générés
cp build/piper_phonemize.js ../../repet/public/wasm/
cp build/piper_phonemize.wasm ../../repet/public/wasm/
cp build/piper_phonemize.data ../../repet/public/wasm/
```

**Temps estimé**: 2-4 heures

---

### Solution 2: Utiliser piper-wasm NPM package 🔧 (Recommandé court terme)

Le package `piper-wasm` sur NPM inclut les fichiers compilés.

**URL**: https://www.npmjs.com/package/piper-wasm

#### Étapes

```bash
# 1. Installer le package
npm install piper-wasm

# 2. Copier les fichiers
cp node_modules/piper-wasm/build/piper_phonemize.js public/wasm/
cp node_modules/piper-wasm/build/piper_phonemize.wasm public/wasm/
cp node_modules/piper-wasm/build/piper_phonemize.data public/wasm/

# 3. Copier espeak-ng-data
cp -r node_modules/piper-wasm/espeak-ng/espeak-ng-data public/

# 4. Redémarrer le serveur
npm run dev
```

**Temps estimé**: 10 minutes

**Note**: Vérifier la compatibilité des fichiers générés avec notre usage.

---

### Solution 3: Télécharger depuis un CDN 🌐

Certains projets hébergent les fichiers compilés sur CDN.

**Sources possibles**:
- https://unpkg.com/piper-wasm@latest/build/
- https://cdn.jsdelivr.net/npm/piper-wasm/build/
- GitHub Releases de projets forks

#### Étapes

```bash
# Exemple avec unpkg
curl -o public/wasm/piper_phonemize.js \
  https://unpkg.com/piper-wasm@0.1.4/build/piper_phonemize.js

curl -o public/wasm/piper_phonemize.wasm \
  https://unpkg.com/piper-wasm@0.1.4/build/piper_phonemize.wasm

curl -o public/wasm/piper_phonemize.data \
  https://unpkg.com/piper-wasm@0.1.4/build/piper_phonemize.data
```

**Temps estimé**: 5 minutes

---

### Solution 4: Revenir à PiperWASMProvider ⏮️ (Solution actuelle)

En attendant d'obtenir `piper_phonemize.js`, utiliser l'ancien provider.

**Fichier modifié**: `src/core/tts/providers/TTSProviderManager.ts`

```typescript
constructor() {
  this.provider = new PiperWASMProvider()  // ← Temporaire
  // this.provider = new PiperNativeProvider()  // Requiert piper_phonemize.js
}
```

**Avantages**:
- ✅ Fonctionne immédiatement
- ✅ Pas de blocage du développement

**Inconvénients**:
- ❌ Pierre (speaker #1) reste inaccessible
- ❌ Pas de support multi-speaker

**Statut**: ✅ Implémenté dans le commit suivant

---

## 🔄 Script de téléchargement automatique

Créer un script pour télécharger automatiquement depuis piper-wasm:

```javascript
// scripts/download-piper-phonemize.js
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const PIPER_WASM_VERSION = '0.1.4'
const BASE_URL = `https://unpkg.com/piper-wasm@${PIPER_WASM_VERSION}/build`

const FILES = [
  'piper_phonemize.js',
  'piper_phonemize.wasm',
  'piper_phonemize.data'
]

async function downloadFile(filename) {
  const url = `${BASE_URL}/${filename}`
  console.log(`📥 Téléchargement: ${url}`)
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  
  const buffer = await response.arrayBuffer()
  const destPath = join('public', 'wasm', filename)
  
  mkdirSync(join('public', 'wasm'), { recursive: true })
  writeFileSync(destPath, Buffer.from(buffer))
  
  console.log(`✅ Sauvegardé: ${destPath}`)
}

async function main() {
  for (const file of FILES) {
    await downloadFile(file)
  }
  console.log('✅ Tous les fichiers piper_phonemize téléchargés !')
}

main().catch(console.error)
```

**Utilisation**:

```bash
node scripts/download-piper-phonemize.js
npm run dev
```

---

## 📝 TODO

### Immédiat
- [ ] Télécharger `piper_phonemize.js` depuis piper-wasm NPM
- [ ] Copier `espeak-ng-data` dans `public/`
- [ ] Tester PiperNativeProvider avec les fichiers
- [ ] Vérifier que Pierre (speaker #1) fonctionne

### Court terme
- [ ] Créer script automatique de téléchargement
- [ ] Ajouter check dans `download-piper-models.js`
- [ ] Documenter dans README

### Moyen terme
- [ ] Compiler piper_phonemize nous-mêmes
- [ ] Optimiser les flags Emscripten pour notre usage
- [ ] Versionner les fichiers compilés dans le repo

---

## 🧪 Vérification après résolution

```bash
# 1. Vérifier présence fichiers
ls -lh public/wasm/piper_phonemize.*

# Doit afficher:
# piper_phonemize.data
# piper_phonemize.js     ← IMPORTANT
# piper_phonemize.wasm

# 2. Vérifier espeak-ng-data
ls -d public/espeak-ng-data

# Doit exister avec:
# public/espeak-ng-data/voices/
# public/espeak-ng-data/lang/

# 3. Activer PiperNativeProvider
# Dans src/core/tts/providers/TTSProviderManager.ts:
# this.provider = new PiperNativeProvider()

# 4. Tester
npm run dev

# 5. Vérifier logs
# Devrait voir:
# [PiperNativeProvider] Initialisation...
# [PiperPhonemizer] Initialisation...
# [PiperNativeProvider] Phonemizer initialisé
# [PiperNativeProvider] Initialisé avec succès
```

---

## 📚 Références

### Documentation Piper
- **Piper phonemize**: https://github.com/rhasspy/piper-phonemize
- **Fork WASM**: https://github.com/wide-video/piper-phonemize
- **NPM package**: https://www.npmjs.com/package/piper-wasm

### Compilation Emscripten
- **Emscripten docs**: https://emscripten.org/docs/getting_started/
- **CMake toolchain**: https://emscripten.org/docs/compiling/Building-Projects.html
- **Module API**: https://emscripten.org/docs/api_reference/module.html

### Espeak-ng
- **Repo officiel**: https://github.com/espeak-ng/espeak-ng
- **Fork Rhasspy**: https://github.com/rhasspy/espeak-ng
- **Data files**: Requis pour phonemization

---

## ✅ Résolution recommandée

**Pour l'instant (immédiat)**:
1. Télécharger depuis piper-wasm NPM (Solution 2)
2. Vérifier que tout fonctionne
3. Commiter les fichiers dans le repo

**Pour plus tard (v0.5.0)**:
1. Compiler piper_phonemize nous-mêmes (Solution 1)
2. Optimiser les flags de compilation
3. Documenter le processus de build

---

**Statut**: 🔧 En cours de résolution  
**Assigné à**: DevOps / Build System  
**Priorité**: Haute (bloque feature multi-speaker)