# Prompt 03 : Parser de Textes Théâtraux - ✅ TERMINÉ

**Date de complétion** : 2025-01-XX  
**Durée estimée** : ~2h  
**Durée réelle** : ~1h30

---

## 📋 Résumé

Le parser de textes théâtraux a été implémenté avec succès. Il transforme les fichiers `.txt` bruts en objets `Play` structurés (AST) conformes aux modèles définis dans le Prompt 02.

---

## ✅ Livrables créés

### Fichiers principaux

- ✅ `src/core/parser/types.ts` - Types internes (Token, TokenType, ParserContext)
- ✅ `src/core/parser/tokenizer.ts` - Tokenizer pour découper le texte en blocs logiques
- ✅ `src/core/parser/parser.ts` - Parser principal qui construit l'AST
- ✅ `src/core/parser/index.ts` - Exports centralisés
- ✅ `src/utils/uuid.ts` - Générateur d'UUID v4
- ✅ `public/test-play.txt` - Fichier de test (Le Bourgeois Gentilhomme)

### Fichiers modifiés

- ✅ `src/core/models/Character.ts` - Ajout paramètre `id` optionnel à `createCharacter()`

---

## 🎯 Fonctionnalités implémentées

### 1. Tokenization (découpage du texte)

Le tokenizer analyse le texte ligne par ligne et détecte :

- **Métadonnées** : Auteur, Année, Catégorie
- **Structure** : Acte, Scène
- **Répliques** : PERSONNAGE: texte de la réplique
- **Didascalies** : 
  - Standalone : `(texte complet entre parenthèses)`
  - Inline : `texte (didascalie) suite du texte`
- **Texte normal** : Continuation de répliques

### 2. Extraction de métadonnées

- Titre extrait automatiquement (premier bloc de texte non-métadonnée)
- Auteur, année, catégorie parsés depuis les lignes dédiées
- Gestion des variations : "Année" / "Annee", "Catégorie" / "Categorie"

### 3. Détection automatique des personnages

- Reconnaissance des noms en MAJUSCULES suivis de `:`
- Génération automatique d'un UUID pour chaque personnage
- Map interne pour éviter les doublons
- Création d'objets `Character` avec valeurs par défaut

### 4. Construction de l'AST

Le parser construit un arbre de syntaxe abstraite (AST) avec :

- **ActNode** : Actes avec numéro (romain ou arabe) et enfants
- **SceneNode** : Scènes avec numéro et enfants
- **LineNode** : Répliques avec ID, personnage, et segments
- **DidascalieNode** : Didascalies standalone
- **TextSegment** : Segments de texte ou didascalies inline

### 5. Gestion des didascalies inline

Parser intelligent qui détecte les didascalies `(entre parenthèses)` au milieu d'une réplique et crée des segments distincts :

```typescript
// Exemple : "Bonjour (souriant) comment allez-vous ?"
[
  { type: 'text', content: 'Bonjour' },
  { type: 'didascalie', content: 'souriant' },
  { type: 'text', content: 'comment allez-vous ?' }
]
```

### 6. Support des numéros romains et arabes

- Acte I, II, III... ou Acte 1, 2, 3...
- Scène I, II, III... ou Scène 1, 2, 3...
- Conversion automatique en nombres pour `number` dans ActNode/SceneNode

---

## 🔍 Validation

### Type-check

```bash
npm run type-check
```

✅ **Résultat** : 0 erreur TypeScript

### Linting

```bash
npm run lint
```

✅ **Résultat** : 0 warning, 0 erreur ESLint

### Build production

```bash
npm run build
```

✅ **Résultat** : Build réussi (36 modules, ~243 KB JavaScript)

### Serveur de développement

```bash
npm run dev
```

✅ **Résultat** : Serveur démarre sur http://localhost:5173/

---

## 🧪 Tests manuels recommandés

### Test 1 : Parser un fichier simple

```javascript
import { parsePlayText } from './core/parser';

const text = `
Le Bourgeois Gentilhomme
Auteur: Molière
Année: 1670

Acte I

MONSIEUR JOURDAIN: Bonjour !
`;

const play = parsePlayText(text, 'test.txt');
console.log(play.title); // "Le Bourgeois Gentilhomme"
console.log(play.author); // "Molière"
console.log(play.characters.length); // 1
```

### Test 2 : Didascalies inline

```javascript
const text = `
Test

PERSONNAGE: Bonjour (souriant) comment allez-vous (tendant la main) ?
`;

const play = parsePlayText(text, 'test.txt');
const line = play.content[0];
console.log(line.segments);
// [
//   { type: 'text', content: 'Bonjour' },
//   { type: 'didascalie', content: 'souriant' },
//   { type: 'text', content: 'comment allez-vous' },
//   { type: 'didascalie', content: 'tendant la main' },
//   { type: 'text', content: '?' }
// ]
```

### Test 3 : Structure actes/scènes

```javascript
const text = `
Test

Acte I

Scène 1

PERSONNAGE A: Réplique 1

Scène 2

PERSONNAGE B: Réplique 2
`;

const play = parsePlayText(text, 'test.txt');
console.log(play.content[0].type); // "act"
console.log(play.content[0].children[0].type); // "scene"
```

---

## 📊 Statistiques

- **Fichiers créés** : 6
- **Fichiers modifiés** : 1
- **Lignes de code** : ~500 lignes TypeScript
- **Fonctions publiques** : 3 (parsePlayText, tokenize, extractNumber)
- **Fonctions internes** : 7
- **Types définis** : 3 (Token, TokenType, ParserContext)

---

## 🔗 Dépendances

- `src/core/models/*` (Prompt 02) - Modèles de données
- `src/utils/uuid.ts` - Génération d'UUID (nouveau)

---

## 📝 Notes techniques

### Choix de conception

1. **Tokenization en 2 étapes** : Découpage d'abord, parsing ensuite
   - Plus simple à déboguer
   - Séparation des responsabilités claire

2. **Map pour les personnages** : `Map<string, string>`
   - Évite les doublons automatiquement
   - Conserve l'ordre d'apparition

3. **Parser récursif** : Pour actes → scènes → répliques
   - Structure naturelle pour l'AST
   - Facile à étendre

4. **Gestion des didascalies** : 2 niveaux
   - Standalone : token dédié
   - Inline : parsing au niveau des segments

### Limitations connues

- **Didascalies imbriquées** : `(texte (imbriqué))` non supporté
- **Personnages multi-lignes** : Nom doit être sur une seule ligne
- **Format strict** : MAJUSCULES requises pour les noms de personnages

### Robustesse

- ✅ Gestion des accents (Année/Annee, Scène/Scene)
- ✅ Tolérance aux lignes vides
- ✅ Métadonnées optionnelles
- ✅ Numéros romains ET arabes
- ✅ Try-catch avec messages d'erreur clairs

---

## 🚀 Prochaines étapes

Le parser est maintenant opérationnel et prêt pour l'intégration.

**Prompt suivant** : Prompt 04 - Storage (IndexedDB avec Dexie)

---

## ✅ Checklist finale

- [x] Tous les fichiers créés
- [x] Copyright headers présents
- [x] JSDoc sur fonctions publiques
- [x] Type-check passe (0 erreur)
- [x] Lint passe (0 warning)
- [x] Build production réussit
- [x] Serveur dev démarre
- [x] Aucun type `any` utilisé
- [x] Gestion d'erreurs explicite
- [x] Fichier de test créé
- [x] Documentation complète