/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useState, useRef, useEffect } from 'react'
import { useUIStore } from '../../state/uiStore'

/**
 * Item du menu dropdown
 */
export interface HeaderMenuItem {
  /** Identifiant de l'item */
  id: string
  /** Libellé de l'item */
  label: string
  /** Icône SVG de l'item */
  icon: React.ReactNode
  /** Callback au clic */
  onClick: () => void
}

/**
 * Props du Header
 */
export interface HeaderProps {
  /** Titre à afficher au centre */
  title?: string
  /** Contenu personnalisé au centre (remplace le titre si fourni) */
  centerContent?: React.ReactNode
  /** Afficher le bouton retour à gauche */
  showBackButton?: boolean
  /** Callback pour le bouton retour */
  onBack?: () => void
  /** Items supplémentaires du menu dropdown (avant Aide et Thème) */
  menuItems?: HeaderMenuItem[]
  /** Masquer l'item Aide du menu */
  hideHelp?: boolean
  /** Masquer l'item Thème du menu */
  hideTheme?: boolean
  /** Classe CSS supplémentaire */
  className?: string
  /** Test ID pour les tests */
  testId?: string
}

/**
 * Composant Header unifié
 * Header standardisé pour toute l'application avec menu dropdown configurable
 */
export function Header({
  title,
  centerContent,
  showBackButton = false,
  onBack,
  menuItems = [],
  hideHelp = false,
  hideTheme = false,
  className = '',
  testId = 'header',
}: HeaderProps) {
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

  // Calculer si on a au moins un item dans le menu
  const hasMenuItems = menuItems.length > 0 || !hideHelp || !hideTheme

  return (
    <header
      className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0 ${className}`}
      data-testid={testId}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Gauche : bouton retour OU espace vide pour symétrie */}
        <div className="w-10 flex-shrink-0">
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Retour"
              data-testid="back-button"
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
          )}
        </div>

        {/* Centre : titre OU contenu personnalisé */}
        <div className="flex-1 mx-4 flex items-center justify-center min-w-0">
          {centerContent ||
            (title && (
              <h1
                className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center truncate"
                data-testid="header-title"
              >
                {title}
              </h1>
            ))}
        </div>

        {/* Droite : menu dropdown OU espace vide pour symétrie */}
        <div className="w-10 flex-shrink-0 flex justify-end">
          {hasMenuItems && (
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
                  {/* Items personnalisés */}
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleMenuItemClick(item.onClick)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      data-testid={`menu-${item.id}`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}

                  {/* Séparateur si on a des items personnalisés */}
                  {menuItems.length > 0 && (!hideHelp || !hideTheme) && (
                    <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                  )}

                  {/* Aide */}
                  {!hideHelp && (
                    <button
                      onClick={() => handleMenuItemClick(toggleHelp)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      data-testid="menu-help"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Aide</span>
                    </button>
                  )}

                  {/* Thème */}
                  {!hideTheme && (
                    <button
                      onClick={() => handleMenuItemClick(toggleTheme)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      data-testid="menu-theme"
                    >
                      {theme === 'light' ? (
                        <>
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
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
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
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
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
