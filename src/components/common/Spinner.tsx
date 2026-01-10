/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Tailles du spinner
 */
export type SpinnerSize = 'sm' | 'md' | 'lg'

/**
 * Props du composant Spinner
 */
export interface SpinnerProps {
  /** Taille du spinner */
  size?: SpinnerSize
  /** Texte de chargement */
  label?: string
  /** Centrer dans le conteneur */
  centered?: boolean
}

/**
 * Tailles en pixels
 */
const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

/**
 * Composant Spinner
 * Indicateur de chargement animé
 */
export function Spinner({ size = 'md', label, centered = false }: SpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center gap-2">
      <svg
        className={`animate-spin text-blue-600 ${sizeClasses[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="status"
        aria-label={label || 'Chargement en cours'}
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
      {label && (
        <span className="text-sm text-gray-600" aria-live="polite">
          {label}
        </span>
      )}
    </div>
  )

  if (centered) {
    return <div className="flex min-h-[200px] items-center justify-center">{spinner}</div>
  }

  return spinner
}
