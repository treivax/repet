# 🚀 Prompt 06 : Utilitaires

**Durée estimée** : ~1h | **Dépend de** : Prompts 01-02

---

## ⚠️ PRÉREQUIS OBLIGATOIRE

**AVANT D'EXÉCUTER CE PROMPT**, charge le fichier `.github/prompts/common.md` dans ton contexte.

Ce fichier contient TOUS les standards du projet (TypeScript, React, architecture, conventions).
Sans lui, tu ne pourras pas respecter les exigences du projet.

---

## 📋 Contexte

Tu vas créer les **fonctions utilitaires** réutilisables dans toute l'application.

Ces utilitaires couvrent :
- Génération de couleurs pour les personnages
- Validation de fichiers
- Formatage de texte et dates
- Constantes globales

**Standards** : Respecte `.github/prompts/common.md` (déjà chargé en prérequis)

### Principes clés à respecter

- ✅ Code simple et lisible (pas de sur-ingénierie)
- ✅ TypeScript strict (pas de `any`, typage complet)
- ✅ Fonctions pures (pas d'effet de bord)
- ✅ Documentation inline (JSDoc pour fonctions publiques)
- ✅ Tests manuels simples
- ❌ PAS de dépendances externes (natif uniquement)
- ❌ PAS de logique métier complexe

---

## 🎯 Objectifs

1. Créer un générateur de couleurs déterministe pour personnages
2. Implémenter la validation de fichiers texte
3. Fournir des utilitaires de formatage
4. Définir les constantes globales de l'application
5. UUID déjà créé au Prompt 03

---

## 📦 Tâches

### 1. Générateur de Couleurs

#### Fichier : `src/utils/colors.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

/**
 * Palette de couleurs lisibles et accessibles pour les personnages
 * Couleurs optimisées pour contraste sur fond blanc et sombre
 */
const READABLE_COLORS = [
  '#3B82F6', // blue-500
  '#EF4444', // red-500
  '#10B981', // green-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#14B8A6', // teal-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
  '#84CC16', // lime-500
  '#06B6D4', // cyan-500
  '#F43F5E', // rose-500
  '#8B5CF6', // purple-500
  '#22C55E', // green-400
  '#A855F7', // purple-400
  '#FB923C', // orange-400
];

/**
 * Génère une couleur unique et déterministe pour un personnage
 * 
 * @param name - Nom du personnage
 * @returns Couleur hexadécimale
 * 
 * @example
 * generateCharacterColor('HAMLET') // toujours la même couleur pour HAMLET
 */
export function generateCharacterColor(name: string): string {
  // Hash simple du nom pour index déterministe
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }

  // Index positif dans la palette
  const index = Math.abs(hash) % READABLE_COLORS.length;
  return READABLE_COLORS[index];
}

/**
 * Récupère la palette complète de couleurs
 * 
 * @returns Tableau des couleurs disponibles
 */
export function getColorPalette(): string[] {
  return [...READABLE_COLORS];
}

/**
 * Vérifie si une couleur est dans la palette
 * 
 * @param color - Couleur hexadécimale
 * @returns true si la couleur est dans la palette
 */
export function isValidColor(color: string): boolean {
  return READABLE_COLORS.includes(color.toUpperCase());
}
```

---

### 2. Validation de Fichiers

#### Fichier : `src/utils/validation.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

/**
 * Types de fichiers supportés
 */
export const SUPPORTED_FILE_TYPES = ['.txt', 'text/plain'];

/**
 * Taille maximale de fichier (5 Mo)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Résultat de validation
 */
export interface ValidationResult {
  /** Validation réussie */
  valid: boolean;
  /** Message d'erreur si invalid */
  error?: string;
}

/**
 * Valide un fichier avant import
 * 
 * @param file - Fichier à valider
 * @returns Résultat de validation
 */
export function validateFile(file: File): ValidationResult {
  // Vérifier la taille
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Le fichier est trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} Mo)`,
    };
  }

  // Vérifier le type
  const extension = file.name.toLowerCase().split('.').pop();
  if (!extension || !SUPPORTED_FILE_TYPES.some(type => type.includes(extension))) {
    return {
      valid: false,
      error: 'Seuls les fichiers .txt sont supportés',
    };
  }

  return { valid: true };
}

/**
 * Valide le contenu d'un texte de pièce
 * 
 * @param text - Contenu du fichier
 * @returns Résultat de validation
 */
export function validateTextContent(text: string): ValidationResult {
  // Vérifier que le texte n'est pas vide
  if (!text || text.trim().length === 0) {
    return {
      valid: false,
      error: 'Le fichier est vide',
    };
  }

  // Vérifier une longueur minimale (au moins quelques lignes)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length < 3) {
    return {
      valid: false,
      error: 'Le fichier ne contient pas assez de contenu',
    };
  }

  return { valid: true };
}

/**
 * Valide une vitesse de lecture
 * 
 * @param speed - Vitesse (0.5 - 2.0)
 * @returns true si valide
 */
export function validateSpeed(speed: number): boolean {
  return speed >= 0.5 && speed <= 2.0;
}

/**
 * Valide un volume
 * 
 * @param volume - Volume (0.0 - 1.0)
 * @returns true si valide
 */
export function validateVolume(volume: number): boolean {
  return volume >= 0 && volume <= 1.0;
}
```

---

### 3. Formatage

#### Fichier : `src/utils/formatting.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

/**
 * Formate une date en format lisible français
 * 
 * @param date - Date à formater
 * @returns Date formatée (ex: "15 janvier 2025")
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Formate une date en format court
 * 
 * @param date - Date à formater
 * @returns Date formatée (ex: "15/01/2025")
 */
export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Formate une durée en secondes en format lisible
 * 
 * @param seconds - Durée en secondes
 * @returns Durée formatée (ex: "2:30")
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Nettoie un texte (espaces multiples, retours lignes excessifs)
 * 
 * @param text - Texte à nettoyer
 * @returns Texte nettoyé
 */
export function cleanText(text: string): string {
  return text
    .replace(/[ \t]+/g, ' ') // Espaces multiples -> 1 espace
    .replace(/\n{3,}/g, '\n\n') // Retours lignes multiples -> 2 max
    .trim();
}

/**
 * Tronque un texte à une longueur maximale
 * 
 * @param text - Texte à tronquer
 * @param maxLength - Longueur maximale
 * @returns Texte tronqué avec "..." si nécessaire
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Capitalise la première lettre d'un texte
 * 
 * @param text - Texte à capitaliser
 * @returns Texte capitalisé
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Compte le nombre de mots dans un texte
 * 
 * @param text - Texte à analyser
 * @returns Nombre de mots
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
```

---

### 4. Constantes

#### Fichier : `src/utils/constants.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

/**
 * Vitesse de lecture minimale
 */
export const MIN_SPEED = 0.5;

/**
 * Vitesse de lecture maximale
 */
export const MAX_SPEED = 2.0;

/**
 * Vitesse de lecture par défaut
 */
export const DEFAULT_SPEED = 1.0;

/**
 * Pas d'incrémentation de la vitesse
 */
export const SPEED_STEP = 0.1;

/**
 * Volume minimal
 */
export const MIN_VOLUME = 0.0;

/**
 * Volume maximal
 */
export const MAX_VOLUME = 1.0;

/**
 * Volume par défaut
 */
export const DEFAULT_VOLUME = 1.0;

/**
 * Durée du débounce pour recherche (ms)
 */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Nombre maximum de pièces affichées par page
 */
export const PLAYS_PER_PAGE = 20;

/**
 * Préfixes pour les ID générés
 */
export const ID_PREFIXES = {
  play: 'play_',
  character: 'char_',
  line: 'line_',
} as const;

/**
 * Messages d'erreur standards
 */
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'Le fichier est trop volumineux',
  FILE_INVALID_TYPE: 'Type de fichier non supporté',
  FILE_EMPTY: 'Le fichier est vide',
  PARSE_ERROR: 'Impossible de parser le fichier',
  STORAGE_ERROR: 'Erreur de stockage',
  TTS_NOT_AVAILABLE: 'Synthèse vocale non disponible',
  NO_VOICES: 'Aucune voix disponible',
} as const;

/**
 * Clés de stockage local
 */
export const STORAGE_KEYS = {
  THEME: 'repet_theme',
  LAST_PLAY_ID: 'repet_last_play',
} as const;
```

---

### 5. Index des Utilitaires

#### Fichier : `src/utils/index.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

export * from './colors';
export * from './validation';
export * from './formatting';
export * from './constants';
export * from './uuid';
```

---

## ✅ Critères de Validation

**Avant de passer au prompt suivant, valider :**

```bash
npm run type-check  # DOIT retourner 0 erreur
npm run dev         # DOIT démarrer sans erreur
```

### Tests manuels dans la console navigateur

Ouvrir la console (F12) et tester :

```javascript
import {
  generateCharacterColor,
  validateFile,
  validateTextContent,
  formatDate,
  cleanText,
  truncate,
  MIN_SPEED,
  MAX_SPEED,
} from './utils';

// Test 1 : Génération de couleurs
console.log('Couleur HAMLET:', generateCharacterColor('HAMLET'));
console.log('Couleur OPHÉLIE:', generateCharacterColor('OPHÉLIE'));
console.log('Couleur HAMLET (bis):', generateCharacterColor('HAMLET'));
// Doit être identique au premier

// Test 2 : Validation fichier
const mockFile = new File(['contenu'], 'test.txt', { type: 'text/plain' });
const result = validateFile(mockFile);
console.log('Fichier valide:', result.valid); // true

const bigFile = new File([new Array(6 * 1024 * 1024).join('x')], 'big.txt');
const result2 = validateFile(bigFile);
console.log('Gros fichier valide:', result2.valid); // false
console.log('Erreur:', result2.error);

// Test 3 : Validation contenu
const validContent = validateTextContent('Ligne 1\nLigne 2\nLigne 3');
console.log('Contenu valide:', validContent.valid); // true

const invalidContent = validateTextContent('');
console.log('Contenu vide valide:', invalidContent.valid); // false

// Test 4 : Formatage date
const date = new Date('2025-01-15');
console.log('Date formatée:', formatDate(date)); // "15 janvier 2025"

// Test 5 : Nettoyage texte
const dirty = 'Texte   avec    espaces\n\n\n\nmultiples';
console.log('Texte nettoyé:', cleanText(dirty));

// Test 6 : Troncature
console.log('Tronqué:', truncate('Texte très long qui doit être tronqué', 20));

// Test 7 : Constantes
console.log('Vitesse min/max:', MIN_SPEED, MAX_SPEED); // 0.5, 2.0
```

### Checklist de validation

- [ ] Fichiers créés sans erreurs TypeScript
- [ ] Aucun type `any` utilisé
- [ ] JSDoc présent sur toutes les fonctions publiques
- [ ] Imports/exports fonctionnent correctement
- [ ] Génération de couleurs déterministe (même nom = même couleur)
- [ ] Validation de fichiers fonctionne (taille, type)
- [ ] Validation de contenu fonctionne (non vide)
- [ ] Formatage de dates fonctionne (français)
- [ ] Nettoyage de texte fonctionne
- [ ] Troncature fonctionne
- [ ] Constantes accessibles
- [ ] Pas d'erreur dans la console navigateur

---

## 📝 Livrables

- [x] `src/utils/colors.ts`
- [x] `src/utils/validation.ts`
- [x] `src/utils/formatting.ts`
- [x] `src/utils/constants.ts`
- [x] `src/utils/index.ts`
- [x] Tests manuels passés
- [x] Commit avec message : "feat: add utility functions (Prompt 06)"

---

## 🔗 Liens utiles

- Standards : `.github/prompts/common.md`
- Architecture : `plans/PROJECT_STRUCTURE.md`

---

## 📌 Notes importantes

- **Fonctions pures** : Pas d'effet de bord, toujours le même résultat pour les mêmes paramètres
- **Déterminisme** : `generateCharacterColor()` retourne toujours la même couleur pour le même nom
- **Palette accessible** : Couleurs optimisées pour contraste (WCAG AA)
- **Validation robuste** : Toujours retourner un `ValidationResult` structuré
- **Constantes** : Utiliser `as const` pour typage strict
- **Formatage** : Utiliser `Intl` pour internationalisation (français)

---

## ➡️ Prompt suivant

Après validation complète : **Prompt 07 - State Management (Zustand)**