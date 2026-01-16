# Bugfix: Audio Pause Not Working Due to Long Press Conflict

**Date:** 2025-01-XX  
**Status:** ✅ Fixed  
**Severity:** 🔴 Critical

## Problem Description

L'arrêt de la lecture audio en cliquant sur une carte en cours de lecture ne fonctionnait plus. L'événement de clic était bien déclenché et la carte était correctement marquée visuellement comme "en pause" (avec l'icône ⏸), mais **la lecture audio continuait** malgré tout.

### Symptômes

- ✅ Le clic sur une carte en cours de lecture déclenchait bien l'événement
- ✅ L'état visuel changeait correctement ("⏸ En pause" affiché)
- ❌ L'audio continuait de jouer sans s'arrêter
- ❌ Le comportement était incohérent et imprévisible

## Root Cause Analysis

Le problème était causé par un **conflit entre les gestionnaires d'événements** pour le clic simple et l'appui long, introduit lors de l'implémentation des annotations.

### Séquence d'événements problématique

Quand l'utilisateur faisait un appui légèrement prolongé (proche de 500ms) :

1. **`mousedown`** → Démarre le timer d'appui long (500ms)
2. **... utilisateur maintient ~500ms ...**
3. **Timer expire** → `onAnnotationCreate()` est appelé
4. **`mouseup`** → Annule le timer (déjà expiré)
5. **`click`** → **Appelle quand même `onClick()`** → `pausePlayback()` est appelé

Le problème : **deux actions étaient déclenchées** au lieu d'une seule :
- ✅ L'annotation était créée (action souhaitée pour l'appui long)
- ❌ **ET** `pausePlayback()` était appelé (action non souhaitée)

### Pourquoi cela cassait la pause ?

L'appel à `pausePlayback()` après la création d'annotation pouvait causer plusieurs problèmes :

1. **Toggle non intentionnel** : Si l'audio était en train de se mettre en pause au moment de la création d'annotation, le deuxième appel à `pausePlayback()` pouvait immédiatement faire `resume()`.

2. **Race condition** : La logique de `pausePlayback()` vérifiait `ttsEngine.isSpeaking()` et `isPaused`, mais ces états pouvaient être désynchronisés entre le moteur TTS et l'état React.

3. **Logique de pause fragile** : La fonction `pausePlayback()` dépendait uniquement de `isPaused` dans son tableau de dépendances, ce qui pouvait causer des problèmes de closure stale.

## Solution Implemented

### 1. Ajout d'un flag `longPressTriggered`

Pour chaque composant de carte (`StageDirectionCard`, `StructureCard`, `PresentationCard`, `LineRenderer`), nous avons ajouté un **ref** pour tracker si l'appui long a été déclenché :

```typescript
const longPressTriggered = useRef(false)
```

### 2. Mise à jour des gestionnaires d'événements

#### Dans `handleMouseDown` / `handleTouchStart` :
```typescript
const handleMouseDown = () => {
  longPressTriggered.current = false  // Reset au début
  if (onAnnotationCreate && !annotation) {
    const timer = window.setTimeout(() => {
      longPressTriggered.current = true  // Marquer comme déclenché
      onAnnotationCreate()
    }, 500)
    longPressTimer.current = timer
  } else {
    setIsClicked(true)
  }
}
```

#### Dans le handler `onClick` du bouton :
```typescript
onClick={(e) => {
  // Annuler le timer si toujours actif
  if (longPressTimer.current) {
    clearTimeout(longPressTimer.current)
    longPressTimer.current = null
  }
  
  // ⭐ Ne pas appeler onClick si l'appui long a déjà déclenché l'annotation
  if (!longPressTriggered.current) {
    onClick()
  }
  
  // Reset du flag
  longPressTriggered.current = false
}}
```

### 3. Amélioration de la logique `pausePlayback()`

Nous avons également amélioré la fonction `pausePlayback()` pour utiliser l'état du moteur TTS comme source de vérité :

```typescript
const pausePlayback = useCallback(() => {
  // Utiliser l'état du moteur TTS comme source de vérité
  const engineIsSpeaking = ttsEngine.isSpeaking()
  const engineIsPaused = ttsEngine.isPaused()

  if (engineIsSpeaking) {
    // En cours de lecture : mettre en pause
    ttsEngine.pause()
    setIsPaused(true)
  } else if (engineIsPaused) {
    // En pause : reprendre
    ttsEngine.resume()
    setIsPaused(false)
  }
  // Sinon (idle/generating) : ne rien faire
}, [])  // Pas de dépendance à isPaused pour éviter stale closure
```

## Files Modified

### Composants de cartes
- ✅ `src/components/play/PlaybackCards.tsx`
  - `StageDirectionCard` : Ajout du flag `longPressTriggered`
  - `StructureCard` : Ajout du flag `longPressTriggered`
  - `PresentationCard` : Ajout du flag `longPressTriggered`

### Composant de ligne
- ✅ `src/components/reader/LineRenderer.tsx`
  - Ajout de l'import `useRef`
  - Ajout du flag `longPressTriggered`
  - Mise à jour des handlers pour les lignes normales ET masquées

### Écran principal
- ✅ `src/screens/PlayScreen.tsx`
  - Refonte de la fonction `pausePlayback()`
  - Ajout de `useCallback` à `handleCardClick` et `handleLineClick`

## Testing Scenarios

### ✅ Scénario 1 : Clic court pour pause/resume
1. Démarrer la lecture audio d'une pièce
2. Cliquer rapidement sur la carte en cours de lecture
3. **Résultat attendu** : L'audio se met en pause immédiatement
4. Re-cliquer rapidement
5. **Résultat attendu** : L'audio reprend

### ✅ Scénario 2 : Appui long pour créer une annotation
1. Démarrer la lecture audio d'une pièce
2. Maintenir le doigt/souris sur une carte pendant >500ms
3. **Résultat attendu** : Une annotation est créée
4. **Résultat attendu** : L'audio **continue** de jouer (pas de pause)

### ✅ Scénario 3 : Appui moyen (~400ms)
1. Démarrer la lecture audio
2. Cliquer et maintenir pendant ~400ms (juste en dessous du seuil)
3. Relâcher
4. **Résultat attendu** : L'audio se met en pause (clic court détecté)
5. **Résultat attendu** : Aucune annotation n'est créée

### ✅ Scénario 4 : Clics multiples rapides
1. Démarrer la lecture audio
2. Cliquer plusieurs fois rapidement sur la même carte
3. **Résultat attendu** : Toggle pause/resume fonctionne correctement
4. **Résultat attendu** : Pas d'appels multiples non intentionnels

## Prevention

### Code Review Checklist

Lors de l'ajout de nouveaux gestionnaires d'événements :

- [ ] Vérifier qu'il n'y a pas de conflit entre `onClick`, `onMouseDown`, `onMouseUp`
- [ ] S'assurer que les timers sont bien annulés dans tous les cas
- [ ] Utiliser des flags (`useRef`) pour tracker les actions asynchrones
- [ ] Tester les scénarios de timing limite (appuis courts, moyens, longs)
- [ ] Vérifier la synchronisation des états (TTS engine vs React state)

### Best Practices

1. **Single Source of Truth** : Toujours utiliser l'état du moteur TTS (`ttsEngine.isSpeaking()`, `ttsEngine.isPaused()`) plutôt que l'état React pour les décisions critiques.

2. **Event Handlers Isolation** : Éviter d'avoir plusieurs handlers qui peuvent déclencher la même action (ex: `onClick` + `onMouseUp`).

3. **Flags pour Actions Asynchrones** : Utiliser des `useRef` pour tracker les actions asynchrones (timers, etc.) et empêcher les doubles appels.

4. **Empty Dependency Arrays** : Pour les fonctions qui interagissent directement avec des APIs externes (comme `ttsEngine`), considérer un tableau de dépendances vide si les closures stale peuvent causer des problèmes.

## Related Issues

- [Conflit appui long et édition](zed:///agent/thread/6595c6f5-b5fb-44e9-ac17-8389b63700a5) - Thread original
- `BUGFIX_ANNOTATION_LONG_PRESS.md` - Implémentation initiale de l'appui long
- `ANNOTATIONS_UNIVERSAL_SUPPORT.md` - Extension des annotations à toutes les cartes

## Conclusion

Le bug a été résolu en ajoutant un mécanisme de flag (`longPressTriggered`) qui empêche l'appel à `onClick()` lorsqu'un appui long a déjà déclenché la création d'une annotation. La logique de pause/resume a également été simplifiée pour utiliser l'état du moteur TTS comme source de vérité unique.

**Impact** : ✅ La pause/resume fonctionne désormais de manière fiable, même avec le système d'annotations par appui long activé.