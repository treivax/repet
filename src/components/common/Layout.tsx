/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import React from 'react'

/**
 * Props du composant Layout
 */
export interface LayoutProps {
  /** Contenu de l'en-tête */
  header?: React.ReactNode
  /** Contenu principal */
  children: React.ReactNode
  /** Contenu du pied de page */
  footer?: React.ReactNode
  /** Classe CSS supplémentaire */
  className?: string
}

/**
 * Composant Layout
 * Structure principale de l'application (header, main, footer)
 */
export function Layout({ header, children, footer, className = '' }: LayoutProps) {
  return (
    <div className={`flex h-screen flex-col bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      {header && (
        <header className="flex-shrink-0 z-40 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">{header}</div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      {/* Footer */}
      {footer && (
        <footer className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{footer}</div>
        </footer>
      )}
    </div>
  )
}
