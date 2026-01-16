/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useState, useEffect, useRef } from 'react'
import { Annotation } from '../../core/models/Annotation'

interface AnnotationNoteProps {
  /** Annotation à afficher */
  annotation: Annotation

  /** Callback lors de la mise à jour du contenu */
  onUpdate: (content: string) => void

  /** Callback lors du toggle (minimiser/étendre) */
  onToggle: () => void

  /** Callback lors de la suppression (optionnel) */
  onDelete?: () => void
}

/**
 * Composant d'affichage et d'édition d'une annotation
 * Peut être minimisé (icône uniquement) ou étendu (textarea éditable)
 * La minimisation se fait par appui long sur la note (géré par le parent)
 */
export function AnnotationNote({ annotation, onUpdate, onToggle, onDelete }: AnnotationNoteProps) {
  const [localContent, setLocalContent] = useState(annotation.content)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Auto-focus sur le textarea quand la note s'étend
  useEffect(() => {
    if (annotation.isExpanded && textareaRef.current && !annotation.content) {
      textareaRef.current.focus()
    }
  }, [annotation.isExpanded, annotation.content])

  // Synchroniser le contenu local avec l'annotation
  useEffect(() => {
    setLocalContent(annotation.content)
  }, [annotation.content])

  // Auto-resize du textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [localContent, annotation.isExpanded])

  // Gestion de la sauvegarde avec debounce
  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent)

    // Annuler le timeout précédent
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Sauvegarder après 500ms d'inactivité
    setIsSaving(true)
    saveTimeoutRef.current = setTimeout(() => {
      onUpdate(newContent)
      setIsSaving(false)
    }, 500)
  }

  // Gestion de la suppression avec confirmation
  const handleDelete = () => {
    if (onDelete) {
      const confirmed = window.confirm('Voulez-vous vraiment supprimer cette note ?')
      if (confirmed) {
        onDelete()
      }
    }
  }

  // Nettoyage du timeout lors du démontage
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // État minimisé : afficher uniquement l'icône
  if (!annotation.isExpanded) {
    return (
      <button
        onClick={onToggle}
        className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center bg-yellow-300 dark:bg-yellow-600 rounded-md shadow-md hover:scale-110 transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500"
        aria-label="Développer l'annotation"
        title={annotation.content || 'Annotation vide'}
      >
        <span className="text-lg" role="img" aria-hidden="true">
          📝
        </span>
      </button>
    )
  }

  // État étendu : afficher le textarea
  return (
    <div className="mt-2 ml-8 animate-in fade-in slide-in-from-top-2 duration-150">
      <div
        className="relative bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-md"
        role="note"
        aria-label="Annotation pour la réplique"
      >
        {/* En-tête avec boutons */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-yellow-800 dark:text-yellow-200">
            <span role="img" aria-hidden="true">
              📝
            </span>
            <span className="font-medium">Note personnelle</span>
            {isSaving && (
              <span className="text-yellow-600 dark:text-yellow-400 italic">Sauvegarde...</span>
            )}
          </div>

          {/* Bouton supprimer avec icône croix */}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1 text-yellow-700 dark:text-yellow-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
              aria-label="Supprimer l'annotation"
              title="Supprimer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Textarea éditable */}
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Ajouter une note..."
          className="w-full min-h-[60px] max-h-[300px] resize-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-yellow-600/50 dark:placeholder-yellow-400/50 focus:outline-none"
          aria-label="Contenu de l'annotation"
        />
      </div>
    </div>
  )
}
