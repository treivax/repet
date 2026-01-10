/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
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
