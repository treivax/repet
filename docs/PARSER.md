# Parser de Texte Théâtral - Documentation

## Vue d'ensemble

Le parser de Répét (`textParser.ts`) transforme des fichiers texte bruts au format théâtral en un arbre syntaxique abstrait (AST) structuré. Il suit strictement les conventions du format `.txt` théâtral français.

## Format de Fichier

### Structure Générale

```
TITRE DE LA PIÈCE

Auteur: NOM DE L'AUTEUR
Annee: ANNÉE

ACTE I

SCÈNE 1

PERSONNAGE1: Texte de la réplique
qui peut s'étendre sur plusieurs lignes.

PERSONNAGE2: Autre réplique.

(Didascalie de mise en scène)

PERSONNAGE1: Réplique avec (didascalie inline) dans le texte.
```

### Règles de Format

#### 1. Métadonnées (en-tête)

**Titre** (obligatoire)
- Première ligne non vide du fichier
- Tout en MAJUSCULES recommandé
- Isolé par des lignes vides avant et après

```
HAMLET

```

**Auteur** (optionnel)
- Ligne commençant par `Auteur:` (insensible à la casse)
- Suit directement le titre (avec maximum 1 ligne vide)

```
HAMLET

Auteur: William Shakespeare
```

**Année** (optionnel)
- Ligne commençant par `Annee:` ou `Année:` (insensible à la casse)
- Suit l'auteur ou le titre

```
HAMLET

Auteur: William Shakespeare
Annee: 1601
```

#### 2. Structure Actes et Scènes

**Déclaration d'Acte**
- Ligne contenant le mot `ACTE` suivi d'un numéro
- Formats acceptés : `ACTE I`, `ACTE 1`, `Acte premier`, etc.
- Doit être sur sa propre ligne

```
ACTE I
```

**Déclaration de Scène**
- Ligne contenant le mot `SCÈNE` ou `SCENE` suivi d'un numéro
- Formats acceptés : `SCÈNE 1`, `SCENE I`, `Scène première`, etc.
- Doit être sur sa propre ligne

```
SCÈNE 1
```

#### 3. Répliques (Dialogues)

Le parser accepte **deux formats** pour les répliques :

**Format 1 : Avec deux-points (standard)**
- Nom du personnage en MAJUSCULES suivi de `:` sur une ligne dédiée
- Le texte de la réplique suit sur les lignes suivantes
- La réplique se termine à la prochaine ligne vide ou nouveau personnage

```
HAMLET: Être ou ne pas être,
telle est la question.

OPHÉLIE: Mon prince...
```

**Format 2 : Sans deux-points (nouveau)**
- Nom du personnage en MAJUSCULES sur une ligne dédiée **sans** `:`
- **DOIT être précédé d'une ligne vierge**
- Le nom doit commencer au premier caractère (pas d'indentation)
- Le texte de la réplique suit sur les lignes suivantes
- Supporte les noms composés : `JEAN-PIERRE`, `MARIE LOUISE LEGRANCHU`

```
HAMLET
Être ou ne pas être,
telle est la question.

OPHÉLIE
Mon prince...
```

**Les deux formats peuvent être mélangés dans le même fichier :**

```
HAMLET:
Avec deux-points.

OPHÉLIE
Sans deux-points.

HAMLET
Encore sans.

OPHÉLIE:
Encore avec.
```

**Règles Importantes**
- Le nom du personnage doit être en MAJUSCULES
- Format avec `:` : pas besoin de ligne vierge avant
- Format sans `:` : **ligne vierge obligatoire avant** + **pas d'indentation**
- Le texte peut s'étendre sur plusieurs lignes
- Les lignes vides séparent les répliques

**Détection de Personnages**
Le parser extrait automatiquement tous les personnages uniques rencontrés dans le texte, quel que soit le format utilisé.

#### 4. Didascalies

**Didascalies de Bloc**
- Lignes entre parenthèses `(...)` en dehors des répliques
- Peuvent s'étendre sur plusieurs lignes

```
(Le rideau se lève. Hamlet entre, seul, visiblement
troublé. Il marche de long en large.)

HAMLET: Être ou ne pas être...
```

**Didascalies Inline**
- Parenthèses `(...)` à l'intérieur d'une réplique
- Traitées comme partie du texte de la réplique

```
HAMLET: Être ou ne pas être (il hésite),
telle est la question.
```

#### 5. Lignes Vides

- Séparent les répliques
- Séparent les didascalies
- Séparent les sections (actes, scènes)
- Les lignes vides multiples sont normalisées

## Exemples Complets

### Exemple Minimal

```
LA FARCE

PERSONNAGE1: Bonjour !

PERSONNAGE2: Bonsoir.
```

### Exemple avec Métadonnées

```
LE CID

Auteur: Pierre Corneille
Annee: 1637

ACTE I

SCÈNE 1

CHIMÈNE: Elvire, m'as-tu fait un rapport bien sincère ?

ELVIRE: Ne vous laissez point surprendre à cette douceur.
```

### Exemple Complet avec Didascalies

```
HAMLET

Auteur: William Shakespeare
Annee: 1601

ACTE I

SCÈNE 1

(Le château d'Elseneur. Une plateforme devant le château.
Il fait nuit. Bernardo arrive pour prendre la garde.)

BERNARDO: Qui va là ?

FRANCISCO: Non, répondez-moi. Halte et donnez le mot.

BERNARDO: Vive le roi !

FRANCISCO: Bernardo ?

BERNARDO: Lui-même.

FRANCISCO: Vous venez très exactement à votre heure.

(Ils échangent quelques mots, puis Francisco part.)
```

### Exemple Mode Italiennes

Format optimisé pour le travail en "italiennes" (avec format sans deux-points) :

```
RÉPÉTITION DE GROUPE

ACTE I

SCÈNE 1

MARIE
Je ne comprends pas pourquoi tu es parti.

JEAN
J'avais mes raisons (il détourne le regard).
Tu le sais bien.

MARIE
Non, je ne sais rien !

(Elle s'approche de lui)

JEAN
Ne me touche pas.

MARIE
Pourquoi ? Qu'est-ce qui t'arrive ?
```

Lors de la lecture en mode italiennes :
- Les répliques de l'utilisateur sont masquées par défaut
- La voix off lit les didascalies si activée
- Possibilité de révéler la réplique masquée en un clic

## Structure de l'AST Généré

Le parser génère un objet `PlayAST` avec la structure suivante :

```typescript
interface PlayAST {
  metadata: {
    title: string
    author?: string
    year?: string
  }
  characters: Character[]  // Détectés automatiquement
  acts: Act[]
  scenes: Scene[]          // Liste plate de toutes les scènes
  flatLines: Line[]        // Liste plate de toutes les lignes
}

interface Act {
  number: number
  title: string
  scenes: Scene[]
}

interface Scene {
  actNumber: number
  number: number
  title: string
  lines: Line[]
}

interface Line {
  id: string
  type: 'dialogue' | 'stage-direction'
  actIndex: number
  sceneIndex: number
  lineIndex: number
  characterId?: string      // Pour dialogues
  character?: string        // Nom du personnage
  text: string
}

interface Character {
  id: string
  name: string
  gender?: 'male' | 'female' | 'neutral'
}
```

## Utilisation du Parser

### Import

```typescript
import { parsePlayText } from '@/core/parser/textParser'
```

### Parsing d'un Fichier

```typescript
const fileContent = await file.text()
const ast = parsePlayText(fileContent)

console.log(ast.metadata.title)        // "HAMLET"
console.log(ast.characters.length)     // Nombre de personnages
console.log(ast.acts.length)           // Nombre d'actes
console.log(ast.flatLines.length)      // Nombre total de lignes
```

### Accès aux Données

```typescript
// Titre et métadonnées
const { title, author, year } = ast.metadata

// Liste des personnages
const characters = ast.characters
characters.forEach(char => {
  console.log(`${char.name} (${char.gender})`)
})

// Navigation par acte/scène
const firstAct = ast.acts[0]
const firstScene = firstAct.scenes[0]
const lines = firstScene.lines

// Toutes les lignes dans l'ordre
const allLines = ast.flatLines
```

## Validation et Erreurs

Le parser est permissif et tente de parser le maximum de contenu possible :

- **Titre manquant** : Utilise "Sans titre"
- **Pas d'actes/scènes** : Crée un acte/scène par défaut
- **Format inhabituel** : Tente de détecter la structure
- **Lignes ambiguës** : Traitées comme didascalies

### Bonnes Pratiques

✅ **À faire**
- Titre en majuscules sur la première ligne
- Noms de personnages en MAJUSCULES
- Format avec `:` : `PERSONNAGE:` suivi du texte
- Format sans `:` : ligne vierge + `PERSONNAGE` (sans indentation) + texte
- Lignes vides pour séparer les répliques (obligatoire pour format sans `:`)
- Déclarations ACTE/SCÈNE sur leur propre ligne
- Didascalies entre parenthèses

❌ **À éviter**
- Mélanger majuscules/minuscules pour les noms de personnages
- Format sans `:` : oublier la ligne vierge avant le nom
- Format sans `:` : indenter le nom du personnage
- Mélanger répliques sans lignes vides (surtout pour format sans `:`)
- Numéros d'actes/scènes incohérents

## Tests et Validation

### Fichiers de Test

Le dossier `examples/` contient des fichiers de test :

- `ALEGRIA.txt` - Exemple complet avec métadonnées
- `minimal.txt` - Format minimal
- `complex.txt` - Cas complexes (didascalies, multi-lignes)

### Exécution des Tests

```bash
npm run test -- parser.test.ts
```

Les tests couvrent :
- Parsing des métadonnées
- Détection des personnages
- Structure actes/scènes
- Répliques multi-lignes
- Didascalies (bloc et inline)
- Cas limites et formats invalides

## Migration depuis l'Ancien Format

Si vous avez des fichiers au format legacy :

1. Le parser legacy (`parser.ts`) est toujours disponible mais **deprecated**
2. Convertissez vos fichiers au nouveau format :
   - Assurez-vous que les noms de personnages sont en MAJUSCULES
   - Ajoutez des lignes vides entre les répliques
   - Vérifiez les déclarations ACTE/SCÈNE

## Performance

- **Fichiers moyens** (< 500 lignes) : < 10ms
- **Grandes pièces** (500-2000 lignes) : < 50ms
- **Très grandes pièces** (> 2000 lignes) : < 200ms

Le parser est optimisé pour :
- Lecture séquentielle (une seule passe)
- Allocation mémoire minimale
- Traitement synchrone (pas d'async overhead)

## Contribution

Pour améliorer le parser :

1. Ajoutez des tests dans `src/core/parser/__tests__/parser.test.ts`
2. Documentez les nouveaux formats dans ce fichier
3. Maintenez la compatibilité ascendante
4. Respectez les conventions TypeScript strict

## Licence

Copyright (c) 2025 Répét Contributors
Licensed under the MIT License