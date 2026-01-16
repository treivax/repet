# Fix de Navigation et Badge pour ReaderScreen

## Problème

Le `ReaderScreen` présentait deux problèmes majeurs :

1. **Badge non mis à jour** : Le badge "Acte X - Scène Y" ne se mettait pas à jour pendant le scroll manuel
2. **Navigation sommaire non fonctionnelle** : La sélection d'une scène dans le sommaire n'entraînait pas le déplacement/scroll vers la scène

## Cause

### Badge non mis à jour
- Aucun mécanisme pour détecter le scroll manuel et mettre à jour les index d'acte/scène dans le store
- Pas d'`IntersectionObserver` pour surveiller quels éléments sont visibles

### Navigation sommaire non fonctionnelle
- `currentPlaybackIndex` était toujours `undefined` dans `ReaderScreen.tsx` (ligne 346)
- Sans `currentPlaybackIndex` valide, `PlaybackDisplay` ne pouvait pas scroller automatiquement
- Pas de gestion des conflits entre scroll programmatique (navigation) et scroll manuel (détection)

## Solution Implémentée

### 1. Calcul de `currentPlaybackIndex`

Ajout d'un `useEffect` qui calcule `currentPlaybackIndex` à partir de l'état du store (`currentLineIndex`, `currentActIndex`, `currentSceneIndex`) :

```typescript
// Chercher d'abord un item de type 'line' correspondant à currentLineIndex
let foundIndex = playbackSequence.findIndex(
  (item) => item.type === 'line' && (item as LinePlaybackItem).lineIndex === currentLineIndex
)

// Si pas trouvé, chercher un item de structure (scene/act) correspondant
if (foundIndex === -1) {
  foundIndex = playbackSequence.findIndex(
    (item) =>
      item.type === 'structure' &&
      (item as StructurePlaybackItem).structureType === 'scene' &&
      (item as StructurePlaybackItem).actIndex === currentActIndex &&
      (item as StructurePlaybackItem).sceneIndex === currentSceneIndex
  )
}

// Si toujours pas trouvé, chercher un item d'acte
if (foundIndex === -1) {
  foundIndex = playbackSequence.findIndex(
    (item) =>
      item.type === 'structure' &&
      (item as StructurePlaybackItem).structureType === 'act' &&
      (item as StructurePlaybackItem).actIndex === currentActIndex
  )
}
```

Cette logique de fallback garantit qu'on trouve toujours un élément à afficher, même si les filtres (hideUserLines, etc.) cachent certaines lignes.

### 2. IntersectionObserver pour la détection du scroll

Ajout d'un `IntersectionObserver` qui :
- Surveille tous les éléments avec `data-playback-index`
- Détecte l'élément le plus visible (celui avec le plus grand `intersectionRatio`)
- Met à jour silencieusement le store (`goToLine` ou `goToScene`) en fonction du type d'élément visible
- Est désactivé pendant le scroll programmatique pour éviter les conflits

```typescript
const observerOptions = {
  root: containerRef.current,
  rootMargin: '-40% 0px -40% 0px', // Zone centrale de l'écran
  threshold: 0,
}

const observerCallback = (entries: IntersectionObserverEntry[]) => {
  // Ne rien faire si on est en train de scroller programmatiquement
  if (isScrollingProgrammaticallyRef.current) {
    return
  }

  // Trouver l'élément le plus visible
  let maxRatio = 0
  let targetEntry: IntersectionObserverEntry | undefined

  for (const entry of entries) {
    if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
      maxRatio = entry.intersectionRatio
      targetEntry = entry
    }
  }

  // Mettre à jour le store en fonction de l'élément visible
  // ...
}
```

### 3. Flag `isScrollingProgrammaticallyRef`

Pour éviter les conflits entre scroll manuel et programmatique :

```typescript
const isScrollingProgrammaticallyRef = useRef(false)

const handleGoToScene = useCallback((actIndex: number, sceneIndex: number) => {
  // Activer le flag de scroll programmatique
  isScrollingProgrammaticallyRef.current = true

  // Mettre à jour le store
  goToScene(actIndex, sceneIndex)
  setShowSummary(false)

  // Désactiver le flag après un délai pour permettre le scroll
  setTimeout(() => {
    isScrollingProgrammaticallyRef.current = false
  }, 1500)
}, [goToScene])
```

Ce flag empêche l'`IntersectionObserver` de mettre à jour le store pendant qu'on effectue une navigation programmée depuis le sommaire.

### 4. Amélioration de `PlaybackDisplay`

- Ajout d'une prop `containerRef` pour permettre au composant parent de passer sa ref
- Ajout d'un délai de 100ms avant le scroll pour s'assurer que le DOM est rendu
- Meilleure gestion des cas où `currentPlaybackIndex` est `undefined`

```typescript
// Petit délai pour s'assurer que le DOM est rendu
setTimeout(() => {
  if (currentItemRef.current) {
    currentItemRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }
}, 100)
```

## Fichiers Modifiés

### `src/screens/ReaderScreen.tsx`
- Ajout du calcul de `currentPlaybackIndex`
- Ajout de l'`IntersectionObserver`
- Ajout du flag `isScrollingProgrammaticallyRef`
- Passage de `currentPlaybackIndex` et `containerRef` à `PlaybackDisplay`
- Import des types `LinePlaybackItem` et `StructurePlaybackItem`

### `src/components/reader/PlaybackDisplay.tsx`
- Ajout de la prop `containerRef?: React.RefObject<HTMLDivElement>`
- Utilisation de la ref externe si fournie
- Ajout d'un délai de 100ms avant le scroll
- Suppression des `console.log` (conformité lint)

## Comportement Attendu

### Navigation depuis le sommaire
1. L'utilisateur clique sur une scène dans le sommaire
2. `handleGoToScene` active le flag `isScrollingProgrammaticallyRef`
3. `goToScene` met à jour `currentActIndex`, `currentSceneIndex`, et `currentLineIndex` dans le store
4. Le `useEffect` de calcul de `currentPlaybackIndex` se déclenche et trouve l'élément correspondant
5. `PlaybackDisplay` reçoit le nouveau `currentPlaybackIndex` et scroll vers l'élément
6. Après 1500ms, le flag `isScrollingProgrammaticallyRef` est désactivé

### Scroll manuel
1. L'utilisateur scroll manuellement dans le texte
2. L'`IntersectionObserver` détecte le nouvel élément le plus visible
3. Si `isScrollingProgrammaticallyRef` est `false`, le store est mis à jour silencieusement
4. Le badge se met à jour automatiquement (il lit `currentActIndex` et `currentSceneIndex` du store)

## Tests

Pour tester les corrections :

1. Ouvrir une pièce en mode lecteur
2. Vérifier que le badge affiche "Acte 1 - Scène 1"
3. Scroller manuellement → le badge doit se mettre à jour
4. Ouvrir le sommaire et sélectionner une autre scène → le texte doit scroller vers cette scène
5. Le badge doit afficher la nouvelle scène

## Notes Techniques

- Le `rootMargin: '-40% 0px -40% 0px'` de l'IntersectionObserver signifie qu'on observe la zone centrale de l'écran (en excluant les 40% en haut et en bas). Cela permet de détecter l'élément "principal" à l'écran.
  
- Le délai de 1500ms pour désactiver `isScrollingProgrammaticallyRef` doit être suffisant pour que le scroll smooth se termine. Si le scroll prend plus de temps sur des appareils lents, ce délai pourrait être augmenté.

- Le délai de 100ms dans `PlaybackDisplay` garantit que React a eu le temps de rendre le DOM avant qu'on essaie de scroller vers un élément.

## Limitations Connues

- Si `playbackSequence` ne contient aucun élément pour une scène donnée (par exemple, toutes les lignes sont filtrées par `hideUserLines`), le scroll peut échouer ou cibler un élément de fallback (acte ou scène structurelle).
  
- Les toggles `readStructure`, `hideUserLines`, `showBefore`, `showAfter` peuvent modifier la composition de `playbackSequence`, ce qui peut affecter la capacité à trouver l'élément exact correspondant à une ligne.

## Améliorations Futures Possibles

1. Utiliser un événement personnalisé au lieu d'un timeout pour désactiver `isScrollingProgrammaticallyRef` (en écoutant l'événement `scrollend`)
2. Ajouter des tests e2e pour valider le comportement de navigation et de mise à jour du badge
3. Ajouter de la télémétrie pour surveiller les cas où `currentPlaybackIndex` reste `undefined`
4. Optimiser l'IntersectionObserver pour ne pas recalculer à chaque frame de scroll