# Fork Notes - piper-tts-web-patched

**Date**: 2025-01-15  
**Version source**: @mintplex-labs/piper-tts-web v1.2.0  
**Raison**: Support multi-speaker (paramètre speakerId)

## 🎯 Objectif

Activer le support des modèles multi-speaker de Piper TTS en exposant le paramètre `speakerId` qui était hardcodé à `0` dans la bibliothèque originale.

## 📝 Modifications apportées

### Fichier modifié: `dist/piper-tts-web.js`

#### 1. Ajout de la propriété privée `_speakerId` (ligne 34)

```javascript
var _createPiperPhonemize,
  _modelConfig,
  _ort,
  _ortSession,
  _progressCallback,
  _wasmPaths,
  _logger,
  _speakerId  // ✅ AJOUTÉ
```

#### 2. Ajout du paramètre au constructeur (ligne 269)

**Avant:**
```javascript
constructor({ voiceId, progress, logger, wasmPaths })
```

**Après:**
```javascript
constructor({ voiceId, progress, logger, wasmPaths, speakerId })  // ✅ speakerId ajouté
```

#### 3. Initialisation de la propriété (lignes 281, 297)

```javascript
// Ajout dans le constructeur
__privateAdd(this, _speakerId, 0)

// ...

// Assignation de la valeur fournie ou 0 par défaut
__privateSet(this, _speakerId, speakerId ?? 0)
```

#### 4. Utilisation dans la méthode predict() (ligne 354)

**Avant:**
```javascript
const speakerId = 0  // ❌ HARDCODÉ
```

**Après:**
```javascript
const speakerId = __privateGet(this, _speakerId)  // ✅ CONFIGURABLE
```

#### 5. Déclaration WeakMap (ligne 385)

```javascript
_speakerId = new WeakMap()  // ✅ AJOUTÉ
```

## ✅ Compatibilité ascendante

- Si `speakerId` n'est pas fourni, la valeur par défaut est `0`
- Comportement identique à la bibliothèque originale pour les utilisateurs existants
- Aucun breaking change

## 🔧 Utilisation

### Création d'une session avec speakerId

```javascript
import { TtsSession } from '@/lib/piper-tts-web-patched'

// Jessica (speaker 0 - par défaut)
const jessicaSession = await TtsSession.create({
  voiceId: 'fr_FR-upmc-medium',
  speakerId: 0  // Optionnel, 0 par défaut
})

// Pierre (speaker 1)
const pierreSession = await TtsSession.create({
  voiceId: 'fr_FR-upmc-medium',
  speakerId: 1  // ✅ Maintenant possible !
})

// Synthèse
const jessicaAudio = await jessicaSession.predict('Bonjour')  // Voix féminine
const pierreAudio = await pierreSession.predict('Bonjour')    // Voix masculine
```

## 📋 Fichiers modifiés

- ✅ `dist/piper-tts-web.js` : Fichier principal compilé (~20 KB)
- ❌ `src/*` : Pas de sources TypeScript dans le package NPM
- ❌ `dist/index.d.ts` : Types non modifiés (pas nécessaire pour JS runtime)

**Note**: Le package est distribué compilé, donc pas de modification de sources TypeScript.

## 🔍 Détection des modèles multi-speaker

Le code détecte automatiquement si un modèle supporte plusieurs speakers:

```javascript
// Ligne 366 du fichier patché
if (Object.keys(__privateGet(this, _modelConfig).speaker_id_map).length) {
  Object.assign(feeds, {
    sid: new (__privateGet(this, _ort).Tensor)('int64', [speakerId]),
  })
}
```

Si `speaker_id_map` est vide, le paramètre `sid` n'est pas envoyé au modèle ONNX.

## 🧪 Tests

### Vérifier la compatibilité

```javascript
// Test 1: Sans speakerId (comportement par défaut)
const session1 = await TtsSession.create({ voiceId: 'fr_FR-siwis-medium' })
await session1.predict('Test')  // ✅ Devrait fonctionner

// Test 2: Avec speakerId = 0
const session2 = await TtsSession.create({ 
  voiceId: 'fr_FR-upmc-medium',
  speakerId: 0 
})
await session2.predict('Test')  // ✅ Devrait fonctionner (Jessica)

// Test 3: Avec speakerId = 1
const session3 = await TtsSession.create({ 
  voiceId: 'fr_FR-upmc-medium',
  speakerId: 1 
})
await session3.predict('Test')  // ✅ Devrait fonctionner (Pierre)
```

### Vérifier le speakerId dans les logs ONNX

Ouvrir la console du navigateur et inspecter les tensors:

```
feeds: {
  input: Tensor(int64) [...],
  input_lengths: Tensor(int64) [234],
  scales: Tensor(float32) [0.667, 1.0, 0.8],
  sid: Tensor(int64) [1]  // ✅ Devrait être 0 ou 1 selon le speaker
}
```

## 🔄 Merge avec upstream

Si la bibliothèque upstream ajoute le support multi-speaker:

### 1. Comparer les changements

```bash
cd src/lib/piper-tts-web-patched
git diff --no-index dist/piper-tts-web.js ../../node_modules/@mintplex-labs/piper-tts-web/dist/piper-tts-web.js
```

### 2. Vérifier la présence du paramètre

```bash
# Dans le nouveau package NPM
grep -n "speakerId" node_modules/@mintplex-labs/piper-tts-web/dist/piper-tts-web.js
```

### 3. Si supporté upstream, migrer

```bash
# Supprimer le fork local
rm -rf src/lib/piper-tts-web-patched

# Mettre à jour l'import dans PiperWASMProvider.ts
# De: import { TtsSession } from '@/lib/piper-tts-web-patched'
# À:  import { TtsSession } from '@mintplex-labs/piper-tts-web'

# Mettre à jour package.json
npm install @mintplex-labs/piper-tts-web@latest
```

## 🐛 Problèmes connus

### Singleton global

La classe `TtsSession` utilise un singleton global (`_instance`). Pour changer de `speakerId`, il faut créer une nouvelle session avec un `voiceId` différent ou gérer plusieurs instances manuellement.

**Workaround actuel**: Utiliser des `voiceId` différents pour chaque speaker:
- `fr_FR-upmc-medium` → Jessica (speakerId: 0)
- `fr_FR-upmc-pierre-medium` → Pierre (speakerId: 1, même modèle)

### Formatage du code

Le fichier a été reformaté avec Prettier lors des modifications. Cela n'affecte pas la fonctionnalité mais rend le diff volumineux.

## 📚 Ressources

- **Package original**: https://github.com/mintplex-labs/piper-tts-web
- **Piper TTS**: https://github.com/rhasspy/piper
- **ONNX Runtime Web**: https://onnxruntime.ai/docs/tutorials/web/
- **Modèles Piper**: https://huggingface.co/rhasspy/piper-voices

## 📊 Impact

| Métrique | Avant | Après |
|----------|-------|-------|
| Fichiers modifiés | 0 | 1 |
| Lignes ajoutées | - | ~8 |
| Lignes modifiées | - | ~3 |
| Taille du package | ~500 KB | ~500 KB (identique) |
| Speakers supportés | 1 (hardcodé) | N (configurable) |
| Breaking changes | - | 0 |

## ✅ Validation

- [x] Code modifié compile sans erreur
- [x] Compatibilité ascendante préservée
- [x] Paramètre optionnel (valeur par défaut = 0)
- [x] Documentation complète
- [x] Prêt pour utilisation en production
- [x] Provider activé par défaut dans `TTSProviderManager`

## 🚀 Intégration dans Répét

### Provider par défaut

Le fork est maintenant utilisé par défaut dans l'application :

```typescript
// src/core/tts/providers/TTSProviderManager.ts
import { PiperWASMProvider } from './PiperWASMProvider'

export class TTSProviderManager {
  constructor() {
    this.provider = new PiperWASMProvider()  // ✅ Utilise le fork
  }
}
```

**Avantages** :
- ✅ Phonemization gérée automatiquement par le fork (pas besoin de `piper_phonemize.wasm`)
- ✅ Support multi-speaker immédiat via `speakerId`
- ✅ Compatible avec tous les modèles Piper (mono et multi-speaker)
- ✅ Pas de problème stdin/stdout avec le phonemizer
- ✅ Audio fonctionne directement sans configuration supplémentaire

**Alternative non utilisée** : `PiperNativeProvider`
- Nécessite `piper_phonemize.wasm` (problème stdin en WebAssembly)
- Phonemization manuelle avec ONNX Runtime
- Plus complexe à maintenir
- Gardé dans le code pour référence future

### Voix disponibles

Les 4 voix françaises sont maintenant fonctionnelles :

1. **Siwis** (F) - `fr_FR-siwis-medium` - Modèle mono-speaker
2. **Tom** (H) - `fr_FR-tom-medium` - Modèle mono-speaker
3. **Jessica** (F) - `fr_FR-upmc-medium` (speakerId: 0) - Multi-speaker
4. **Pierre** (H) - `fr_FR-upmc-pierre-medium` (speakerId: 1) - Multi-speaker

---

**Maintaineur**: Répét Contributors  
**Licence**: MIT (identique au package upstream)  
**Dernière mise à jour**: 2025-01-15