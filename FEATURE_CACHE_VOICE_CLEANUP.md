# Amélioration - Vidage Automatique du Cache Lors du Changement de Voix

**Date :** Janvier 2025  
**Version :** 0.1.0  
**Type :** Amélioration  
**Statut :** ✅ Implémenté

---

## 🎯 Objectif

Nettoyer automatiquement le cache audio des anciennes voix lorsqu'un utilisateur change manuellement l'affectation d'une voix à un personnage.

---

## 🔍 Problème Identifié

### Scénario Utilisateur

1. L'utilisateur assigne la voix **"Siwis"** au personnage **"Hamlet"**
2. Il synthétise plusieurs répliques d'Hamlet (mises en cache avec `voiceId: siwis-medium`)
3. L'utilisateur change d'avis et assigne la voix **"Tom"** à Hamlet
4. Les nouvelles synthèses utilisent bien Tom (nouvelles clés de cache)
5. **MAIS** : Les anciens audios de Siwis restent dans IndexedDB

### Conséquences

- ❌ **Gaspillage d'espace disque** : Les audios de Siwis ne seront plus jamais utilisés
- ❌ **Accumulation progressive** : Chaque changement de voix laisse des traces
- ❌ **Cache gonflé** : Peut atteindre la limite de 100 MB plus rapidement
- ❌ **Performances IndexedDB** : Plus d'entrées = requêtes potentiellement plus lentes

### Pourquoi les Anciennes Voix ne Sont Pas Réutilisées ?

Le cache utilise une clé composite :
```
clé = hash(text + voiceId + rate + pitch + volume)
```

Donc :
- `hash("To be or not to be" + "siwis-medium" + "1" + "1" + "1")` = `audio_abc123`
- `hash("To be or not to be" + "tom-medium" + "1" + "1" + "1")` = `audio_def456`

**Les clés sont différentes**, donc les anciens audios (Siwis) ne seront jamais trouvés après le changement.

---

## ✅ Solution Implémentée

### 1. Nouvelle Méthode dans `AudioCacheService`

**Fichier :** `src/core/tts/services/AudioCacheService.ts`

```typescript
/**
 * Delete all cached items for a specific voice
 * Useful when changing voice assignment for a character
 */
async deleteByVoiceId(voiceId: string): Promise<number> {
  await this.initialize()

  if (!this.db) {
    return 0
  }

  return new Promise((resolve, reject) => {
    const transaction = this.db!.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    const request = store.getAll()

    request.onsuccess = () => {
      const items = request.result as CachedAudio[]
      const toDelete = items.filter((item) => item.voiceId === voiceId)

      if (toDelete.length === 0) {
        console.warn(`[AudioCache] 🔍 Aucune entrée trouvée pour voiceId: ${voiceId}`)
        resolve(0)
        return
      }

      console.warn(
        `[AudioCache] 🗑️ Suppression de ${toDelete.length} entrées pour voiceId: ${voiceId}`
      )

      let deletedCount = 0
      let processedCount = 0

      for (const item of toDelete) {
        const deleteRequest = store.delete(item.key)

        deleteRequest.onsuccess = () => {
          deletedCount++
          processedCount++

          if (processedCount === toDelete.length) {
            console.warn(`[AudioCache] ✅ ${deletedCount} entrées supprimées`)
            resolve(deletedCount)
          }
        }

        deleteRequest.onerror = () => {
          console.error(`[AudioCache] ❌ Erreur lors de la suppression de ${item.key}`)
          processedCount++

          if (processedCount === toDelete.length) {
            resolve(deletedCount)
          }
        }
      }
    }

    request.onerror = () => {
      console.error('Failed to get items for deletion:', request.error)
      reject(request.error)
    }
  })
}
```

**Fonctionnement :**
1. Récupère toutes les entrées du cache
2. Filtre celles qui ont le `voiceId` spécifié
3. Supprime toutes les entrées trouvées
4. Retourne le nombre d'entrées supprimées

---

### 2. Exposition dans le Provider Piper

**Fichier :** `src/core/tts/providers/PiperWASMProvider.ts`

```typescript
/**
 * Vider le cache audio pour une voix spécifique
 * Utile lors du changement d'affectation de voix à un personnage
 */
async clearCacheForVoice(voiceId: string): Promise<number> {
  return audioCacheService.deleteByVoiceId(voiceId)
}
```

**Export du singleton :**
```typescript
// À la fin du fichier
export const piperWASMProvider = new PiperWASMProvider()
```

---

### 3. Intégration dans le Store

**Fichier :** `src/state/playSettingsStore.ts`

```typescript
setCharacterVoiceAssignment: (
  playId: string,
  provider: TTSProviderType,
  characterId: string,
  voiceId: string
) => {
  const settings = get().getPlaySettings(playId)

  // Récupérer l'ancienne voix assignée pour la supprimer du cache
  let oldVoiceId: string | undefined
  if (provider === 'piper-wasm') {
    oldVoiceId = settings.characterVoicesPiper[characterId]
  } else {
    oldVoiceId = settings.characterVoicesGoogle[characterId]
  }

  // Vider le cache de l'ancienne voix si elle existe et est différente
  if (oldVoiceId && oldVoiceId !== voiceId && provider === 'piper-wasm') {
    // Import dynamique pour éviter les dépendances circulaires
    import('../core/tts/providers/PiperWASMProvider')
      .then(({ piperWASMProvider }) => {
        piperWASMProvider.clearCacheForVoice(oldVoiceId).then((deletedCount) => {
          if (deletedCount > 0) {
            console.warn(
              `[PlaySettings] 🗑️ Cache vidé pour l'ancienne voix ${oldVoiceId} (${deletedCount} entrées)`
            )
          }
        })
      })
      .catch((err) => {
        console.error('[PlaySettings] Erreur lors du vidage du cache:', err)
      })
  }

  // Mettre à jour l'affectation
  if (provider === 'piper-wasm') {
    const updatedAssignments = {
      ...settings.characterVoicesPiper,
      [characterId]: voiceId,
    }
    get().updatePlaySettings(playId, { characterVoicesPiper: updatedAssignments })
  } else {
    const updatedAssignments = {
      ...settings.characterVoicesGoogle,
      [characterId]: voiceId,
    }
    get().updatePlaySettings(playId, { characterVoicesGoogle: updatedAssignments })
  }
}
```

**Logique :**
1. Récupérer l'ancienne voix assignée au personnage
2. Si elle existe et est différente de la nouvelle
3. Vider le cache de l'ancienne voix (async, non-bloquant)
4. Mettre à jour l'affectation

**Pourquoi import dynamique ?**
- Éviter les dépendances circulaires
- Le store ne doit pas importer directement le provider
- L'import dynamique est résolu à l'exécution

**Pourquoi uniquement pour `piper-wasm` ?**
- Le provider `web-speech` (Google) n'utilise pas le cache audio (synthèse en temps réel)
- Seul Piper génère des blobs audio mis en cache

---

## 📊 Comportement

### Avant l'Amélioration

```
1. Hamlet → Siwis
2. Synthétiser "To be or not to be" (3 fois)
   → 3 entrées en cache : audio_abc1, audio_abc2, audio_abc3 (voiceId: siwis-medium)

3. Hamlet → Tom
   → Affectation mise à jour
   → Cache inchangé (3 entrées Siwis toujours présentes)

4. Synthétiser "To be or not to be" avec Tom
   → +3 nouvelles entrées : audio_def1, audio_def2, audio_def3 (voiceId: tom-medium)
   → Total : 6 entrées (dont 3 inutiles)
```

### Après l'Amélioration

```
1. Hamlet → Siwis
2. Synthétiser "To be or not to be" (3 fois)
   → 3 entrées en cache : audio_abc1, audio_abc2, audio_abc3 (voiceId: siwis-medium)

3. Hamlet → Tom
   → Affectation mise à jour
   → [AudioCache] 🗑️ Suppression de 3 entrées pour voiceId: siwis-medium
   → [AudioCache] ✅ 3 entrées supprimées
   → Cache vidé des anciennes entrées

4. Synthétiser "To be or not to be" avec Tom
   → +3 nouvelles entrées : audio_def1, audio_def2, audio_def3 (voiceId: tom-medium)
   → Total : 3 entrées (optimisé)
```

---

## 🎯 Bénéfices

### Pour l'Utilisateur

- ✅ **Transparent** - Aucune action requise, nettoyage automatique
- ✅ **Espace optimisé** - Pas d'accumulation d'audios obsolètes
- ✅ **Cohérence** - Le cache contient uniquement les voix actuellement utilisées
- ✅ **Performance** - Cache plus léger = requêtes IndexedDB plus rapides

### Pour le Système

- ✅ **Moins d'entrées** - Cache maintenu à une taille raisonnable
- ✅ **Nettoyage ciblé** - Seulement l'ancienne voix est supprimée (pas tout le cache)
- ✅ **Asynchrone** - Ne bloque pas l'UI pendant le nettoyage
- ✅ **Résilient** - En cas d'erreur, l'affectation de voix fonctionne quand même

---

## 📝 Logs Attendus

### Changement de Voix avec Cache à Nettoyer

```
[PlaySettings] 🗑️ Cache vidé pour l'ancienne voix siwis-medium (5 entrées)
[AudioCache] 🗑️ Suppression de 5 entrées pour voiceId: siwis-medium
[AudioCache] ✅ 5 entrées supprimées
```

### Changement de Voix sans Cache

```
[AudioCache] 🔍 Aucune entrée trouvée pour voiceId: siwis-medium
```

### Première Assignation (pas d'ancienne voix)

Aucun log de nettoyage (normal, pas d'ancienne voix à vider).

---

## ✅ Tests de Validation

### Test 1 : Changement de Voix avec Cache

**Étapes :**
1. Assigner Siwis à Hamlet
2. Synthétiser 3 répliques d'Hamlet
3. Vérifier stats : `await audioCacheService.getStats()` → 3 entrées
4. Changer Hamlet pour Tom
5. Vérifier logs : suppression de 3 entrées
6. Vérifier stats : `await audioCacheService.getStats()` → 0 entrées

**Résultat attendu :** ✅ Cache vidé, logs confirmant la suppression.

### Test 2 : Changement de Voix sans Cache

**Étapes :**
1. Assigner Siwis à Hamlet (sans synthétiser)
2. Changer Hamlet pour Tom
3. Vérifier logs

**Résultat attendu :** ✅ Log "Aucune entrée trouvée".

### Test 3 : Première Assignation

**Étapes :**
1. Nouveau personnage "Ophélie"
2. Assigner Jessica à Ophélie

**Résultat attendu :** ✅ Pas de logs de nettoyage (normal).

### Test 4 : Changement Multiples

**Étapes :**
1. Hamlet → Siwis, synthétiser 2 répliques
2. Hamlet → Tom, synthétiser 2 répliques
3. Hamlet → Pierre, synthétiser 2 répliques
4. Vérifier stats après chaque changement

**Résultat attendu :** 
- ✅ Après Siwis→Tom : cache de Siwis vidé
- ✅ Après Tom→Pierre : cache de Tom vidé
- ✅ Cache final : seulement 2 entrées (Pierre)

---

## 🔧 API Ajoutée

### AudioCacheService

```typescript
/**
 * Supprime toutes les entrées du cache pour une voix spécifique
 * @param voiceId - L'ID de la voix à supprimer du cache
 * @returns Le nombre d'entrées supprimées
 */
async deleteByVoiceId(voiceId: string): Promise<number>
```

### PiperWASMProvider

```typescript
/**
 * Vide le cache audio pour une voix spécifique
 * @param voiceId - L'ID de la voix à vider
 * @returns Le nombre d'entrées supprimées
 */
async clearCacheForVoice(voiceId: string): Promise<number>
```

---

## 📚 Utilisation Console Développeur

```javascript
// Vider le cache d'une voix spécifique
await audioCacheService.deleteByVoiceId('siwis-medium')
// → Retourne le nombre d'entrées supprimées

// Via le provider
await piperWASMProvider.clearCacheForVoice('tom-medium')

// Voir les entrées en cache
const stats = await audioCacheService.getStats()
console.log(stats) // { count: X, size: Y, sizeFormatted: "Z KB" }
```

---

## 🎉 Conclusion

Cette amélioration garantit que le cache audio reste **optimisé et cohérent** avec les choix de l'utilisateur. Le nettoyage automatique lors du changement de voix évite l'accumulation d'audios obsolètes tout en restant totalement transparent pour l'utilisateur.

**Impact :**
- ✅ Meilleure gestion de l'espace disque
- ✅ Cache plus performant (moins d'entrées)
- ✅ Expérience utilisateur améliorée
- ✅ Code maintenable et testable

---

**Fichiers modifiés :**
- `src/core/tts/services/AudioCacheService.ts` - Ajout de `deleteByVoiceId()`
- `src/core/tts/providers/PiperWASMProvider.ts` - Ajout de `clearCacheForVoice()` + singleton
- `src/state/playSettingsStore.ts` - Intégration du nettoyage automatique

**Documentation :**
- `FEATURE_CACHE_VOICE_CLEANUP.md` (ce fichier)
- `CHANGELOG_CACHE_VERSION_REMOVAL.md` - Section 3 ajoutée
- `TEST_CACHE_STARTUP_CLEAR.md` - Test 6 ajouté
- `FIX_SUMMARY.md` - Solution #3 ajoutée