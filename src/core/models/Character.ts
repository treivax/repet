/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { Gender } from './types'

/**
 * Représente un personnage dans une pièce
 */
export interface Character {
  /** Identifiant unique du personnage */
  id: string

  /** Nom du personnage (en majuscules dans le texte) */
  name: string

  /** Sexe du personnage (pour sélection de voix) */
  gender: Gender

  /** URI de la voix système sélectionnée (optionnel) */
  voiceURI?: string

  /** Couleur associée au personnage (pour l'affichage) */
  color?: string
}

/**
 * Détecte automatiquement le genre d'un personnage basé sur son nom
 * Utilise des patterns communs de prénoms français
 *
 * @param name - Nom du personnage
 * @returns Genre détecté ('male', 'female', ou 'neutral' si indéterminé)
 */
export function detectGenderFromName(name: string): Gender {
  const nameLower = name.toLowerCase()

  // Patterns féminins (prénoms courants et terminaisons)
  const femalePatterns = [
    // Prénoms féminins courants
    /\b(marie|anne|jeanne|catherine|louise|marguerite|isabelle|élisabeth|sophie|claire|julie|caroline|émilie|camille|chloé|léa|sarah|laura|manon|marine|pauline|alice|emma|clara|zoé|lucie|charlotte|amélie|anaïs|mathilde|juliette|céline|sandrine|valérie|nathalie|sylvie|martine|françoise|monique|jacqueline|nicole|dominique|chantal|christine|brigitte|véronique|corinne|patricia|danielle|michèle|josette|yvette|simone|madeleine|suzanne|andrée|odette|yvonne|germaine|hélène|thérèse|bernadette|denise|agnès|sabrina|stéphanie|amandine|audrey|jessica|mélanie|virginie|séverine|florence|laurence|béatrice)\b/i,
    // Terminaisons féminines
    /[aeéèê]$/i, // La plupart des prénoms féminins se terminent par une voyelle
    /ine$/i, // -ine (Christine, Sabine, Marine, etc.)
    /ette$/i, // -ette (Juliette, Bernadette, etc.)
    /elle$/i, // -elle (Isabelle, Gabrielle, etc.)
    /lle$/i, // -lle (Camille, Lucille, etc.)
  ]

  // Patterns masculins (prénoms courants et terminaisons)
  const malePatterns = [
    // Prénoms masculins courants
    /\b(pierre|jean|paul|jacques|louis|andré|rené|robert|michel|bernard|claude|alain|françois|marcel|daniel|philippe|patrick|christian|gérard|georges|henri|charles|joseph|antoine|nicolas|thomas|julien|alexandre|maxime|lucas|nathan|hugo|arthur|théo|mathis|léo|raphaël|gabriel|louis|jules|adam|élie|baptiste|simon|valentin|quentin|romain|jérôme|sébastien|fabrice|olivier|vincent|stéphane|laurent|pascal|thierry|bruno|xavier|yves|eric|didier|serge|guy|roger|raymond|lucien|maurice|fernand|albert|gaston|léon|alfred|eugène|édouard|auguste|victor|armand|émile|emmanuel|loïck|loïc|fabien|damien|adrien|cédric|florian|jonathan|anthony|kévin|michaël|ludovic|aurélien|benjamin)\b/i,
    // Terminaisons masculines
    /ric$/i, // -ric (Éric, Frédéric, etc.)
    /ier$/i, // -ier (Olivier, Xavier, etc.)
    /ain$/i, // -ain (Alain, Romain, etc.)
    /el$/i, // -el (Michel, Daniel, etc.)
    /ien$/i, // -ien (Julien, Sébastien, etc.)
  ]

  // Vérifier les patterns féminins
  for (const pattern of femalePatterns) {
    if (pattern.test(nameLower)) {
      return 'female'
    }
  }

  // Vérifier les patterns masculins
  for (const pattern of malePatterns) {
    if (pattern.test(nameLower)) {
      return 'male'
    }
  }

  // Si aucun pattern ne correspond, retourner neutral
  return 'neutral'
}

/**
 * Crée un nouveau personnage avec des valeurs par défaut
 * Le genre est détecté automatiquement basé sur le nom
 *
 * @param name - Nom du personnage
 * @param id - Identifiant optionnel
 * @returns Un nouveau personnage
 */
export function createCharacter(name: string, id?: string): Character {
  return {
    id: id || `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    gender: detectGenderFromName(name),
    color: '#666666', // Sera généré automatiquement
  }
}
