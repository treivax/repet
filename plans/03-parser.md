# 🚀 Prompt 03 : Parser de Textes Théâtraux

**Durée estimée** : ~2h | **Dépend de** : Prompts 01-02

---

## ⚠️ PRÉREQUIS OBLIGATOIRE

**AVANT D'EXÉCUTER CE PROMPT**, charge le fichier `.github/prompts/common.md` dans ton contexte.

Ce fichier contient TOUS les standards du projet (TypeScript, React, architecture, conventions).
Sans lui, tu ne pourras pas respecter les exigences du projet.

---

## 📋 Contexte

Tu vas créer le **parser** qui transforme les fichiers `.txt` bruts en objets `Play` structurés (AST).

Le parser doit analyser le format texte défini dans les spécifications et extraire :
- Métadonnées (titre, auteur, année)
- Structure (actes, scènes)
- Personnages (détectés automatiquement)
- Répliques et didascalies

**Standards** : Respecte `.github/prompts/common.md` (déjà chargé en prérequis)

### Principes clés à respecter

- ✅ Code simple et lisible (pas de sur-ingénierie)
- ✅ TypeScript strict (pas de `any`, typage complet)
- ✅ Gestion d'erreurs explicite (try-catch + messages clairs)
- ✅ Documentation inline (JSDoc pour fonctions publiques)
- ✅ Tests manuels avec fichiers réels
- ❌ PAS de dépendances externes (parser natif uniquement)
- ❌ PAS de regex complexes non documentées

---

## 🎯 Objectifs

1. Créer un tokenizer qui découpe le texte en blocs logiques
2. Créer un parser qui construit l'AST à partir des tokens
3. Extraire automatiquement les métadonnées (titre, auteur, année)
4. Détecter et créer les personnages dynamiquement
5. Gérer les didascalies inline et standalone
6. Valider la structure du fichier importé

---

## 📦 Tâches

### 1. Types Internes du Parser

#### Fichier : `src/core/parser/types.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

/**
 * Type de token détecté dans le texte
 */
export type TokenType =
  | 'title'
  | 'author'
  | 'year'
  | 'category'
  | 'act'
  | 'scene'
  | 'character_line'
  | 'didascalie'
  | 'text'
  | 'empty';

/**
 * Représente un token dans le flux de parsing
 */
export interface Token {
  type: TokenType;
  content: string;
  lineNumber: number;
}

/**
 * Contexte de parsing pour suivre l'état
 */
export interface ParserContext {
  /** Tokens à parser */
  tokens: Token[];
  /** Position actuelle */
  position: number;
  /** Personnages détectés */
  characters: Map<string, string>; // name -> id
  /** Titre de la pièce */
  title?: string;
  /** Auteur */
  author?: string;
  /** Année */
  year?: string;
  /** Catégorie */
  category?: string;
}
```

---

### 2. Tokenizer

#### Fichier : `src/core/parser/tokenizer.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { Token, TokenType } from './types';

/**
 * Découpe le texte brut en tokens
 * 
 * @param text - Texte brut du fichier .txt
 * @returns Liste de tokens
 */
export function tokenize(text: string): Token[] {
  const lines = text.split('\n');
  const tokens: Token[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNumber = i + 1;

    // Ligne vide
    if (trimmed === '') {
      tokens.push({ type: 'empty', content: '', lineNumber });
      continue;
    }

    // Auteur
    if (/^Auteur\s*:?\s*/i.test(trimmed)) {
      const author = trimmed.replace(/^Auteur\s*:?\s*/i, '').trim();
      tokens.push({ type: 'author', content: author, lineNumber });
      continue;
    }

    // Année
    if (/^Ann[ée]e\s*:?\s*/i.test(trimmed)) {
      const year = trimmed.replace(/^Ann[ée]e\s*:?\s*/i, '').trim();
      tokens.push({ type: 'year', content: year, lineNumber });
      continue;
    }

    // Catégorie
    if (/^Cat[ée]gorie\s*:?\s*/i.test(trimmed)) {
      const category = trimmed.replace(/^Cat[ée]gorie\s*:?\s*/i, '').trim();
      tokens.push({ type: 'category', content: category, lineNumber });
      continue;
    }

    // Acte
    if (/^Acte\s+/i.test(trimmed)) {
      tokens.push({ type: 'act', content: trimmed, lineNumber });
      continue;
    }

    // Scène
    if (/^Sc[èe]ne\s+/i.test(trimmed)) {
      tokens.push({ type: 'scene', content: trimmed, lineNumber });
      continue;
    }

    // Réplique : MAJUSCULES suivi de ':'
    if (/^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s'-]+\s*:/.test(trimmed)) {
      tokens.push({ type: 'character_line', content: trimmed, lineNumber });
      continue;
    }

    // Didascalie standalone : texte entre parenthèses complet
    if (/^\(.*\)$/.test(trimmed)) {
      const content = trimmed.slice(1, -1).trim();
      tokens.push({ type: 'didascalie', content, lineNumber });
      continue;
    }

    // Texte normal
    tokens.push({ type: 'text', content: trimmed, lineNumber });
  }

  return tokens;
}

/**
 * Extrait le numéro d'un titre d'acte ou de scène
 * 
 * @param text - Texte de l'acte/scène (ex: "Acte I", "Scène 2")
 * @returns Numéro extrait ou undefined
 */
export function extractNumber(text: string): number | undefined {
  // Nombres romains
  const romanMatch = text.match(/\b([IVXLCDM]+)\b/);
  if (romanMatch) {
    return romanToInt(romanMatch[1]);
  }

  // Nombres arabes
  const arabicMatch = text.match(/\b(\d+)\b/);
  if (arabicMatch) {
    return parseInt(arabicMatch[1], 10);
  }

  return undefined;
}

/**
 * Convertit un nombre romain en entier
 * 
 * @param roman - Nombre romain (I, II, III, IV, V, etc.)
 * @returns Entier correspondant
 */
function romanToInt(roman: string): number {
  const values: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };

  let total = 0;
  for (let i = 0; i < roman.length; i++) {
    const current = values[roman[i]];
    const next = values[roman[i + 1]];

    if (next && current < next) {
      total -= current;
    } else {
      total += current;
    }
  }

  return total;
}
```

---

### 3. Parser Principal

#### Fichier : `src/core/parser/parser.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { Play } from '../models/Play';
import { Character, createCharacter } from '../models/Character';
import {
  ContentNode,
  ActNode,
  SceneNode,
  LineNode,
  DidascalieNode,
  TextSegment,
} from '../models/ContentNode';
import { tokenize, extractNumber } from './tokenizer';
import { ParserContext, Token } from './types';
import { generateUUID } from '../../utils/uuid';

/**
 * Parse un fichier texte et retourne un objet Play
 * 
 * @param text - Contenu du fichier .txt
 * @param fileName - Nom du fichier original
 * @returns Play object parsé
 * @throws Error si le format est invalide
 */
export function parsePlayText(text: string, fileName: string): Play {
  try {
    const tokens = tokenize(text);
    const context = initializeContext(tokens);

    // Extraire métadonnées
    extractMetadata(context);

    // Extraire le titre (premier bloc non-métadonnée)
    if (!context.title) {
      context.title = extractTitle(context);
    }

    // Parser le contenu
    const content = parseContent(context);

    // Créer l'objet Play
    const play: Play = {
      id: generateUUID(),
      fileName,
      title: context.title || 'Sans titre',
      author: context.author,
      year: context.year,
      category: context.category,
      characters: Array.from(context.characters.values()).map((id) => {
        const name = Array.from(context.characters.entries()).find(
          ([_, v]) => v === id
        )![0];
        return createCharacter(name);
      }),
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return play;
  } catch (error) {
    throw new Error(
      `Erreur lors du parsing : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    );
  }
}

/**
 * Initialise le contexte de parsing
 */
function initializeContext(tokens: Token[]): ParserContext {
  return {
    tokens,
    position: 0,
    characters: new Map(),
  };
}

/**
 * Extrait les métadonnées du contexte
 */
function extractMetadata(context: ParserContext): void {
  for (const token of context.tokens) {
    if (token.type === 'author' && !context.author) {
      context.author = token.content;
    } else if (token.type === 'year' && !context.year) {
      context.year = token.content;
    } else if (token.type === 'category' && !context.category) {
      context.category = token.content;
    }
  }
}

/**
 * Extrait le titre (premier bloc de texte non-métadonnée)
 */
function extractTitle(context: ParserContext): string {
  for (const token of context.tokens) {
    if (
      token.type === 'text' &&
      token.content.length > 0 &&
      !/^(Auteur|Ann[ée]e|Cat[ée]gorie)/i.test(token.content)
    ) {
      return token.content;
    }
  }
  return 'Sans titre';
}

/**
 * Parse le contenu principal (actes, scènes, répliques)
 */
function parseContent(context: ParserContext): ContentNode[] {
  const content: ContentNode[] = [];

  while (context.position < context.tokens.length) {
    const token = context.tokens[context.position];

    if (token.type === 'act') {
      content.push(parseAct(context));
    } else if (token.type === 'scene') {
      content.push(parseScene(context));
    } else if (token.type === 'character_line') {
      content.push(parseLine(context));
    } else if (token.type === 'didascalie') {
      const node: DidascalieNode = {
        type: 'didascalie',
        content: token.content,
      };
      content.push(node);
      context.position++;
    } else {
      context.position++;
    }
  }

  return content;
}

/**
 * Parse un acte
 */
function parseAct(context: ParserContext): ActNode {
  const token = context.tokens[context.position];
  const number = extractNumber(token.content);
  const title = token.content;

  context.position++;

  const children: ContentNode[] = [];

  // Parser les scènes et répliques de l'acte
  while (
    context.position < context.tokens.length &&
    context.tokens[context.position].type !== 'act'
  ) {
    const current = context.tokens[context.position];

    if (current.type === 'scene') {
      children.push(parseScene(context));
    } else if (current.type === 'character_line') {
      children.push(parseLine(context));
    } else if (current.type === 'didascalie') {
      children.push({
        type: 'didascalie',
        content: current.content,
      });
      context.position++;
    } else {
      context.position++;
    }
  }

  return {
    type: 'act',
    number,
    title,
    children,
  };
}

/**
 * Parse une scène
 */
function parseScene(context: ParserContext): SceneNode {
  const token = context.tokens[context.position];
  const number = extractNumber(token.content);
  const title = token.content;

  context.position++;

  const children: ContentNode[] = [];

  // Parser les répliques de la scène
  while (
    context.position < context.tokens.length &&
    context.tokens[context.position].type !== 'act' &&
    context.tokens[context.position].type !== 'scene'
  ) {
    const current = context.tokens[context.position];

    if (current.type === 'character_line') {
      children.push(parseLine(context));
    } else if (current.type === 'didascalie') {
      children.push({
        type: 'didascalie',
        content: current.content,
      });
      context.position++;
    } else {
      context.position++;
    }
  }

  return {
    type: 'scene',
    number,
    title,
    children,
  };
}

/**
 * Parse une réplique de personnage
 */
function parseLine(context: ParserContext): LineNode {
  const token = context.tokens[context.position];
  const [characterName, ...restParts] = token.content.split(':');
  const characterNameClean = characterName.trim();
  const firstPart = restParts.join(':').trim();

  // Enregistrer le personnage
  if (!context.characters.has(characterNameClean)) {
    context.characters.set(characterNameClean, generateUUID());
  }

  const characterId = context.characters.get(characterNameClean)!;

  context.position++;

  // Collecter tout le texte de la réplique
  const textParts: string[] = [];
  if (firstPart) {
    textParts.push(firstPart);
  }

  // Continuer tant qu'on a du texte (pas un autre personnage/acte/scène)
  while (
    context.position < context.tokens.length &&
    context.tokens[context.position].type === 'text'
  ) {
    textParts.push(context.tokens[context.position].content);
    context.position++;
  }

  const fullText = textParts.join(' ');

  // Parser les segments (texte + didascalies inline)
  const segments = parseSegments(fullText);

  return {
    type: 'line',
    id: generateUUID(),
    characterId,
    segments,
  };
}

/**
 * Parse les segments d'une réplique (texte + didascalies inline)
 */
function parseSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let current = '';
  let inDidascalie = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '(' && !inDidascalie) {
      // Fin du segment texte
      if (current.trim()) {
        segments.push({ type: 'text', content: current.trim() });
      }
      current = '';
      inDidascalie = true;
    } else if (char === ')' && inDidascalie) {
      // Fin de la didascalie
      if (current.trim()) {
        segments.push({ type: 'didascalie', content: current.trim() });
      }
      current = '';
      inDidascalie = false;
    } else {
      current += char;
    }
  }

  // Texte restant
  if (current.trim()) {
    segments.push({
      type: inDidascalie ? 'didascalie' : 'text',
      content: current.trim(),
    });
  }

  return segments;
}
```

---

### 4. Utilitaire UUID

#### Fichier : `src/utils/uuid.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

/**
 * Génère un UUID v4
 * 
 * @returns UUID unique
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```

---

### 5. Index du Parser

#### Fichier : `src/core/parser/index.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

export { parsePlayText } from './parser';
export { tokenize, extractNumber } from './tokenizer';
export type { Token, TokenType, ParserContext } from './types';
```

---

## ✅ Critères de Validation

**Avant de passer au prompt suivant, valider :**

```bash
npm run type-check  # DOIT retourner 0 erreur
npm run dev         # DOIT démarrer sans erreur
```

### Tests manuels

Créer un fichier de test `public/test-play.txt` :

```
Le Bourgeois Gentilhomme
Auteur: Molière
Année: 1670
Catégorie: Comédie

Acte I

Scène 1

MONSIEUR JOURDAIN: Nicole, apportez-moi mes pantoufles et me donnez mon bonnet de nuit.

NICOLE: (riant) Monsieur, vous êtes bien plaisant avec votre bonnet !

MONSIEUR JOURDAIN: Comment osez-vous rire de moi ? (en colère) Sortez immédiatement !

Scène 2

MADAME JOURDAIN: Que se passe-t-il ici ?

MONSIEUR JOURDAIN: Rien qui vous regarde, madame.
```

Tester le parser dans la console navigateur :

```javascript
import { parsePlayText } from './core/parser';

// Charger le fichier de test
const response = await fetch('/test-play.txt');
const text = await response.text();

// Parser
const play = parsePlayText(text, 'test-play.txt');

// Vérifier
console.log('Titre:', play.title); // "Le Bourgeois Gentilhomme"
console.log('Auteur:', play.author); // "Molière"
console.log('Année:', play.year); // "1670"
console.log('Personnages:', play.characters); // MONSIEUR JOURDAIN, NICOLE, MADAME JOURDAIN
console.log('Actes:', play.content.filter(n => n.type === 'act').length); // 1
console.log('Scènes:', play.content[0].children.filter(n => n.type === 'scene').length); // 2
```

### Checklist de validation

- [ ] Fichiers créés sans erreurs TypeScript
- [ ] Aucun type `any` utilisé
- [ ] JSDoc présent sur toutes les fonctions publiques
- [ ] Imports/exports fonctionnent correctement
- [ ] Parser détecte correctement titre, auteur, année
- [ ] Personnages extraits automatiquement
- [ ] Actes et scènes parsés correctement
- [ ] Répliques assignées aux bons personnages
- [ ] Didascalies inline détectées (entre parenthèses)
- [ ] Didascalies standalone détectées
- [ ] Gestion d'erreurs explicite (try-catch)
- [ ] Test manuel avec fichier réel réussi

---

## 📝 Livrables

- [x] `src/core/parser/types.ts`
- [x] `src/core/parser/tokenizer.ts`
- [x] `src/core/parser/parser.ts`
- [x] `src/core/parser/index.ts`
- [x] `src/utils/uuid.ts`
- [x] `public/test-play.txt` (fichier de test)
- [x] Tests manuels passés
- [x] Commit avec message : "feat: add text parser (Prompt 03)"

---

## 🔗 Liens utiles

- Standards : `.github/prompts/common.md`
- Architecture : `plans/PROJECT_STRUCTURE.md`
- Modèles de données : `src/core/models/`

---

## 📌 Notes importantes

- Le parser doit être **tolérant** : si un champ manque (auteur, année), continuer quand même
- Les noms de personnages peuvent contenir des espaces, tirets, apostrophes
- Les didascalies peuvent être imbriquées dans les répliques ou standalone
- Les numéros d'actes/scènes peuvent être romains (I, II) ou arabes (1, 2)

---

## ➡️ Prompt suivant

Après validation complète : **Prompt 04 - Storage (IndexedDB)**