# Correction du Bug de Volume en Mode Italienne (WebSpeechProvider)

## 🐛 Problème

En mode italiennes, les répliques du personnage choisi étaient **toujours lues à voix haute** au lieu d'être muettes (volume = 0), lorsque le provider TTS utilisé était **Web Speech API** (Google TTS).

## 🔍 Cause Racine

Dans le fichier `src/core/tts/providers/WebSpeechProvider.ts`, lignes 188-190, l'opérateur `||` était utilisé au lieu de `??` :

```typescript
// ❌ CODE BUGUÉ
utterance.rate = options.rate || 1.0
utterance.pitch = options.pitch || 1.0
utterance.volume = options.volume || 1.0
```

### Pourquoi c'est un problème ?

En JavaScript :
- L'opérateur `||` retourne le deuxième opérande si le premier est **falsy** (false, 0, "", null, undefined, NaN)
- L'opérateur `??` (nullish coalescing) retourne le deuxième opérande **uniquement** si le premier est `null` ou `undefined`

**Cas problématique :**
```javascript
const volume = 0 || 1.0  // Retourne 1.0 ❌ (car 0 est falsy)
const volume = 0 ?? 1.0  // Retourne 0   ✓ (car 0 n'est ni null ni undefined)
```

En mode italiennes, `options.volume` est défini à `0` pour les répliques du personnage utilisateur. Avec l'opérateur `||`, ce `0` était remplacé par `1.0`, rendant l'audio **audible** au lieu de **muet**.

## ✅ Correction Appliquée

Remplacement de `||` par `??` dans `WebSpeechProvider.ts` :

```typescript
// ✓ CODE CORRIGÉ
utterance.rate = options.rate ?? 1.0
utterance.pitch = options.pitch ?? 1.0
utterance.volume = options.volume ?? 1.0
```

### Impact

| Valeur de `options.volume` | Avant (`\|\|`) | Après (`??`) |
|---------------------------|--------------|-------------|
| `0` (mode italienne)      | `1.0` ❌     | `0` ✓       |
| `0.5` (demi-volume)       | `0.5` ✓      | `0.5` ✓     |
| `1` (volume normal)       | `1` ✓        | `1` ✓       |
| `undefined` (non défini)  | `1.0` ✓      | `1.0` ✓     |
| `null` (null)             | `1.0` ✓      | `1.0` ✓     |

## 📁 Fichier Modifié

- **`src/core/tts/providers/WebSpeechProvider.ts`** (lignes 188-190)

## 🧪 Comment Tester

### Prérequis
1. Ouvrir une pièce de théâtre
2. Aller dans **Paramètres** → **Voix et Audio**
3. Sélectionner le provider **Google TTS** (Web Speech API)
4. Activer le **mode italiennes**
5. Choisir **votre personnage** (ex: HAMLET, ROMÉO)

### Procédure de Test

1. Revenir à l'écran de lecture
2. Cliquer sur une réplique de **votre personnage**
3. **✓ Résultat attendu** : Aucun son (audio complètement muet)
4. Cliquer sur une réplique d'un **autre personnage**
5. **✓ Résultat attendu** : Audio audible normalement

### Vérification Console

Ouvrir la console développeur (F12) et vérifier les logs :

```
[PlayScreen] 🎭 Mode italiennes - Ligne utilisateur détectée: volume=0, rate=1
[PlayScreen] ▶️ LECTURE ligne X (HAMLET): voiceId="...", volume=0, rate=1
```

Le `volume=0` doit apparaître pour les répliques de votre personnage.

## 📊 État des Providers TTS

| Provider | Fichier | Statut |
|----------|---------|--------|
| **Piper WASM** | `PiperWASMProvider.ts` | ✓ OK (utilisait déjà `??`) |
| **Google TTS** | `WebSpeechProvider.ts` | ✓ **CORRIGÉ** (`\|\|` → `??`) |
| **Manager** | `TTSProviderManager.ts` | ✓ OK (pas d'utilisation directe) |

## 🔗 Contexte

Cette correction complète les corrections précédentes documentées dans :
- `VOLUME_FIX_SUMMARY.md` (correction de `PiperWASMProvider`)
- `AUDIO_FIXES_TEST.md` (guide de test général)

Le bug persistait parce que `WebSpeechProvider.ts` n'avait **pas été corrigé** lors des corrections précédentes, qui se concentraient sur `PiperWASMProvider.ts`.

## ⚠️ Note Importante

Cette correction s'applique **uniquement** si vous utilisez le provider **Google TTS** (Web Speech API). Si vous utilisez **Piper WASM** (recommandé), ce bug n'existait déjà pas.

Pour vérifier quel provider vous utilisez :
1. Ouvrir les **Paramètres** de la pièce
2. Aller dans **Voix et Audio**
3. Regarder le **Provider TTS** sélectionné

## ✅ Résultat Final

Maintenant, quel que soit le provider TTS utilisé (**Piper WASM** ou **Google TTS**), le mode italiennes fonctionne correctement :
- ✓ Vos répliques sont **complètement muettes** (volume = 0)
- ✓ Les répliques des autres personnages sont **audibles** (volume = 1)
- ✓ Le timing est respecté (pause appropriée pour vos répliques)

---

**Date :** 2025-01-XX  
**Fichier :** `src/core/tts/providers/WebSpeechProvider.ts`  
**Lignes modifiées :** 188-190  
**Type :** Correction de bug critique  
**Priorité :** Haute  
**Statut :** ✅ Corrigé