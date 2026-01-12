# Guide Utilisateur - Répét

Bienvenue dans **Répét**, votre assistant de répétition de pièces de théâtre ! 🎭

## 📚 Table des Matières

1. [Introduction](#introduction)
2. [Premiers Pas](#premiers-pas)
3. [Importer une Pièce](#importer-une-pièce)
4. [Modes de Lecture](#modes-de-lecture)
5. [Mode Italiennes (Répétition)](#mode-italiennes-répétition)
6. [Navigation](#navigation)
7. [Synthèse Vocale (TTS)](#synthèse-vocale-tts)
8. [Paramètres](#paramètres)
9. [Bibliothèque](#bibliothèque)
10. [Conseils d'Utilisation](#conseils-dutilisation)

---

## Introduction

**Répét** est une application web progressive (PWA) conçue pour faciliter la répétition de pièces de théâtre. Elle permet de :

- Importer vos textes au format `.txt`
- Lire avec synthèse vocale
- Répéter en mode "italiennes" (masquage de vos répliques)
- Travailler hors-ligne
- Installer sur mobile/tablette/ordinateur

---

## Premiers Pas

### Installation

#### Sur ordinateur (Chrome, Edge)
1. Ouvrez l'application dans votre navigateur
2. Cliquez sur l'icône d'installation dans la barre d'adresse
3. Confirmez l'installation
4. L'application s'ouvre dans une fenêtre dédiée

#### Sur iPhone/iPad (Safari)
1. Ouvrez l'application dans Safari
2. Appuyez sur le bouton "Partager" (carré avec flèche)
3. Sélectionnez "Sur l'écran d'accueil"
4. Confirmez

#### Sur Android (Chrome)
1. Ouvrez l'application dans Chrome
2. Appuyez sur "Ajouter à l'écran d'accueil" dans la bannière
3. Confirmez
4. L'icône apparaît dans vos applications

### Navigation

- **Accueil** : Importer une nouvelle pièce
- **Bibliothèque** : Gérer vos pièces
- **Paramètres** : Configuration TTS et modes

---

## Importer une Pièce

### Format Accepté

Les fichiers doivent être au format `.txt` avec la structure suivante.

**Le parser accepte deux formats pour les répliques :**

#### Format 1 : Avec deux-points (standard)

```
Titre: Le Misanthrope
Auteur: Molière
Genre: Comédie
Année: 1666

ACTE I

Scène 1

ALCESTE:
Il faut que je te parle...

PHILINTE:
Fort bien, parlons...
```

#### Format 2 : Sans deux-points (nouveau)

```
Titre: Le Misanthrope
Auteur: Molière
Genre: Comédie
Année: 1666

ACTE I

Scène 1

ALCESTE
Il faut que je te parle...

PHILINTE
Fort bien, parlons...
```

**Règles importantes :**
- **Format avec `:` (deux-points)** : Le nom du personnage est suivi de `:` immédiatement
- **Format sans `:` (deux-points)** : 
  - Le nom du personnage **DOIT être précédé d'une ligne vierge**
  - Le nom **NE DOIT PAS** être indenté (commence au premier caractère)
  - Supporte les noms composés : `JEAN-PIERRE`, `MARIE LOUISE LEGRANCHU`
- Les deux formats **peuvent être mélangés** dans le même fichier
- Les noms de personnages doivent **toujours être en MAJUSCULES**

### Procédure d'Import

1. Allez sur la page **Accueil**
2. Cliquez sur "Choisir un fichier" ou glissez-déposez votre fichier `.txt`
3. Le nom du fichier apparaît
4. Cliquez sur "Analyser la pièce"
5. ✅ La pièce est importée et apparaît dans votre bibliothèque

### Validation

L'application détecte automatiquement :
- Le titre et l'auteur
- Les personnages
- Les actes et scènes
- Les répliques et didascalies

---

## Modes de Lecture

Répét propose **3 modes de lecture** :

### 1. Mode Silencieux
- Lecture à l'écran uniquement
- Aucun son
- Idéal pour la lecture découverte

### 2. Mode Audio
- Toutes les répliques sont lues par la synthèse vocale
- Vous pouvez suivre en écoutant
- Idéal pour s'imprégner du rythme

### 3. Mode Italiennes ⭐
- **Vos répliques sont masquées** (floutées)
- Les répliques des autres personnages sont visibles/audibles
- Vous devez réciter vos répliques de mémoire
- Idéal pour la répétition et la mémorisation

> 💡 **Conseil** : Le mode italiennes est la méthode traditionnelle de répétition au théâtre. Il vous force à réciter de mémoire en vous donnant les répliques-cues.

---

## Mode Italiennes (Répétition)

### Activation

1. Allez dans **Paramètres**
2. Sélectionnez le mode de lecture **"Italiennes"**
3. Cochez "Masquer mes répliques en mode italiennes"
4. Retournez dans votre pièce

### Utilisation

#### Dans la lecture principale (`/play`)

1. **Sélectionnez votre personnage** via le bouton en haut à droite
2. Un badge violet **"MODE ITALIENNES"** apparaît dans le header
3. Naviguez dans la pièce :
   - Les lignes des autres personnages sont **visibles** et peuvent être **lues par TTS**
   - **Vos lignes sont masquées** (fond violet, texte flouté : `●●●●●●●●●●`)
   - Un message vous invite : *"Récitez votre réplique de mémoire"*

#### Bouton Révéler

Si vous avez un trou de mémoire :

1. Cliquez sur **"👁️ Révéler ma réplique"**
2. Le texte apparaît temporairement
3. Lisez-le
4. Cliquez sur **"🔒 Masquer à nouveau"** pour continuer

⚠️ **Note** : L'état "révéler" se réinitialise automatiquement quand vous passez à la ligne suivante.

#### Dans le mode lecteur (`/reader`)

- Même principe que la lecture principale
- Liste de toutes les lignes de la scène
- Vos lignes sont marquées avec 🔒
- Toggle "Toutes les lignes" / "Mes lignes" disponible

### Conseils pour le Mode Italiennes

✅ **Bonnes pratiques** :
- Lisez d'abord la scène en mode "Audio" ou "Silencieux" pour vous familiariser
- Passez en mode "Italiennes" une fois que vous connaissez approximativement vos répliques
- Utilisez le bouton "Révéler" avec parcimonie (sinon vous ne mémorisez pas !)
- Répétez plusieurs fois la même scène

❌ **À éviter** :
- Ne passez pas directement en mode italiennes sur une pièce inconnue
- N'abusez pas du bouton "Révéler" (c'est une béquille !)

---

## Navigation

### Navigation Ligne par Ligne

- **Bouton "Suivant"** : Passe à la ligne suivante
- **Bouton "Précédent"** : Retourne à la ligne précédente
- Indicateur de progression : `Ligne 42 / 358`

### Navigation par Acte/Scène

- Utilisez le **menu déroulant** en haut de la page
- Sélectionnez "Acte X, Scène Y"
- Vous êtes transporté à la première ligne de cette scène

### Dans le Mode Lecteur

- Cliquez directement sur une ligne dans la liste pour y accéder
- Filtrez par personnage avec le toggle "Mes lignes" / "Toutes les lignes"

---

## Synthèse Vocale (TTS)

### Configuration

1. Allez dans **Paramètres**
2. Sélectionnez une **voix** dans la liste (voix de votre système)
3. Ajustez la **vitesse** (0.5x - 2.0x)
4. Ajustez le **volume** (0% - 100%)

### Utilisation

#### Lecture automatique

- Dans Paramètres, activez **"Lecture automatique"**
- Quand une ligne se termine, la suivante démarre automatiquement
- Pratique pour écouter toute une scène

#### Lecture manuelle

- Cliquez sur le bouton **▶ Lire** pour lire la ligne courante
- Cliquez sur **⏹ Arrêter** pour stopper

### Voix Disponibles

Les voix dépendent de votre système d'exploitation :

- **Windows** : Voix Microsoft (Hortense, Julie, etc.)
- **macOS/iOS** : Voix Apple (Thomas, Amélie, etc.)
- **Android** : Voix Google (fr-FR)
- **Linux** : Voix eSpeak ou Festival

💡 **Astuce** : Vous pouvez installer des voix supplémentaires dans les paramètres de votre système.

### Limitations

⚠️ **Sur iOS (iPhone/iPad)** :
- Le TTS nécessite une interaction utilisateur avant la première lecture
- Cliquez sur un bouton avant que le TTS ne fonctionne
- C'est une limitation de Safari/iOS, pas de Répét

---

## Paramètres

### Mode de Lecture
- **Silencieux** : Lecture visuelle uniquement
- **Audio** : Toutes les lignes lues par TTS
- **Italiennes** : Vos lignes masquées

### Audio Global
- **Vitesse** : 0.5x (lent) à 2.0x (rapide)
- **Volume** : 0% (muet) à 100% (maximum)

### Options
- **Lecture automatique** : Enchaîne les lignes automatiquement
- **Surligner mes lignes** : Fond jaune sur vos lignes (hors mode italien)
- **Masquer mes lignes en italiennes** : Active/désactive le masquage

### Réinitialisation
- Bouton **"Réinitialiser les paramètres"** : Retour aux valeurs par défaut
- Confirmation demandée avant application

---

## Bibliothèque

### Vue d'Ensemble

- Grille de toutes vos pièces importées
- Métadonnées affichées : Titre, Auteur, Date d'import
- Tri chronologique (plus récent en premier)

### Recherche

- Barre de recherche en haut
- Recherche en temps réel sur :
  - Titre
  - Auteur
  - Catégorie/Genre

### Suppression

1. Cliquez sur l'icône 🗑️ (poubelle) sur une pièce
2. Confirmez la suppression dans la modale
3. La pièce est définitivement supprimée

⚠️ **Attention** : La suppression est irréversible !

### Ouverture

- Cliquez sur une carte de pièce pour l'ouvrir en mode lecture
- Vous serez invité à choisir votre personnage

---

## Conseils d'Utilisation

### 🎯 Pour Débutants

1. **Jour 1** : Importez votre pièce et lisez-la en mode "Silencieux"
2. **Jour 2-3** : Relisez en mode "Audio" pour entendre le rythme
3. **Jour 4+** : Passez en mode "Italiennes" et répétez scène par scène

### 🎓 Pour Avancés

- Utilisez le mode lecteur (`/reader`) pour voir toutes vos lignes d'une scène
- Créez des sessions de répétition : 1 scène = 1 session
- Répétez la même scène 3-5 fois avant de passer à la suivante

### 📱 Sur Mobile

- Installez l'application sur votre écran d'accueil (PWA)
- Mode portrait recommandé
- Utilisez des écouteurs pour le TTS en public

### 💡 Astuces

- **Raccourci** : Allez directement à `/play/[id]` pour ouvrir une pièce
- **Hors-ligne** : Une fois une pièce importée, elle fonctionne sans internet
- **Sauvegarde** : Exportez vos fichiers `.txt` régulièrement (backup manuel)

### ⚠️ Limitations

- Pas de synchronisation entre appareils (stockage local uniquement)
- Fichiers volumineux (>5MB) peuvent ralentir l'import
- TTS dépend des voix de votre système

---

## Dépannage

### La pièce ne s'importe pas

- Vérifiez le format du fichier (`.txt` uniquement)
- Assurez-vous qu'il contient "ACTE" et "Scène"
- Taille < 5MB recommandée

### Le TTS ne fonctionne pas

- Sur iOS : cliquez sur un bouton d'abord (interaction requise)
- Vérifiez que le volume n'est pas à 0%
- Vérifiez qu'une voix est sélectionnée dans Paramètres

### Mode italiennes ne masque pas mes lignes

- Vérifiez que le mode "Italiennes" est bien sélectionné dans Paramètres
- Vérifiez que "Masquer mes lignes" est coché
- Assurez-vous d'avoir sélectionné votre personnage

### L'application ne s'installe pas

- Utilisez un navigateur compatible (Chrome, Safari, Edge)
- HTTPS requis (fonctionne sur localhost et sites sécurisés)
- Vérifiez que vous n'avez pas déjà installé l'app

---

## Support et Contribution

- **Documentation** : Consultez les fichiers dans `docs/`
- **Issues** : Rapportez les bugs sur GitHub
- **Contributions** : Pull requests bienvenues !

---

**Bonne répétition ! 🎭**

*"La répétition est la mère de la perfection."*