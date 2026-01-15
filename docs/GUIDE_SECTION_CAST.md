# Guide de la section Cast (Personnages)

## 🎭 Introduction

La section Cast (Personnages/Comédiens/Rôles) est une fonctionnalité puissante qui vous permet de **présenter vos personnages avant le début de la pièce**, comme dans un programme de théâtre.

## ✨ Pourquoi utiliser la section Cast ?

### Avantages
- 📖 **Documentation** : Décrivez vos personnages pour les lecteurs
- 🎓 **Pédagogie** : Aidez les élèves à comprendre les rôles
- 🎬 **Casting** : Notez les exigences pour chaque rôle
- 📝 **Contexte** : Ajoutez une introduction à votre pièce

### Affichage
- **Mode silencieux** : La section est affichée normalement
- **Mode audio/italienne** : La section est **ignorée** (pas lue à haute voix)

## 📝 Comment l'utiliser

### Étape 1 : Ajouter le titre de la section

Utilisez l'un de ces mots-clés (avec ou sans deux-points) :

```
Personnages
Personnages:
Comédiens
Comédiens:
Rôles
Rôles:
Présentation
Présentation:
Introduction
Introduction:
```

### Étape 2 : Ajouter du contenu

Vous pouvez ajouter :
1. Du **texte libre** (introduction, contexte)
2. Des **présentations de personnages** (format réplique)

### Étape 3 : Terminer avec ACTE ou Scène

⚠️ **Important** : Si vous utilisez la section Cast, votre pièce **DOIT** avoir au moins un ACTE ou une Scène explicite.

## 🎯 Exemples pratiques

### Exemple 1 : Présentations simples

```
Le Malade Imaginaire

Auteur: Molière

Personnages:

ARGAN
Le malade imaginaire, obsédé par sa santé.

TOINETTE
Servante rusée qui aide la famille.

ANGÉLIQUE
Fille d'Argan, amoureuse de Cléante.

ACTE I

Scène 1
...
```

### Exemple 2 : Avec introduction

```
Hamlet

Auteur: Shakespeare

Présentation:

Cette tragédie explore les thèmes de la vengeance et de la folie
dans la cour royale du Danemark.

HAMLET
Prince du Danemark, tourmenté par la mort de son père.

CLAUDIUS
Roi du Danemark, oncle d'Hamlet.

OPHÉLIE
Fille de Polonius, amoureuse d'Hamlet.

ACTE I
...
```

### Exemple 3 : Format complet

```
La Rencontre

Auteur: Jean Dupont
Année: 2024

Rôles:

Cette pièce contemporaine se déroule dans un café parisien.

MARIE
Une jeune femme de 25 ans, étudiante en philosophie.
Personnage principal - Rôle exigeant sensibilité.

THOMAS
Un homme de 30 ans, professeur de littérature.
Second rôle - Nécessite expérience du théâtre classique.

LE SERVEUR
Personnage secondaire, comique.
Quelques répliques seulement.

(La mise en scène nécessite un décor minimaliste.)

Scène 1 - Le café
...
```

## 📋 Format des présentations

### Syntaxe

Les présentations utilisent **exactement la même syntaxe que les répliques** :

```
PERSONNAGE
Description du personnage.
Peut être sur plusieurs lignes.
```

### Règles

1. **Nom en MAJUSCULES** : `HAMLET`, `LE NARRATEUR`, `COMÉDIEN1`
2. **Pas d'indentation** : Commencer au début de la ligne
3. **Avec ou sans deux-points** : `HAMLET:` ou `HAMLET` (les deux fonctionnent)
4. **Ligne vide optionnelle** : Pas obligatoire entre les présentations dans la section Cast

### ✅ Correct

```
Personnages:

ALICE
Une femme curieuse.

BOB
Un homme mystérieux.
```

### ✅ Aussi correct

```
Personnages:

ALICE:
Une femme curieuse.

BOB:
Un homme mystérieux.
```

### ❌ Incorrect (indentation)

```
Personnages:

  ALICE
  Une femme curieuse.
```

### ❌ Incorrect (pas en majuscules)

```
Personnages:

Alice
Une femme curieuse.
```

## 🔍 Différence avec les répliques

| Aspect | Répliques | Présentations Cast |
|--------|-----------|-------------------|
| **Emplacement** | Corps de la pièce | Section Cast uniquement |
| **Syntaxe** | PERSONNAGE + texte | Identique |
| **Affichage** | Nom en couleur | Nom en couleur |
| **Lecture audio** | ✅ Lu | ❌ Ignoré |
| **Lecture italienne** | ✅ Lu | ❌ Ignoré |
| **Compteur de lignes** | ✅ Compté | ❌ Non compté |
| **Ligne vide avant** | Obligatoire (sans :) | Optionnelle |

## ⚠️ Règle importante

### Obligation de structure

Si vous utilisez la section Cast, votre pièce **DOIT** avoir au moins un ACTE ou une Scène :

✅ **Valide** :
```
Personnages:
HAMLET
...

ACTE I
...
```

✅ **Valide** :
```
Personnages:
HAMLET
...

Scène 1
...
```

❌ **Invalide** :
```
Personnages:
HAMLET
...

HAMLET
Bonjour.
```

**Erreur** : "Une pièce avec section Personnages/Comédiens/Rôles doit avoir au moins un ACTE ou une Scène explicite"

## 💡 Cas d'usage

### Pour l'enseignement

```
Roméo et Juliette

Personnages:

Cette tragédie raconte l'histoire de deux jeunes amoureux
séparés par la haine de leurs familles.

ROMÉO
Fils de la famille Montaigu. Impulsif et romantique.
Âge : 16-18 ans.

JULIETTE
Fille de la famille Capulet. Innocente mais déterminée.
Âge : 13-14 ans (selon le texte original).

ACTE I
...
```

### Pour le casting

```
La Pièce Moderne

Comédiens:

MARIE
Rôle principal féminin.
Nécessite : Grande présence scénique, voix puissante.
Âge apparent : 30-40 ans.

JEAN
Rôle principal masculin.
Nécessite : Expérience du théâtre contemporain.
Âge apparent : 35-45 ans.

ACTE I
...
```

### Pour le contexte historique

```
Les Fourberies de Scapin

Auteur: Molière
Année: 1671

Introduction:

Cette farce fut jouée pour la première fois au Palais-Royal.
Elle s'inscrit dans la tradition de la commedia dell'arte.

SCAPIN
Valet rusé, héritier des Zanni italiens.
Rôle central de la pièce.

ACTE I
...
```

## 🎨 Mise en page recommandée

### Version minimale

```
Personnages:

ALICE
Description.

BOB
Description.

ACTE I
...
```

### Version détaillée

```
Personnages:

Introduction générale (optionnel).

PERSONNAGE1
Description complète sur
plusieurs lignes si nécessaire.

PERSONNAGE2
Autre description.

(Note finale optionnelle.)

ACTE I
...
```

## 🔧 Conseils pratiques

### 1. Longueur des descriptions

- **Courte** : Une ligne suffit souvent
- **Moyenne** : 2-3 lignes pour plus de détails
- **Longue** : Évitez les pavés, restez concis

### 2. Ordre des personnages

- **Par importance** : Principaux d'abord
- **Par ordre d'apparition** : Comme dans la pièce
- **Alphabétique** : Pour les grandes distributions

### 3. Informations utiles

Pour chaque personnage, vous pouvez inclure :
- Rôle dans l'histoire
- Relations avec les autres
- Traits de caractère
- Âge (si pertinent)
- Exigences pour le comédien

### 4. Blocs de texte

Utilisez les blocs de texte pour :
- Introduction de la pièce
- Contexte historique
- Notes de mise en scène
- Informations générales

## 📚 Exemples complets

Consultez les fichiers d'exemple :
- `examples/sans-structure.txt` - Section Personnages simple
- `examples/uniquement-scenes.txt` - Section Rôles
- `examples/section-cast-complete.txt` - Exemple complet avec Le Malade Imaginaire

## ❓ Questions fréquentes

**Q : La section Cast est-elle obligatoire ?**  
R : Non, elle est complètement optionnelle.

**Q : Puis-je mélanger texte libre et présentations ?**  
R : Oui ! Vous pouvez alterner blocs de texte et présentations de personnages.

**Q : Les présentations sont-elles lues en mode audio ?**  
R : Non, toute la section Cast est ignorée en mode audio et italienne.

**Q : Puis-je utiliser "Personnages:" et "Comédiens:" dans la même pièce ?**  
R : Non, une seule section Cast est reconnue (la première).

**Q : Que se passe-t-il si j'oublie d'ajouter un ACTE ?**  
R : Vous obtiendrez une erreur. Si vous utilisez la section Cast, ajoutez au moins `ACTE I` ou `Scène 1`.

**Q : Puis-je utiliser des parenthèses dans les présentations ?**  
R : Oui, comme dans les répliques normales : `HAMLET\n(Prince tourmenté) Description...`

**Q : La section Cast apparaît-elle dans les statistiques ?**  
R : Non, les présentations ne sont pas comptées comme des répliques dans les statistiques.

## 🚀 Pour aller plus loin

Consultez la documentation technique complète :
- `docs/SECTION_CAST.md` - Documentation technique détaillée
- `docs/RELEASE_NOTES_STRUCTURE_OPTIONNELLE.md` - Notes de version
- `examples/README-EXAMPLES.md` - Guide des exemples

---

**Version** : 1.0  
**Date** : Janvier 2025  
**Répét** : v0.2.0+