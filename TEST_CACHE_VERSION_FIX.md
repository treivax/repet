# Guide de Test - Fix Cache Audio et Sessions TtsSession

**Objectif :** Vérifier que le fix du singleton `TtsSession._instance` et le versionnage automatique du cache fonctionnent correctement.

**Durée estimée :** 10-15 minutes

---

## Préparation

### 1. Vérifier la Version du Code

Dans `src/core/tts/services/AudioCacheService.ts` :

```typescript
private static readonly CACHE_VERSION = 2
```

✅ La version doit être **2** (ou supérieure).

### 2. Outils de Diagnostic

Ouvrez la console du navigateur (F12) pour surveiller les logs.

---

## Test 1 : Vidage Automatique du Cache (Migration)

**Objectif :** Vérifier que l'ancien cache est automatiquement vidé.

### Étapes

1. **Simuler un ancien cache :**
   ```javascript
   // Dans la console
   localStorage.setItem('repet-audio-cache-version', '1')
   ```

2. **Recharger la page :**
   ```
   F5 ou Ctrl+R
   ```

3. **Vérifier les logs :**
   Vous devriez voir :
   ```
   [AudioCache] 🔄 Version du cache obsolète (stockée: 1, actuelle: 2)
   [AudioCache] 🧹 Vidage automatique du cache audio pour garantir la cohérence
   [AudioCache] ✅ Cache vidé et version mise à jour
   ```

4. **Vérifier la version stockée :**
   ```javascript
   localStorage.getItem('repet-audio-cache-version')
   // Doit retourner "2"
   ```

5. **Vérifier que le cache est vide :**
   ```javascript
   await window.piperDebug.getCacheStats()
   // Doit retourner { count: 0, size: 0, ... }
   ```

✅ **Succès si :** Le cache est vidé automatiquement et la version est mise à jour.

---

## Test 2 : Cohérence des Voix (Fix Principal)

**Objectif :** Vérifier que chaque personnage garde la même voix sur toutes ses lignes.

### Étapes

1. **Vider tous les caches (départ propre) :**
   ```javascript
   await window.clearAllCaches()
   location.reload()
   ```

2. **Attendre le préchargement complet des voix**
   - Observer la barre de progression
   - Attendre que toutes les voix soient chargées (100%)

3. **Charger une pièce avec plusieurs personnages**
   - Exemple : *Le Bourgeois Gentilhomme* ou *Les Précieuses Ridicules*
   - Personnages avec plusieurs répliques (ex: Chantal, Isabelle)

4. **Lancer la lecture audio**
   - Appuyer sur "Lire avec audio"

5. **Observer attentivement les voix**
   - Chaque personnage doit avoir **une seule et même voix** pour toutes ses lignes
   - Pas de variation entre les répliques d'un même personnage

6. **Vérifier dans les logs (optionnel) :**
   Chercher les lignes :
   ```
   [PiperWASM] 🔧 Réinitialisation de TtsSession._instance avant synthèse avec fr_FR-siwis-medium
   ```
   - Cette ligne doit apparaître **avant chaque synthèse**
   - Le voiceId doit être constant pour un même personnage

7. **Vérifier l'assignation dans les logs :**
   ```
   [PiperWASM] synthesize() appelé avec voiceId: fr_FR-siwis-medium
   [PiperWASM] 🎤 Synthèse avec fr_FR-siwis-medium (piperVoiceId: fr_FR-siwis-medium)
   ```
   - Même voiceId pour toutes les lignes d'un personnage

✅ **Succès si :** Chaque personnage a une voix cohérente sur toutes ses lignes.

---

## Test 3 : Utilisation du Cache de Sessions

**Objectif :** Vérifier que les sessions préchargées sont réutilisées (pas de rechargement).

### Étapes

1. **Après le test 2, lire à nouveau la même pièce**
   - Les voix sont déjà préchargées

2. **Observer les logs pendant la synthèse :**
   - Vous devriez voir :
     ```
     [PiperWASM] ♻️ Utilisation de la session en cache pour fr_FR-siwis-medium
     ```
   - Vous NE devriez PAS voir :
     ```
     [PiperWASM] 🔄 Création d'une nouvelle session pour...
     ```

3. **Vérifier les performances :**
   - La synthèse de chaque ligne doit être **rapide** (<1s après la première fois)
   - Pas de nouveau téléchargement de modèles

4. **Vérifier le cache de sessions :**
   ```javascript
   window.piperDebug.getSessionCacheStats()
   ```
   - Doit montrer plusieurs voix en cache
   - Exemple : `{ voiceCount: 4, voices: [...] }`

✅ **Succès si :** Les sessions sont réutilisées sans rechargement.

---

## Test 4 : Vidage Manuel via URL

**Objectif :** Vérifier que `?clearCache` fonctionne.

### Étapes

1. **Accumuler du cache audio :**
   - Lire quelques lignes pour générer du cache
   - Vérifier :
     ```javascript
     await window.piperDebug.getCacheStats()
     // count devrait être > 0
     ```

2. **Ajouter `?clearCache` à l'URL :**
   ```
   http://localhost:5173/?clearCache
   ```
   Ou simplement :
   ```javascript
   window.location.href = window.location.href + '?clearCache'
   ```

3. **Vérifier les logs :**
   ```
   [AudioCache] 🧹 Paramètre clearCache détecté - vidage forcé du cache
   ```

4. **Vérifier que le cache est vide :**
   ```javascript
   await window.piperDebug.getCacheStats()
   // { count: 0, size: 0, ... }
   ```

✅ **Succès si :** Le cache est vidé et la version est mise à jour.

---

## Test 5 : Persistance de la Version

**Objectif :** Vérifier que la version persiste entre les rechargements.

### Étapes

1. **Vérifier la version actuelle :**
   ```javascript
   localStorage.getItem('repet-audio-cache-version')
   // Doit retourner "2"
   ```

2. **Recharger la page plusieurs fois :**
   ```
   F5, F5, F5...
   ```

3. **Vérifier les logs :**
   - Vous devriez voir :
     ```
     [AudioCache] ✅ Version du cache à jour (v2)
     ```
   - Vous NE devriez PAS voir :
     ```
     [AudioCache] 🔄 Version du cache obsolète...
     ```

4. **Vérifier que le cache n'est PAS vidé :**
   - Le cache audio devrait persister entre les rechargements
   - `getCacheStats()` devrait montrer le même nombre d'entrées

✅ **Succès si :** La version persiste et le cache n'est pas re-vidé.

---

## Test 6 : Statistiques du Cache au Démarrage

**Objectif :** Vérifier que les statistiques sont affichées.

### Étapes

1. **Recharger l'application**

2. **Chercher dans les logs :**
   ```
   [PiperWASM] 🔄 Initialisation du cache audio...
   [PiperWASM] ✅ Cache audio initialisé
   [PiperWASM] 📊 Statistiques du cache: X entrées, Y MB
   ```

3. **Vérifier la cohérence :**
   - Le nombre d'entrées et la taille doivent correspondre à la réalité
   - Comparer avec :
     ```javascript
     await window.piperDebug.getCacheStats()
     ```

✅ **Succès si :** Les statistiques sont affichées et cohérentes.

---

## Vérifications Finales

### Checklist Complète

- [ ] Le cache est automatiquement vidé quand on change la version
- [ ] Chaque personnage garde la même voix sur toutes ses lignes
- [ ] Les sessions préchargées sont réutilisées (pas de rechargement)
- [ ] `?clearCache` vide le cache manuellement
- [ ] La version persiste entre les rechargements
- [ ] Les statistiques du cache sont affichées au démarrage
- [ ] Aucune erreur dans la console (sauf warnings attendus)

### Commandes de Diagnostic

```javascript
// Afficher tout l'état du système
await window.piperDebug.logAllStats()

// Vérifier la version
localStorage.getItem('repet-audio-cache-version')

// Nettoyer complètement
await window.clearAllCaches()
```

---

## Résultats Attendus

### Avant le Fix
❌ Chantal entendait différentes voix (siwis, upmc, mls) sur différentes lignes  
❌ Le problème persistait même avec cache vide  
❌ Les logs montraient la bonne voix mais l'audio était incorrect

### Après le Fix
✅ Chantal (et tous les personnages) ont une voix constante  
✅ La réinitialisation de `_instance` garantit l'utilisation de la bonne session  
✅ Le cache obsolète est automatiquement invalidé  
✅ Les performances restent excellentes (sessions en cache)

---

## En Cas de Problème

### Problème : Le cache ne se vide pas automatiquement

**Solution :**
```javascript
// Forcer le vidage
await window.clearAudioCache()

// Réinitialiser la version
localStorage.removeItem('repet-audio-cache-version')

// Recharger
location.reload()
```

### Problème : Les voix sont toujours incohérentes

**Diagnostic :**
1. Vérifier que le code est à jour :
   ```javascript
   // Dans PiperWASMProvider.ts, avant session.predict()
   // Doit contenir :
   (TtsSession as any)._instance = session
   ```

2. Vérifier les logs :
   ```
   [PiperWASM] 🔧 Réinitialisation de TtsSession._instance...
   ```
   Cette ligne DOIT apparaître avant chaque synthèse.

3. Vider complètement tout :
   ```javascript
   await window.clearAllCaches()
   indexedDB.deleteDatabase('repet-audio-cache')
   localStorage.clear()
   location.reload()
   ```

### Problème : "Version obsolète" à chaque démarrage

**Cause :** localStorage n'est pas persistant (mode privé, extension, etc.)

**Solution :**
- Désactiver le mode navigation privée
- Vérifier les permissions du site
- Tester dans un autre navigateur

---

## Rapport de Test

Après avoir complété tous les tests, remplir ce rapport :

```
✅ PASS / ❌ FAIL

Test 1 (Vidage auto) : ___
Test 2 (Cohérence voix) : ___
Test 3 (Cache sessions) : ___
Test 4 (Vidage URL) : ___
Test 5 (Persistance) : ___
Test 6 (Statistiques) : ___

Navigateur : _____________
Version : _____________
Cache version : _____________

Notes :
_________________________
_________________________
```

---

**Date de création :** 2025-01  
**Version du cache testée :** 2  
**Statut :** Prêt pour test