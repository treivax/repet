# Guide de Débogage - Navigation Sommaire

**Date** : 2025-01-XX  
**Problème** : Le composant de navigation sommaire ne fonctionne dans aucun mode de lecture  
**Version** : 0.2.1  
**Commit** : `5e1c1d7` - debug: Ajouter logs et améliorer calcul de currentPlaybackIndex

---

## 🐛 Problème Rapporté

Le composant de navigation de sommaire ne fonctionne **absolument pas** dans aucun mode de lecture :
- ❌ Cliquer sur une scène dans le sommaire ne scrolle pas vers la position
- ❌ Le badge de scène ne se met pas à jour pendant le scroll manuel
- ❓ Possibilité que le sommaire ne s'ouvre pas du tout

---

## 🔍 Modifications Récentes (Commit 5e1c1d7)

### 1. Amélioration du Calcul de `currentPlaybackIndex`

**Ancien code** (ne fonctionnait pas) :
```typescript
// Calculait basé sur currentLineIndex
const playbackItem = playbackSequence.find(
  (item) => item.type === 'line' && item.lineIndex === currentLineIndex
)
```

**Problème** : Si `currentLineIndex` pointait vers une ligne non présente dans `playbackSequence`, aucun item n'était trouvé et le scroll ne se déclenchait pas.

**Nouveau code** :
```typescript
// Calcule basé sur currentActIndex et currentSceneIndex
const firstLineItem = playbackSequence.find((item) => {
  if (item.type === 'line') {
    const line = currentPlay.ast.flatLines[lineItem.lineIndex]
    return line && line.actIndex === currentActIndex && line.sceneIndex === currentSceneIndex
  }
  return false
})

// Fallback : chercher un élément de structure (titre de scène/acte)
if (!firstLineItem) {
  const structureItem = playbackSequence.find((item) => {
    if (item.type === 'structure') {
      return item.actIndex === currentActIndex && 
             (item.structureType === 'scene' || item.structureType === 'act')
    }
    return false
  })
}
```

**Avantage** : Trouve toujours un item de la scène cible, même si la première ligne n'est pas dans la séquence.

### 2. Logs de Débogage Ajoutés

**Dans ReaderScreen.tsx** :
- `[ReaderScreen] 🔍 Recherche item pour Acte X, Scène Y`
- `[ReaderScreen] ✅ Ligne trouvée, playbackIndex=X`
- `[ReaderScreen] ⚠️ Aucune ligne trouvée, recherche structure...`
- `[ReaderScreen] ✅ Structure trouvée, playbackIndex=X`
- `[ReaderScreen] ❌ Aucun item trouvé pour cette scène!`
- `[ReaderScreen] 🎯 handleGoToScene appelé: Acte X, Scène Y`
- `[ReaderScreen] 📜 goToScene appelé, scroll programmatique activé/désactivé`

**Dans PlaybackDisplay.tsx** :
- `[PlaybackDisplay] 🔄 currentPlaybackIndex changed: X`
- `[PlaybackDisplay] ✅ Scrolling to item: X`
- `[PlaybackDisplay] ⚠️ Cannot scroll - ref not found`
- `[PlaybackDisplay] 🎯 Current item assigned ref`

---

## 🧪 Comment Tester et Déboguer

### 1. Ouvrir la Console DevTools

1. Ouvrir l'application dans le navigateur
2. Ouvrir DevTools (F12)
3. Aller dans l'onglet "Console"
4. Activer "Preserve log" pour garder les logs entre les navigations

### 2. Test de Base - Ouverture du Sommaire

**Actions** :
1. Charger une pièce et ouvrir le mode lecteur (n'importe quel mode)
2. Cliquer sur le badge "Acte X - Scène Y" en bas de l'écran

**Logs attendus** :
```
(aucun log attendu pour l'ouverture)
```

**Vérifications** :
- ✅ Le modal de sommaire s'ouvre
- ✅ La liste des actes et scènes est visible
- ✅ La scène courante est mise en évidence (fond bleu)

**Si ça ne marche pas** :
- Vérifier que `showSummary` passe à `true`
- Vérifier que le modal est bien rendu (inspecter le DOM)
- Chercher des erreurs JavaScript dans la console

### 3. Test Principal - Navigation via Sommaire

**Actions** :
1. Ouvrir le sommaire
2. Cliquer sur une scène différente (par ex. Acte 2, Scène 3)

**Logs attendus** :
```
[ReaderScreen] 🎯 handleGoToScene appelé: Acte 2, Scène 3
[ReaderScreen] 📜 goToScene appelé, scroll programmatique activé
[ReaderScreen] 🔍 Recherche item pour Acte 2, Scène 3
[ReaderScreen] ✅ Ligne trouvée, playbackIndex=42
[PlaybackDisplay] 🔄 currentPlaybackIndex changed: 42
[PlaybackDisplay] 🎯 Current item assigned ref: { index: 42, type: 'line' }
[PlaybackDisplay] ✅ Scrolling to item: 42
[ReaderScreen] 📜 Scroll programmatique désactivé
```

**Vérifications** :
- ✅ Le texte scrolle vers la scène sélectionnée
- ✅ Le sommaire se ferme automatiquement
- ✅ Le badge se met à jour pour afficher "Acte 2 - Scène 3"

**Si ça ne marche pas** :

#### Cas A : Aucun log n'apparaît
- Problème : `handleGoToScene` n'est pas appelé
- Cause : Le composant `SceneSummary` ne reçoit pas correctement `onSceneSelect`
- Solution : Vérifier les props passées à `SceneSummary`

#### Cas B : Logs jusqu'à "🔍 Recherche item" mais pas "✅ Ligne trouvée"
- Problème : Aucun item trouvé dans `playbackSequence` pour cette scène
- Cause possible :
  - La scène n'a aucune ligne
  - Les toggles `readStructure` sont désactivés et il n'y a que des structures
  - Bug dans `buildPlaybackSequence`
- Solution : 
  - Vérifier `playbackSequence` dans la console : `playbackSequence.filter(i => i.actIndex === 1 && i.sceneIndex === 2)`
  - Vérifier les settings : `playSettings.readStructure`, `readStageDirections`, `readPresentation`

#### Cas C : Logs jusqu'à "✅ Ligne trouvée" mais pas "✅ Scrolling to item"
- Problème : `currentPlaybackIndex` est défini mais le scroll ne se déclenche pas
- Cause : La ref n'est pas assignée à l'élément DOM
- Solution :
  - Vérifier que l'item est bien rendu dans le DOM
  - Inspecter l'élément avec `data-playback-index="42"`
  - Vérifier que `isCurrentItem` est vrai pour cet élément

#### Cas D : Logs jusqu'à "⚠️ Cannot scroll - ref not found"
- Problème : L'élément existe mais la ref n'est pas assignée
- Cause possible :
  - Timing : L'effet se déclenche avant que le DOM soit mis à jour
  - L'item n'est pas rendu (par ex. masqué par `hideUserLines`)
- Solution :
  - Ajouter un délai avant le scroll
  - Vérifier que l'item est bien visible dans le DOM

### 4. Test Secondaire - Scroll Manuel

**Actions** :
1. Scroller manuellement dans le texte avec la souris/doigt
2. Observer le badge pendant le scroll

**Logs attendus** :
```
(après 100-200ms de scroll, quand une nouvelle ligne devient visible)
[ReaderScreen] 🔍 Recherche item pour Acte 3, Scène 1
[ReaderScreen] ✅ Ligne trouvée, playbackIndex=67
[PlaybackDisplay] 🔄 currentPlaybackIndex changed: 67
```

**Vérifications** :
- ✅ Le badge se met à jour automatiquement
- ✅ Le numéro d'acte et de scène correspond à la position dans le texte

**Si ça ne marche pas** :
- Vérifier que `IntersectionObserver` est initialisé (pas de log mais vérifier dans la console)
- Vérifier que les éléments `[data-playback-type="line"]` sont observés
- Vérifier `isScrollingProgrammaticallyRef.current` (doit être `false` pendant scroll manuel)

---

## 🔧 Commandes de Débogage Console

### Inspecter l'État du Store

```javascript
// Voir l'état complet du playStore
const playState = JSON.parse(localStorage.getItem('repet-play-storage'))
console.log(playState.state)

// Acte et scène courants
console.log({
  actIndex: playState.state.currentActIndex,
  sceneIndex: playState.state.currentSceneIndex
})
```

### Inspecter la Séquence de Playback

```javascript
// Dans la console, si playbackSequence est accessible
// (sinon, ajouter temporairement window.playbackSequence = playbackSequence dans le code)

// Voir tous les items de la scène 2 de l'acte 1
playbackSequence.filter(item => 
  (item.type === 'line' && item.lineIndex !== undefined) || 
  (item.actIndex === 0 && item.sceneIndex === 1)
)

// Compter les items par type
const counts = {}
playbackSequence.forEach(item => {
  counts[item.type] = (counts[item.type] || 0) + 1
})
console.table(counts)
```

### Forcer un Scroll Manuel

```javascript
// Trouver l'élément avec playbackIndex = 42
const element = document.querySelector('[data-playback-index="42"]')
if (element) {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
} else {
  console.error('Element not found!')
}
```

---

## 🎯 Scénarios de Problèmes Possibles

### Scénario 1 : Le sommaire ne s'ouvre pas du tout

**Symptôme** : Cliquer sur le badge ne fait rien

**Causes possibles** :
- `showSummary` ne passe pas à `true`
- Z-index du badge trop bas (clics interceptés par autre chose)
- Handler `onOpenSummary` pas attaché correctement

**Vérification** :
```javascript
// Dans la console, forcer l'ouverture
setShowSummary(true) // Nécessite d'exposer la fonction ou d'utiliser React DevTools
```

### Scénario 2 : Le sommaire s'ouvre mais cliquer ne fait rien

**Symptôme** : Modal visible, liste des scènes visible, mais clic sans effet

**Causes possibles** :
- Handler `onSceneSelect` pas attaché
- `handleGoToScene` pas appelé
- Event propagation stoppée quelque part

**Vérification** :
- Chercher des logs `[ReaderScreen] 🎯 handleGoToScene appelé`
- Si absent, ajouter un log dans le composant `SceneSummary`

### Scénario 3 : La scène est trouvée mais pas de scroll

**Symptôme** : Logs montrent "✅ Ligne trouvée" mais pas de scroll visible

**Causes possibles** :
- L'élément est déjà visible (pas de scroll nécessaire)
- L'élément n'est pas rendu dans le DOM
- La ref n'est pas assignée à temps

**Vérification** :
- Inspecter manuellement le DOM
- Chercher `[data-playback-index="X"]` où X est le playbackIndex trouvé
- Vérifier la présence de la ref sur cet élément

### Scénario 4 : Scroll fonctionne une fois puis plus jamais

**Symptôme** : Premier clic fonctionne, suivants ne fonctionnent pas

**Causes possibles** :
- `isScrollingProgrammaticallyRef` reste à `true`
- Le timeout de 1 seconde est trop court ou ne se déclenche pas
- L'observer est déconnecté

**Vérification** :
```javascript
// Vérifier le flag dans la console
// (Nécessite d'exposer la ref ou d'utiliser React DevTools)
isScrollingProgrammaticallyRef.current // Devrait être false
```

---

## 🚀 Prochaines Étapes

1. **Déployer** : Le commit `5e1c1d7` est déjà poussé, le workflow va déployer automatiquement
2. **Tester** : Suivre ce guide pour reproduire le problème et capturer les logs
3. **Reporter** : Copier les logs de la console et décrire exactement ce qui ne fonctionne pas
4. **Corriger** : Basé sur les logs, identifier la cause racine et implémenter le fix

---

## 📝 Informations pour le Rapport de Bug

Si le problème persiste après test, inclure :

1. **Navigateur et OS** : Chrome/Firefox/Safari, version, Windows/Mac/Linux
2. **Mode de lecture** : Silent / Audio / Italian
3. **Actions effectuées** : Étapes exactes pour reproduire
4. **Logs de la console** : Copier tous les logs `[ReaderScreen]` et `[PlaybackDisplay]`
5. **État du store** : Sortie de `localStorage.getItem('repet-play-storage')`
6. **Capture d'écran** : Du sommaire ouvert et de la console

---

**Dernière mise à jour** : Commit `5e1c1d7`  
**Status** : En attente de tests et logs utilisateur