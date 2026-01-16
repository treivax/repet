# Guide de démarrage rapide - Test du scroll automatique

## 🚀 Démarrage rapide (5 minutes)

### Prérequis
- Avoir compilé le projet : `npm run build` ou `npm run dev`
- Avoir une pièce de théâtre chargée dans l'application

### Tests essentiels à faire MAINTENANT

#### ✅ Test 1 : Navigation par sommaire (1 min)
1. Ouvrez une pièce
2. Cliquez sur l'icône de navigation (sommaire)
3. Cliquez sur une scène différente
4. **Vérifiez** : La vue scroll automatiquement vers cette scène

**Comportement attendu** : Scroll fluide et centré sur la carte de scène

---

#### ✅ Test 2 : Lecture audio continue (2 min)
1. Passez en mode "Lecture audio"
2. Cliquez sur une ligne pour lancer la lecture
3. Attendez que 5-6 lignes soient lues automatiquement
4. **Vérifiez** : Chaque ligne en cours reste toujours visible à l'écran

**Comportement attendu** : Scroll automatique à chaque nouvelle ligne, pas de saccades

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

## ⚠️ Problèmes connus AVANT le fix

Si vous testez sur une version AVANT ce correctif, vous devriez observer :

❌ **Test 1** : Cliquer sur une scène ne scroll pas → il faut scroller manuellement
❌ **Test 2** : Scrolls saccadés, parfois la ligne sort de l'écran
❌ **Test 3** : Les cartes ne scrollent pas automatiquement (uniquement les lignes)

## ✅ Comportements attendus APRÈS le fix

✅ **Test 1** : Scroll automatique et fluide vers la scène sélectionnée
✅ **Test 2** : Scroll fluide, ligne toujours visible, pas de saccades
✅ **Test 3** : Scroll automatique pour lignes ET cartes uniformément

---

## 🔍 Comment vérifier que le fix est appliqué

### Méthode 1 : Vérifier le commit
```bash
git log --oneline -1
```

Devrait afficher :
```
c7da143 docs: Ajouter checklist de tests pour le scroll automatique
ecb0484 fix: Centraliser et améliorer le scroll automatique dans PlayScreen
```

### Méthode 2 : Vérifier le code
Ouvrez `src/screens/PlayScreen.tsx` et cherchez la fonction `speakLine`.

**Avant le fix** (❌ mauvais) :
```typescript
// Scroll vers la ligne (l'élément a data-line-index={globalLineIndex})
scrollToLine(globalLineIndex)
```

**Après le fix** (✅ bon) :
```typescript
// Note: Le scroll automatique est géré par PlaybackDisplay via currentPlaybackIndex
// pour éviter les conflits entre plusieurs systèmes de scroll
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
- **Détails techniques** : `AUTOSCROLL_FIX.md` (explications du code)
- **Résumé** : `AUTOSCROLL_SUMMARY.md` (vue d'ensemble)

---

## 🎯 Objectif final

Après ce fix, l'expérience utilisateur devrait être :
- 🎭 Fluide : Pas de saccades, scrolls smooth
- 🎯 Précise : L'élément en cours toujours visible et centré
- 🔄 Cohérente : Même comportement pour lignes, cartes, structure
- 🧭 Intuitive : Navigation par sommaire avec scroll automatique

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