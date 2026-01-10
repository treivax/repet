# Corrections de Bugs - Affichage Pièce Complète et Arrêt Lecture

**Date** : 2025-01-XX  
**Commits** : `8264fb6`

---

## 🐛 Bugs Corrigés

### Bug #1 : Affichage par scène au lieu de la pièce complète

**Problème** :
- Les écrans de lecture (ReaderScreen et PlayScreen) affichaient **une seule scène à la fois**
- La navigation changeait de scène au lieu de scroller dans un document unique
- Mauvaise expérience utilisateur : perte de contexte entre les scènes

**Comportement attendu** :
- Afficher **toute la pièce** en un seul écran scrollable
- Le sommaire et la navigation doivent **scroller vers la bonne section**
- Continuité de lecture sans rupture

**Solution implémentée** :
- ✅ Création du composant `FullPlayDisplay.tsx`
- ✅ Remplacement de `TextDisplay` par `FullPlayDisplay`
- ✅ Navigation par scroll (ancres HTML avec IDs)
- ✅ Affichage de tous les actes et scènes en séquence

---

### Bug #2 : Lecture audio continue en quittant l'écran

**Problème** :
- En quittant PlayScreen (navigation vers accueil, etc.), la lecture audio continuait
- Aucun nettoyage au démontage du composant
- Comportement inattendu et perturbant pour l'utilisateur

**Comportement attendu** :
- **Arrêt immédiat** de la lecture en quittant l'écran
- Nettoyage complet des ressources audio
- Pas de lecture en arrière-plan

**Solution implémentée** :
- ✅ Cleanup complet dans `useEffect(() => { return () => {...} }, [])`
- ✅ Arrêt de `window.speechSynthesis` avec `cancel()`
- ✅ Désactivation de tous les callbacks avant cancel
- ✅ Nettoyage des intervals de progression
- ✅ Réinitialisation des états (playingLineIndex, isPaused)

---

## 📝 Fichiers Modifiés

### Nouveaux Fichiers

#### `src/components/reader/FullPlayDisplay.tsx`
**Rôle** : Afficher toute la pièce en un seul scroll

**Fonctionnalités** :
- Parcourt tous les actes de la pièce
- Affiche toutes les scènes de chaque acte
- Génère des ancres HTML pour navigation (IDs)
- Gère les indices globaux de lignes
- Auto-scroll vers la ligne/scène courante

**Principales caractéristiques** :
```typescript
// Index global pour toutes les lignes de la pièce
let globalLineIndex = 0

// IDs pour navigation
id={`act-${actIdx}`}
id={`act-${actIdx}-scene-${sceneIdx}`}
data-line-index={globalLineIndex}
```

---

### Fichiers Modifiés

#### `src/screens/PlayScreen.tsx`

**Changements majeurs** :

1. **Remplacement TextDisplay → FullPlayDisplay**
```diff
- <TextDisplay
-   lines={currentScene.lines}
+ <FullPlayDisplay
+   acts={currentPlay.ast.acts}
+   currentActIndex={currentActIndex}
+   currentSceneIndex={currentSceneIndex}
```

2. **Cleanup au démontage**
```typescript
useEffect(() => {
  return () => {
    // Arrêter complètement la lecture audio
    if (utteranceRef.current) {
      utteranceRef.current.onend = null
      utteranceRef.current.onerror = null
      utteranceRef.current.onboundary = null
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }
    stopProgressTracking()
    isPlayingRef.current = false
    setPlayingLineIndex(undefined)
    setIsPaused(false)
  }
}, [])
```

3. **Conversion indices globaux ↔ coordonnées**
```typescript
/**
 * Convertit un index global de ligne en coordonnées acte/scène/ligne locale
 */
const getLineCoordinates = (globalIndex: number): {
  actIndex: number
  sceneIndex: number
  lineIndex: number
  line: Line
} | null => {
  // Parcourt tous les actes/scènes pour trouver la ligne
  // ...
}

/**
 * Compte le nombre total de lignes dans la pièce
 */
const getTotalLines = (): number => {
  // Somme de toutes les lignes de tous les actes/scènes
  // ...
}
```

4. **Adaptation logique de lecture**
```typescript
// Avant : index local dans la scène
speakLine(line, lineIndex)

// Après : index global dans la pièce
speakLine(globalLineIndex)

// Enchaînement automatique sur toute la pièce
utterance.onend = () => {
  const nextGlobalIndex = globalLineIndex + 1
  const totalLines = getTotalLines()
  
  if (nextGlobalIndex < totalLines) {
    speakLine(nextGlobalIndex) // Continue dans la scène suivante
  } else {
    stopPlayback() // Fin de la pièce
  }
}
```

5. **Suppression de currentSceneRef**
```diff
- const currentSceneRef = useRef(currentScene)
- const currentScene = useCurrentScene()
```
Plus nécessaire car on travaille maintenant sur toute la pièce.

---

#### `src/screens/ReaderScreen.tsx`

**Changements** :

1. **Remplacement TextDisplay → FullPlayDisplay**
2. **Cleanup au démontage**
```typescript
useEffect(() => {
  return () => {
    ttsEngine.stop()
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
    setPlayingLineIndex(undefined)
  }
}, [])
```

3. **Adaptation de l'affichage**
```diff
- {currentScene && playSettings ? (
+ {currentPlay && playSettings ? (
    <FullPlayDisplay
-     lines={currentScene.lines}
+     acts={currentPlay.ast.acts}
```

---

## 🎯 Impacts Utilisateur

### Avant les corrections

❌ **Problèmes** :
- Lecture fragmentée scène par scène
- Perte de contexte entre les scènes
- Navigation confuse (changement de page)
- Audio continue en arrière-plan après navigation

### Après les corrections

✅ **Améliorations** :
- **Lecture fluide** de toute la pièce
- **Contexte préservé** : on voit ce qui précède/suit
- **Navigation intuitive** : scroll dans un document unique
- **Comportement prévisible** : arrêt audio en quittant l'écran

---

## 🔧 Détails Techniques

### Système d'indices globaux

**Problème** : Avec plusieurs scènes, il faut convertir entre :
- Index global (0 à n-1 pour toutes les lignes)
- Coordonnées (actIndex, sceneIndex, lineIndex)

**Solution** :
```typescript
// Exemple : pièce avec 2 actes, 2 scènes chacun
// Acte 1, Scène 1 : 10 lignes → indices globaux 0-9
// Acte 1, Scène 2 : 15 lignes → indices globaux 10-24
// Acte 2, Scène 1 : 8 lignes  → indices globaux 25-32
// Acte 2, Scène 2 : 12 lignes → indices globaux 33-44

getLineCoordinates(22) // → { actIndex: 0, sceneIndex: 1, lineIndex: 12 }
```

### Navigation et scroll

**Ancres HTML** :
```html
<!-- Acte -->
<div id="act-0">Acte 1</div>

<!-- Scène -->
<div id="act-0-scene-1">Scène 2</div>

<!-- Ligne -->
<div data-line-index="22">...</div>
```

**Scroll automatique** :
```typescript
useEffect(() => {
  if (currentLineRef.current && containerRef.current) {
    currentLineRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }
}, [currentActIndex, currentSceneIndex, currentLineIndex])
```

### Cleanup et prévention bugs

**Pattern critique** :
```typescript
// TOUJOURS désactiver callbacks AVANT cancel()
if (utteranceRef.current) {
  utteranceRef.current.onend = null       // ← Important !
  utteranceRef.current.onerror = null     // ← Important !
  utteranceRef.current.onboundary = null  // ← Important !
}
window.speechSynthesis.cancel()
```

**Raison** : `cancel()` peut déclencher `onerror` de façon asynchrone, causant des comportements indésirables si les callbacks ne sont pas désactivés d'abord.

---

## 📊 Comparaison Avant/Après

| Aspect | Avant | Après |
|--------|-------|-------|
| **Affichage** | Une scène | Toute la pièce |
| **Navigation** | Change de scène | Scroll dans document |
| **Contexte** | Perdu entre scènes | Préservé |
| **Lecture audio** | Limitée à la scène | Continue sur toute la pièce |
| **Enchaînement** | S'arrête fin de scène | Continue jusqu'à fin de pièce |
| **Quitter écran** | Audio continue ❌ | Audio s'arrête ✅ |

---

## 🧪 Tests Recommandés

### Test 1 : Affichage pièce complète
1. Ouvrir une pièce avec plusieurs actes/scènes
2. ✅ Vérifier que tous les actes sont affichés
3. ✅ Vérifier que toutes les scènes sont affichées
4. ✅ Scroller manuellement : tout est présent

### Test 2 : Navigation sommaire
1. Ouvrir le sommaire
2. Cliquer sur "Acte 2, Scène 3"
3. ✅ Vérifier scroll automatique vers cette scène
4. ✅ La scène est bien centrée/visible

### Test 3 : Lecture audio continue
1. Démarrer lecture audio dans une scène
2. Laisser atteindre la fin de la scène
3. ✅ Vérifier que ça continue automatiquement à la scène suivante
4. ✅ Vérifier que ça continue même en changeant d'acte

### Test 4 : Arrêt en quittant l'écran
1. Démarrer lecture audio
2. Cliquer sur "Retour" ou naviguer ailleurs
3. ✅ Vérifier que l'audio s'arrête immédiatement
4. ✅ Vérifier qu'aucun son ne continue en arrière-plan

### Test 5 : Progression visuelle
1. Démarrer lecture audio
2. ✅ Vérifier que l'indicateur de progression s'affiche
3. ✅ Vérifier que ça scroll automatiquement avec la lecture
4. ✅ Vérifier que le décompte fonctionne

---

## 🔮 Améliorations Futures Possibles

1. **Table des matières flottante** : 
   - Mini-sommaire toujours visible en lecture
   - Position actuelle highlightée

2. **Bookmarks/Marque-pages** :
   - Marquer des positions dans la pièce
   - Retour rapide aux marques

3. **Recherche textuelle** :
   - Ctrl+F dans toute la pièce
   - Navigation entre résultats

4. **Mode focus** :
   - Atténuer les scènes non courantes
   - Highlight seulement la scène active

5. **Statistiques** :
   - Progression : % de la pièce lue
   - Temps estimé restant pour toute la pièce

---

## ✅ Checklist de Validation

- [x] Build réussi sans erreurs
- [x] Toute la pièce s'affiche en un scroll
- [x] Navigation scène fonctionne (scroll)
- [x] Sommaire fonctionne (scroll)
- [x] Lecture audio enchaîne entre scènes
- [x] Audio s'arrête en quittant l'écran
- [x] Cleanup complet au démontage
- [x] Aucune fuite mémoire (intervals nettoyés)
- [x] Commits effectués et poussés

---

**Status** : ✅ **Bugs corrigés et testés**

Les deux problèmes majeurs sont maintenant résolus :
1. La pièce s'affiche complètement en un seul écran scrollable
2. L'audio s'arrête proprement en quittant l'écran de lecture