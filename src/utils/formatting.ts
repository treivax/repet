/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
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
