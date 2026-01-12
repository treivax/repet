/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useUIStore } from '../../state/uiStore'

/**
 * Props du LibraryHeader
 */
export interface LibraryHeaderProps {
  /** Titre de l'application */
  title?: string
  /** Test ID pour les tests */
  testId?: string
}

/**
 * Composant LibraryHeader
 * Header standardisé pour la page d'accueil (bibliothèque) avec icônes d'aide et thème
 */
export function LibraryHeader({ title = 'Répét', testId = 'library-header' }: LibraryHeaderProps) {
  const { toggleHelp, toggleTheme, theme } = useUIStore()

  return (
    <header
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0"
      data-testid={testId}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Gauche : vide pour symétrie */}
        <div className="w-10" />

        {/* Centre : titre de l'application */}
        <div className="flex-1 flex items-center justify-center">
          <h1
            className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center"
            data-testid="app-title"
          >
            {title}
          </h1>
        </div>

        {/* Droite : icônes aide et thème */}
        <div className="flex items-center gap-1">
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
