/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import React from 'react';

/**
 * Props du composant Input
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label du champ */
  label?: string;
  /** Message d'erreur */
  error?: string;
  /** Icône à gauche */
  leftIcon?: React.ReactNode;
  /** Icône à droite */
  rightIcon?: React.ReactNode;
  /** Conteneur pleine largeur */
  fullWidth?: boolean;
}

/**
 * Composant Input
 * Champ de saisie accessible avec label, erreur et icônes
 */
export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  id,
  disabled = false,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const containerClasses = fullWidth ? 'w-full' : '';

  const inputClasses = [
    'block w-full rounded-lg border px-3 py-2 transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500',
    error
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-300 hover:border-gray-400',
    leftIcon ? 'pl-10' : '',
    rightIcon ? 'pr-10' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={inputClasses}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
