# Guide de test manuel - Aide et Thème

## Objectif
Valider le bon fonctionnement des nouvelles fonctionnalités d'aide et de mode sombre/clair.

## Prérequis
- Application compilée et en cours d'exécution (`npm run dev`)
- Au moins une pièce importée dans la bibliothèque

---

## Test 1 : Écran d'accueil (LibraryScreen)

### 1.1 - Header standardisé présent
- [ ] Ouvrir l'application
- [ ] Vérifier la présence du header avec "Répét" à gauche
- [ ] Vérifier la présence de l'icône d'aide (?) en haut à droite
- [ ] Vérifier la présence de l'icône de thème (lune) en haut à droite

### 1.2 - Icône d'aide fonctionnelle
- [ ] Cliquer sur l'icône d'aide (?)
- [ ] Vérifier que le modal d'aide s'ouvre
- [ ] Vérifier que le titre "Aide et Documentation" est visible
- [ ] Vérifier que le contenu est scrollable
- [ ] Vérifier que toutes les sections sont présentes :
  - [ ] Bienvenue sur Répét
  - [ ] Démarrage rapide
  - [ ] Modes de lecture (Silencieux, Audio, Italien)
  - [ ] Paramètres par pièce
  - [ ] Contrôles de lecture
  - [ ] Format des fichiers
  - [ ] Astuces et conseils
  - [ ] Besoin d'aide ?

### 1.3 - Fermeture du modal d'aide
- [ ] Cliquer sur le bouton X en haut à droite du modal
- [ ] Vérifier que le modal se ferme
- [ ] Rouvrir le modal d'aide
- [ ] Cliquer en dehors du modal (sur le fond sombre)
- [ ] Vérifier que le modal se ferme

### 1.4 - Icône de thème fonctionnelle
- [ ] Cliquer sur l'icône lune (mode sombre)
- [ ] Vérifier que l'interface passe en mode sombre :
  - [ ] Fond général devient sombre
  - [ ] Textes deviennent clairs
  - [ ] Header devient sombre
  - [ ] L'icône change en soleil
- [ ] Cliquer sur l'icône soleil (mode clair)
- [ ] Vérifier que l'interface repasse en mode clair

### 1.5 - Persistance du thème
- [ ] Activer le mode sombre
- [ ] Recharger la page (F5)
- [ ] Vérifier que le mode sombre est toujours actif
- [ ] Revenir en mode clair
- [ ] Recharger la page
- [ ] Vérifier que le mode clair est conservé

---

## Test 2 : Écran de détails (PlayDetailScreen)

### 2.1 - Header standardisé présent
- [ ] Ouvrir les détails d'une pièce
- [ ] Vérifier la présence du bouton "← Retour" à gauche
- [ ] Vérifier la présence de l'icône d'aide (?) en haut à droite
- [ ] Vérifier la présence de l'icône de thème en haut à droite

### 2.2 - Navigation
- [ ] Cliquer sur "← Retour"
- [ ] Vérifier le retour à l'écran d'accueil

### 2.3 - Aide et thème fonctionnels
- [ ] Retourner dans les détails d'une pièce
- [ ] Ouvrir l'aide
- [ ] Vérifier que le modal s'affiche correctement en mode clair
- [ ] Fermer l'aide
- [ ] Activer le mode sombre
- [ ] Vérifier que l'écran de détails est bien en mode sombre
- [ ] Ouvrir l'aide en mode sombre
- [ ] Vérifier que le modal d'aide est également en mode sombre

---

## Test 3 : Écran de lecture (PlayScreen / Audio)

### 3.1 - Header de lecture présent
- [ ] Ouvrir une pièce en mode Audio
- [ ] Vérifier la présence de :
  - [ ] Icône retour (chevron gauche) à gauche
  - [ ] Titre de la pièce au centre
  - [ ] Badge du mode de lecture (🔊 Audio ou similaire) au centre
  - [ ] Icône sommaire (≡) à droite
  - [ ] Icône d'aide (?) à droite
  - [ ] Icône de thème à droite

### 3.2 - Boutons fonctionnels
- [ ] Cliquer sur l'icône sommaire
- [ ] Vérifier que le sommaire s'ouvre
- [ ] Fermer le sommaire
- [ ] Cliquer sur l'icône d'aide
- [ ] Vérifier que le modal d'aide s'ouvre
- [ ] Fermer l'aide
- [ ] Cliquer sur le badge du mode de lecture
- [ ] Vérifier la navigation vers l'écran de détails

### 3.3 - Thème en mode lecture
- [ ] Activer le mode sombre via l'icône de thème
- [ ] Vérifier que le texte de la pièce est lisible en mode sombre
- [ ] Vérifier que les répliques sont bien contrastées
- [ ] Vérifier que le header est en mode sombre
- [ ] Lancer la lecture audio
- [ ] Vérifier que l'indicateur de lecture est visible en mode sombre

### 3.4 - Transitions hover
- [ ] Survoler chaque icône du header
- [ ] Vérifier qu'un effet visuel apparaît (changement de couleur/fond)
- [ ] Vérifier les tooltips (title) au survol :
  - [ ] "Sommaire" sur l'icône ≡
  - [ ] "Aide" sur l'icône ?
  - [ ] "Mode sombre" ou "Mode clair" selon le thème actif

---

## Test 4 : Écran de lecture silencieuse (ReaderScreen)

### 4.1 - Header de lecture présent
- [ ] Ouvrir une pièce en mode Silencieux
- [ ] Vérifier la même présence d'éléments que pour PlayScreen
- [ ] Vérifier que le badge affiche "📖 Silencieux"

### 4.2 - Fonctionnalités identiques
- [ ] Tester l'ouverture du sommaire
- [ ] Tester l'ouverture de l'aide
- [ ] Tester le changement de thème
- [ ] Vérifier que tout fonctionne comme pour PlayScreen

---

## Test 5 : Mode Italien (ReaderScreen)

### 5.1 - Header en mode Italien
- [ ] Ouvrir une pièce en mode Italien
- [ ] Vérifier que le badge affiche "🎭 Italien"
- [ ] Vérifier la présence de toutes les icônes (sommaire, aide, thème)

### 5.2 - Thème avec lignes masquées
- [ ] Activer le masquage des lignes utilisateur
- [ ] Vérifier que les lignes masquées (••••••) sont visibles en mode clair
- [ ] Activer le mode sombre
- [ ] Vérifier que les lignes masquées sont visibles en mode sombre
- [ ] Vérifier que l'indicateur de lecture (cercle + temps) est visible sur les lignes masquées en mode sombre

---

## Test 6 : Contenu de l'aide

### 6.1 - Exactitude du contenu
- [ ] Ouvrir l'aide
- [ ] Vérifier que le guide de démarrage rapide est clair
- [ ] Vérifier que les 3 modes sont bien expliqués
- [ ] Vérifier que l'exemple de format de fichier est correct
- [ ] Vérifier qu'il n'y a pas de fautes de frappe

### 6.2 - Lisibilité
- [ ] Vérifier que le texte est bien formaté
- [ ] Vérifier que les listes sont correctement indentées
- [ ] Vérifier que les blocs de code sont bien mis en évidence
- [ ] Tester en mode sombre : vérifier la lisibilité

### 6.3 - Scroll du contenu
- [ ] Ouvrir l'aide
- [ ] Scroller jusqu'en bas
- [ ] Vérifier que tout le contenu est accessible
- [ ] Vérifier que le header "Aide et Documentation" reste fixe

---

## Test 7 : Responsive et edge cases

### 7.1 - Taille de fenêtre réduite
- [ ] Réduire la largeur de la fenêtre
- [ ] Vérifier que les icônes du header restent visibles
- [ ] Vérifier que le titre de la pièce se tronque proprement (ellipsis)
- [ ] Vérifier que l'aide reste lisible sur petit écran

### 7.2 - Navigation rapide
- [ ] Ouvrir l'aide
- [ ] Fermer immédiatement
- [ ] Rouvrir rapidement
- [ ] Vérifier qu'il n'y a pas de bugs visuels
- [ ] Changer de thème plusieurs fois rapidement
- [ ] Vérifier qu'il n'y a pas de clignotements

### 7.3 - Multiples pièces
- [ ] Ouvrir une première pièce en mode sombre
- [ ] Retourner à la bibliothèque
- [ ] Ouvrir une autre pièce
- [ ] Vérifier que le mode sombre est toujours actif

---

## Test 8 : Console et erreurs

### 8.1 - Pas d'erreurs console
- [ ] Ouvrir les DevTools (F12)
- [ ] Aller dans l'onglet Console
- [ ] Effectuer les actions suivantes et vérifier qu'il n'y a pas d'erreurs :
  - [ ] Ouvrir/fermer l'aide
  - [ ] Changer de thème
  - [ ] Naviguer entre les écrans
  - [ ] Ouvrir le sommaire

### 8.2 - localStorage
- [ ] Ouvrir les DevTools → Application → Local Storage
- [ ] Vérifier la présence de la clé `theme`
- [ ] Changer de thème
- [ ] Vérifier que la valeur de `theme` change entre `'light'` et `'dark'`

---

## Test 9 : Accessibilité

### 9.1 - Aria labels
- [ ] Inspecter les boutons du header
- [ ] Vérifier la présence de `aria-label` sur :
  - [ ] Bouton retour
  - [ ] Bouton sommaire
  - [ ] Bouton aide
  - [ ] Bouton thème

### 9.2 - Navigation au clavier
- [ ] Utiliser Tab pour naviguer entre les boutons du header
- [ ] Vérifier que le focus est visible
- [ ] Appuyer sur Entrée sur le bouton d'aide
- [ ] Vérifier que l'aide s'ouvre
- [ ] Utiliser Tab pour atteindre le bouton X
- [ ] Appuyer sur Entrée
- [ ] Vérifier que l'aide se ferme

---

## Résultats attendus

✅ **Tous les tests doivent passer sans erreur**

### Points critiques
1. Le thème doit persister après rechargement
2. L'aide doit être accessible depuis tous les écrans
3. Aucune erreur dans la console
4. Le mode sombre doit être appliqué à tous les éléments
5. Les transitions doivent être fluides

### Si un test échoue
1. Noter le numéro du test et la description
2. Capturer une screenshot si possible
3. Copier les erreurs de la console
4. Vérifier les fichiers concernés :
   - `uiStore.ts` pour la logique thème/aide
   - `App.tsx` pour l'initialisation
   - `HelpScreen.tsx` pour le contenu
   - `StandardHeader.tsx` et `ReadingHeader.tsx` pour les headers

---

## Checklist finale

- [ ] Tous les tests 1-9 passent
- [ ] Aucune erreur console
- [ ] Le thème persiste après rechargement
- [ ] L'aide s'affiche sur tous les écrans
- [ ] Les icônes sont cohérentes et visibles
- [ ] Le mode sombre est appliqué partout
- [ ] Les transitions sont fluides
- [ ] L'accessibilité est respectée

**Date du test :** _______________
**Testeur :** _______________
**Résultat global :** ☐ Réussi  ☐ Échec  ☐ Partiel

**Notes :** 
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________