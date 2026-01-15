/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useState, useRef, useEffect } from 'react'
import { useUIStore } from '../../state/uiStore'

/**
 * Props du ReadingHeader
 */
export interface ReadingHeaderProps {
  /** Titre de la pièce */
  title: string
  /** Auteur de la pièce (optionnel) */
  author?: string
  /** Badge du mode de lecture */
  modeBadge?: React.ReactNode
  /** Callback pour le bouton retour */
  onBack: () => void
  /** Callback pour l'export PDF (optionnel) */
  onExportPDF?: () => void
  /** Callback pour l'export TXT (optionnel) */
  onExportText?: () => void
  /** Test ID pour les tests */
  testId?: string
}

/**
 * Composant ReadingHeader
 * Header standardisé pour les écrans de lecture avec menu dropdown
 */
export function ReadingHeader({
  title,
  author,
  modeBadge,
  onBack,
  onExportPDF,
  onExportText,
  testId = 'reading-header',
}: ReadingHeaderProps) {
  const { toggleHelp, toggleTheme, theme } = useUIStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fermer le menu au clic dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleMenuItemClick = (action: () => void) => {
    action()
    setIsMenuOpen(false)
  }

  return (
    <header
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0"
      data-testid={testId}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Gauche : icône retour */}
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          aria-label="Retour à l'accueil"
          data-testid="close-button"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Centre : titre et auteur avec badge mode de lecture */}
        <div className="flex-1 mx-4 flex items-center justify-center gap-2 min-w-0">
          <div className="flex items-baseline gap-2 truncate">
            <h1
              className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate"
              data-testid="play-title"
            >
              {title}
            </h1>
            {author && (
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate hidden sm:inline">
                par {author}
              </span>
            )}
          </div>
          {modeBadge}
        </div>

        {/* Droite : menu dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Menu"
            aria-expanded={isMenuOpen}
            data-testid="menu-button"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>

          {/* Menu dropdown */}
          {isMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
              data-testid="dropdown-menu"
            >
              {/* Export TXT (si disponible) */}
              {onExportText && (
                <button
                  onClick={() => handleMenuItemClick(onExportText)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  data-testid="menu-export-text"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                  <span>Enregistrer sous (.txt)</span>
                </button>
              )}

              {/* Export PDF (si disponible) */}
              {onExportPDF && (
                <button
                  onClick={() => handleMenuItemClick(onExportPDF)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  data-testid="menu-export-pdf"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>Exporter en PDF</span>
                </button>
              )}

              {/* Séparateur si on a des exports */}
              {(onExportText || onExportPDF) && (
                <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
              )}

              {/* Aide */}
              <button
                onClick={() => handleMenuItemClick(toggleHelp)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                data-testid="menu-help"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Aide</span>
              </button>

              {/* Thème */}
              <button
                onClick={() => handleMenuItemClick(toggleTheme)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                data-testid="menu-theme"
              >
                {theme === 'light' ? (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                    <span>Mode sombre</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span>Mode clair</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
