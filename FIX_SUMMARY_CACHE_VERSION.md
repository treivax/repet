# Fix Rapide - Voix Cohérentes & Cache Auto-Vidé

## 🎯 Problème Résolu

**Symptôme :** Un même personnage (ex: Chantal) avait différentes voix selon les lignes, même lors d'une première lecture après le démarrage.

**Cause :** Le singleton `TtsSession._instance` n'était pas réinitialisé avant chaque synthèse, donc toutes les voix utilisaient la même session ONNX (la dernière préchargée).

## ✅ Solution Appliquée

### 1. Fix Critique du Singleton

**Fichier :** `src/core/tts/providers/PiperWASMProvider.ts` (ligne ~344)

```typescript
// AVANT chaque synthèse, on force l'instance à pointer vers la bonne session
(TtsSession as any)._instance = session
```

✅ Garantit que chaque voix utilise SA propre session, même quand elle vient du cache.

### 2. Versionnage Automatique du Cache

**Fichier :** `src/core/tts/services/AudioCacheService.ts`

- **Version du cache = 2** (incrémentée suite au fix)
- Au démarrage : vérification automatique de la version
- Si ancienne version détectée → **vidage automatique** du cache audio
- Version stockée dans `localStorage`

✅ Les utilisateurs ne garderont jamais d'audio généré avec l'ancien code buggé.

## 🚀 Utilisation

### Après Mise à Jour

**Premier démarrage :**
1. L'application détecte l'ancienne version du cache (v1)
2. Vide automatiquement tout le cache audio
3. Met à jour la version (v2)
4. Logs visibles dans la console :
   ```
   [AudioCache] 🔄 Version du cache obsolète (stockée: 1, actuelle: 2)
   [AudioCache] 🧹 Vidage automatique du cache audio pour garantir la cohérence
   [AudioCache] ✅ Cache vidé et version mise à jour
   ```

**Démarrages suivants :**
- Tout fonctionne normalement
- Pas de nouveau vidage
- Cache audio utilisé normalement

### Vidage Manuel (Si Besoin)

**Via Console :**
```javascript
await window.clearAudioCache()  // Vider audio uniquement
await window.clearAllCaches()   // Vider audio + sessions
```

**Via URL :**
```
http://localhost:5173/?clearCache
```

## 📊 Vérification

### Test Rapide

1. Vider les caches : `await window.clearAllCaches()` + reload
2. Attendre le préchargement des voix (100%)
3. Lire une pièce avec plusieurs personnages
4. ✅ Chaque personnage doit garder la même voix sur TOUTES ses lignes

### Logs à Surveiller

**Au démarrage :**
```
[AudioCache] ✅ Version du cache à jour (v2)
[PiperWASM] 📊 Statistiques du cache: X entrées, Y MB
```

**Pendant la synthèse :**
```
[PiperWASM] 🔧 Réinitialisation de TtsSession._instance avant synthèse
[PiperWASM] ♻️ Utilisation de la session en cache pour fr_FR-siwis-medium
```

## 📁 Fichiers Modifiés

### Code
- ✅ `src/core/tts/providers/PiperWASMProvider.ts` - Fix singleton
- ✅ `src/core/tts/services/AudioCacheService.ts` - Versionnage

### Documentation
- ✅ `docs/AUDIO_CACHE_VERSIONING.md` - Guide complet
- ✅ `CHANGELOG_AUDIO_CACHE_FIX.md` - Historique détaillé
- ✅ `TEST_CACHE_VERSION_FIX.md` - Guide de test

## 🔧 Pour Développeurs

### Quand Incrémenter CACHE_VERSION ?

Incrémenter la version quand :
- ✅ Modification du système TTS affectant l'audio généré
- ✅ Changement de bibliothèque ou de modèles
- ✅ Fix de bug dans la synthèse vocale
- ❌ Changements UI uniquement
- ❌ Optimisations sans impact sur l'output

### Comment Incrémenter

```typescript
// Dans src/core/tts/services/AudioCacheService.ts
private static readonly CACHE_VERSION = 3  // Incrémenter ici
```

Le vidage automatique se fera au prochain démarrage pour tous les utilisateurs.

## 📚 Documentation Complète

- **Guide de versionnage :** `docs/AUDIO_CACHE_VERSIONING.md`
- **Tests détaillés :** `TEST_CACHE_VERSION_FIX.md`
- **Changelog :** `CHANGELOG_AUDIO_CACHE_FIX.md`

## 🎉 Résultat

✅ **Voix cohérentes** pour chaque personnage  
✅ **Cache automatiquement nettoyé** après mise à jour  
✅ **Performances préservées** (sessions en cache)  
✅ **Transparent** pour l'utilisateur final  

---

**Version actuelle du cache :** 2  
**Statut :** ✅ Testé et fonctionnel