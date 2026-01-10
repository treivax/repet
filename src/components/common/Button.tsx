/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import React from 'react';

/**
 * Variantes de bouton
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/**
 * Tailles de bouton
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props du composant Button
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visuelle du bouton */
  variant?: ButtonVariant;
  /** Taille du bouton */
  size?: ButtonSize;
  /** État de chargement */
  loading?: boolean;
  /** Contenu du bouton */
  children: React.ReactNode;
  /** Bouton pleine largeur */
  fullWidth?: boolean;
}

/**
 * Classes CSS par variante
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300',
  secondary:
    'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 disabled:bg-gray-100 disabled:text-gray-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300',
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 disabled:text-gray-400',
};

/**
 * Classes CSS par taille
 */
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

/**
 * Composant Button
 * Bouton accessible avec variantes, tailles et états
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed';

  const widthClass = fullWidth ? 'w-full' : '';

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
