# Tests de Vérification des Corrections Audio

Ce document décrit les tests à effectuer pour vérifier que les deux bugs audio sont corrigés.

## Bug 1 : Superposition Audio

### Problème
Lorsqu'on clique sur une réplique pendant qu'une autre est en cours de lecture, les deux audios se superposent au lieu que la précédente s'arrête.

### Cause Racine
- L'ancien élément `HTMLAudioElement` n'était pas complètement arrêté avant de démarrer un nouveau
- Les événements de l'ancien audio restaient attachés et pouvaient se déclencher
- L'URL blob n'était pas libérée, causant une fuite mémoire potentielle

### Corrections Appliquées

#### 1. `PiperWASMProvider.ts` - Amélioration de `stop()`
```typescript
stop(): void {
  if (this.currentAudio) {
    // Supprimer tous les événements pour éviter les callbacks après l'arrêt
    this.currentAudio.onplay = null
    this.currentAudio.onended = null
    this.currentAudio.onerror = null
    this.currentAudio.ontimeupdate = null

    // Arrêter la lecture
    this.currentAudio.pause()
    this.currentAudio.currentTime = 0

    // Libérer l'URL de l'objet blob si elle existe
    if (this.currentAudio.src && this.currentAudio.src.startsWith('blob:')) {
      URL.revokeObjectURL(this.currentAudio.src)
    }

    this.currentAudio = null
  }
  this.isPaused = false
}
```

#### 2. `PiperWASMProvider.ts` - Appel proactif de `stop()` avant nouvelle lecture
```typescript
// Arrêter complètement tout audio précédent avant d'en démarrer un nouveau
this.stop()

// Connecter les événements
audio.addEventListener('play', () => options.onStart?.())
// ...
```

### Tests à Effectuer

1. **Test de Clic Rapide**
   - Charger une pièce avec plusieurs répliques
   - Activer le mode audio
   - Cliquer sur une réplique pour démarrer la lecture
   - Immédiatement cliquer sur une autre réplique
   - ✅ **Résultat attendu** : La première lecture s'arrête instantanément, seule la seconde est audible

2. **Test de Changement Multiple**
   - Démarrer la lecture d'une réplique
   - Cliquer rapidement sur 3-4 répliques différentes en succession rapide
   - ✅ **Résultat attendu** : Aucune superposition audio, seule la dernière réplique cliquée est jouée

3. **Test de Mémoire**
   - Ouvrir la console développeur (onglet Performance/Memory)
   - Cliquer sur 20-30 répliques différentes rapidement
   - Observer l'utilisation mémoire
   - ✅ **Résultat attendu** : Pas de fuite mémoire (les blobs URL sont bien libérés)

---

## Bug 2 : Volume en Mode Italienne

### Problème
En mode italiennes, l'audio du personnage choisi devrait être muet (volume à 0) mais le timing doit être respecté. Le volume n'était pas correctement appliqué à cause de plusieurs problèmes.

### Cause Racine (Multiples Issues)

1. **Problème dans `PiperWASMProvider.ts` - Audio depuis cache**
   - Ligne 316 : `audio.volume = options.volume || 1`
   - L'opérateur `||` traite `0` comme falsy et le remplace par `1`
   - Résultat : audio depuis cache toujours joué à volume 1

2. **Problème dans `PiperWASMProvider.ts` - Audio nouvellement synthétisé**
   - Ligne 429 : `audio.volume = options.volume || 1`
   - Même problème avec l'opérateur `||`
   - Résultat : audio nouvellement synthétisé toujours joué à volume 1

3. **PROBLÈME MAJEUR dans `AudioCacheService.ts` - Clé de cache**
   - Ligne 98 : Le volume était inclus dans la clé de cache
   - `const data = `${text}|${voiceId}|${rate}|${pitch}|${volume || 1}``
   - **Erreur conceptuelle** : Le volume est une propriété de **lecture**, pas de **synthèse**
   - L'audio synthétisé est identique quel que soit le volume de lecture
   - Conséquence : Plusieurs entrées en cache pour le même audio avec des volumes différents
   - Pire : avec `volume || 1`, un volume de 0 était traité comme 1 dans la clé

### Corrections Appliquées

#### 1. `PiperWASMProvider.ts` - Correction pour audio depuis cache (ligne ~315)
```typescript
// AVANT (incorrect)
const audio = new Audio(URL.createObjectURL(cachedBlob))
audio.playbackRate = options.rate || 1
audio.volume = options.volume || 1

// APRÈS (correct)
const audio = new Audio(URL.createObjectURL(cachedBlob))
audio.playbackRate = options.rate ?? 1
audio.volume = options.volume ?? 1

console.warn(
  `[PiperWASM] 🔊 Audio depuis cache - volume appliqué: ${audio.volume}, rate: ${audio.playbackRate}`
)
```

#### 2. `PiperWASMProvider.ts` - Correction pour audio nouvellement synthétisé (ligne ~428)
```typescript
// AVANT (incorrect)
audio.playbackRate = options.rate || 1
audio.volume = options.volume || 1

// APRÈS (correct)
audio.playbackRate = options.rate ?? 1
audio.volume = options.volume ?? 1

console.warn(
  `[PiperWASM] 🔊 Audio nouvellement synthétisé - volume appliqué: ${audio.volume}, rate: ${audio.playbackRate}`
)
```

#### 3. `AudioCacheService.ts` - Suppression du volume de la clé de cache (ligne ~98)
```typescript
// AVANT (incorrect - volume inclus dans la clé)
const data = `${text}|${voiceId}|${settings.rate || 1}|${settings.pitch || 1}|${settings.volume || 1}`

// APRÈS (correct - volume exclu, c'est une propriété de lecture)
// Volume is excluded from cache key - it's applied at playback time
const data = `${text}|${voiceId}|${settings.rate ?? 1}|${settings.pitch ?? 1}`
```

#### 4. `PlayScreen.tsx` - Logging pour débug
```typescript
// Mode italiennes : répliques utilisateur à volume 0
const isUserLine = userCharacter && line.characterId === userCharacter.id
const volume = playSettings.readingMode === 'italian' && isUserLine ? 0 : 1
const rate = isUserLine ? playSettings.userSpeed : playSettings.defaultSpeed

// Log pour le mode italiennes
if (playSettings.readingMode === 'italian' && isUserLine) {
  console.warn(
    `[PlayScreen] 🎭 Mode italiennes - Ligne utilisateur détectée: volume=${volume}, rate=${rate}`
  )
}
```

### Tests à Effectuer

1. **Test Volume Utilisateur = 0**
   - Charger une pièce avec plusieurs personnages
   - Configurer le mode italiennes
   - Sélectionner votre personnage (ex: "HAMLET")
   - Activer le masquage des répliques utilisateur
   - Démarrer la lecture
   - ✅ **Résultat attendu** : 
     - Les répliques des autres personnages sont audibles
     - Les répliques de votre personnage sont **complètement silencieuses** (aucun son)
     - Le timing est respecté (pause entre les répliques même si muettes)

2. **Test Console Logs**
   - Ouvrir la console développeur
   - En mode italiennes, lancer la lecture
   - Vérifier les logs console
   - ✅ **Résultat attendu** :
     ```
     [PlayScreen] 🎭 Mode italiennes - Ligne utilisateur détectée: volume=0, rate=<vitesse>
     [PlayScreen] Lecture ligne X (HAMLET): voiceId="...", volume=0, rate=<vitesse>
     [PiperWASM] 🔊 Audio depuis cache - volume appliqué: 0, rate: <vitesse>
     ```
     OU (si pas en cache)
     ```
     [PiperWASM] 🔊 Audio nouvellement synthétisé - volume appliqué: 0, rate: <vitesse>
     ```

3. **Test Timing Respecté**
   - En mode italiennes
   - Observer une séquence : réplique autre → réplique utilisateur → réplique autre
   - Chronométrer le temps total
   - ✅ **Résultat attendu** :
     - La réplique utilisateur crée une pause de durée appropriée (basée sur `estimateLineDuration`)
     - Pas de lecture audio audible pendant cette pause
     - La séquence continue normalement

4. **Test Changement de Vitesse Utilisateur**
   - Configurer `userSpeed` à 0.5x (lent)
   - Configurer `defaultSpeed` à 1.5x (rapide)
   - Lancer la lecture en mode italiennes
   - ✅ **Résultat attendu** :
     - Les répliques des autres personnages sont rapides (1.5x)
     - Les pauses pour vos répliques sont plus longues (0.5x = plus de temps)
     - Volume reste à 0 pour vos répliques

5. **Test Mode Audio Normal**
   - Passer en mode audio normal (pas italiennes)
   - Lancer la lecture
   - ✅ **Résultat attendu** :
     - Toutes les répliques sont audibles, y compris celles de votre personnage
     - Volume = 1 pour toutes les lignes

---

## Checklist Finale

### Corrections Code
- [x] `PiperWASMProvider.stop()` : Nettoyage complet (événements + blob URL)
- [x] `PiperWASMProvider.synthesize()` : Appel proactif de `stop()` avant nouvelle lecture
- [x] `PiperWASMProvider.synthesize()` : Utilisation de `??` au lieu de `||` pour volume et rate (audio depuis cache)
- [x] `PiperWASMProvider.synthesize()` : Utilisation de `??` au lieu de `||` pour volume et rate (audio nouvellement synthétisé)
- [x] `PiperWASMProvider.synthesize()` : Logs confirmant volume appliqué (cache + nouveau)
- [x] `AudioCacheService.generateCacheKey()` : Suppression du volume de la clé de cache
- [x] `AudioCacheService.generateCacheKey()` : Utilisation de `??` au lieu de `||` pour rate et pitch
- [x] `PlayScreen.speakLine()` : Logs de débogage pour mode italiennes

### Tests Fonctionnels
- [ ] Bug 1 : Pas de superposition audio lors de clics rapides
- [ ] Bug 1 : Mémoire stable (pas de fuite de blobs)
- [ ] Bug 2 : Volume à 0 pour répliques utilisateur en mode italiennes
- [ ] Bug 2 : Timing respecté même avec volume 0
- [ ] Bug 2 : Vitesse utilisateur appliquée correctement
- [ ] Régression : Mode audio normal fonctionne toujours

---

## Notes Techniques

### Opérateur `??` (Nullish Coalescing)
- `value ?? default` : retourne `default` uniquement si `value` est `null` ou `undefined`
- `value || default` : retourne `default` si `value` est falsy (`0`, `""`, `false`, `null`, `undefined`)
- Pour les valeurs numériques où `0` est valide, **toujours utiliser `??`**

### Libération des Blob URLs
- `URL.createObjectURL()` crée une référence blob qui occupe de la mémoire
- `URL.revokeObjectURL()` doit être appelé pour libérer cette mémoire
- Sans libération : fuite mémoire après chaque lecture

### Timing en Mode Italienne
- L'audio est bien synthétisé (pour obtenir la durée correcte)
- `volume=0` fait que l'audio est joué mais inaudible
- Les événements `onStart` et `onEnd` se déclenchent normalement
- Le système de progression (`startProgressTracking`) fonctionne correctement

---

## Fichiers Modifiés

1. `src/core/tts/providers/PiperWASMProvider.ts`
   - Amélioration de `stop()` avec nettoyage complet
   - Appel proactif de `stop()` avant nouvelle lecture
   - Correction `||` → `??` pour volume et rate (audio depuis cache)
   - Correction `||` → `??` pour volume et rate (audio nouvellement synthétisé)
   - Ajout de logs confirmant le volume appliqué

2. `src/core/tts/services/AudioCacheService.ts`
   - **CORRECTION MAJEURE** : Suppression du volume de la clé de cache
   - Correction `||` → `??` pour rate et pitch
   - Ajout de commentaire expliquant pourquoi le volume est exclu

3. `src/screens/PlayScreen.tsx`
   - Ajout de logs pour le mode italiennes
   - Amélioration du log de lecture avec volume et rate

---

## Date
2025-01-XX

## Auteur
Assistant AI

## Impact des Corrections

### Avant
- Audio se superposait lors de clics rapides
- En mode italienne, répliques utilisateur audibles à volume normal
- Cache contenait plusieurs copies du même audio avec différents volumes
- Fuite mémoire potentielle (blobs non libérés)

### Après
- Audio précédent arrêté proprement avant nouveau démarrage
- En mode italienne, répliques utilisateur complètement muettes (volume = 0)
- Cache optimisé : une seule entrée par audio (volume appliqué à la lecture)
- Pas de fuite mémoire (blobs libérés correctement)

## Statut
✅ Corrections appliquées - En attente de tests utilisateur

## Note Importante
Si l'audio a déjà été mis en cache AVANT cette correction avec `volume=1` dans la clé, il faudra peut-être vider le cache pour que les nouvelles clés (sans volume) prennent effet. Le cache se videra automatiquement au prochain redémarrage de l'application.