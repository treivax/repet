/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import React from 'react';

/**
 * Props du composant Layout
 */
export interface LayoutProps {
  /** Contenu de l'en-tête */
  header?: React.ReactNode;
  /** Contenu principal */
  children: React.ReactNode;
  /** Contenu du pied de page */
  footer?: React.ReactNode;
  /** Classe CSS supplémentaire */
  className?: string;
}

/**
 * Composant Layout
 * Structure principale de l'application (header, main, footer)
 */
export function Layout({ header, children, footer, className = '' }: LayoutProps) {
  return (
    <div className={`flex min-h-screen flex-col ${className}`}>
      {/* Header */}
      {header && (
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">{header}</div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      {/* Footer */}
      {footer && (
        <footer className="border-t border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{footer}</div>
        </footer>
      )}
    </div>
  );
}
