/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

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
 * Header standardisé pour les écrans de lecture avec icônes d'aide et thème
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

        {/* Droite : icônes export, aide et thème */}
        <div className="flex items-center gap-1">
          {/* Icône Export TXT (uniquement si onExportText est fourni) */}
          {onExportText && (
            <button
              onClick={onExportText}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Exporter en TXT"
              title="Enregistrer sous (.txt)"
              data-testid="export-text-button"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
            </button>
          )}

          {/* Icône Export PDF (uniquement si onExportPDF est fourni) */}
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Exporter en PDF"
              title="Exporter en PDF"
              data-testid="export-pdf-button"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>
          )}

          {/* Icône d'aide */}
          <button
            onClick={toggleHelp}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Aide"
            title="Aide"
            data-testid="help-button"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {/* Icône de thème */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
            title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
            data-testid="theme-button"
          >
            {theme === 'light' ? (
              /* Icône Lune pour activer le mode sombre */
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : (
              /* Icône Soleil pour activer le mode clair */
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
