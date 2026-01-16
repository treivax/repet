/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { createContext, useContext } from 'react';
import { Note, NoteDisplayState } from '../core/models/note';

/**
 * Contexte pour la gestion des notes
 */
export interface NotesContextValue {
  /** Toutes les notes de la pièce actuelle */
  notes: Note[];

  /** Map pour lookup rapide : "type:index" → Note */
  notesMap: Map<string, Note>;

  /** Crée une nouvelle note */
  createNote: (
    attachedToType: Note['attachedToType'],
    attachedToIndex: number
  ) => Promise<Note>;

  /** Met à jour le contenu d'une note */
  updateNoteContent: (id: string, content: string) => Promise<void>;

  /** Bascule l'état d'affichage d'une note */
  toggleNoteDisplayState: (id: string) => Promise<void>;

  /** Supprime une note */
  deleteNote: (id: string) => Promise<void>;

  /** Minimise ou maximise toutes les notes */
  setAllNotesDisplayState: (state: NoteDisplayState) => Promise<void>;

  /** Recharge les notes depuis le storage */
  reloadNotes: () => Promise<void>;
}

export const NotesContext = createContext<NotesContextValue | null>(null);

/**
 * Hook pour accéder au contexte des notes
 * @throws Error si utilisé hors d'un NotesProvider
 */
export function useNotes(): NotesContextValue {
  const context = useContext(NotesContext);

  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }

  return context;
}

/**
 * Génère une clé pour la map de notes
 */
export function getNoteMapKey(
  type: Note['attachedToType'],
  index: number
): string {
  return `${type}:${index}`;
}
