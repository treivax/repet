/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { NOTE_ICON_SIZE_PX } from '../../core/models/noteConstants'

interface NoteIconProps {
  /** Callback au clic */
  onClick: () => void

  /** Classes CSS additionnelles */
  className?: string
}

/**
 * Icône de note minimisée (sticky note)
 */
export function NoteIcon({ onClick, className = '' }: NoteIconProps) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center justify-center
        rounded
        bg-yellow-200 dark:bg-yellow-600
        hover:bg-yellow-300 dark:hover:bg-yellow-500
        transition-colors
        cursor-pointer
        ${className}
      `}
      style={{
        width: NOTE_ICON_SIZE_PX,
        height: NOTE_ICON_SIZE_PX,
      }}
      aria-label="Ouvrir la note"
      title="Cliquez pour ouvrir la note"
    >
      {/* SVG sticky note icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-yellow-700 dark:text-yellow-900"
      >
        <path
          d="M3 3h18v12l-6 6H3V3z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M15 15v6l6-6h-6z" fill="currentColor" />
      </svg>
    </button>
  )
}
