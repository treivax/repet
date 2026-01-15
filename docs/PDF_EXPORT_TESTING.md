# PDF Export - Testing Checklist

## Vue d'ensemble

Ce document décrit les tests à effectuer pour valider la fonctionnalité d'export PDF.

## Tests Fonctionnels

### Test 1 : Export Basique
- [ ] Importer une pièce simple (1 acte, 2-3 scènes)
- [ ] Ouvrir la pièce en mode lecture
- [ ] Cliquer sur le bouton "Exporter en PDF" dans le header
- [ ] Vérifier qu'un indicateur de chargement apparaît
- [ ] Vérifier que le PDF se télécharge automatiquement
- [ ] Ouvrir le PDF et vérifier son contenu

**Résultat attendu** : PDF téléchargé avec le nom correct, contenu lisible

### Test 2 : Page de Couverture
- [ ] Exporter une pièce avec titre et auteur
- [ ] Ouvrir le PDF
- [ ] Vérifier que la page 1 est la couverture
- [ ] Vérifier que le titre est centré et bien formaté (28pt, gras)
- [ ] Vérifier que l'auteur est présent (16pt, normal)
- [ ] Vérifier que "Généré avec Répét" apparaît en bas

**Résultat attendu** : Couverture professionnelle et bien formatée

### Test 3 : Distribution des Rôles
- [ ] Exporter une pièce contenant une section "DISTRIBUTION"
- [ ] Ouvrir le PDF
- [ ] Vérifier que la distribution commence sur la page 2
- [ ] Vérifier que le titre "Distribution des rôles" est présent (18pt, gras)
- [ ] Vérifier que les noms de personnages sont en gras
- [ ] Vérifier que les descriptions sont en italique et indentées

**Résultat attendu** : Section Cast bien formatée et lisible

### Test 4 : Contenu de la Pièce
- [ ] Exporter une pièce avec plusieurs actes
- [ ] Ouvrir le PDF
- [ ] Vérifier que chaque acte commence sur une nouvelle page
- [ ] Vérifier les titres d'actes (16pt, gras)
- [ ] Vérifier les titres de scènes (14pt, gras)
- [ ] Vérifier que les noms de personnages sont en gras (11pt)
- [ ] Vérifier que les répliques sont indentées (11pt, normal)
- [ ] Vérifier que les didascalies sont en italique

**Résultat attendu** : Hiérarchie claire, typographie correcte

### Test 5 : Pagination
- [ ] Exporter une pièce longue (3+ actes)
- [ ] Ouvrir le PDF
- [ ] Vérifier que les numéros de page sont présents
- [ ] Vérifier que les numéros sont centrés en bas de page
- [ ] Vérifier que la numérotation commence après la couverture
- [ ] Vérifier qu'aucune page n'est manquante

**Résultat attendu** : Pagination correcte et continue

### Test 6 : Sauts de Page
- [ ] Exporter une pièce avec des répliques longues
- [ ] Ouvrir le PDF
- [ ] Vérifier qu'aucune réplique n'est coupée au milieu
- [ ] Vérifier qu'une réplique complète passe à la page suivante si nécessaire
- [ ] Vérifier que les scènes ne sont pas coupées de manière abrupte

**Résultat attendu** : Sauts de page intelligents, pas de coupure maladroite

### Test 7 : Nom de Fichier
- [ ] Exporter une pièce avec un titre simple : "Le Malade Imaginaire"
- [ ] Vérifier que le fichier se nomme `le_malade_imaginaire.pdf`
- [ ] Exporter une pièce avec caractères spéciaux : "L'Avare (1668)"
- [ ] Vérifier que les caractères spéciaux sont remplacés : `l_avare_1668_.pdf`

**Résultat attendu** : Noms de fichiers valides, sans caractères interdits

### Test 8 : Export depuis PlayScreen
- [ ] Ouvrir une pièce en mode Audio
- [ ] Cliquer sur "Exporter en PDF"
- [ ] Vérifier que l'export fonctionne
- [ ] Vérifier que le PDF contient TOUTES les répliques (pas de filtrage)

**Résultat attendu** : Export complet indépendant du mode de lecture

### Test 9 : Export depuis ReaderScreen
- [ ] Ouvrir une pièce en mode Lecture silencieuse
- [ ] Cliquer sur "Exporter en PDF"
- [ ] Vérifier que l'export fonctionne
- [ ] Vérifier que le contenu est identique à l'export depuis PlayScreen

**Résultat attendu** : Export identique quel que soit l'écran

### Test 10 : Pièce Sans Distribution
- [ ] Exporter une pièce sans section "DISTRIBUTION"
- [ ] Ouvrir le PDF
- [ ] Vérifier que la couverture est suivie directement du premier acte
- [ ] Vérifier qu'il n'y a pas de page blanche

**Résultat attendu** : PDF sans page de distribution, flux logique

## Tests de Performance

### Test 11 : Pièce Courte
- [ ] Exporter une pièce de 1 acte (< 10 pages)
- [ ] Mesurer le temps de génération
- [ ] Vérifier que le fichier se télécharge en < 1 seconde

**Résultat attendu** : Génération quasi-instantanée

### Test 12 : Pièce Moyenne
- [ ] Exporter une pièce de 3 actes (~30 pages)
- [ ] Mesurer le temps de génération
- [ ] Vérifier que le fichier se télécharge en < 3 secondes

**Résultat attendu** : Génération rapide (1-3 secondes)

### Test 13 : Pièce Longue
- [ ] Exporter une pièce de 5 actes (> 50 pages)
- [ ] Mesurer le temps de génération
- [ ] Vérifier que le fichier se télécharge en < 5 secondes
- [ ] Vérifier que l'indicateur de chargement est visible pendant la génération

**Résultat attendu** : Génération acceptable (3-5 secondes), feedback visuel

### Test 14 : Taille de Fichier
- [ ] Exporter plusieurs pièces de longueurs différentes
- [ ] Noter les tailles de fichiers
- [ ] Vérifier que les tailles sont raisonnables :
  - Pièce courte : ~50-100 KB
  - Pièce moyenne : ~200-400 KB
  - Pièce longue : ~500 KB - 1 MB

**Résultat attendu** : Tailles de fichiers optimales

## Tests de Compatibilité

### Test 15 : Lecteurs PDF Desktop
- [ ] Ouvrir le PDF avec Adobe Acrobat Reader
- [ ] Ouvrir le PDF avec Foxit Reader
- [ ] Ouvrir le PDF avec Chrome/Edge (visionneuse intégrée)
- [ ] Ouvrir le PDF avec Preview (macOS)
- [ ] Vérifier que le rendu est identique partout

**Résultat attendu** : Compatibilité parfaite avec tous les lecteurs

### Test 16 : Lecteurs PDF Mobile
- [ ] Ouvrir le PDF sur iOS (Apple Books, Safari)
- [ ] Ouvrir le PDF sur Android (Google PDF Viewer)
- [ ] Vérifier que le zoom fonctionne
- [ ] Vérifier que le scroll est fluide

**Résultat attendu** : Lecture mobile sans problème

### Test 17 : Impression Physique
- [ ] Exporter un PDF
- [ ] Imprimer sur papier A4
- [ ] Vérifier que les marges sont correctes
- [ ] Vérifier que le texte n'est pas coupé
- [ ] Vérifier que la police est lisible (11pt)

**Résultat attendu** : Impression parfaite sur A4

## Tests de Robustesse

### Test 18 : Pièce avec Caractères Spéciaux
- [ ] Importer une pièce avec accents (é, è, à, ç, ù, etc.)
- [ ] Exporter en PDF
- [ ] Vérifier que tous les accents sont corrects
- [ ] Importer une pièce avec guillemets français « »
- [ ] Vérifier que les guillemets sont bien rendus

**Résultat attendu** : Encodage UTF-8 parfait

### Test 19 : Pièce avec Longues Didascalies
- [ ] Exporter une pièce avec des didascalies très longues
- [ ] Vérifier que les didascalies sont bien en italique
- [ ] Vérifier qu'elles sont correctement formatées sur plusieurs lignes
- [ ] Vérifier qu'elles ne débordent pas des marges

**Résultat attendu** : Didascalies bien formatées même si longues

### Test 20 : Pièce avec Nombreux Personnages
- [ ] Exporter une pièce avec 10+ personnages
- [ ] Vérifier que la distribution est complète
- [ ] Vérifier que tous les noms de personnages sont présents dans les répliques
- [ ] Vérifier qu'il n'y a pas de confusion entre personnages

**Résultat attendu** : Gestion correcte de nombreux personnages

## Tests d'Erreur

### Test 21 : Pièce Vide
- [ ] Créer/importer une pièce sans contenu (ou acte vide)
- [ ] Tenter d'exporter en PDF
- [ ] Vérifier qu'une erreur est affichée OU que le PDF est minimal

**Résultat attendu** : Gestion gracieuse du cas limite

### Test 22 : Export Multiple Rapide
- [ ] Cliquer plusieurs fois rapidement sur "Exporter en PDF"
- [ ] Vérifier qu'il n'y a pas de génération multiple simultanée
- [ ] Vérifier qu'un seul fichier se télécharge

**Résultat attendu** : Pas de race condition

### Test 23 : Bloqueur de Pop-ups
- [ ] Activer le bloqueur de pop-ups du navigateur
- [ ] Tenter d'exporter un PDF
- [ ] Vérifier qu'un message d'erreur ou d'avertissement apparaît

**Résultat attendu** : Feedback clair si téléchargement bloqué

## Tests UI/UX

### Test 24 : Icône Export Visible
- [ ] Ouvrir PlayScreen
- [ ] Vérifier que l'icône d'export est visible dans le header
- [ ] Vérifier que l'icône a un tooltip "Exporter en PDF"
- [ ] Vérifier que l'icône change de couleur au hover

**Résultat attendu** : Bouton facilement identifiable

### Test 25 : Indicateur de Chargement
- [ ] Exporter une pièce longue
- [ ] Vérifier qu'un spinner ou indicateur apparaît pendant la génération
- [ ] Vérifier que l'indicateur disparaît une fois le téléchargement commencé

**Résultat attendu** : Feedback visuel clair

### Test 26 : Thème Sombre
- [ ] Activer le thème sombre
- [ ] Exporter un PDF
- [ ] Vérifier que le PDF est TOUJOURS en thème clair (optimisé pour impression)

**Résultat attendu** : PDF toujours clair indépendamment du thème UI

## Régression

### Test 27 : Lecture Non Affectée
- [ ] Lancer une lecture audio
- [ ] Exporter en PDF pendant la lecture
- [ ] Vérifier que la lecture continue sans interruption

**Résultat attendu** : Export n'interfère pas avec la lecture

### Test 28 : Navigation Non Affectée
- [ ] Naviguer entre scènes
- [ ] Exporter en PDF
- [ ] Vérifier que la navigation reste fluide après l'export

**Résultat attendu** : Pas d'impact sur la navigation

## Checklist Finale

- [ ] Tous les tests fonctionnels passent
- [ ] Tous les tests de performance passent
- [ ] Tous les tests de compatibilité passent
- [ ] Tous les tests de robustesse passent
- [ ] Tous les tests d'erreur passent
- [ ] Tous les tests UI/UX passent
- [ ] Aucun test de régression échoue
- [ ] Documentation à jour (PDF_EXPORT.md)
- [ ] CHANGELOG.md mis à jour
- [ ] README.md mis à jour

## Notes

**Date des tests** : _____________________

**Testeur** : _____________________

**Version testée** : _____________________

**Navigateur(s)** : _____________________

**Système(s)** : _____________________

**Bugs trouvés** : 

_____________________________________________________

_____________________________________________________

_____________________________________________________

**Améliorations suggérées** :

_____________________________________________________

_____________________________________________________

_____________________________________________________