# Fix: Restauration de la progression automatique des lignes

**Date**: 2025-01-XX  
**Fichiers modifiés**: `src/screens/PlayScreen.tsx`

## Problème

Lorsque l'utilisateur cliquait sur une ligne (réplique) pour la lire, celle-ci se lisait correctement mais **ne passait pas automatiquement à la ligne suivante** à la fin de la lecture. Ce comportement brisait l'expérience utilisateur attendue : cliquer sur une ligne devait démarrer une lecture continue de toute la scène/pièce.

### Symptômes observés

- ✅ Lecture d'une ligne : OK
- ✅ Pause/reprise : OK
- ✅ Désélection de la ligne à la fin : OK
- ❌ **Passage automatique à la ligne suivante : NON**

### Logs révélateurs

```
[PlayScreen] 🎯 Ligne terminée, callback onComplete appelé {
  globalLineIndex: 24,
  playbackSequenceLength: 0    ← PROBLÈME !
}
[PlayScreen] currentItem trouvé? {
  found: false,
  currentItem: null
}
```

La `playbackSequence` était vide (length: 0) → impossible de trouver l'élément suivant.

## Cause racine

### 1. `handleLineClick` n'initialisait pas `playbackSequence`

Quand l'utilisateur cliquait sur une ligne, `handleLineClick` appelait directement `speakLine(globalLineIndex)` **sans construire de `playbackSequence`**.

```typescript
// ❌ AVANT (version cassée)
const handleLineClick = useCallback((globalLineIndex: number) => {
  if (playingLineIndex === globalLineIndex) {
    pausePlayback()
  } else {
    speakLine(globalLineIndex)  // ← Pas de playbackSequence !
  }
}, [playingLineIndex, pausePlayback, speakLine])
```

À la fin de `speakLine`, le callback `onComplete` cherchait l'élément suivant dans `playbackSequence`, mais celle-ci était vide → pas de progression.

### 2. Stale closure dans `speakLine`

`speakLine` est un `useCallback` avec dépendances `[]` (pour des raisons de performance / éviter recréations). Cela signifie qu'il **capture** les valeurs de `playbackSequence` au moment de sa création et ne voit jamais les mises à jour ultérieures.

Même si `handleLineClick` avait mis à jour `playbackSequence`, `speakLine` aurait continué à utiliser l'ancienne valeur vide.

## Solution

### 1. Construire `playbackSequence` dans `handleLineClick`

Modification de `handleLineClick` pour :
1. Construire la séquence de lecture complète (`buildPlaybackSequence`)
2. Trouver l'item correspondant à la ligne cliquée
3. Mettre à jour `playbackSequence` et `currentPlaybackIndex`
4. Appeler `playPlaybackItem` (comme pour les cartes)

```typescript
// ✅ APRÈS (version corrigée)
const handleLineClick = useCallback((globalLineIndex: number) => {
  if (!currentPlay || !playSettings) return

  if (playingLineIndex === globalLineIndex) {
    pausePlayback()
    return
  }

  // Construire la playbackSequence complète
  const sequence = buildPlaybackSequence(currentPlay.ast, {
    includeStageDirections: playSettings.readStageDirections,
    includeStructure: playSettings.readStructure,
    includePresentation: playSettings.readPresentation,
  })

  // Trouver l'item correspondant
  const lineItem = sequence.find(
    (item): item is LinePlaybackItem =>
      item.type === 'line' && (item as LinePlaybackItem).lineIndex === globalLineIndex
  )

  if (!lineItem) {
    console.error('Item non trouvé pour globalLineIndex:', globalLineIndex)
    return
  }

  // Mettre à jour la séquence
  setPlaybackSequence(sequence)
  playbackSequenceRef.current = sequence
  setCurrentPlaybackIndex(lineItem.index)

  // Démarrer la lecture
  playPlaybackItem(lineItem)
}, [currentPlay, playSettings, playingLineIndex, pausePlayback, playPlaybackItem])
```

### 2. Utiliser une ref pour `playbackSequence`

Ajout de `playbackSequenceRef` pour que les callbacks asynchrones puissent accéder à la **version actuelle** de `playbackSequence` :

```typescript
// Nouvelle ref
const playbackSequenceRef = useRef<PlaybackItem[]>([])

// Synchronisation avec le state
useEffect(() => {
  // ...
  setPlaybackSequence(sequence)
  playbackSequenceRef.current = sequence  // ← Toujours synchronisé
}, [currentPlay, playSettings])
```

### 3. Mise à jour des callbacks pour utiliser la ref

Tous les callbacks asynchrones (dans `speakLine`, `playNextPlaybackItem`, etc.) utilisent maintenant `playbackSequenceRef.current` au lieu de `playbackSequence` :

```typescript
// Dans speakLine - callback onComplete
speakLineSegments(segments, voiceId, narratorVoiceId, rate, volume, globalLineIndex, () => {
  // ✅ Utilise la ref
  const currentItem = playbackSequenceRef.current.find(
    (item) => item.type === 'line' && (item as LinePlaybackItem).lineIndex === globalLineIndex
  )
  if (currentItem) {
    playNextPlaybackItem(currentItem.index)
  }
})

// Dans playNextPlaybackItem
const playNextPlaybackItem = (currentIndex: number) => {
  // ✅ Utilise la ref
  const nextItem = playbackSequenceRef.current.find((item) => item.index === currentIndex + 1)
  if (nextItem) {
    playPlaybackItem(nextItem)
  }
}
```

## Changements apportés

### Fichier : `src/screens/PlayScreen.tsx`

1. **Ajout de `playbackSequenceRef`** (ligne ~119)
   ```typescript
   const playbackSequenceRef = useRef<PlaybackItem[]>([])
   ```

2. **Synchronisation de la ref avec le state** (lignes ~207, ~219, ~1527)
   ```typescript
   setPlaybackSequence(sequence)
   playbackSequenceRef.current = sequence
   ```

3. **Refactorisation de `handleLineClick`** (lignes ~1488-1540)
   - Construction de `playbackSequence` complète
   - Recherche de l'item correspondant
   - Mise à jour des states
   - Appel à `playPlaybackItem`

4. **Mise à jour des callbacks** (lignes ~1124, ~1201, ~1379, ~1411)
   - `playNextPlaybackItem` : utilise `playbackSequenceRef.current`
   - `speakLine` : utilise `playbackSequenceRef.current`

## Résultat

- ✅ Cliquer sur une ligne démarre la lecture **et passe automatiquement aux lignes suivantes**
- ✅ Fonctionne en mode **audio** et **italiennes**
- ✅ Pause/reprise continue de fonctionner
- ✅ Long-press pour annotations n'interfère pas
- ✅ Comportement cohérent avec le clic sur les cartes (structure, didascalies)

## Tests recommandés

1. **Lecture continue**
   - Cliquer sur une ligne → vérifier qu'elle se lit et passe automatiquement à la suivante
   - Vérifier que toute la scène s'enchaîne jusqu'à la fin

2. **Pause/reprise**
   - Cliquer sur la ligne en cours → pause
   - Recliquer → reprise
   - Vérifier que la progression continue après reprise

3. **Mode italiennes**
   - Même test que ci-dessus
   - Vérifier que seules les lignes du personnage utilisateur sont lues

4. **Changement de ligne pendant lecture**
   - Cliquer sur ligne A → lecture démarre
   - Cliquer sur ligne B → lecture de A s'arrête, B démarre
   - B enchaîne sur les lignes suivantes

5. **Toggles de lecture**
   - Activer/désactiver "Lire structure", "Lire didascalies"
   - Vérifier que la séquence est reconstruite correctement
   - Vérifier que l'enchaînement saute les éléments désactivés

## Notes techniques

- La construction de `playbackSequence` à chaque clic sur ligne peut sembler coûteuse, mais :
  - `buildPlaybackSequence` est optimisé et rapide (parcours linéaire de l'AST)
  - Cela garantit que la séquence est **toujours à jour** avec les settings
  - Alternative considérée : construire une seule fois et filtrer → plus complexe, bugs potentiels

- L'utilisation d'une ref (`playbackSequenceRef`) est nécessaire pour les callbacks asynchrones :
  - React Hooks + closures = risque de "stale values"
  - Refs = toujours la valeur actuelle, pas de closure
  - Pattern standard pour ce type de problème

## Problèmes additionnels corrigés

### Problème #2 : Sélection visuelle incorrecte

**Symptôme** : Quand on clique sur une carte de structure pendant qu'une réplique est en cours de lecture, la réplique reste visuellement sélectionnée (et vice versa).

**Cause** : Les fonctions `playStageDirection`, `playStructure`, et `playPresentation` mettaient à jour `currentPlaybackIndex` mais ne réinitialisaient pas `playingLineIndex`. Résultat : les deux types d'éléments pouvaient être sélectionnés simultanément.

**Solution** : Ajout de `setPlayingLineIndex(undefined)` dans chaque fonction de lecture de carte :

```typescript
const playStageDirection = (item: StageDirectionPlaybackItem) => {
  setCurrentPlaybackIndex(item.index)
  setPlayedItems((prev) => new Set(prev).add(item.index))
  setPlayingLineIndex(undefined)  // ← Désélectionner toute ligne
  // ...
}
```

### Problème #3 : Scroll saccadé lors des transitions

**Symptôme** : Le repositionnement lors du passage d'une carte à l'autre se fait en plusieurs sacades dans un sens puis dans l'autre.

**Causes** :
1. Multiples appels à `setShouldAutoScroll(true)` avec timeouts qui se chevauchent
2. Scrolls redondants vers la même cible
3. Pas de cleanup des timeouts

**Solutions** :

1. **Utilisation d'une ref pour le timeout auto-scroll** :
   ```typescript
   const autoScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
   
   // Annuler le timeout précédent avant d'en créer un nouveau
   if (autoScrollTimeoutRef.current) {
     clearTimeout(autoScrollTimeoutRef.current)
   }
   setShouldAutoScroll(true)
   autoScrollTimeoutRef.current = setTimeout(() => {
     setShouldAutoScroll(false)
     autoScrollTimeoutRef.current = null
   }, 1000)
   ```

2. **Éviter les scrolls redondants** :
   ```typescript
   const lastScrollTargetRef = useRef<number | null>(null)
   
   const scrollToLine = (lineIndex: number) => {
     if (lastScrollTargetRef.current === lineIndex) {
       return  // Déjà en train de scroller vers cette cible
     }
     
     const element = document.querySelector(`[data-line-index="${lineIndex}"]`)
     if (element) {
       lastScrollTargetRef.current = lineIndex
       element.scrollIntoView({ behavior: 'smooth', block: 'center' })
       
       setTimeout(() => {
         lastScrollTargetRef.current = null
       }, 500)
     }
   }
   ```

3. **Cleanup des timeouts au démontage** :
   ```typescript
   useEffect(() => {
     return () => {
       if (autoScrollTimeoutRef.current) {
         clearTimeout(autoScrollTimeoutRef.current)
       }
       if (observerTimeoutRef.current) {
         clearTimeout(observerTimeoutRef.current)
       }
       if (progressIntervalRef.current) {
         clearInterval(progressIntervalRef.current)
       }
     }
   }, [])
   ```

**Résultat** : Scroll fluide et sans sacades, une seule animation vers la cible.

## Résumé des changements (complet)

### Fichier : `src/screens/PlayScreen.tsx`

1. **Progression automatique** (lignes ~119, ~207, ~219, ~1124, ~1201, ~1379, ~1411, ~1488-1540)
   - Ajout `playbackSequenceRef`
   - Refactorisation `handleLineClick`
   - Mise à jour callbacks pour utiliser la ref

2. **Sélection visuelle** (lignes ~985, ~1034, ~1087)
   - `setPlayingLineIndex(undefined)` dans `playStageDirection`
   - `setPlayingLineIndex(undefined)` dans `playStructure`
   - `setPlayingLineIndex(undefined)` dans `playPresentation`

3. **Scroll fluide** (lignes ~120, ~801-816, ~1215-1223, ~1486-1494, ~1547-1555, ~1574-1590, ~207-218)
   - Ajout `autoScrollTimeoutRef` et `lastScrollTargetRef`
   - Annulation timeouts précédents avant nouvelles activations
   - Évitement scrolls redondants dans `scrollToLine`
   - Cleanup au démontage

## Références

- Thread d'origine : "Long press breaks italian line playback"
- Documentation précédente : `BUGFIX_AUDIO_PAUSE_LONG_PRESS_CONFLICT.md`
- Fonction clé : `buildPlaybackSequence` (`src/utils/playbackSequence.ts`)