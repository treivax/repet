/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
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
