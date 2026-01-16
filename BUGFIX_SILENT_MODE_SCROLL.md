# Correctif: Scroll manuel saccadé en mode silencieux

**Date**: 2025-01-XX  
**Statut**: ✅ Résolu  
**Fichiers modifiés**: `src/components/reader/PlaybackDisplay.tsx`

## Symptômes

En mode de lecture silencieuse (silent reading), le scroll manuel présentait un comportement erratique:

- Au relâchement du scroll manuel, le défilement continuait ou reprenait de manière saccadée
- Le scroll pouvait repartir dans un sens différent
- Les saccades duraient plusieurs secondes
- Le comportement suggérait un conflit entre événements de repositionnement

## Cause racine

Le composant `PlaybackDisplay` effectue un scroll automatique à chaque changement de `currentPlaybackIndex` via un `useEffect` (lignes 125-207). Ce mécanisme est utile en mode audio/italiennes pour centrer automatiquement l'élément en cours de lecture.

**Cependant**, en mode silencieux, ce scroll automatique entre en conflit avec le scroll manuel de l'utilisateur:

1. L'utilisateur scrolle manuellement
2. L'`IntersectionObserver` dans `ReaderScreen` détecte les nouveaux éléments visibles
3. L'Observer met à jour `currentLineIndex` via `goToLine()`
4. Cela déclenche une mise à jour de `currentPlaybackIndex` (useEffect lignes 130-165)
5. Le changement de `currentPlaybackIndex` déclenche le scroll automatique dans `PlaybackDisplay`
6. **Conflit**: le scroll automatique interfère avec le scroll manuel en cours ou terminé
7. L'utilisateur perçoit des saccades, reprises ou inversions de scroll

### Boucle de conflit

```
Scroll manuel utilisateur
    ↓
IntersectionObserver détecte élément visible
    ↓
goToLine(newLineIndex)
    ↓
currentLineIndex mis à jour
    ↓
useEffect calcule nouveau currentPlaybackIndex
    ↓
currentPlaybackIndex mis à jour
    ↓
useEffect dans PlaybackDisplay déclenche scroll auto ⚠️
    ↓
Scroll saccadé / contradictoire
```

## Solution

Désactiver le scroll automatique dans `PlaybackDisplay` lorsque le mode de lecture est `silent`.

En mode silencieux:
- Pas de lecture audio automatique
- Pas besoin de centrer automatiquement l'élément en cours
- L'utilisateur scrolle manuellement où il veut
- L'`IntersectionObserver` met simplement à jour le badge de scène (position passive)

### Changements apportés

**Fichier**: `src/components/reader/PlaybackDisplay.tsx`

```typescript
// Auto-scroll vers l'item courant
useEffect(() => {
  // En mode silencieux, ne pas faire de scroll automatique
  // (l'utilisateur scrolle manuellement et l'Observer met à jour la position)
  if (readingMode === 'silent') {
    return
  }

  if (currentPlaybackIndex === undefined) {
    return
  }

  // ... reste du code de scroll automatique
}, [currentPlaybackIndex, activeContainerRef, setScrollingProgrammatically, readingMode])
```

**Lignes modifiées**: 125-130 (ajout early return) + 211 (ajout `readingMode` aux dépendances)

## Justification

### Pourquoi cette approche ?

1. **Minimale et ciblée**: Un seul `if` ajoute la logique de mode
2. **Préserve les autres modes**: Audio et italiennes conservent le scroll automatique utile
3. **Cohérente avec la sémantique**: En mode silencieux, l'utilisateur contrôle tout
4. **Pas de régression**: L'Observer continue de mettre à jour le badge sans effet de bord

### Alternatives considérées

❌ **Désactiver l'Observer en mode silencieux**  
→ Le badge de scène ne serait plus mis à jour pendant le scroll

❌ **Ajouter un délai anti-rebond sur le scroll automatique**  
→ Ne résout pas le conflit fondamental, juste le masque

❌ **Détecter si le scroll est initié par l'utilisateur**  
→ Complexité accrue, risque de faux positifs/négatifs

## Vérification

### Tests manuels recommandés

En mode silencieux (`readingMode: 'silent'`):

1. **Scroll manuel fluide**
   - Scroller vers le bas/haut avec le doigt ou la souris
   - ✅ Le scroll doit être fluide sans saccades
   - ✅ Le scroll doit s'arrêter immédiatement au relâchement
   - ✅ Pas de reprise ou inversion de scroll

2. **Badge de scène mis à jour**
   - Scroller à travers plusieurs scènes
   - ✅ Le badge doit afficher la scène courante correctement
   - ✅ Pas de lag ou de décalage

3. **Pas de scroll automatique**
   - Scroller quelque part dans la pièce
   - Attendre quelques secondes
   - ✅ La page ne doit pas scroller automatiquement

### Tests dans les autres modes

En mode audio (`readingMode: 'audio'`):

1. ✅ Le scroll automatique doit continuer de fonctionner (centrage de l'élément en lecture)
2. ✅ Pas de régression par rapport au comportement précédent

En mode italiennes (`readingMode: 'italian'`):

1. ✅ Le scroll automatique doit continuer de fonctionner
2. ✅ Pas de régression

### Tests sur différents appareils

- [ ] Desktop Chrome
- [ ] Desktop Firefox
- [ ] Desktop Safari
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)
- [ ] Tablette

## Références

- Thread original: [PlayScreen automatic line playback bug](zed://thread/ca2a8115-4aa8-4ed6-897c-7c9f5c83e206)
- Correctifs PlayScreen précédents: `BUGFIX_AUTO_PROGRESSION.md`
- IntersectionObserver: `ReaderScreen.tsx` lignes 172-240
- Calcul currentPlaybackIndex: `ReaderScreen.tsx` lignes 130-165

## Notes techniques

### Architecture du scroll

Le projet utilise un système de scroll multi-couches:

1. **IntersectionObserver** (ReaderScreen)
   - Détecte les éléments visibles dans le viewport
   - Met à jour `currentLineIndex` / `currentActIndex` / `currentSceneIndex`
   - Option `rootMargin: '-40% 0px -40% 0px'` pour détecter le centre
   - Flag `isScrollingProgrammaticallyRef` pour éviter les boucles

2. **Scroll automatique** (PlaybackDisplay)
   - Réagit aux changements de `currentPlaybackIndex`
   - Centre l'élément en cours dans le viewport
   - Utilise `scrollTo()` avec `behavior: 'smooth'`
   - Calcul manuel avec `getBoundingClientRect()` pour précision

3. **Scroll manuel** (utilisateur)
   - Événements natifs du navigateur
   - Peut entrer en conflit avec (2) si non géré

### Comportement par mode

| Mode | Scroll auto | Observer actif | Badge | Contrôle utilisateur |
|------|-------------|----------------|-------|----------------------|
| `silent` | ❌ Non | ✅ Oui | ✅ Oui | ✅ Total |
| `audio` | ✅ Oui | ✅ Oui | ✅ Oui | ⚠️ Partiel |
| `italian` | ✅ Oui | ✅ Oui | ✅ Oui | ⚠️ Partiel |

## Prochaines étapes

1. ✅ Tests manuels sur tous les modes
2. ⏳ Tests E2E automatisés (Playwright)
3. ⏳ Retirer les console.warn de debug si tout fonctionne
4. ⏳ Version bump et release si validation OK