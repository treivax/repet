/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
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
