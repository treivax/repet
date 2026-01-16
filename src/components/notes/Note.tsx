/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import React, { useState, useRef, useEffect } from 'react'
import { Note as NoteType, NoteDisplayState } from '../../core/models/note'
import {
  NOTE_BG_COLOR,
  NOTE_BG_COLOR_DARK,
  NOTE_BORDER_COLOR,
  NOTE_BORDER_COLOR_DARK,
  NOTE_TEXT_COLOR,
  NOTE_TEXT_COLOR_DARK,
  NOTE_MIN_WIDTH_PX,
  NOTE_MIN_HEIGHT_PX,
  NOTE_MAX_LENGTH,
  NOTE_AUTOSAVE_DEBOUNCE_MS,
} from '../../core/models/noteConstants'
import { useLongPress } from '../../hooks/useLongPress'
import { NoteIcon } from './NoteIcon'

interface NoteProps {
  /** Données de la note */
  note: NoteType

  /** Callback pour mise à jour du contenu */
  onContentChange: (content: string) => void

  /** Callback pour minimiser/maximiser */
  onToggleState: () => void

  /** Callback pour supprimer */
  onDelete: () => void

  /** Classes CSS additionnelles */
  className?: string
}

/**
 * Composant Note - affichage maximisé ou minimisé
 */
export function Note({
  note,
  onContentChange,
  onToggleState,
  onDelete,
  className = '',
}: NoteProps) {
  const [localContent, setLocalContent] = useState(note.content)
  const saveTimeoutRef = useRef<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync local content avec props
  useEffect(() => {
    setLocalContent(note.content)
  }, [note.content])

  // Auto-save avec debounce
  const scheduleSave = (content: string) => {
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      onContentChange(content)
    }, NOTE_AUTOSAVE_DEBOUNCE_MS)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setLocalContent(newContent)
    scheduleSave(newContent)
  }

  const handleBlur = () => {
    // Save immédiatement au blur
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    onContentChange(localContent)
  }

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Long-press pour minimiser (sauf sur textarea et bouton delete)
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      if (note.displayState === NoteDisplayState.MAXIMIZED) {
        onToggleState()
      }
    },
  })

  // Note minimisée
  if (note.displayState === NoteDisplayState.MINIMIZED) {
    return (
      <div className={`inline-block ml-2 ${className}`}>
        <NoteIcon onClick={onToggleState} />
      </div>
    )
  }

  // Note maximisée
  return (
    <div
      className={`
        relative
        ${NOTE_BG_COLOR} ${NOTE_BG_COLOR_DARK}
        border ${NOTE_BORDER_COLOR} ${NOTE_BORDER_COLOR_DARK}
        rounded-lg shadow-md
        p-4 mb-4
        ${className}
      `}
      style={{
        minWidth: NOTE_MIN_WIDTH_PX,
        minHeight: NOTE_MIN_HEIGHT_PX,
      }}
      {...longPressHandlers}
      // Exclure du IntersectionObserver
      data-note-element="true"
    >
      {/* Bouton de suppression */}
      <button
        onClick={onDelete}
        className="
          absolute top-2 right-2
          w-6 h-6
          flex items-center justify-center
          text-gray-400 hover:text-gray-600
          dark:text-gray-500 dark:hover:text-gray-300
          transition-colors
        "
        aria-label="Supprimer la note"
        title="Supprimer la note"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Textarea pour le contenu */}
      <textarea
        ref={textareaRef}
        value={localContent}
        onChange={handleContentChange}
        onBlur={handleBlur}
        maxLength={NOTE_MAX_LENGTH}
        placeholder="Écrivez votre note ici..."
        className={`
          w-full
          resize-none
          bg-transparent
          border-none
          outline-none
          ${NOTE_TEXT_COLOR} ${NOTE_TEXT_COLOR_DARK}
          italic
          placeholder-gray-400 dark:placeholder-gray-600
        `}
        style={{
          minHeight: NOTE_MIN_HEIGHT_PX - 32, // padding
        }}
        aria-label="Contenu de la note"
      />

      {/* Indicateur de caractères */}
      <div
        className="
          text-xs text-gray-400 dark:text-gray-600
          text-right mt-1
        "
      >
        {localContent.length} / {NOTE_MAX_LENGTH}
      </div>
    </div>
  )
}
