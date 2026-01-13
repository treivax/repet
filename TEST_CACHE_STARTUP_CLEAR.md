# Guide de Test - Vidage du Cache au Démarrage

## Objectif

Valider que le cache audio est systématiquement vidé à chaque démarrage de l'application pour garantir la cohérence avec les modèles de voix rechargés.

## Contexte

- **Problème résolu :** Deadlock au démarrage causé par le système de versioning du cache
- **Nouveau comportement :** Cache audio vidé automatiquement à chaque initialisation
- **Raison :** Les modèles de voix sont rechargés à chaque session, donc les audios en cache peuvent être obsolètes

## Tests à Effectuer

### Test 1 : Démarrage Sans Blocage ✅

**Objectif :** Vérifier que l'application démarre normalement sans deadlock.

**Étapes :**
1. Lancer l'application : `npm run dev`
2. Ouvrir la console développeur (F12)
3. Observer le splash screen "Initialisation de l'application"

**Résultat attendu :**
- ✅ Le splash screen disparaît rapidement
- ✅ Les voix/modèles se chargent
- ✅ L'application devient utilisable

**Logs attendus dans la console :**
```
[PiperWASM] 🔄 Initialisation du cache audio...
[AudioCache] 🗑️ Vidage du cache au démarrage (modèles rechargés)
[AudioCache] ✅ Cache vidé avec succès
[PiperWASM] ✅ Cache audio initialisé
[PiperWASM] 📊 Statistiques du cache: 0 entrées, 0 Bytes
```

---

### Test 2 : Cache Fonctionne Pendant la Session ✅

**Objectif :** Vérifier que le cache fonctionne correctement pendant une session.

**Étapes :**
1. Aller sur une pièce avec des répliques
2. Lire une réplique avec TTS
3. Observer les logs : `[AudioCache] 💾 Mise en cache avec clé: audio_XXXXX`
4. Relire **la même réplique** dans la même session
5. Observer les logs

**Résultat attendu :**
- ✅ Première lecture : Audio synthétisé + mis en cache
  ```
  [AudioCache] 🔍 Recherche dans le cache avec clé: audio_abc123
  [AudioCache] ❌ Clé audio_abc123 NON trouvée dans le cache
  [PiperWASM] 🎤 Synthèse vocale...
  [AudioCache] 💾 Mise en cache avec clé: audio_abc123
  ```
  
- ✅ Deuxième lecture : Audio récupéré depuis le cache
  ```
  [AudioCache] 🔍 Recherche dans le cache avec clé: audio_abc123
  [AudioCache] ✅ Clé audio_abc123 TROUVÉE dans le cache (XXXX bytes)
  ```

---

### Test 3 : Cache Vidé Entre Sessions ✅

**Objectif :** Vérifier que le cache est bien vidé entre deux sessions.

**Étapes :**
1. Synthétiser une réplique (elle sera mise en cache)
2. Vérifier dans les logs : `[AudioCache] 💾 Mise en cache`
3. **Recharger complètement l'application** (F5 ou `Ctrl+R`)
4. Observer les logs au démarrage
5. Re-synthétiser **la même réplique**

**Résultat attendu :**
- ✅ Au démarrage :
  ```
  [AudioCache] 🗑️ Vidage du cache au démarrage (modèles rechargés)
  [AudioCache] ✅ Cache vidé avec succès
  ```
  
- ✅ Lors de la re-synthèse :
  ```
  [AudioCache] 🔍 Recherche dans le cache avec clé: audio_abc123
  [AudioCache] ❌ Clé audio_abc123 NON trouvée dans le cache
  [PiperWASM] 🎤 Synthèse vocale...
  ```
  
- ✅ L'audio est **re-synthétisé** (pas récupéré du cache)

---

### Test 4 : Pas de "Mauvaises Voix" ✅

**Objectif :** Vérifier qu'on n'a plus le problème des voix incorrectes dues au cache.

**Prérequis :** Avoir au moins 2 voix disponibles (ex: Siwis et Tom)

**Étapes :**
1. Aller dans les paramètres et sélectionner la voix **Siwis**
2. Synthétiser une réplique
3. Noter le son de la voix
4. **Recharger l'application** (F5)
5. Aller dans les paramètres et sélectionner la voix **Tom**
6. Synthétiser **la même réplique**

**Résultat attendu :**
- ✅ La voix **Tom** est bien utilisée (pas Siwis en cache)
- ✅ Les deux synthèses ont des voix différentes et correctes
- ✅ Pas de mélange de voix ou d'incohérence

---

### Test 5 : Vidage Manuel du Cache ✅

**Objectif :** Vérifier que le vidage manuel fonctionne toujours.

**Étapes :**
1. Aller dans "Piper Model Manager" (ou composant de gestion des modèles)
2. Cliquer sur le bouton "Vider le cache"
3. Confirmer l'action

**Résultat attendu :**
- ✅ Message de confirmation
- ✅ Logs dans la console : `[AudioCache] ✅ Cache audio vidé avec succès`
- ✅ Pas d'erreur, l'application reste fonctionnelle

---

### Test 6 : Statistiques du Cache ✅

**Objectif :** Vérifier que les statistiques sont correctes.

**Étapes :**
1. Au démarrage, vérifier les stats : `0 entrées, 0 Bytes`
2. Synthétiser 3 répliques différentes
3. Vérifier les stats

**Résultat attendu :**
- ✅ Au démarrage : `0 entrées, 0 Bytes`
- ✅ Après 3 synthèses : `3 entrées, X KB/MB`
- ✅ Après rechargement : retour à `0 entrées, 0 Bytes`

---

## Vérification IndexedDB (Optionnel)

**Pour voir directement le contenu du cache :**

1. Ouvrir DevTools (F12)
2. Aller dans l'onglet **Application** (ou **Stockage**)
3. Dans le menu de gauche : **IndexedDB** → **repet-audio-cache** → **audio-cache**

**Ce qu'on devrait voir :**

- **Au démarrage :** Object store vide (0 entrées)
- **Après synthèses :** Plusieurs entrées avec clés `audio_XXXXX`
- **Après rechargement :** Object store vide à nouveau

---

### Test 6 : Vidage Automatique Lors du Changement de Voix ✅

**Objectif :** Vérifier que le cache de l'ancienne voix est vidé automatiquement quand on change l'affectation d'une voix à un personnage.

**Étapes :**
1. Aller dans les paramètres TTS de la pièce
2. Sélectionner le provider **Piper**
3. Assigner la voix **Siwis** au personnage "Hamlet"
4. Synthétiser 2-3 répliques d'Hamlet
5. Dans la console : `await audioCacheService.getStats()` pour voir le nombre d'entrées
6. **Changer la voix d'Hamlet** pour **Tom** (ou une autre voix)
7. Observer les logs dans la console
8. Re-vérifier les stats : `await audioCacheService.getStats()`

**Résultat attendu :**
- ✅ Lors du changement de voix :
  ```
  [PlaySettings] 🗑️ Cache vidé pour l'ancienne voix siwis-medium (X entrées)
  [AudioCache] 🗑️ Suppression de X entrées pour voiceId: siwis-medium
  [AudioCache] ✅ X entrées supprimées
  ```

- ✅ Les statistiques montrent moins d'entrées (celles de Siwis ont été supprimées)
- ✅ Synthétiser à nouveau les répliques d'Hamlet utilise bien Tom (pas Siwis en cache)
- ✅ Pas d'accumulation d'audios obsolètes

---

## Checklist Finale

- [ ] ✅ Application démarre sans blocage
- [ ] ✅ Cache vidé au démarrage (logs confirmant)
- [ ] ✅ Cache fonctionne pendant la session
- [ ] ✅ Cache vidé entre deux sessions
- [ ] ✅ Pas de "mauvaises voix" dues au cache
- [ ] ✅ Vidage manuel fonctionne
- [ ] ✅ Statistiques correctes
- [ ] ✅ Vidage automatique lors du changement de voix

---

## En Cas de Problème

### Symptôme : Application bloquée au démarrage

**Cause possible :** Deadlock réapparu

**Actions :**
1. Vérifier que `initialize()` n'appelle **pas** `clearCache()`
2. Vérifier que le vidage se fait **directement** dans `initialize()`
3. Vérifier les logs de la console pour identifier où ça bloque

### Symptôme : Cache persiste entre sessions

**Cause possible :** Le vidage au démarrage ne s'exécute pas

**Actions :**
1. Vérifier les logs : doit contenir `[AudioCache] 🗑️ Vidage du cache au démarrage`
2. Vérifier que `this.db` n'est pas `null` au moment du vidage
3. Vérifier IndexedDB manuellement (voir section ci-dessus)

### Symptôme : Erreur lors du vidage

**Cause possible :** Problème avec la transaction IndexedDB

**Actions :**
1. Vérifier les logs : `[AudioCache] ❌ Erreur lors du vidage du cache:`
2. Note : L'erreur ne bloque pas l'initialisation (on `resolve()` même en cas d'erreur)
3. Vérifier que IndexedDB est bien supporté par le navigateur

---

## Commandes Console Utiles

```javascript
// Vérifier les stats du cache
await audioCacheService.getStats()

// Vider manuellement le cache
await audioCacheService.clearCache()

// Vider tous les caches (OPFS + IndexedDB)
await window.clearAllCaches()

// Voir les statistiques de stockage
await window.logStorageStats()
```

---

**Dernière mise à jour :** Janvier 2025  
**Version testée :** 0.1.0  
**Changement :** Vidage systématique du cache au démarrage