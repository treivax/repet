# Système de Versionnage du Cache Audio

## Vue d'ensemble

Le cache audio de Répét utilise un système de versionnage automatique pour garantir que les fichiers audio mis en cache restent cohérents avec le code de synthèse vocale. Lorsque des modifications importantes sont apportées au système TTS (Text-to-Speech), le cache est automatiquement invalidé au démarrage.

## Fonctionnement

### Version du Cache

La version actuelle du cache est définie dans `AudioCacheService` :

```typescript
private static readonly CACHE_VERSION = 2
```

Cette version est :
- **Stockée dans `localStorage`** après chaque initialisation
- **Comparée au démarrage** avec la version précédemment stockée
- **Incrémentée manuellement** lorsque des changements du système TTS rendent les anciens audios invalides

### Cycle de Vie

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Démarrage de l'application                               │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Initialisation de AudioCacheService                      │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Ouverture de la base IndexedDB                           │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Vérification de la version du cache                      │
│    - Lire version stockée dans localStorage                 │
│    - Comparer avec CACHE_VERSION                            │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌─────────────┐   ┌─────────────────────────────────────┐
│ Version OK  │   │ Version obsolète ou absente         │
└──────┬──────┘   └──────┬──────────────────────────────┘
       │                 │
       │                 ▼
       │          ┌──────────────────────────────────────┐
       │          │ 5. Vidage automatique du cache       │
       │          │    - clearCache()                    │
       │          │    - Suppression de tous les blobs   │
       │          └──────┬───────────────────────────────┘
       │                 │
       │                 ▼
       │          ┌──────────────────────────────────────┐
       │          │ 6. Mise à jour de la version         │
       │          │    localStorage.setItem(...)         │
       │          └──────┬───────────────────────────────┘
       │                 │
       └─────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Cache prêt avec version à jour                           │
└─────────────────────────────────────────────────────────────┘
```

## Quand Incrémenter la Version ?

Vous devez incrémenter `CACHE_VERSION` lorsque :

### ✅ Modifications Nécessitant l'Incrémentation

1. **Changements dans le système de sessions TTS**
   - Modification de la gestion des `TtsSession`
   - Fix de bugs affectant la qualité ou la voix des audios générés
   - Changement de la bibliothèque TTS (ex: mise à jour de `piper-tts-web`)

2. **Modifications des paramètres de synthèse**
   - Ajout ou modification des paramètres de voix
   - Changement de l'algorithme de génération de clés de cache
   - Modification des voiceIds ou de leur mapping

3. **Changements structurels du cache**
   - Modification du schéma `CachedAudio`
   - Ajout de métadonnées obligatoires
   - Changement de la méthode de sérialisation

### ❌ Modifications Ne Nécessitant PAS l'Incrémentation

1. **Changements UI uniquement**
   - Modifications de l'interface utilisateur
   - Changements cosmétiques
   - Ajout de composants React

2. **Optimisations sans impact sur la sortie**
   - Améliorations de performance du cache
   - Logs ou diagnostics
   - Gestion d'erreurs améliorée (sans changer la logique)

3. **Modifications de lecture**
   - Changements dans l'API de récupération du cache
   - Ajustements des statistiques

## Historique des Versions

### Version 2 (Actuelle)
**Date :** 2025-01
**Raison :** Fix critique du singleton `TtsSession._instance`

Les voix multiples utilisaient incorrectement la même session ONNX, rendant tous les audios en cache potentiellement invalides (mauvaise voix associée).

**Changements :**
- Ajout de `(TtsSession as any)._instance = session` avant chaque synthèse
- Garantie que chaque voix utilise sa propre session

### Version 1 (Initiale)
**Date :** 2025-01
**Raison :** Implémentation initiale du cache audio

Première version du système de cache avec IndexedDB.

## Vidage Manuel du Cache

### Via Console du Navigateur

```javascript
// Vider le cache audio
await window.clearAudioCache()

// Vider tous les caches (audio + sessions Piper)
await window.clearAllCaches()
```

### Via Paramètre URL

Ajoutez `?clearCache` à l'URL pour forcer le vidage au démarrage :

```
http://localhost:5173/?clearCache
```

Cela :
- Vide complètement le cache audio
- Met à jour la version stockée
- Utile pour le debugging ou après des modifications locales

### Programmatiquement

```typescript
import { audioCacheService } from './core/tts/services/AudioCacheService'

// Vider tout le cache
await audioCacheService.clearCache()

// Supprimer un élément spécifique
await audioCacheService.deleteItem(text, voiceId, settings)
```

## Diagnostics

### Vérifier la Version Actuelle

Dans la console du navigateur :

```javascript
// Version du code
console.log('Version du cache dans le code:', 2) // À remplacer par la version actuelle

// Version stockée (dernière utilisée)
console.log('Version stockée:', localStorage.getItem('repet-audio-cache-version'))
```

### Logs au Démarrage

Lors de l'initialisation, surveillez ces messages :

```
[AudioCache] ✅ Version du cache à jour (v2)
```

Ou si le cache est vidé :

```
[AudioCache] 🔄 Version du cache obsolète (stockée: 1, actuelle: 2)
[AudioCache] 🧹 Vidage automatique du cache audio pour garantir la cohérence
[AudioCache] ✅ Cache vidé et version mise à jour
```

### Statistiques du Cache

```javascript
// Via window helper
const stats = await window.piperDebug.getCacheStats()
console.log(`Cache: ${stats.count} entrées, ${stats.sizeFormatted}`)

// Directement
const stats = await audioCacheService.getStats()
```

## Bonnes Pratiques

### 1. Documentation des Changements

Lorsque vous incrémentez `CACHE_VERSION`, documentez :
- **Ce qui a changé** (courte description)
- **Pourquoi** cela invalide le cache
- **Date** du changement

### 2. Tests Après Incrémentation

Après avoir incrémenté la version :

1. ✅ Vider votre cache local manuellement
2. ✅ Recharger l'application
3. ✅ Vérifier que le cache est vide (0 entrées)
4. ✅ Tester la génération de nouveaux audios
5. ✅ Vérifier que les nouveaux audios sont bien mis en cache

### 3. Communication

Si vous travaillez en équipe :
- 📢 **Avertir l'équipe** qu'une nouvelle version invalide le cache
- 📝 **Documenter dans le CHANGELOG**
- 🔍 **Expliquer pourquoi** dans la PR/commit

### 4. Migration Progressive (Pour Grandes Apps)

Si vous avez beaucoup d'utilisateurs, considérez :
- Ajouter un message d'information lors du vidage du cache
- Permettre de continuer à utiliser l'ancien cache temporairement
- Implémenter une migration graduelle avec double écriture

## Implémentation Technique

### Clé de Version dans localStorage

```typescript
private static readonly CACHE_VERSION_KEY = 'repet-audio-cache-version'
```

Stocke un simple nombre entier représentant la version.

### Structure de CachedAudio

Chaque élément en cache contient :

```typescript
interface CachedAudio {
  key: string                // Clé de hash unique
  blob: Blob                 // Données audio
  text: string               // Texte synthétisé
  voiceId: string            // ID de la voix
  settings: {...}            // Paramètres (rate, pitch, volume)
  createdAt: number          // Timestamp de création
  lastAccess: number         // Dernier accès
  accessCount: number        // Nombre d'accès
  cacheVersion?: number      // Version du cache (v2+)
}
```

Le champ `cacheVersion` est ajouté lors de la création mais **non utilisé** actuellement pour le filtrage (on vide tout le cache en cas de changement de version).

### Alternative Future : Filtrage par Version

Au lieu de vider tout le cache, on pourrait filtrer :

```typescript
// Pseudo-code - non implémenté
async getAudio(...): Promise<Blob | null> {
  const cached = await this.getCachedItem(...)
  
  if (cached.cacheVersion !== CACHE_VERSION) {
    // Supprimer uniquement cet élément obsolète
    await this.deleteItem(...)
    return null
  }
  
  return cached.blob
}
```

Avantages :
- ✅ Conserve les audios compatibles
- ✅ Migration transparente

Inconvénients :
- ❌ Plus complexe
- ❌ Peut laisser des audios obsolètes non utilisés

Pour l'instant, le vidage complet est préféré pour sa **simplicité et sa fiabilité**.

## Dépannage

### Le cache ne se vide pas

**Symptômes :** La version est incrémentée mais les anciens audios persistent

**Solutions :**
1. Vérifier que `localStorage` n'est pas désactivé/bloqué
2. Ouvrir DevTools → Application → Local Storage → Vérifier `repet-audio-cache-version`
3. Supprimer manuellement la clé et recharger
4. Utiliser `?clearCache` dans l'URL

### "Version obsolète" à chaque démarrage

**Symptômes :** Le message de vidage apparaît à chaque rechargement

**Causes possibles :**
1. `localStorage.setItem()` échoue silencieusement
2. Navigateur en mode privé (localStorage non persistant)
3. Extensions bloquant localStorage

**Solution :**
Vérifier dans la console :
```javascript
localStorage.setItem('test', '123')
console.log(localStorage.getItem('test')) // Doit afficher '123'
```

### Performances dégradées au démarrage

**Symptômes :** Le démarrage est lent après incrémentation

**Explication :** Le vidage de milliers d'entrées peut prendre du temps

**Solutions :**
1. ✅ Normal - le vidage est une opération ponctuelle
2. ✅ Les démarrages suivants seront rapides
3. Si problème persiste, vérifier qu'il n'y a pas une boucle de vidage

## Voir Aussi

- [PIPER_SESSION_CACHE.md](./PIPER_SESSION_CACHE.md) - Gestion des sessions Piper
- [VOICE_PRELOADING.md](./VOICE_PRELOADING.md) - Préchargement des voix
- [AudioCacheService.ts](../src/core/tts/services/AudioCacheService.ts) - Code source