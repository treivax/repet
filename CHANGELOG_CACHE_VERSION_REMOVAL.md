# Changelog - Retrait du Système de Versioning du Cache Audio

**Date :** 2025-01-XX  
**Version :** 0.1.0  
**Auteur :** Répét Contributors

## 🐛 Problème Identifié

L'application se bloquait au démarrage sur le message "Initialisation de l'application" et ne progressait jamais vers le chargement des voix/modèles.

### Cause Racine : Deadlock d'Initialisation

Le système de versioning automatique du cache audio introduisait un **deadlock** (interblocage) pendant l'initialisation :

```
initialize() 
  ↓
  await checkAndInvalidateCache()
    ↓
    await clearCache()
      ↓
      await initialize()  ← Re-entrée !
        ↓
        return this.initPromise  ← Retourne la même Promise
```

**Explication du deadlock :**

1. `initialize()` crée `this.initPromise` et l'exécute
2. Dans cette Promise, on appelle `await checkAndInvalidateCache()`
3. Si la version du cache est obsolète, `checkAndInvalidateCache()` appelle `await clearCache()`
4. `clearCache()` commence par appeler `await this.initialize()`
5. Comme `this.initPromise` existe déjà, `initialize()` retourne cette même Promise
6. **Résultat :** `clearCache()` attend une Promise qui elle-même attend `checkAndInvalidateCache()`, qui attend `clearCache()`
7. **Deadlock :** Les deux fonctions s'attendent mutuellement, la Promise ne se résout jamais
8. **Symptôme visible :** L'UI reste bloquée sur le splash screen "Initialisation de l'application"

## ✅ Solutions Appliquées

### 1. Retrait du système de versioning automatique

**Retrait complet du système de versioning automatique du cache** (cause du deadlock).

### Modifications dans `src/core/tts/services/AudioCacheService.ts`

#### Éléments Supprimés

1. **Constantes de version :**
   ```typescript
   // SUPPRIMÉ
   private static readonly CACHE_VERSION = 2
   private static readonly CACHE_VERSION_KEY = 'repet-audio-cache-version'
   ```

2. **Champ de version dans l'interface :**
   ```typescript
   interface CachedAudio {
     // ...
     cacheVersion?: number  // ← SUPPRIMÉ
   }
   ```

3. **Méthode de vérification :**
   ```typescript
   // SUPPRIMÉE
   private async checkAndInvalidateCache(): Promise<void> { ... }
   ```

4. **Appel dans initialize() :**
   ```typescript
   async initialize(): Promise<void> {
     // ...
     // SUPPRIMÉ : await this.checkAndInvalidateCache()
   }
   ```

5. **Assignation de version lors du cache :**
   ```typescript
   // Dans cacheAudio(), SUPPRIMÉ :
   cacheVersion: AudioCacheService.CACHE_VERSION
   ```

#### Code Final (simplifié)

```typescript
async initialize(): Promise<void> {
  if (this.initPromise) {
    return this.initPromise
  }

  this.initPromise = (async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)
      // ... setup IndexedDB ...
    })
    // Plus d'appel à checkAndInvalidateCache() !
    
    // Vidage systématique au démarrage (voir section 2)
    await this.clearCacheDirectly()
  })()

  return this.initPromise
}
```

### 2. Vidage systématique du cache au démarrage

**Problème identifié lors des tests :** Après le retrait du versioning, le cache persistait entre les sessions. Comme les modèles de voix sont rechargés à chaque démarrage de l'application, les audios en cache (générés avec d'anciennes instances de modèles) causaient des incohérences - les "mauvaises voix" étaient utilisées.

**Solution :** Vider systématiquement le cache audio à chaque démarrage de l'application.

### 3. Vidage du cache lors du changement d'affectation de voix

**Problème identifié :** Lorsqu'un utilisateur change manuellement la voix affectée à un personnage (par exemple, passer de "Siwis" à "Tom" pour Hamlet), les anciens audios en cache restent et occupent de l'espace inutilement.

**Solution :** Vider automatiquement le cache de l'ancienne voix lorsqu'on change l'affectation d'une voix à un personnage.

**Implémentation :**

```typescript
async initialize(): Promise<void> {
  if (this.initPromise) {
    return this.initPromise
  }

  this.initPromise = (async () => {
    // Ouvrir la base de données IndexedDB
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)
      // ... setup ...
    })

    // Vider le cache directement (sans appeler clearCache() pour éviter le deadlock)
    if (this.db) {
      await new Promise<void>((resolve, reject) => {
        console.warn('[AudioCache] 🗑️ Vidage du cache au démarrage (modèles rechargés)')
        const transaction = this.db!.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const request = store.clear()

        request.onsuccess = () => {
          console.warn('[AudioCache] ✅ Cache vidé avec succès')
          resolve()
        }

        request.onerror = () => {
          console.error('[AudioCache] ❌ Erreur lors du vidage du cache:', request.error)
          resolve() // On ne rejette pas pour ne pas bloquer l'initialisation
        }
      })
    }
  })()

  return this.initPromise
}
```

**Pourquoi directement dans `initialize()` et pas via `clearCache()` ?**

Pour éviter de recréer le deadlock ! `clearCache()` appelle `initialize()`, donc si `initialize()` appelait `clearCache()`, on recréerait le même problème de ré-entrance.

**Bénéfices :**

- ✅ Cache toujours cohérent avec les modèles chargés
- ✅ Pas de "mauvaises voix" dues à des audios obsolètes
- ✅ Pas de deadlock (le clear est fait directement dans le flux d'initialisation)
- ✅ Comportement prévisible : l'application redémarre avec un cache vide

**Implémentation du vidage lors du changement de voix :**

```typescript
// Dans AudioCacheService.ts
async deleteByVoiceId(voiceId: string): Promise<number> {
  await this.initialize()
  if (!this.db) return 0

  return new Promise((resolve, reject) => {
    const transaction = this.db!.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    const request = store.getAll()

    request.onsuccess = () => {
      const items = request.result as CachedAudio[]
      const toDelete = items.filter((item) => item.voiceId === voiceId)
      
      // Supprimer toutes les entrées correspondantes
      // ...
    }
  })
}

// Dans playSettingsStore.ts
setCharacterVoiceAssignment: (playId, provider, characterId, voiceId) => {
  const settings = get().getPlaySettings(playId)
  
  // Récupérer l'ancienne voix
  const oldVoiceId = provider === 'piper-wasm' 
    ? settings.characterVoicesPiper[characterId]
    : settings.characterVoicesGoogle[characterId]
  
  // Vider le cache de l'ancienne voix si elle est différente
  if (oldVoiceId && oldVoiceId !== voiceId && provider === 'piper-wasm') {
    piperWASMProvider.clearCacheForVoice(oldVoiceId)
  }
  
  // Mettre à jour l'affectation
  // ...
}
```

**Bénéfices :**

- ✅ Cache nettoyé automatiquement lors du changement de voix
- ✅ Pas d'accumulation d'audios obsolètes
- ✅ Espace disque optimisé
- ✅ Transparent pour l'utilisateur

### Fonctionnalités Conservées

✅ **Mise en cache audio pendant la session** (store, get)  
✅ **Nettoyage automatique** quand la limite de taille est dépassée  
✅ **Statistiques de cache** (count, size)  
✅ **Vidage manuel du cache** via `clearCache()` (UI et API)  
✅ **Suppression d'éléments spécifiques** via `deleteItem()`  
✅ **Vidage automatique au démarrage** pour cohérence avec les modèles rechargés  
✅ **Vidage automatique lors du changement de voix** pour un cache optimisé

### Fonctionnalités Retirées

❌ **Versioning automatique** du cache  
❌ **Invalidation conditionnelle** (basée sur numéro de version)  
❌ **Support du paramètre URL** `?clearCache` (était géré par `checkAndInvalidateCache()`)  
❌ **Persistance du cache entre sessions** (maintenant vidé à chaque démarrage)  
❌ **Persistance du cache des anciennes voix** (vidé lors du changement d'affectation)

## 📊 Impact

### Positif

- ✅ **Application démarre normalement** - Plus de blocage à l'initialisation
- ✅ **Code plus simple** - Moins de complexité, moins de risques de bugs
- ✅ **Pas de re-entrée** - Plus de risque de deadlock dans `initialize()`
- ✅ **Cache toujours cohérent** - Vidé à chaque démarrage, pas de "mauvaises voix"
- ✅ **Comportement prévisible** - Chaque session démarre avec un cache vide

### Performance

- ℹ️ **Cache fonctionnel pendant la session** - Les répliques répétées dans une même session sont bien mises en cache
- ℹ️ **Pas de cache persistant** - Entre deux sessions, le cache est vidé (cohérence > performance)
- ℹ️ **Impact mineur** - Les modèles sont déjà rechargés à chaque démarrage, le coût de re-synthèse est négligeable comparé au chargement des modèles

### Pour les Utilisateurs

Le cache audio est maintenant **automatiquement vidé à chaque démarrage** de l'application. Aucune action n'est requise.

Si besoin de vider le cache manuellement pendant une session :

1. **Via l'interface :**
   - Aller dans "Piper Model Manager"
   - Cliquer sur "Vider le cache"

2. **Via la console développeur :**
   ```javascript
   // Vider le cache audio
   await window.clearAudioCache()
   
   // Vider tous les caches (OPFS + IndexedDB)
   await window.clearAllCaches()
   ```

## 🔧 Alternatives Envisagées (Non Implémentées)

### Option 1 : Rendre clearCache() non-réentrante

```typescript
async clearCache(): Promise<void> {
  // Ne pas appeler initialize() si déjà initialisé
  if (!this.db) {
    // Ouvrir une connexion temporaire sans passer par initialize()
    const db = await indexedDB.open(this.dbName, 1)
    // ... clear ...
    db.close()
    return
  }
  
  // Utiliser this.db directement
  // ...
}
```

**Raison du non-choix :** Complexité accrue pour un bénéfice limité.

### Option 2 : Guard de ré-entrance

```typescript
private isClearing = false

private async checkAndInvalidateCache(): Promise<void> {
  if (this.isClearing) return
  
  if (versionObsolete) {
    this.isClearing = true
    await this.clearCache()
    this.isClearing = false
  }
}
```

**Raison du non-choix :** Risque de laisser `isClearing = true` en cas d'erreur.

### Option 3 : Versioning simple sans clearCache automatique

Garder la version mais juste **logger un avertissement** au lieu de vider automatiquement.

**Raison du non-choix :** Si on ne vide pas automatiquement, le versioning n'apporte rien.

## 📝 Documentation Affectée

Les fichiers suivants mentionnent le système de versioning et doivent être mis à jour ou archivés :

- ❌ `docs/AUDIO_CACHE_VERSIONING.md` - **Obsolète, à supprimer ou archiver**
- ⚠️ `CHANGELOG_AUDIO_CACHE_FIX.md` - Contient l'historique de l'ajout du versioning
- ⚠️ `FIX_SUMMARY_CACHE_VERSION.md` - Documente le système retiré
- ⚠️ `SOLUTION_COMPLETE.md` - Fait référence au versioning

**Recommandation :** Archiver ces fichiers dans un dossier `docs/archive/` avec une note expliquant qu'ils documentent un système qui a été retiré.

## ✅ Tests de Validation

### Test 1 : Démarrage Normal

1. Lancer l'application
2. ✅ Le splash screen "Initialisation de l'application" doit disparaître
3. ✅ L'UI doit progresser vers le chargement des voix/modèles
4. ✅ Vérifier dans la console :
   ```
   [AudioCache] 🗑️ Vidage du cache au démarrage (modèles rechargés)
   [AudioCache] ✅ Cache vidé avec succès
   [PiperWASM] ✅ Cache audio initialisé
   ```

### Test 2 : Cache Fonctionne Pendant la Session

1. Synthétiser du texte
2. Re-synthétiser le même texte **dans la même session**
3. ✅ Vérifier dans la console :
   ```
   [AudioCache] 🔍 Recherche dans le cache avec clé: audio_XXXXX
   [AudioCache] ✅ Clé audio_XXXXX TROUVÉE dans le cache
   ```

### Test 3 : Cache Vidé Entre Sessions

1. Synthétiser du texte (mis en cache)
2. Recharger l'application (F5 ou relancer)
3. Re-synthétiser le même texte
4. ✅ Vérifier dans la console :
   ```
   [AudioCache] 🗑️ Vidage du cache au démarrage
   [AudioCache] 🔍 Recherche dans le cache avec clé: audio_XXXXX
   [AudioCache] ❌ Clé audio_XXXXX NON trouvée dans le cache
   ```
5. ✅ Le texte doit être re-synthétisé (pas d'audio obsolète)

### Test 4 : Vidage Manuel du Cache

1. Aller dans "Piper Model Manager"
2. Cliquer sur "Vider le cache"
3. ✅ Le cache doit être vidé sans erreur
4. ✅ L'application doit rester fonctionnelle

### Test 5 : Pas de "Mauvaises Voix"

1. Synthétiser du texte avec une voix A
2. Recharger l'application
3. Synthétiser le même texte avec une voix B
5. ✅ La voix B doit être utilisée (pas la voix A en cache)

### Test 6 : Vidage Automatique Lors du Changement de Voix

1. Aller dans les paramètres TTS
2. Assigner la voix "Siwis" au personnage "Hamlet"
3. Synthétiser plusieurs répliques d'Hamlet
4. Vérifier les statistiques : `await audioCacheService.getStats()` → plusieurs entrées
5. **Changer la voix d'Hamlet** pour "Tom"
6. Observer les logs
7. Vérifier les statistiques à nouveau

**Résultat attendu :**
- ✅ Lors du changement :
  ```
  [PlaySettings] 🗑️ Cache vidé pour l'ancienne voix siwis-medium (X entrées)
  [AudioCache] 🗑️ Suppression de X entrées pour voiceId: siwis-medium
  [AudioCache] ✅ X entrées supprimées
  ```
  
- ✅ Les statistiques montrent moins d'entrées (anciennes supprimées)
- ✅ Les nouvelles synthèses utilisent Tom (pas de conflit)

## 🎯 Conclusion

Le retrait du système de versioning automatique résout définitivement le problème de blocage au démarrage causé par un deadlock. 

L'ajout du **vidage systématique du cache au démarrage** garantit que :
- ✅ Le cache est toujours cohérent avec les modèles de voix chargés
- ✅ Pas de problème de "mauvaises voix" dues à des audios obsolètes
- ✅ Comportement prévisible et déterministe

Le cache reste **pleinement fonctionnel pendant une session** pour optimiser la synthèse de textes répétés, tout en garantissant la cohérence entre sessions.

## 📅 Historique

- **2025-01-XX** : Ajout du vidage systématique au démarrage (correction des "mauvaises voix")
- **2025-01-XX** : Retrait du système de versioning (résolution du deadlock)
- **2025-01-XX** : Ajout initial du système de versioning (CACHE_VERSION = 2) - introduit le bug

---

**Fichiers modifiés :**
- `src/core/tts/services/AudioCacheService.ts` - Vidage au démarrage + méthode `deleteByVoiceId()`
- `src/core/tts/providers/PiperWASMProvider.ts` - Méthode `clearCacheForVoice()` + export singleton
- `src/state/playSettingsStore.ts` - Vidage du cache lors du changement de voix

**Documentation ajoutée :**
- `CHANGELOG_CACHE_VERSION_REMOVAL.md` (ce fichier)
- `TEST_CACHE_STARTUP_CLEAR.md` - Guide de test
- `FIX_SUMMARY.md` - Résumé exécutif
- `NEXT_STEPS.md` - Guide de démarrage
- `docs/archive/README.md` - Documentation des archives