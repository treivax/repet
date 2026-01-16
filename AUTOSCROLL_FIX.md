# Correctif du scroll automatique dans PlayScreen

## Problèmes identifiés

### 1. Navigation par sommaire sans scroll
Lorsqu'une scène était sélectionnée dans le sommaire (`handleGoToScene`), le store était mis à jour mais **aucun scroll n'était effectué** vers la scène sélectionnée. L'utilisateur devait scroller manuellement pour voir la scène.

### 2. Double système de scroll conflictuel
Deux systèmes de scroll automatique coexistaient et pouvaient entrer en conflit :

- **Dans `PlayScreen.speakLine()`** : Appel à `scrollToLine(globalLineIndex)` pour scroller vers les lignes
- **Dans `PlaybackDisplay.useEffect`** : Auto-scroll vers `currentPlaybackIndex` pour tous les items

**Conséquences** :
- Les cartes (structure, stage-direction, presentation) n'avaient PAS de scroll dans leurs fonctions `play*()`, uniquement via le `useEffect` de PlaybackDisplay
- Les lignes avaient les DEUX scrolls, causant des saccades et des scrolls redondants
- Les deux systèmes pouvaient se chevaucher et s'annuler mutuellement

### 3. Scroll non fiable dans PlaybackDisplay
Le `useEffect` de `PlaybackDisplay` reposait uniquement sur `currentItemRef.current`, qui pouvait être `null` si le composant n'était pas encore monté, causant des échecs silencieux de scroll.

## Solutions implémentées

### 1. Centralisation du scroll automatique
**Principe** : Tout le scroll automatique est désormais géré dans `PlaybackDisplay` via `currentPlaybackIndex`.

#### Modifications dans `PlayScreen.tsx` :
- **Supprimé** : La fonction `scrollToLine()` (non utilisée ailleurs)
- **Supprimé** : L'appel `scrollToLine(globalLineIndex)` dans `speakLine()`
- **Ajouté** : Commentaire expliquant que le scroll est géré par PlaybackDisplay

```typescript
// Note: Le scroll automatique est géré par PlaybackDisplay via currentPlaybackIndex
// pour éviter les conflits entre plusieurs systèmes de scroll
```

**Avantage** : Un seul point de contrôle pour le scroll automatique, uniformité entre tous les types d'items (line, structure, stage-direction, presentation).

### 2. Amélioration de la robustesse du scroll dans PlaybackDisplay

#### Modifications dans `PlaybackDisplay.tsx` :

**Avant** :
```typescript
if (!currentItemRef.current) {
  return
}

setTimeout(() => {
  if (currentItemRef.current) {
    currentItemRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }
}, 100)
```

**Après** :
```typescript
const scrollTimer = setTimeout(() => {
  // Essayer d'abord avec la ref, sinon chercher l'élément par data-attribute
  let targetElement: HTMLDivElement | HTMLElement | null = currentItemRef.current

  if (!targetElement) {
    // Fallback: chercher par data-playback-index
    targetElement = activeContainerRef.current?.querySelector(
      `[data-playback-index="${currentPlaybackIndex}"]`
    ) as HTMLDivElement | null
  }

  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }
}, 150)

return () => clearTimeout(scrollTimer)
```

**Améliorations** :
- ✅ **Fallback robuste** : Si `currentItemRef.current` est null, recherche l'élément par `data-playback-index`
- ✅ **Cleanup du timer** : Évite les fuites mémoire et les scrolls obsolètes
- ✅ **Délai augmenté** : 150ms au lieu de 100ms pour s'assurer que le DOM est rendu

### 3. Scroll vers la scène sélectionnée dans le sommaire

#### Modifications dans `PlayScreen.handleGoToScene()` :

**Ajouté** :
```typescript
// Trouver le premier élément de playback de la scène sélectionnée
const firstSceneItem = playbackSequence.find((item) => {
  if (item.type === 'structure') {
    const structItem = item as StructurePlaybackItem
    return structItem.actIndex === actIndex && structItem.sceneIndex === sceneIndex
  }
  return false
})

// Si trouvé, scroller vers cet élément
if (firstSceneItem) {
  setTimeout(() => {
    const element = document.querySelector(
      `[data-playback-index="${firstSceneItem.index}"]`
    ) as HTMLElement
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, 200)
}
```

**Fonctionnement** :
1. Trouve le premier item de type 'structure' correspondant à la scène sélectionnée (acte + scène)
2. Scroll vers cet élément après 200ms (laisse le temps au DOM de se mettre à jour)
3. Utilise `data-playback-index` pour identifier l'élément de manière fiable

**Note** : Le délai de 200ms est coordonné avec le flag `isScrollingProgrammaticallyRef` (désactivé après 1500ms) pour éviter que l'Observer n'interprète ce scroll comme un changement de position utilisateur.

## Comportement final attendu

### ✅ Navigation par sommaire
- Cliquer sur une scène dans le sommaire → Scroll automatique vers la carte de scène
- Le badge de navigation se met à jour correctement

### ✅ Lecture audio/italienne
- Lancement de la lecture d'une ligne → Scroll automatique vers cette ligne
- Passage automatique à l'élément suivant → Scroll automatique vers le nouvel élément
- Fonctionne pour tous les types : lignes, didascalies, structure, présentation

### ✅ Fluidité
- Un seul scroll par changement d'item
- Pas de saccades ou de va-et-vient
- Pas de conflits entre différents systèmes de scroll

## Tests recommandés

### Test 1 : Navigation par sommaire
1. Ouvrir une pièce
2. Cliquer sur une scène dans le sommaire
3. **Vérifier** : La vue scroll automatiquement vers la carte de scène

### Test 2 : Lecture audio continue
1. Lancer la lecture d'une ligne
2. Laisser la lecture progresser automatiquement
3. **Vérifier** : Chaque élément lu reste visible à l'écran (scroll auto)

### Test 3 : Lecture avec cartes
1. Activer la lecture des didascalies, structure, présentation
2. Lancer une lecture incluant ces éléments
3. **Vérifier** : Le scroll fonctionne pour tous les types de cartes

### Test 4 : Scroll utilisateur
1. Lancer une lecture
2. Scroller manuellement pendant la lecture
3. **Vérifier** : L'Observer met à jour la navigation sans conflit avec l'auto-scroll

### Test 5 : Pause/reprise
1. Lancer une lecture
2. Mettre en pause
3. Scroller ailleurs manuellement
4. Reprendre la lecture
5. **Vérifier** : Le scroll revient à l'élément en cours de lecture

## Fichiers modifiés

- `src/screens/PlayScreen.tsx`
  - Suppression de `scrollToLine()`
  - Suppression de l'appel dans `speakLine()`
  - Ajout du scroll dans `handleGoToScene()`
  
- `src/components/reader/PlaybackDisplay.tsx`
  - Amélioration du `useEffect` de scroll avec fallback et cleanup

## Prochaines étapes

- [ ] Tester sur mobile (touch) et desktop (mouse)
- [ ] Vérifier sur différents navigateurs (Chrome, Firefox, Safari)
- [ ] Surveiller les performances avec de longues pièces (>1000 éléments)
- [ ] Considérer l'ajout d'un debounce si des scrolls répétés sont observés
- [ ] Ajouter des tests E2E pour le scroll automatique

## Notes techniques

### Pourquoi un fallback par querySelector ?
La ref React (`currentItemRef`) peut être `null` dans certains cas :
- Lors du premier render
- Si React n'a pas encore attaché la ref
- Si le composant se remonte (unmount/remount)

Le fallback par `data-playback-index` garantit que le scroll fonctionne même dans ces cas edge.

### Pourquoi des timeouts ?
Les timeouts permettent au DOM de se mettre à jour avant d'effectuer le scroll :
- **150ms dans PlaybackDisplay** : Attendre que React rende le nouveau currentPlaybackIndex
- **200ms dans handleGoToScene** : Attendre que le store se mette à jour et que React re-rende

Ces valeurs sont des compromis entre réactivité (UX) et fiabilité (garantir que l'élément existe).

### Coordination avec isScrollingProgrammaticallyRef
Le flag `isScrollingProgrammaticallyRef.current = true` dans `handleGoToScene` empêche l'Observer d'interpréter le scroll programmatique comme un changement de position utilisateur, ce qui éviterait un conflit avec le store.

Le délai de 1500ms pour désactiver ce flag laisse le temps au scroll de se terminer (smooth scroll + animation).