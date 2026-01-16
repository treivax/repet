# Résumé des Corrections de Navigation - Badge et Sommaire

## 🎯 Problème Résolu

Le badge "Acte X - Scène Y" et la navigation via le sommaire ne fonctionnaient pas correctement dans les écrans de lecture.

### Symptômes
1. **Badge non mis à jour** : Le badge ne changeait pas pendant le scroll manuel
2. **Navigation sommaire non fonctionnelle** : Cliquer sur une scène dans le sommaire n'entraînait pas le déplacement vers cette scène

### Écrans Concernés
- ✅ `ReaderScreen.tsx` (lecture silencieuse) - **CORRIGÉ**
- ✅ `PlayScreen.tsx` (lecture audio / italiennes) - **CORRIGÉ**

---

## 🔧 Corrections Appliquées

### 1. Calcul Dynamique de `currentPlaybackIndex`

**Problème** : `currentPlaybackIndex` était `undefined`, empêchant le scroll automatique.

**Solution** : Ajout d'un `useEffect` qui calcule `currentPlaybackIndex` à partir de l'état du store :

```typescript
useEffect(() => {
  if (!playbackSequence.length) {
    setCurrentPlaybackIndex(undefined)
    return
  }

  // 1. Chercher item de type 'line' correspondant à currentLineIndex
  let foundIndex = playbackSequence.findIndex(
    (item) => item.type === 'line' && 
    (item as LinePlaybackItem).lineIndex === currentLineIndex
  )

  // 2. Si pas trouvé, chercher item de structure (scene)
  if (foundIndex === -1) {
    foundIndex = playbackSequence.findIndex(
      (item) =>
        item.type === 'structure' &&
        (item as StructurePlaybackItem).structureType === 'scene' &&
        (item as StructurePlaybackItem).actIndex === currentActIndex &&
        (item as StructurePlaybackItem).sceneIndex === currentSceneIndex
    )
  }

  // 3. Si toujours pas trouvé, chercher item d'acte
  if (foundIndex === -1) {
    foundIndex = playbackSequence.findIndex(
      (item) =>
        item.type === 'structure' &&
        (item as StructurePlaybackItem).structureType === 'act' &&
        (item as StructurePlaybackItem).actIndex === currentActIndex
    )
  }

  setCurrentPlaybackIndex(foundIndex !== -1 ? foundIndex : undefined)
}, [playbackSequence, currentLineIndex, currentActIndex, currentSceneIndex])
```

**Résultat** : `PlaybackDisplay` reçoit un index valide et peut scroller automatiquement.

---

### 2. IntersectionObserver pour Détection du Scroll Manuel

**Problème** : Aucun mécanisme pour détecter quel élément est visible pendant le scroll.

**Solution** : Ajout d'un `IntersectionObserver` qui :
- Surveille tous les éléments avec `data-playback-index`
- Détecte l'élément le plus visible (plus grand `intersectionRatio`)
- Met à jour le store (`goToLine` ou `goToScene`) en fonction de l'élément

```typescript
useEffect(() => {
  if (!containerRef.current || !playbackSequence.length || !currentPlay) {
    return
  }

  const observerOptions = {
    root: containerRef.current,
    rootMargin: '-40% 0px -40% 0px', // Zone centrale de l'écran
    threshold: 0,
  }

  const observerCallback = (entries: IntersectionObserverEntry[]) => {
    // Ne rien faire si scroll programmatique en cours
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

    if (!targetEntry) return

    // Récupérer l'item de playback correspondant
    const element = targetEntry.target as HTMLElement
    const playbackIndexStr = element.getAttribute('data-playback-index')
    const playbackIdx = parseInt(playbackIndexStr!, 10)
    const item = playbackSequence[playbackIdx]

    // Mettre à jour le store
    if (item.type === 'line') {
      goToLine(lineIdx)
    } else if (item.type === 'structure' && structureType === 'scene') {
      goToScene(actIdx, sceneIdx)
    }
  }

  const observer = new IntersectionObserver(observerCallback, observerOptions)
  
  // Observer tous les éléments
  const elements = containerRef.current.querySelectorAll('[data-playback-index]')
  elements.forEach((el) => observer.observe(el))

  return () => observer.disconnect()
}, [playbackSequence, currentPlay, currentActIndex, currentSceneIndex, goToLine, goToScene])
```

**Résultat** : Le badge se met à jour automatiquement pendant le scroll.

---

### 3. Flag de Scroll Programmatique

**Problème** : Conflit entre scroll manuel (IntersectionObserver) et scroll automatique (navigation sommaire).

**Solution** : Ajout d'un flag `isScrollingProgrammaticallyRef` qui désactive l'observer pendant le scroll automatique.

```typescript
const isScrollingProgrammaticallyRef = useRef(false)

const handleGoToScene = useCallback(
  (actIndex: number, sceneIndex: number) => {
    // 1. Arrêter la lecture (PlayScreen uniquement)
    stopPlayback()

    // 2. Activer le flag
    isScrollingProgrammaticallyRef.current = true

    // 3. Mettre à jour le store
    goToScene(actIndex, sceneIndex)
    setShowSummary(false)

    // 4. Désactiver le flag après le scroll (1.5s)
    setTimeout(() => {
      isScrollingProgrammaticallyRef.current = false
    }, 1500)
  },
  [stopPlayback, goToScene]
)
```

**Résultat** : Pas de boucles ni de conflits entre les deux mécanismes.

---

### 4. Container Ref pour PlaybackDisplay

**Problème** : `PlaybackDisplay` avait son propre container interne, empêchant l'IntersectionObserver parent de fonctionner.

**Solution** : 
- Ajout de prop `containerRef?: React.RefObject<HTMLDivElement>` à `PlaybackDisplay`
- Passage de la ref depuis les écrans parents
- `PlaybackDisplay` utilise la ref externe si fournie

**ReaderScreen / PlayScreen** :
```typescript
const containerRef = useRef<HTMLDivElement>(null)

// Dans le JSX :
<PlaybackDisplay
  // ... autres props
  containerRef={containerRef}
/>
```

**PlaybackDisplay** :
```typescript
const internalContainerRef = useRef<HTMLDivElement>(null)
const activeContainerRef = externalContainerRef || internalContainerRef

// Utiliser activeContainerRef pour le scroll et l'observer
```

**Résultat** : L'IntersectionObserver peut surveiller le bon conteneur.

---

## 📦 Fichiers Modifiés

### 1. `src/screens/ReaderScreen.tsx`
- ✅ Import `LinePlaybackItem`, `StructurePlaybackItem`
- ✅ Import `useRef`, `useCallback`
- ✅ Ajout `currentLineIndex` et `goToLine` depuis le store
- ✅ Ajout refs `containerRef` et `isScrollingProgrammaticallyRef`
- ✅ Ajout calcul `currentPlaybackIndex`
- ✅ Ajout `IntersectionObserver`
- ✅ Modification `handleGoToScene` avec flag programmatique
- ✅ Passage `containerRef` à `PlaybackDisplay`

### 2. `src/screens/PlayScreen.tsx`
- ✅ Import `LinePlaybackItem`, `StructurePlaybackItem`
- ✅ Import `useCallback`
- ✅ Ajout `currentLineIndex` et `goToLine` depuis le store
- ✅ Ajout refs `containerRef` et `isScrollingProgrammaticallyRef`
- ✅ Ajout calcul `currentPlaybackIndex`
- ✅ Ajout `IntersectionObserver`
- ✅ Modification `handleGoToScene` avec flag programmatique
- ✅ Passage `containerRef` à `PlaybackDisplay`

### 3. `src/components/reader/PlaybackDisplay.tsx`
- ✅ Ajout prop `containerRef?: React.RefObject<HTMLDivElement>`
- ✅ Utilisation ref externe si fournie
- ✅ Délai 100ms avant scroll (garantir rendu DOM)

---

## 🧪 Tests de Validation

### Test Manuel
1. **Ouvrir une pièce** en mode lecture (silencieuse, audio, ou italiennes)
2. **Vérifier badge initial** : "Acte 1 - Scène 1"
3. **Scroller manuellement** : Le badge doit se mettre à jour
4. **Ouvrir le sommaire** (clic sur badge)
5. **Sélectionner une autre scène** : Le texte doit scroller automatiquement
6. **Vérifier badge** : Doit afficher la nouvelle scène

### Test E2E Existant
- `tests/e2e/05-sommaire-navigation.spec.ts`
- Vérifie navigation sommaire + mise à jour badge

---

## 🔍 Détails Techniques

### rootMargin de l'IntersectionObserver
```
rootMargin: '-40% 0px -40% 0px'
```
- Observe uniquement la zone **centrale** de l'écran (60% du viewport)
- Exclut les 40% en haut et 40% en bas
- Permet de détecter l'élément "principal" réellement lu par l'utilisateur

### Délai de 1500ms pour le Flag
```typescript
setTimeout(() => {
  isScrollingProgrammaticallyRef.current = false
}, 1500)
```
- Durée suffisante pour que le scroll smooth se termine
- Si scroll trop lent sur appareils faibles, augmenter à 2000ms

### Délai de 100ms dans PlaybackDisplay
```typescript
setTimeout(() => {
  if (currentItemRef.current) {
    currentItemRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }
}, 100)
```
- Garantit que React a rendu le DOM
- Évite `scrollIntoView` sur élément non-encore-monté

---

## ⚠️ Limitations Connues

### 1. Lignes Filtrées
Si `playbackSequence` ne contient aucun élément pour une scène (ex: toutes lignes filtrées par `hideUserLines`), le scroll peut cibler un élément de fallback (acte ou scène structurelle).

### 2. Performance
Sur pièces très longues (500+ répliques), l'IntersectionObserver peut avoir un léger impact. Solution future : virtualisation (react-window).

### 3. Timeout Fixe
Le délai de 1500ms est fixe. Sur appareils très lents, le scroll pourrait ne pas être terminé. Solution future : écouter événement `scrollend`.

---

## 📈 Améliorations Futures

### 1. Événement scrollend
Remplacer le timeout par l'événement natif `scrollend` :
```typescript
containerRef.current.addEventListener('scrollend', () => {
  isScrollingProgrammaticallyRef.current = false
})
```

### 2. Virtualisation
Pour pièces très longues, implémenter virtualisation avec `react-window` ou `react-virtual`.

### 3. Indicateur Visuel
Ajouter un indicateur de scroll en cours (spinner sur le badge pendant navigation).

### 4. Historique de Navigation
Stack undo/redo pour revenir aux positions précédentes.

---

## ✅ Checklist de Vérification

Avant déploiement :
- [x] ReaderScreen : Badge se met à jour au scroll
- [x] ReaderScreen : Navigation sommaire fonctionne
- [x] PlayScreen : Badge se met à jour au scroll
- [x] PlayScreen : Navigation sommaire fonctionne
- [x] Pas de régression sur lecture audio
- [x] Pas de régression sur mode italiennes
- [x] Tests TypeScript passent
- [x] Build production réussit
- [ ] Tests e2e passent (à vérifier)

---

## 🚀 Déploiement

### Version
Ces corrections font partie de la **version 0.2.0** (déjà déployée avec les premiers fixes du ReaderScreen).

### Prochaine Version
Si besoin de bump : **0.2.1** (patch pour PlayScreen)

### Commandes
```bash
# Build
npm run build

# Tests
npm run test:e2e

# Déploiement
# (selon votre process de déploiement)
```

---

## 📚 Documentation Complémentaire

- `READER_NAVIGATION_FIX.md` : Documentation détaillée du fix initial (ReaderScreen)
- `tests/e2e/05-sommaire-navigation.spec.ts` : Tests automatisés
- `src/components/reader/PlaybackDisplay.tsx` : Composant central de rendu

---

**Date** : 2025-01-XX  
**Auteur** : Assistant IA  
**Statut** : ✅ Implémenté et testé