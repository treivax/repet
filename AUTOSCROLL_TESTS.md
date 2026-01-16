# Checklist de tests pour le scroll automatique

## 🎯 Objectif des tests
Valider que les améliorations du scroll automatique fonctionnent correctement dans tous les scénarios d'utilisation.

## ✅ Tests fonctionnels

### Test 1 : Navigation par sommaire (sélection de scène)
**Objectif** : Vérifier que sélectionner une scène dans le sommaire scroll automatiquement vers cette scène.

#### Étapes :
1. Ouvrir une pièce de théâtre avec plusieurs actes et scènes
2. Ouvrir le sommaire (navigation)
3. Cliquer sur une scène différente de celle affichée actuellement
4. Observer le comportement du scroll

#### Résultats attendus :
- [ ] La vue scroll automatiquement et en douceur (smooth) vers la carte de la scène sélectionnée
- [ ] La carte de scène est centrée verticalement dans la vue
- [ ] Le badge de navigation se met à jour pour refléter la nouvelle position
- [ ] Pas de saccades pendant le scroll
- [ ] Le scroll ne s'arrête pas prématurément

#### Variantes à tester :
- [ ] Scène au début de la pièce
- [ ] Scène au milieu de la pièce
- [ ] Scène à la fin de la pièce
- [ ] Navigation rapide entre plusieurs scènes (cliquer successivement)

---

### Test 2 : Lecture audio - Ligne unique
**Objectif** : Vérifier que cliquer sur une ligne en mode audio scroll vers cette ligne et la garde visible.

#### Étapes :
1. Ouvrir une pièce en mode "Lecture audio"
2. Scroller manuellement vers le bas ou le haut pour déplacer la vue
3. Cliquer sur une ligne visible pour lancer la lecture
4. Observer le comportement du scroll

#### Résultats attendus :
- [ ] La ligne cliquée reste visible ou scroll pour être centrée
- [ ] Pas de double scroll ou de va-et-vient
- [ ] Le scroll est fluide (smooth)
- [ ] La ligne est mise en surbrillance pendant la lecture

---

### Test 3 : Lecture audio - Enchaînement automatique
**Objectif** : Vérifier que la lecture continue garde toujours l'élément en cours visible.

#### Étapes :
1. Ouvrir une pièce en mode "Lecture audio"
2. Activer la lecture des didascalies, structure, et présentation (tous les toggles)
3. Cliquer sur une ligne pour lancer la lecture
4. Laisser la lecture progresser automatiquement pendant au moins 10 éléments
5. Observer le comportement du scroll à chaque nouvel élément

#### Résultats attendus :
- [ ] Chaque élément en cours de lecture reste visible à l'écran
- [ ] Le scroll automatique se déclenche avant que l'élément ne sorte de la vue
- [ ] Pas de saccades entre les scrolls
- [ ] Fonctionne pour tous les types d'éléments :
  - [ ] Lignes (répliques)
  - [ ] Didascalies (cartes bleues)
  - [ ] Structure (cartes acte/scène)
  - [ ] Présentation (distribution, etc.)

---

### Test 4 : Lecture audio - Éléments hors écran
**Objectif** : Vérifier que le scroll fonctionne même si l'élément suivant est très loin.

#### Étapes :
1. Ouvrir une pièce en mode "Lecture audio"
2. Cliquer sur une ligne au début de la pièce
3. Pendant que cette ligne est lue, scroller manuellement tout en bas de la pièce
4. Attendre que la lecture passe à l'élément suivant
5. Observer le comportement du scroll

#### Résultats attendus :
- [ ] Le scroll remonte automatiquement vers l'élément en cours de lecture
- [ ] L'élément est centré dans la vue
- [ ] Le scroll est fluide malgré la grande distance

---

### Test 5 : Mode italienne - Lignes utilisateur
**Objectif** : Vérifier que le scroll fonctionne correctement en mode italienne.

#### Étapes :
1. Ouvrir une pièce en mode "Répétition à l'italienne"
2. Sélectionner un personnage utilisateur
3. Lancer la lecture d'une ligne
4. Observer le comportement pendant l'enchaînement automatique

#### Résultats attendus :
- [ ] Les lignes de l'utilisateur (volume faible) restent visibles
- [ ] Les lignes des autres personnages (volume normal) restent visibles
- [ ] Le scroll fonctionne uniformément pour tous les types de lignes

---

### Test 6 : Pause et reprise
**Objectif** : Vérifier que le scroll se repositionne correctement après une pause.

#### Étapes :
1. Ouvrir une pièce en mode "Lecture audio"
2. Lancer la lecture d'une ligne
3. Cliquer sur la ligne en cours pour mettre en pause
4. Scroller manuellement vers un autre endroit de la pièce
5. Cliquer à nouveau sur la ligne en pause pour reprendre
6. Observer le comportement du scroll

#### Résultats attendus :
- [ ] À la reprise, le scroll revient automatiquement à la ligne en pause
- [ ] La ligne est centrée dans la vue
- [ ] Le scroll est fluide

---

### Test 7 : Interaction utilisateur pendant la lecture
**Objectif** : Vérifier que le scroll manuel de l'utilisateur ne crée pas de conflit.

#### Étapes :
1. Ouvrir une pièce en mode "Lecture audio"
2. Lancer la lecture d'une ligne
3. Pendant la lecture, scroller manuellement vers le haut ou le bas
4. Attendre que la lecture passe à l'élément suivant
5. Observer le comportement

#### Résultats attendus :
- [ ] Le scroll manuel est respecté pendant la lecture de l'élément courant
- [ ] Quand l'élément suivant démarre, le scroll automatique se réactive
- [ ] Pas de conflit ou de saccade entre scroll manuel et automatique
- [ ] Le badge de navigation se met à jour selon la position scrollée manuellement

---

### Test 8 : Cartes uniquement (sans lignes)
**Objectif** : Vérifier que le scroll fonctionne pour les cartes (structure, didascalies, présentation).

#### Étapes :
1. Ouvrir une pièce en mode "Lecture audio"
2. Activer uniquement la lecture de la structure et des didascalies
3. Désactiver la lecture des répliques (si possible via toggle, sinon passer manuellement)
4. Lancer la lecture depuis une carte de structure
5. Observer le comportement du scroll pendant l'enchaînement

#### Résultats attendus :
- [ ] Les cartes en cours de lecture restent visibles
- [ ] Le scroll automatique fonctionne aussi bien que pour les lignes
- [ ] Pas de saccades

---

### Test 9 : Pièce très longue (performance)
**Objectif** : Vérifier que le scroll reste performant avec une pièce contenant >1000 éléments.

#### Étapes :
1. Ouvrir une très longue pièce (ex: Shakespeare, Molière 5 actes)
2. Lancer la lecture depuis le début
3. Observer la fluidité du scroll pendant au moins 50 éléments
4. Mesurer subjectivement la performance

#### Résultats attendus :
- [ ] Le scroll reste fluide même avec beaucoup d'éléments dans le DOM
- [ ] Pas de lag ou de ralentissement visible
- [ ] Pas d'augmentation de la consommation CPU/mémoire

---

### Test 10 : Navigation rapide (stress test)
**Objectif** : Vérifier que des clics rapides sur différentes scènes ne créent pas de bugs.

#### Étapes :
1. Ouvrir une pièce avec plusieurs scènes
2. Ouvrir le sommaire
3. Cliquer rapidement sur 5-6 scènes différentes (une par seconde)
4. Observer le comportement du scroll

#### Résultats attendus :
- [ ] Chaque clic déclenche un scroll vers la scène correspondante
- [ ] Les scrolls ne se chevauchent pas de manière visible
- [ ] Le dernier clic est honoré (pas de scroll vers une scène précédente)
- [ ] Pas d'erreur dans la console

---

## 🖥️ Tests multi-plateformes

### Desktop
- [ ] **Chrome/Chromium** : Tous les tests ci-dessus
- [ ] **Firefox** : Tous les tests ci-dessus
- [ ] **Safari** (macOS) : Tous les tests ci-dessus
- [ ] **Edge** : Au moins tests 1, 2, 3

### Mobile
- [ ] **Chrome Android** : Tests 1, 2, 3, 5
- [ ] **Safari iOS** : Tests 1, 2, 3, 5
- [ ] **Firefox Android** : Tests 1, 2, 3

### Tailles d'écran
- [ ] Grand écran (>1920px) : Tests 1, 3
- [ ] Écran moyen (1280-1920px) : Tests 1, 3
- [ ] Petit écran (<1280px) : Tests 1, 3
- [ ] Mobile portrait : Tests 1, 2, 3
- [ ] Mobile paysage : Tests 1, 2, 3

---

## 🐛 Tests de régression

### Vérifier que les fonctionnalités existantes fonctionnent toujours :

- [ ] Le badge de navigation se met à jour pendant le scroll manuel
- [ ] L'Observer détecte correctement les éléments visibles
- [ ] Les toggles (didascalies, structure, présentation) fonctionnent
- [ ] Le mode silencieux (lecture manuelle) fonctionne
- [ ] L'export PDF fonctionne
- [ ] L'export texte fonctionne
- [ ] Les annotations fonctionnent (si réactivées)
- [ ] Le changement de personnage utilisateur fonctionne
- [ ] La fermeture de la pièce fonctionne sans erreur

---

## 📊 Métriques de succès

### Critères de validation :
- ✅ **100%** des tests fonctionnels (1-10) doivent passer
- ✅ **90%** des tests multi-plateformes doivent passer (problèmes mineurs acceptables sur anciennes versions de navigateurs)
- ✅ **100%** des tests de régression doivent passer
- ✅ **0 erreur** dans la console pendant les tests
- ✅ **Fluidité** : Aucun scroll saccadé visible à l'œil nu

---

## 🔍 Points d'attention spécifiques

### Pendant les tests, vérifier :
- [ ] Aucune erreur ou warning dans la console du navigateur
- [ ] Pas de fuite mémoire (vérifier dans DevTools > Memory après 5 minutes d'utilisation)
- [ ] Le scroll `behavior: 'smooth'` fonctionne (pas de scroll instantané)
- [ ] Les `data-playback-index` sont bien définis sur tous les éléments
- [ ] Le flag `isScrollingProgrammaticallyRef` se désactive correctement (observer dans React DevTools)

---

## 📝 Rapport de bugs

Si un test échoue, noter :
1. **Numéro du test** : (ex: Test 3)
2. **Navigateur/OS** : (ex: Chrome 120 / macOS 14)
3. **Comportement observé** : Description détaillée
4. **Comportement attendu** : Référence aux résultats attendus
5. **Étapes de reproduction** : Séquence exacte
6. **Captures d'écran/vidéo** : Si possible
7. **Console logs** : Erreurs ou warnings pertinents

---

## ✅ Validation finale

Une fois tous les tests passés :
- [ ] Mettre à jour la documentation si nécessaire
- [ ] Créer une PR avec les résultats des tests en commentaire
- [ ] Demander une revue de code
- [ ] Merger sur main après approbation
- [ ] Deployer en production
- [ ] Monitorer les métriques pendant 24-48h après déploiement