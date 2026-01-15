# Exemples de pièces de théâtre

Ce dossier contient des exemples de fichiers `.txt` qui démontrent les différentes capacités du parser de Répét.

## Format flexible

Le parser de Répét supporte une grande flexibilité dans la structure des pièces :

- ✅ **Actes et scènes** : Structure classique avec ACTE I, ACTE II, etc. et Scène 1, Scène 2, etc.
- ✅ **Scènes uniquement** : Une pièce peut avoir des scènes sans actes
- ✅ **Actes uniquement** : Une pièce peut avoir des actes sans scènes explicites
- ✅ **Sans structure** : Une pièce peut commencer directement par des répliques

## Fichiers d'exemple

### 1. `Interbref.txt`

**Type** : Scène unique sans acte

Une courte scène humoristique avec deux comédiens. Démontre :
- Une scène sans acte parent
- Des didascalies entre parenthèses
- Des personnages avec chiffres (COMÉDIEN1, COMÉDIEN2)

```
Scène 8 - Troisième interbref

(Deux comédiens, pensifs, sur le plateau.)

COMÉDIEN1
Le problème essentiel...
```

**Note** : Cette scène fonctionne sans acte parent (un acte par défaut est créé automatiquement).

### 2. `sans-structure.txt`

**Type** : Pièce avec section Personnages et structure minimale

Un dialogue avec présentation des personnages. Démontre :
- Section "Personnages" avec présentations de personnages
- Format de présentation (nom + description multi-lignes)
- Répliques vides (BOB ne répond pas)
- ACTE obligatoire quand section Personnages est présente

```
Le Dialogue

Auteur: Anonyme

Personnages:

ALICE
Une femme curieuse

BOB
Un homme mystérieux

ACTE I

Scène 1

ALICE
Bonjour.

BOB
Bonjour à vous.
```

**Important** : La présence de la section "Personnages" nécessite au moins un ACTE ou une Scène explicite.

### 3. `uniquement-scenes.txt`

**Type** : Pièce avec scènes uniquement (sans actes)

Une histoire complète en 3 scènes sans découpage en actes. Démontre :
- Plusieurs scènes sans acte parent
- Section "Rôles" avec présentations de personnages
- Métadonnées complètes (Auteur, Année)
- Dialogues naturels avec didascalies

```
La Rencontre

Auteur: Jean Dupont
Année: 2024

Rôles

MARIE
Une jeune femme

THOMAS
Un jeune homme

LE SERVEUR
Un serveur de café

Scène 1 - Le café
...
```

## Métadonnées supportées

Le parser reconnaît les métadonnées suivantes (toutes optionnelles) :

### Titre
Le premier bloc de texte non vide est considéré comme le titre.

### Auteur et Année
```
Auteur: Nom de l'auteur
Annee: 2024
```
(accepte aussi "Année" avec accent)

### Catégorie
```
Categorie: Comédie
```
(accepte aussi "Catégorie" avec accent)

### Section Personnages/Rôles/Cast

Une section optionnelle pour décrire les personnages **avant le début de la pièce**. Peut utiliser l'un de ces titres :
- `Personnages` ou `Personnages:`
- `Comédiens` ou `Comédiens:`
- `Rôles` ou `Rôles:`
- `Présentation` ou `Présentation:`
- `Introduction` ou `Introduction:`

**⚠️ Important** : Si cette section est présente, la pièce DOIT avoir au moins un ACTE ou une Scène explicite.

#### Structure de la section

La section peut contenir :
1. **Blocs de texte libre** : Introduction, contexte
2. **Présentations de personnages** : Format identique aux répliques (nom en MAJUSCULES + description)

#### Exemple avec présentations de personnages
```
Personnages:

HAMLET
Prince du Danemark, tourmenté par la mort de son père.

OPHÉLIE
Fille de Polonius, amoureuse d'Hamlet.

LAËRTE
Frère d'Ophélie, étudiant à Paris.

ACTE I
...
```

#### Exemple avec texte et présentations mixtes
```
Personnages:

Cette tragédie met en scène la famille royale du Danemark.

HAMLET
Le prince héritier.

CLAUDIUS
Roi du Danemark, oncle d'Hamlet.

(D'autres personnages secondaires apparaissent également.)

ACTE I
...
```

#### Comportement en lecture

- **Mode silencieux** : Section affichée normalement
- **Mode audio** : Section ignorée (pas lue à haute voix)
- **Mode italienne** : Section ignorée (pas lue)

Les présentations de personnages ont le même affichage que les répliques (nom en couleur) mais ne sont pas comptées comme des lignes à lire.

## Formats de répliques

Le parser supporte deux formats de répliques :

### Format classique (avec deux-points)
```
HAMLET:
Être ou ne pas être, telle est la question.
```

### Format moderne (sans deux-points)
```
HAMLET
Être ou ne pas être, telle est la question.
```

**Note** : Le format sans deux-points nécessite une ligne vide avant le nom du personnage.

### Répliques vides
Un personnage peut ne rien dire :
```
HAMLET

OPHÉLIE
Quelle surprise !
```

## Didascalies

Les didascalies (indications scéniques) sont détectées automatiquement :

### Didascalies en bloc
```
(Le rideau se lève. La scène est vide.)
(Un temps.)
```

### Didascalies inline
```
HAMLET
Être ou ne pas être...
(Il hésite.)
Telle est la question.
```

## Structure hiérarchique

### Actes
```
ACTE I
ACTE I - Titre de l'acte
ACTE 1 - Alegria
```
(supporte chiffres romains et arabes)

### Scènes
```
Scene 1
Scène 1
Scene 1 - Titre de la scène
Scène 2 - La rencontre
```
(avec ou sans accent, chiffres romains et arabes)

## Personnages

Les noms de personnages doivent être :
- En MAJUSCULES
- Commencer par une lettre
- Peuvent contenir : lettres, chiffres, espaces, tirets, apostrophes

Exemples valides :
- `HAMLET`
- `COMÉDIEN1`
- `JEAN-PAUL`
- `LE NARRATEUR`
- `L'ÉTRANGER`

### 4. `section-cast-complete.txt`

**Type** : Exemple complet de section Cast

Le Malade Imaginaire avec une section Cast complète. Démontre :
- Texte d'introduction dans la section Cast
- Présentations détaillées de personnages
- Blocs de texte entre les présentations
- Métadonnées complètes
- Structure avec ACTE et Scène

```
Le Malade Imaginaire

Auteur: Molière
Année: 1673

Personnages:

Cette comédie-ballet met en scène la maladie imaginaire d'Argan...

ARGAN
Le malade imaginaire, père d'Angélique...

TOINETTE
Servante d'Argan, spirituelle et rusée...

(Les personnages secondaires incluent également...)

ACTE I

Scène 1
...
```

## Conseils d'utilisation

1. **Commencez simple** : Une pièce peut être aussi simple qu'un titre et des répliques
2. **Ajoutez de la structure progressivement** : Actes et scènes sont optionnels (sauf si section Cast présente)
3. **Documentez vos personnages** : Utilisez la section "Personnages" pour clarifier les rôles
4. **Section Cast** : Si vous utilisez la section Cast, ajoutez au moins un ACTE ou une Scène
5. **Format des présentations** : Même syntaxe que les répliques (nom en MAJUSCULES + description)
6. **Ligne vide avant les personnages** : Dans le corps de la pièce (pas obligatoire dans la section Cast)
7. **Indentation** : Les lignes ne doivent pas commencer par des espaces (pas d'indentation)

## Compatibilité

Tous les exemples de ce dossier sont compatibles avec le parser de Répét et peuvent être importés directement dans l'application.