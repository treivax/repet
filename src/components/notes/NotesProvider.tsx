/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Note, NoteDisplayState } from '../../core/models/note';
import { NotesStorage } from '../../core/storage/notesStorage';
import { NotesContext, getNoteMapKey } from '../../hooks/useNotes';

interface NotesProviderProps {
  playId: string;
  children: React.ReactNode;
}

/**
 * Provider pour la gestion des notes d'une pièce
 */
export function NotesProvider({ playId, children }: NotesProviderProps) {
  const [notes, setNotes] = useState<Note[]>([]);

  // Map pour lookup O(1)
  const notesMap = useMemo(() => {
    const map = new Map<string, Note>();
    for (const note of notes) {
      const key = getNoteMapKey(note.attachedToType, note.attachedToIndex);
      map.set(key, note);
    }
    return map;
  }, [notes]);

  // Charge les notes au montage et quand playId change
  const reloadNotes = useCallback(async () => {
    try {
      const loadedNotes = await NotesStorage.getNotesByPlayId(playId);
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
      setNotes([]);
    }
  }, [playId]);

  useEffect(() => {
    reloadNotes();
  }, [reloadNotes]);

  // Crée une nouvelle note
  const createNote = useCallback(
    async (
      attachedToType: Note['attachedToType'],
      attachedToIndex: number
    ): Promise<Note> => {
      const note = await NotesStorage.createNote(
        playId,
        attachedToType,
        attachedToIndex,
        ''
      );
      setNotes(prev => [...prev, note]);
      return note;
    },
    [playId]
  );

  // Met à jour le contenu
  const updateNoteContent = useCallback(
    async (id: string, content: string) => {
      await NotesStorage.updateNoteContent(id, content);
      setNotes(prev =>
        prev.map(note =>
          note.id === id
            ? { ...note, content, updatedAt: new Date() }
            : note
        )
      );
    },
    []
  );

  // Bascule l'état d'affichage
  const toggleNoteDisplayState = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const newState =
      note.displayState === NoteDisplayState.MAXIMIZED
        ? NoteDisplayState.MINIMIZED
        : NoteDisplayState.MAXIMIZED;

    await NotesStorage.updateNoteDisplayState(id, newState);
    setNotes(prev =>
      prev.map(n =>
        n.id === id
          ? { ...n, displayState: newState, updatedAt: new Date() }
          : n
      )
    );
  }, [notes]);

  // Supprime une note
  const deleteNote = useCallback(async (id: string) => {
    await NotesStorage.deleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  // Change l'état de toutes les notes
  const setAllNotesDisplayState = useCallback(
    async (state: NoteDisplayState) => {
      await NotesStorage.setAllNotesDisplayState(playId, state);
      await reloadNotes();
    },
    [playId, reloadNotes]
  );

  const value = {
    notes,
    notesMap,
    createNote,
    updateNoteContent,
    toggleNoteDisplayState,
    deleteNote,
    setAllNotesDisplayState,
    reloadNotes
  };

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}
