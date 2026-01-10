/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import React, { useEffect, useRef } from 'react';

/**
 * Props du composant Modal
 */
export interface ModalProps {
  /** Modale ouverte */
  isOpen: boolean;
  /** Callback de fermeture */
  onClose: () => void;
  /** Titre de la modale */
  title?: string;
  /** Contenu de la modale */
  children: React.ReactNode;
  /** Actions de la modale (footer) */
  actions?: React.ReactNode;
  /** Largeur maximale */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  /** Empêcher fermeture sur clic overlay */
  preventCloseOnOverlayClick?: boolean;
}

/**
 * Classes de largeur maximale
 */
const maxWidthClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

/**
 * Composant Modal
 * Modale accessible avec overlay, focus trap et gestion clavier
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'md',
  preventCloseOnOverlayClick = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Gestion de la touche ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap et focus initial
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus sur le premier élément
    firstElement?.focus();

    // Trap focus
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTab as EventListener);
    return () => modal.removeEventListener('keydown', handleTab as EventListener);
  }, [isOpen]);

  // Bloquer le scroll du body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (preventCloseOnOverlayClick) return;
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidthClasses[maxWidth]} rounded-lg bg-white shadow-xl`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Fermer"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4">{children}</div>

        {/* Actions */}
        {actions && (
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
