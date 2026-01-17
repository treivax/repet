/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import { Note, NotesPreferences, NoteDisplayState } from '../models/note';

/**
 * Base de données IndexedDB pour les notes
 * Utilise Dexie pour simplifier les opérations
 */
class NotesDatabase extends Dexie {
  notes!: Table<Note, string>;
  preferences!: Table<NotesPreferences, string>;

  constructor() {
    super('RepetNotesDB');

    // Version 1 du schéma
    this.version(1).stores({
      notes: 'id, playId, [playId+attachedToType+attachedToIndex]',
      preferences: 'id'
    });
  }
}

const db = new NotesDatabase();

/**
 * Service de gestion du stockage des notes
 */
export class NotesStorage {
  /**
   * Génère un nouvel ID unique pour une note
   */
  private static generateId(): string {
    return uuidv4();
  }

  /**
   * Crée une nouvelle note
   */
  static async createNote(
    playId: string,
    attachedToType: Note['attachedToType'],
    attachedToIndex: number,
    content: string = ''
  ): Promise<Note> {
    const now = new Date();
    const note: Note = {
      id: this.generateId(),
      playId,
      attachedToType,
      attachedToIndex,
      content,
      displayState: NoteDisplayState.MAXIMIZED,
      createdAt: now,
      updatedAt: now
    };

    await db.notes.add(note);
    return note;
  }

  /**
   * Récupère une note par son ID
   */
  static async getNote(id: string): Promise<Note | undefined> {
    return await db.notes.get(id);
  }

  /**
   * Récupère toutes les notes d'une pièce
   */
  static async getNotesByPlayId(playId: string): Promise<Note[]> {
    return await db.notes.where('playId').equals(playId).toArray();
  }

  /**
   * Récupère la note attachée à un élément spécifique
   */
  static async getNoteByAttachment(
    playId: string,
    attachedToType: Note['attachedToType'],
    attachedToIndex: number
  ): Promise<Note | undefined> {
    return await db.notes
      .where('[playId+attachedToType+attachedToIndex]')
      .equals([playId, attachedToType, attachedToIndex])
      .first();
  }

  /**
   * Met à jour le contenu d'une note
   */
  static async updateNoteContent(id: string, content: string): Promise<void> {
    await db.notes.update(id, {
      content,
      updatedAt: new Date()
    });
  }

  /**
   * Met à jour l'état d'affichage d'une note
   */
  static async updateNoteDisplayState(
    id: string,
    displayState: NoteDisplayState
  ): Promise<void> {
    await db.notes.update(id, {
      displayState,
      updatedAt: new Date()
    });
  }

  /**
   * Supprime une note
   */
  static async deleteNote(id: string): Promise<void> {
    await db.notes.delete(id);
  }

  /**
   * Supprime toutes les notes d'une pièce
   */
  static async deleteNotesByPlayId(playId: string): Promise<void> {
    await db.notes.where('playId').equals(playId).delete();
  }

  /**
   * Minimise ou maximise toutes les notes d'une pièce
   */
  static async setAllNotesDisplayState(
    playId: string,
    displayState: NoteDisplayState
  ): Promise<void> {
    const notes = await this.getNotesByPlayId(playId);
    const now = new Date();

    await db.transaction('rw', db.notes, async () => {
      for (const note of notes) {
        await db.notes.update(note.id, {
          displayState,
          updatedAt: now
        });
      }
    });
  }

  /**
   * Récupère les préférences globales
   */
  static async getPreferences(): Promise<NotesPreferences> {
    const prefs = await db.preferences.get('global');

    if (!prefs) {
      // Créer préférences par défaut
      const defaultPrefs: NotesPreferences = {
        id: 'global',
        defaultDisplayState: NoteDisplayState.MAXIMIZED,
        updatedAt: new Date()
      };
      await db.preferences.add(defaultPrefs);
      return defaultPrefs;
    }

    return prefs;
  }

  /**
   * Met à jour les préférences globales
   */
  static async updatePreferences(
    updates: Partial<Omit<NotesPreferences, 'id'>>
  ): Promise<void> {
    await db.preferences.update('global', {
      ...updates,
      updatedAt: new Date()
    });
  }

  /**
   * Nettoie toutes les données (pour tests/debug)
   */
  static async clearAll(): Promise<void> {
    await db.notes.clear();
    await db.preferences.clear();
  }
}
