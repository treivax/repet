/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Constantes pour la gestion des notes
 */

/** Durée minimale du long-press en millisecondes */
export const LONG_PRESS_DELAY_MS = 500;

/** Seuil de mouvement pour annuler un long-press (en pixels) */
export const LONG_PRESS_MOVE_THRESHOLD_PX = 10;

/** Délai de debounce pour la sauvegarde automatique (en millisecondes) */
export const NOTE_AUTOSAVE_DEBOUNCE_MS = 500;

/** Largeur minimale d'une note en pixels */
export const NOTE_MIN_WIDTH_PX = 200;

/** Hauteur minimale d'une note en pixels */
export const NOTE_MIN_HEIGHT_PX = 100;

/** Nombre maximum de caractères dans une note */
export const NOTE_MAX_LENGTH = 5000;

/** Classes Tailwind pour le style de note (fond jaune pastel) */
export const NOTE_BG_COLOR = 'bg-yellow-50';
export const NOTE_BG_COLOR_DARK = 'dark:bg-yellow-900/20';
export const NOTE_BORDER_COLOR = 'border-yellow-200';
export const NOTE_BORDER_COLOR_DARK = 'dark:border-yellow-700';
export const NOTE_TEXT_COLOR = 'text-gray-600';
export const NOTE_TEXT_COLOR_DARK = 'dark:text-gray-400';

/** Taille de l'icône minimisée */
export const NOTE_ICON_SIZE_PX = 24;
