# Correction du Contrôle de Navigation de Sommaire

**Date** : 2025-01-XX  
**Fichier modifié** : `src/screens/ReaderScreen.tsx`  
**Problème** : Le contrôle de navigation de sommaire ne fonctionnait plus dans les écrans de lecture

---

## 🐛 Problèmes Identifiés

### 1. Navigation du sommaire vers le contenu non fonctionnelle

**Symptôme** : Lorsqu'on cliquait sur une scène dans le sommaire, le texte ne scrollait pas vers la position sélectionnée.

**Cause** : Le composant `PlaybackDisplay` recevait `currentPlaybackIndex={undefined}`, donc le mécanisme de scroll automatique basé sur ce prop ne se déclenchait jamais.

```tsx
// ❌ AVANT
<PlaybackDisplay
  ...
  currentPlaybackIndex={undefined}  // Toujours undefined !
  ...
/>
```

### 2. Badge de scène non mis à jour pendant le scroll

**Symptôme** : Le badge affichant "Acte X - Scène Y" ne se mettait pas à jour quand on scrollait manuellement dans le texte.

**Cause** : Aucun mécanisme n'existait pour détecter la position de scroll actuelle et mettre à jour `currentActIndex` et `currentSceneIndex` dans le store.

---

## ✅ Solutions Implémentées

### Solution 1 : Calcul automatique du `currentPlaybackIndex`

Ajout d'un `useEffect` qui calcule le `currentPlaybackIndex` basé sur le `currentLineIndex` du store :

```tsx
// Calculer currentPlaybackIndex basé sur currentLineIndex
useEffect(() => {
  if (playbackSequence.length === 0 || currentLineIndex === undefined) {
    setCurrentPlaybackIndex(undefined)
    return
  }

  // Trouver l'item de playback correspondant à la ligne courante
  const playbackItem = playbackSequence.find(
    (item) => item.type === 'line' && (item as LinePlaybackItem).lineIndex === currentLineIndex
  )

  if (playbackItem) {
    setCurrentPlaybackIndex(playbackItem.index)
  }
}, [currentLineIndex, playbackSequence])
```

**Résultat** : Quand on sélectionne une scène dans le sommaire, `goToScene()` met à jour `currentLineIndex`, ce qui déclenche le calcul du `currentPlaybackIndex`, et `PlaybackDisplay` scrolle automatiquement vers la bonne position.

### Solution 2 : IntersectionObserver pour la détection de position

Ajout d'un `IntersectionObserver` qui détecte l'élément ligne le plus visible dans la zone centrale de la vue :

```tsx
// IntersectionObserver pour détecter l'acte/scène visible pendant le scroll
const handleIntersection = useCallback(
  (entries: IntersectionObserverEntry[]) => {
    // Ne pas mettre à jour pendant un scroll programmatique
    if (isScrollingProgrammaticallyRef.current) {
      return
    }

    // Trouver l'élément le plus visible (plus grande intersection ratio)
    let mostVisibleEntry: IntersectionObserverEntry | null = null
    let maxRatio = 0

    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
        maxRatio = entry.intersectionRatio
        mostVisibleEntry = entry
      }
    }

    // Extraire lineIndex et mettre à jour le store si changement d'acte/scène
    // ...
  },
  [currentPlay, currentActIndex, currentSceneIndex]
)
```

**Configuration de l'observer** :
- **Zone de détection** : Zone centrale de la vue (`rootMargin: '-20% 0px -20% 0px'`)
- **Seuils** : Multiple thresholds pour une détection précise (`[0, 0.25, 0.5, 0.75, 1.0]`)
- **Cibles** : Tous les éléments `[data-playback-type="line"]`

**Résultat** : Pendant le scroll manuel, l'observer détecte la ligne la plus visible, extrait son `actIndex` et `sceneIndex`, et met à jour le store silencieusement. Le badge se met automatiquement à jour.

### Solution 3 : Prévention des conflits scroll programmatique vs manuel

Ajout d'un flag `isScrollingProgrammaticallyRef` pour éviter que l'observer mette à jour le store pendant un scroll programmatique (navigation sommaire) :

```tsx
const handleGoToScene = (actIndex: number, sceneIndex: number) => {
  if (isPlaying) {
    handleStop()
  }

  // Marquer qu'on fait un scroll programmatique
  isScrollingProgrammaticallyRef.current = true

  goToScene(actIndex, sceneIndex)
  setShowSummary(false)

  // Réactiver la détection après le scroll (1 seconde)
  setTimeout(() => {
    isScrollingProgrammaticallyRef.current = false
  }, 1000)
}
```

---

## 🔧 Détails Techniques

### Nouveaux Imports

```tsx
import { useEffect, useState, useCallback, useRef } from 'react'
import type { PlaybackItem, LinePlaybackItem } from '../core/models/types'
```

### Nouveaux États et Refs

```tsx
const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState<number | undefined>()

// Ref pour l'IntersectionObserver
const observerRef = useRef<IntersectionObserver | null>(null)
const isScrollingProgrammaticallyRef = useRef(false)
```

### TypeScript Strict Mode

Pour satisfaire le mode strict de TypeScript, utilisation de :
- Type narrowing explicite avec `instanceof HTMLElement`
- `getAttribute()` au lieu de `dataset` pour éviter les problèmes d'inférence
- Checks explicites avec early returns

```tsx
const element = mostVisibleEntry.target
if (!(element instanceof HTMLElement)) {
  return
}

const lineIndex = element.getAttribute('data-line-index')
if (!lineIndex) {
  return
}
```

---

## 🧪 Tests Recommandés

### Tests Manuels

1. **Navigation sommaire → contenu**
   - Ouvrir une pièce en mode lecteur
   - Ouvrir le sommaire (clic sur le badge)
   - Sélectionner une scène dans un acte différent
   - ✅ Le texte doit scroller vers la scène sélectionnée
   - ✅ Le sommaire doit se fermer automatiquement

2. **Mise à jour badge pendant scroll**
   - Scroller manuellement dans le texte avec la souris/doigt
   - ✅ Le badge doit se mettre à jour quand on change d'acte ou de scène
   - ✅ Le badge doit afficher les bons numéros d'acte et de scène

3. **Pas de conflit entre navigation et scroll**
   - Sélectionner une scène dans le sommaire
   - Pendant l'animation de scroll, scroller manuellement
   - ✅ Pas de saut ou de comportement erratique
   - ✅ L'animation de scroll se termine normalement

### Tests Automatisés (À Implémenter)

```typescript
// test/e2e/navigation-sommaire.spec.ts

test('should scroll to scene when clicking in summary', async () => {
  // 1. Ouvrir une pièce
  // 2. Ouvrir le sommaire
  // 3. Cliquer sur Acte 2, Scène 3
  // 4. Vérifier que l'élément correspondant est visible
  // 5. Vérifier que le badge affiche "Acte 2 - Scène 3"
})

test('should update badge when scrolling manually', async () => {
  // 1. Ouvrir une pièce
  // 2. Vérifier le badge initial
  // 3. Scroller jusqu'à une autre scène
  // 4. Vérifier que le badge s'est mis à jour
})
```

---

## 📊 Impact

### Fichiers Modifiés

- ✅ `src/screens/ReaderScreen.tsx` (+~110 lignes)

### Fichiers Non Affectés

- ✅ `src/screens/PlayScreen.tsx` (déjà fonctionnel, utilise `currentPlaybackIndex` différemment)
- ✅ `src/components/reader/PlaybackDisplay.tsx` (inchangé)
- ✅ `src/components/reader/SceneSummary.tsx` (inchangé)
- ✅ `src/components/reader/SceneBadge.tsx` (inchangé)

### Compatibilité

- ✅ TypeScript : Pas d'erreurs de compilation
- ✅ Build Production : Succès (offline + online)
- ✅ Modes de lecture : Fonctionne pour tous (silent, audio, italian)

---

## 🚀 Déploiement

```bash
# Vérification TypeScript
npm run type-check

# Build production
npm run build

# Tests e2e (recommandé avant déploiement)
npm run test:e2e

# Déploiement (GitHub Actions)
git add src/screens/ReaderScreen.tsx
git commit -m "fix: Restaurer la navigation de sommaire dans ReaderScreen"
git push origin main
```

---

## 📝 Notes

- L'IntersectionObserver est nettoyé correctement au démontage du composant
- Le délai de 1 seconde après navigation sommaire peut être ajusté si nécessaire
- La zone de détection centrale (`-20%`) peut être ajustée pour changer la sensibilité
- Solution compatible avec tous les modes de lecture (silent, audio, italian)

---

## 🔗 Références

- [MDN - Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Thread Zed](zed:///agent/thread/74ac5b8d-e9f6-4295-8d58-c1a96367734e?name=Header+and+Reader+Card+Consistency)
- Commit : `fix: Restaurer la navigation de sommaire dans ReaderScreen`
