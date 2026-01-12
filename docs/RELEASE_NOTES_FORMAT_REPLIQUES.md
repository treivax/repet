# Notes de Version - Support Format de Répliques Sans Deux-Points

**Date** : Janvier 2025  
**Version** : À venir dans la prochaine release  
**Type** : Nouvelle fonctionnalité

---

## 🎭 Résumé

Le parser de Répét accepte maintenant **deux formats pour les répliques** dans les fichiers `.txt` :

1. **Format classique** (avec deux-points) : `PERSONNAGE:`
2. **Format nouveau** (sans deux-points) : `PERSONNAGE` (précédé d'une ligne vierge)

Les deux formats peuvent être **mélangés dans le même fichier**.

---

## ✨ Nouveautés

### Format Sans Deux-Points

Vous pouvez désormais écrire vos répliques sans les deux-points après le nom du personnage :

**Avant (seul format accepté) :**
```
HAMLET:
Être ou ne pas être, telle est la question.

OPHÉLIE:
Mon prince...
```

**Maintenant (nouveau format également accepté) :**
```
HAMLET
Être ou ne pas être, telle est la question.

OPHÉLIE
Mon prince...
```

### Règles du Format Sans Deux-Points

Pour qu'un nom soit reconnu comme personnage sans deux-points, il doit respecter **toutes** ces conditions :

✅ **Ligne vierge avant** - Le nom doit être précédé d'une ligne complètement vide  
✅ **MAJUSCULES** - Le nom doit être entièrement en majuscules  
✅ **Début de ligne** - Le nom doit commencer au premier caractère (pas d'indentation)  
✅ **Noms composés supportés** - `JEAN-PIERRE`, `MARIE LOUISE`, `LE PETIT CHAPERON ROUGE`, etc.

### Format Mixte

Les deux formats peuvent coexister dans le même fichier :

```
ACTE I

Scene 1

JEAN:
Bonjour ! (format avec deux-points)

MARIE
Bonjour à vous aussi. (format sans deux-points)

JEAN
Comment allez-vous ? (format sans deux-points)

MARIE:
Très bien, merci. (format avec deux-points)
```

---

## 📋 Exemples

### Exemple 1 : Format Sans Deux-Points Pur

```
Le Petit Chaperon Rouge

Auteur: Charles Perrault
Annee: 1697

ACTE I

Scene 1

LE PETIT CHAPERON ROUGE
Quelle belle journée pour aller voir mère-grand !

LE LOUP
Bonjour, ma petite demoiselle.
Où allez-vous donc si tôt ce matin ?

LE PETIT CHAPERON ROUGE
Je vais voir ma mère-grand et lui porter une galette.
```

### Exemple 2 : Format Mixte

```
La Rencontre

ACTE I

Scene 1

JEAN:
Bonjour ! Cette place est-elle libre ?

MARIE
Oui, je vous en prie, asseyez-vous.

JEAN:
Merci. Vous lisez quoi d'intéressant ?

MARIE
"Les Misérables" de Victor Hugo.
```

### Exemple 3 : Noms Composés

```
ACTE I

Scene 1

MARIE-ANTOINETTE
Je suis la reine de France.

LOUIS-PHILIPPE D'ORLÉANS
Et moi, le roi des Français.

LE PETIT CHAPERON ROUGE
Les noms composés fonctionnent parfaitement !
```

---

## 🚨 Cas Particuliers et Pièges

### ❌ Ce qui NE fonctionnera PAS

**1. Nom sans ligne vierge avant (sera traité comme didascalie) :**
```
Texte de didascalie
HAMLET
Ceci sera considéré comme une didascalie, pas une réplique !
```

**2. Nom avec indentation (sera traité comme didascalie) :**
```

  HAMLET
Ceci sera aussi une didascalie car le nom est indenté !
```

**3. Nom en minuscules ou casse mixte :**
```

Hamlet
Ceci ne sera pas reconnu (doit être en MAJUSCULES).
```

### ✅ Solutions

**1. Toujours précéder d'une ligne vierge :**
```
Texte de didascalie

HAMLET
Maintenant c'est bon !
```

**2. Pas d'espace avant le nom :**
```

HAMLET
Parfait, pas d'indentation !
```

**3. MAJUSCULES obligatoires :**
```

HAMLET
Toujours en majuscules !
```

---

## 🔧 Impact Technique

### Fichiers Modifiés

- **`src/core/parser/textParser.ts`**
  - Fonction `isCharacterLine()` : ajout du paramètre `previousLine`
  - Fonction `extractCharacterName()` : gestion des deux formats
  - Fonction `parseStructure()` : passage de la ligne brute pour vérifier l'indentation

- **`src/core/parser/__tests__/parser.test.ts`**
  - 5 nouveaux tests pour valider le format sans deux-points
  - Tests de noms composés
  - Tests de non-reconnaissance sans ligne vierge
  - Tests de format mixte

### Documentation Mise à Jour

- ✅ `docs/PARSER.md` - Documentation complète du parser
- ✅ `docs/USER_GUIDE.md` - Guide utilisateur
- ✅ `docs/ARCHITECTURE.md` - Architecture technique
- ✅ `CHANGELOG.md` - Notes de version
- ✅ `PROJECT_STATUS.md` - Statut du projet
- ✅ `src/screens/HelpScreen.tsx` - Aide intégrée dans l'application

### Exemples Ajoutés

- ✅ `examples/format-sans-deux-points.txt` - Exemple du nouveau format
- ✅ `examples/format-mixte.txt` - Exemple de mélange des deux formats
- ✅ `examples/README.md` - Documentation des exemples

---

## ✅ Tests

**Statut** : Tous les tests passent (29/29) ✅

### Nouveaux Tests Ajoutés

1. `devrait reconnaître une réplique sans deux-points précédée d'une ligne vierge`
2. `devrait reconnaître plusieurs répliques sans deux-points`
3. `devrait accepter les noms composés sans deux-points`
4. `ne devrait PAS reconnaître un nom sans deux-points si non précédé d'une ligne vierge`
5. `devrait mélanger les formats avec et sans deux-points`

### Validation

```bash
npm test -- src/core/parser/__tests__/parser.test.ts
```

Résultat : **29 tests passed** ✅

---

## 🎯 Cas d'Usage

### Pourquoi ce nouveau format ?

1. **Simplicité** - Moins de caractères à taper
2. **Lisibilité** - Format plus aéré et visuellement clair
3. **Compatibilité** - Certains scripts de théâtre utilisent déjà ce format
4. **Flexibilité** - Vous choisissez le format qui vous convient

### Quand utiliser quel format ?

**Format avec deux-points (`PERSONNAGE:`)**
- Scripts déjà existants au format classique
- Compatibilité avec d'autres outils
- Pas besoin de lignes vierges avant chaque réplique

**Format sans deux-points (`PERSONNAGE`)**
- Nouveaux scripts pour plus de lisibilité
- Format "épuré" et moderne
- Meilleure séparation visuelle entre les répliques

**Format mixte**
- Transition progressive d'un format à l'autre
- Sections différentes avec formats différents
- Maximum de flexibilité

---

## 📚 Ressources

### Documentation

- [PARSER.md](./PARSER.md) - Documentation complète du parser
- [USER_GUIDE.md](./USER_GUIDE.md) - Guide utilisateur
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture technique

### Exemples

- `examples/format-sans-deux-points.txt` - Le Petit Chaperon Rouge (format pur)
- `examples/format-mixte.txt` - La Rencontre (format mixte)
- `examples/ALEGRIA.txt` - Exemple complexe (format classique)

### Tests

- `src/core/parser/__tests__/parser.test.ts` - Suite de tests complète

---

## 🔄 Rétrocompatibilité

✅ **Totalement rétrocompatible**

- Tous les fichiers existants continuent de fonctionner
- Le format classique avec deux-points reste supporté
- Aucune modification requise sur les fichiers existants
- Zéro breaking change

---

## 🚀 Migration

### Pas de migration nécessaire !

Vos fichiers existants fonctionnent exactement comme avant. Si vous souhaitez adopter le nouveau format :

**Option 1 : Conversion complète**
```bash
# Remplacer tous les "PERSONNAGE:" par "PERSONNAGE"
# ET ajouter des lignes vierges avant chaque nom
```

**Option 2 : Migration progressive**
```bash
# Garder l'ancien format pour les répliques existantes
# Utiliser le nouveau format pour les nouvelles répliques
```

**Option 3 : Ne rien faire**
```bash
# Continuer d'utiliser le format classique
# Tout fonctionne comme avant
```

---

## 📞 Support

Pour toute question ou problème :

1. Consultez la [documentation](./PARSER.md)
2. Vérifiez les [exemples](../examples/)
3. Lancez les [tests](../src/core/parser/__tests__/parser.test.ts)
4. Ouvrez une issue sur GitHub

---

**Bonne utilisation du nouveau format ! 🎭**

*Répét - L'application de répétition théâtrale qui évolue avec vous.*