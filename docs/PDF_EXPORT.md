# Export PDF

## Vue d'ensemble

**Répét** permet d'exporter vos pièces de théâtre au format PDF pour l'impression ou l'archivage. Cette fonctionnalité génère des documents au format A4 professionnels, fidèles à l'affichage du mode lecture.

## Fonctionnalités

### Format A4 Standard
- Documents formatés pour impression A4 (210 × 297 mm)
- Marges optimisées pour la lecture
- Pagination automatique avec numéros de page
- Compatible avec tous les lecteurs PDF

### Contenu Exporté

L'export PDF inclut :

1. **Page de couverture**
   - Titre de la pièce
   - Auteur
   - Mention "Généré avec Répét"

2. **Distribution des rôles** (si présente)
   - Liste des personnages
   - Descriptions des rôles
   - Didascalies de présentation

3. **Contenu complet**
   - Tous les actes et scènes
   - Structure hiérarchique préservée
   - Répliques avec noms de personnages
   - Didascalies en italique

### Options d'Export

Par défaut, l'export PDF :
- Utilise un thème clair (optimal pour l'impression)
- Inclut la page de couverture
- Inclut la distribution des rôles
- Ajoute des numéros de page
- Utilise une police de taille 11pt
- Applique des marges de 15mm

## Utilisation

### Depuis l'interface de lecture

1. Ouvrez une pièce dans n'importe quel mode de lecture
2. Cliquez sur l'icône **Exporter en PDF** dans le header (icône document avec flèche)
3. Le PDF se génère automatiquement
4. Le fichier est téléchargé avec le nom de la pièce

### Nom du fichier

Le fichier PDF est automatiquement nommé d'après le titre de la pièce :
- Caractères spéciaux remplacés par des underscores
- Espaces remplacés par des underscores
- Extension `.pdf` ajoutée automatiquement
- Limité à 50 caractères maximum

Exemple : `le_malade_imaginaire.pdf`

## Mise en Page

### Typographie

- **Titres d'actes** : 16pt, gras, noir
- **Titres de scènes** : 14pt, gras, noir
- **Noms de personnages** : 11pt, gras, **en couleur** (mêmes couleurs que dans l'application)
- **Répliques** : 11pt, normal, noir, légèrement indentées
- **Didascalies** : 11pt, italique, **gris** (dans les répliques et hors répliques), indentées
- **Page de couverture** : 28pt pour le titre, 16pt pour l'auteur

### Structure

- **Page de couverture** : Titre centré verticalement, auteur en dessous
- **Distribution** : Titre de section, puis liste avec noms en gras et descriptions indentées
- **Actes et scènes** : Nouvelle page pour chaque acte, titres clairs, espacement optimal
- **Pagination** : Numéros centrés en bas de page (commence après la couverture)

### Gestion des Sauts de Page

Le système :
- Vérifie l'espace restant **ligne par ligne** avant d'ajouter du contenu
- Respecte strictement la marge du bas (15mm par défaut)
- Insère automatiquement de nouvelles pages si nécessaire
- **Garde le nom du personnage avec sa réplique** : si l'espace est insuffisant, toute la réplique est reportée sur la page suivante
- Évite de séparer le nom du personnage de son texte sur deux pages différentes
- Peut couper une très longue réplique sur plusieurs pages (nom sur la première, suite sur les suivantes)
- Préserve la lisibilité et la cohérence visuelle

## Qualité et Performance

### Taille des Fichiers

La taille du PDF dépend de :
- La longueur de la pièce
- Le nombre de personnages
- La densité du texte

Typiquement :
- Pièce courte (1 acte) : ~50-100 KB
- Pièce moyenne (3 actes) : ~200-400 KB
- Pièce longue (5 actes) : ~500 KB - 1 MB

### Temps de Génération

- Pièce courte : < 1 seconde
- Pièce moyenne : 1-3 secondes
- Pièce longue : 3-5 secondes

Un indicateur de chargement s'affiche pendant la génération.

## Cas d'Usage

### Impression pour Répétitions
Exportez et imprimez vos pièces pour les comédiens qui préfèrent le papier.

### Archivage
Conservez des versions PDF de vos pièces importées pour référence future.

### Partage
Partagez facilement des extraits ou la pièce complète avec d'autres acteurs.

### Annotations Manuscrites
Imprimez pour annoter à la main pendant les répétitions.

## Limitations

### Mode Hors Ligne Uniquement (Build Complet)

Pour optimiser la taille du build online, l'export PDF utilise des bibliothèques légères :
- **jsPDF** : Génération de PDF côté client
- **html2canvas** : Capture optionnelle du rendu HTML

Ces bibliothèques ajoutent ~200 KB au build.

### Formatage

- ✅ Les couleurs des personnages **sont** exportées (mêmes couleurs que dans l'application)
- ✅ Les didascalies **sont** en gris et italique (fidèle à l'affichage de l'application)
- Le thème sombre n'est pas appliqué (PDF en mode clair par défaut pour l'impression)
- Les polices utilisent Helvetica (standard PDF)
- Espacement optimisé pour éviter les problèmes de lisibilité

### Contenu

L'export reflète le contenu de la pièce tel qu'importé :
- Les réglages de lecture (masquage, mode) n'affectent pas l'export
- Toutes les répliques et didascalies sont incluses
- L'export ne filtre pas selon le personnage sélectionné

## Dépannage

### Le PDF ne se télécharge pas

**Cause** : Bloqueur de pop-ups ou problème de permissions

**Solution** :
1. Vérifiez que votre navigateur autorise les téléchargements
2. Désactivez les bloqueurs de pop-ups pour Répét
3. Rechargez la page et réessayez

### PDF vide ou incomplet

**Cause** : Problème de génération du contenu

**Solution** :
1. Vérifiez que la pièce est complètement chargée
2. Rechargez la pièce
3. Réessayez l'export
4. Si le problème persiste, signalez-le sur GitHub

### Temps de génération très long

**Cause** : Pièce très longue ou appareil lent

**Solution** :
- Patience : l'export peut prendre plusieurs secondes pour les longues pièces
- Assurez-vous que l'application ne tourne pas en arrière-plan sur mobile
- Fermez d'autres onglets pour libérer de la mémoire

### Caractères spéciaux mal affichés

**Cause** : Encodage ou police non supportée

**Solution** :
- Vérifiez que votre fichier texte source est en UTF-8
- Réimportez la pièce si nécessaire
- Signalez les problèmes d'encodage sur GitHub

## Support Technique

Pour signaler des bugs ou demander des améliorations :
- **GitHub Issues** : https://github.com/resinsec/repet/issues
- **Email** : support@repet.ecanasso.org (si configuré)

## Licence

La fonctionnalité d'export PDF fait partie de **Répét**, un logiciel open-source sous licence MIT.

---

**Dernière mise à jour** : Janvier 2025
**Version** : 1.0.0