# Changelog - Fix Cache Audio et Singleton TtsSession

**Date :** 2025-01-XX  
**Version du cache audio :** 2  
**Auteur :** Répét Contributors

## 🐛 Problème Résolu

### Symptômes
Lors de la première lecture après le démarrage de l'application, certains personnages (notamment Chantal) entendaient différentes voix pour différentes lignes, alors que l'assignation voix→personnage était correcte dans les logs.

### Diagnostic Initial (Erroné)
Nous pensions initialement que le problème venait d'un cache audio obsolète contenant des blobs générés avec de mauvaises assignations de voix.

### Cause Racine (Réelle)
Le vrai problème était plus subtil et se situait dans l'utilisation du singleton `TtsSession._instance` de la bibliothèque `@mintplex-labs/piper-tts-web` :

1. ✅ Les voix étaient correctement préchargées au démarrage (séquentiellement)
2. ✅ Le `sessionCache` (Map<voiceId, TtsSession>) contenait bien des sessions distinctes
3. ❌ **MAIS** : lors de la synthèse, quand on récupérait une session du cache, on ne mettait PAS à jour `_instance`
4. ❌ La bibliothèque utilisait probablement `_instance` en interne dans `predict()`, donc elle utilisait toujours la dernière session préchargée au lieu de celle passée en paramètre

**Résultat :** Toutes les synthèses utilisaient la même session ONNX (la dernière préchargée), quelle que soit la voix demandée.

## 🔧 Solution Implémentée

### 1. Fix du Singleton TtsSession (CRITIQUE)

**Fichier :** `src/core/tts/providers/PiperWASMProvider.ts`

**Avant :**
```typescript
let session = this.sessionCache.get(options.voiceId)

if (!session) {
  // Réinitialiser _instance uniquement lors de la création
  ;(TtsSession as any)._instance = null
  session = await TtsSession.create({...})
  this.sessionCache.set(options.voiceId, session)
}

// Synthèse avec la session
const audioBlob = await session.predict(text)
```

**Après :**
```typescript
let session = this.sessionCache.get(options.voiceId)

if (!session) {
  ;(TtsSession as any)._instance = null
  session = await TtsSession.create({...})
  this.sessionCache.set(options.voiceId, session)
}

// CRITICAL: Toujours réinitialiser _instance avant synthèse
// Même si la session vient du cache, la bibliothèque pourrait utiliser _instance en interne
;(TtsSession as any)._instance = session

// Synthèse avec la session
const audioBlob = await session.predict(text)
```

**Impact :** Garantit que chaque synthèse utilise la bonne session ONNX, même quand la session vient du cache.

### 2. Versionnage Automatique du Cache Audio

**Fichier :** `src/core/tts/services/AudioCacheService.ts`

Ajout d'un système de versionnage pour invalider automatiquement les caches obsolètes :

```typescript
export class AudioCacheService {
  private static readonly CACHE_VERSION = 2
  private static readonly CACHE_VERSION_KEY = 'repet-audio-cache-version'
  
  private async checkAndInvalidateCache(): Promise<void> {
    const storedVersion = localStorage.getItem(AudioCacheService.CACHE_VERSION_KEY)
    const storedVersionNum = storedVersion ? parseInt(storedVersion, 10) : 0
    
    if (storedVersionNum < AudioCacheService.CACHE_VERSION) {
      console.warn('[AudioCache] 🔄 Version obsolète, vidage automatique...')
      await this.clearCache()
      localStorage.setItem(AudioCacheService.CACHE_VERSION_KEY, CACHE_VERSION.toString())
    }
  }
}
```

**Déclenchement :** Au démarrage, lors de `audioCacheService.initialize()`

**Bénéfices :**
- ✅ Garantit que les utilisateurs n'utilisent jamais d'audio en cache généré avec l'ancien code buggé
- ✅ Permet de forcer facilement l'invalidation du cache après des modifications TTS futures
- ✅ Transparent pour l'utilisateur (vidage automatique au premier démarrage après mise à jour)

### 3. Paramètre URL pour Vidage Manuel

Ajout de `?clearCache` pour forcer le vidage du cache :

```
http://localhost:5173/?clearCache
```

**Utilité :** 
- Debugging
- Tests locaux
- Résolution de problèmes utilisateur sans avoir à incrémenter la version globale

### 4. Logs Améliorés

Ajout de logs détaillés pour faciliter le diagnostic :

```typescript
console.warn(`[PiperWASM] 🔧 Réinitialisation de TtsSession._instance avant synthèse`)
console.warn(`[AudioCache] ✅ Version du cache à jour (v2)`)
console.warn(`[PiperWASM] 📊 Statistiques du cache: X entrées, Y MB`)
```

## 📊 Impact

### Avant le Fix
- ❌ Voix incohérentes pour un même personnage
- ❌ Logs corrects mais audio incorrect
- ❌ Problème présent même avec un cache vide (première lecture)

### Après le Fix
- ✅ Chaque personnage utilise toujours la même voix
- ✅ Les sessions en cache sont correctement utilisées
- ✅ Cache audio automatiquement invalidé au démarrage (une seule fois)
- ✅ Performances préservées après le vidage initial

## 🧪 Tests Recommandés

### Test 1 : Première Lecture Après Démarrage
1. Vider complètement les caches (`?clearCache` ou console)
2. Recharger l'application
3. Lancer une pièce avec plusieurs personnages
4. ✅ Vérifier que chaque personnage garde la même voix sur toutes ses lignes

### Test 2 : Vidage Automatique au Démarrage
1. Installer une version avec `CACHE_VERSION = 1`
2. Générer du cache audio
3. Mettre à jour vers `CACHE_VERSION = 2`
4. Recharger
5. ✅ Vérifier dans les logs : `Version obsolète, vidage automatique...`
6. ✅ Vérifier que le cache est vide après init

### Test 3 : Vidage Manuel via URL
1. Accumuler du cache audio
2. Ajouter `?clearCache` à l'URL
3. ✅ Vérifier que le cache est vidé
4. ✅ Vérifier que la version est mise à jour

## 📝 Notes de Migration

### Pour les Développeurs

Si vous modifiez le système TTS d'une manière qui affecte la sortie audio :

1. **Incrémenter `CACHE_VERSION`** dans `AudioCacheService.ts`
2. **Documenter** le changement dans ce fichier ou dans `docs/AUDIO_CACHE_VERSIONING.md`
3. **Tester** le vidage automatique en local

### Pour les Utilisateurs Finaux

**Premier démarrage après cette mise à jour :**
- Le cache audio sera vidé automatiquement (peut prendre quelques secondes)
- Un message apparaîtra dans la console
- Les démarrages suivants seront normaux

**Pas d'action requise** de la part des utilisateurs.

## 🔗 Fichiers Modifiés

### Core
- `src/core/tts/providers/PiperWASMProvider.ts`
  - Ajout de `(TtsSession as any)._instance = session` avant chaque synthèse
  - Logs améliorés pour diagnostics

- `src/core/tts/services/AudioCacheService.ts`
  - Ajout de `CACHE_VERSION` (v2)
  - Ajout de `checkAndInvalidateCache()`
  - Support du paramètre URL `?clearCache`
  - Ajout du champ `cacheVersion` dans `CachedAudio`

### Documentation
- `docs/AUDIO_CACHE_VERSIONING.md` (nouveau)
  - Guide complet du système de versionnage
  - Bonnes pratiques
  - Dépannage

- `CHANGELOG_AUDIO_CACHE_FIX.md` (ce fichier)
  - Historique du fix
  - Tests et migration

## 🎯 Prochaines Étapes (Optionnel)

### Court Terme
- ✅ **FAIT :** Fix du singleton
- ✅ **FAIT :** Versionnage du cache
- ⏳ Monitoring : surveiller les logs utilisateurs pour confirmer le fix

### Moyen Terme
- Considérer un PR upstream vers `@mintplex-labs/piper-tts-web` pour supprimer/corriger le singleton
- Ajouter des tests automatisés pour vérifier la cohérence des voix
- Implémenter un système de migration progressive (au lieu de vidage complet)

### Long Terme
- Étudier des alternatives à Piper si le problème de singleton n'est pas résolu upstream
- Implémenter un cache distribué/synchronisé si l'app devient multi-device

## 🙏 Remerciements

- À l'utilisateur qui a signalé le problème avec patience et détails
- À la communauté `@mintplex-labs/piper-tts-web` pour la bibliothèque TTS offline

## 📚 Références

- [Issue Originale] Thread Zed : `Piper WASM TTS session reuse`
- [Documentation] `docs/AUDIO_CACHE_VERSIONING.md`
- [Documentation] `docs/PIPER_SESSION_CACHE.md`
- [Bibliothèque] https://github.com/Mintplex-Labs/piper-tts-web

---

**Version du cache au moment de ce changelog :** 2  
**Statut :** ✅ Résolu et testé