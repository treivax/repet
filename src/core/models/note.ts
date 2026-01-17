/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Type d'élément sur lequel une note peut être attachée
 */
export enum AttachableType {
  STRUCTURE = 'structure',  // Titre, acte, scène
  ANNOTATION = 'annotation', // Didascalie, présentation
  LINE = 'line'             // Réplique
}

/**
 * État d'affichage d'une note
 */
export enum NoteDisplayState {
  MAXIMIZED = 'maximized',
  MINIMIZED = 'minimized'
}

/**
 * Note attachée à un élément de la pièce
 */
export interface Note {
  /** Identifiant unique de la note (UUID v4) */
  id: string;

  /** ID de la pièce */
  playId: string;

  /** Type d'élément attaché */
  attachedToType: AttachableType;

  /** Index de l'élément dans son tableau */
  attachedToIndex: number;

  /** Contenu texte de la note */
  content: string;

  /** État d'affichage actuel */
  displayState: NoteDisplayState;

  /** Date de création */
  createdAt: Date;

  /** Date de dernière modification */
  updatedAt: Date;
}

/**
 * Préférences globales pour l'affichage des notes
 */
export interface NotesPreferences {
  /** ID unique (toujours 'global') */
  id: 'global';

  /** État par défaut pour nouvelles notes */
  defaultDisplayState: NoteDisplayState;

  /** Dernière mise à jour */
  updatedAt: Date;
}
