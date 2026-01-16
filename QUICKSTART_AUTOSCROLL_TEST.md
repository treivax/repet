# Guide de démarrage rapide - Test du scroll automatique

## 🚀 Démarrage rapide (5 minutes)

### Prérequis
- Avoir compilé le projet : `npm run build` ou `npm run dev`
- Avoir une pièce de théâtre chargée dans l'application

### Tests essentiels à faire MAINTENANT

#### ✅ Test 1 : Navigation par sommaire (1 min)
1. Ouvrez une pièce
2. Cliquez sur l'icône de navigation (sommaire)
3. Cliquez sur une scène différente (de préférence au milieu de la pièce)
4. **Vérifiez** : La vue scroll automatiquement vers cette scène
5. **Vérifiez** : La carte de scène est **exactement centrée** verticalement

**Comportement attendu** : Scroll fluide, carte de scène mathématiquement centrée dans la fenêtre

---

#### ✅ Test 2 : Lecture audio continue (2 min)
1. Passez en mode "Lecture audio"
2. Cliquez sur une ligne pour lancer la lecture
3. Attendez que 5-6 lignes soient lues automatiquement
4. **Vérifiez** : Chaque ligne en cours reste toujours visible à l'écran
5. **Vérifiez** : Les lignes sont **centrées** dans la vue (pas en haut ou en bas)

**Comportement attendu** : Scroll automatique à chaque nouvelle ligne, centrage précis, pas de saccades

---

#### ✅ Test 3 : Lecture avec cartes (2 min)
1. En mode "Lecture audio", activez les toggles :
   - ☑️ Didascalies
   - ☑️ Structure
   - ☑️ Présentation
2. Lancez la lecture depuis le début
3. Laissez progresser pendant 10 éléments
4. **Vérifiez** : Les cartes (bleues, structure) scrollent aussi bien que les lignes

**Comportement attendu** : Scroll automatique pour TOUS les types d'éléments

---

## ⚠️ Problèmes connus AVANT les fixes

Si vous testez sur une version AVANT ces correctifs, vous devriez observer :

❌ **Test 1** : Cliquer sur une scène ne scroll pas → il faut scroller manuellement
❌ **Test 2** : Scrolls saccadés, parfois la ligne sort de l'écran
❌ **Test 3** : Les cartes ne scrollent pas automatiquement (uniquement les lignes)
❌ **Positionnement** : Éléments hors de la vue, décalés vers le haut ou le bas

## ✅ Comportements attendus APRÈS les fixes

✅ **Test 1** : Scroll automatique et fluide, scène exactement centrée
✅ **Test 2** : Scroll fluide, ligne toujours visible et centrée, pas de saccades
✅ **Test 3** : Scroll automatique pour lignes ET cartes uniformément
✅ **Positionnement** : Chaque élément mathématiquement centré dans la vue (±5px)

---

## 🔍 Comment vérifier que le fix est appliqué

### Méthode 1 : Vérifier le commit
```bash
git log --oneline -3
```

Devrait afficher :
```
d661720 fix: Améliorer le calcul de position du scroll automatique
c7da143 docs: Ajouter checklist de tests pour le scroll automatique
ecb0484 fix: Centraliser et améliorer le scroll automatique dans PlayScreen
```

### Méthode 2 : Vérifier le code
Ouvrez `src/components/reader/PlaybackDisplay.tsx` et cherchez le `useEffect` de scroll.

**Avant les fixes** (❌ mauvais) :
```typescript
if (targetElement) {
  targetElement.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  })
}
```

**Après les fixes** (✅ bon) :
```typescript
if (targetElement && activeContainerRef.current) {
  const containerRect = activeContainerRef.current.getBoundingClientRect()
  const elementRect = targetElement.getBoundingClientRect()
  const containerHeight = containerRect.height
  const elementHeight = elementRect.height
  const elementTop = targetElement.offsetTop
  const targetScroll = elementTop - containerHeight / 2 + elementHeight / 2

  activeContainerRef.current.scrollTo({
    top: targetScroll,
    behavior: 'smooth',
  })
}
```

---

## 🐛 Si vous trouvez un bug

### Étapes :
1. Notez exactement ce que vous faisiez
2. Ouvrez la console du navigateur (F12)
3. Vérifiez s'il y a des erreurs (rouges)
4. Essayez de reproduire le bug 2-3 fois
5. Créez un rapport avec :
   - Description du problème
   - Étapes de reproduction
   - Navigateur utilisé
   - Logs de la console (copier/coller)

### Bugs typiques à surveiller :
- ❌ Scroll ne se déclenche pas du tout
- ❌ Scroll va au mauvais endroit
- ❌ Scrolls multiples successifs (saccades)
- ❌ Erreur dans la console
- ❌ L'élément en cours sort de l'écran pendant la lecture
- ❌ Élément décalé (pas centré) : trop haut ou trop bas
- ❌ Scroll s'arrête avant d'atteindre l'élément cible

---

## 📊 Résultats attendus

Si les 3 tests essentiels passent :
- ✅ Le fix fonctionne correctement
- ✅ Vous pouvez passer aux tests détaillés (voir `AUTOSCROLL_TESTS.md`)

Si au moins 1 test échoue :
- ⚠️ Il y a un problème à investiguer
- 📝 Créez un rapport de bug détaillé
- 🔍 Consultez `AUTOSCROLL_FIX.md` pour comprendre le fonctionnement technique

---

## 📚 Documentation complète

Pour aller plus loin :
- **Tests complets** : `AUTOSCROLL_TESTS.md` (10 tests détaillés)
- **Détails techniques** : `AUTOSCROLL_FIX.md` (première correction - centralisation)
- **Positionnement** : `SCROLL_POSITIONING_FIX.md` (seconde correction - calcul précis)
- **Résumé** : `AUTOSCROLL_SUMMARY.md` (vue d'ensemble)

---

## 🎯 Objectif final

Après ces fixes, l'expérience utilisateur devrait être :
- 🎭 Fluide : Pas de saccades, scrolls smooth
- 🎯 Précise : L'élément en cours toujours visible et **mathématiquement centré**
- 🔄 Cohérente : Même comportement pour lignes, cartes, structure
- 🧭 Intuitive : Navigation par sommaire avec scroll automatique
- 📐 Exacte : Centrage à ±5px (au lieu de ±200px)

**Temps estimé pour validation complète** : 5 minutes (tests essentiels) + 30 minutes (tests détaillés)

---

## ✅ Checklist rapide

- [ ] Code compilé sans erreur
- [ ] Test 1 (navigation sommaire) : ✅ PASS
- [ ] Test 2 (lecture continue) : ✅ PASS
- [ ] Test 3 (lecture avec cartes) : ✅ PASS
- [ ] Aucune erreur dans la console
- [ ] Prêt pour tests détaillés

**Si tous les tests passent → 🎉 Le fix fonctionne !**