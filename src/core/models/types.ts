/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/** Sexe d'un personnage */
export type Gender = 'male' | 'female' | 'neutral';

/** Type de nœud de contenu dans l'AST */
export type ContentNodeType = 'act' | 'scene' | 'line' | 'didascalie';

/** Type de segment de texte */
export type TextSegmentType = 'text' | 'didascalie';

/** Mode de lecture */
export type ReadingMode = 'silent' | 'audio' | 'italian';

/** Thème de l'application */
export type Theme = 'light' | 'dark';
