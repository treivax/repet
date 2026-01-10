/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
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
