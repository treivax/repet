/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { Character } from '../../core/models/Character'
import { generateCharacterColor } from '../../utils/colors'

/**
 * Props du composant CharacterBadge
 */
export interface CharacterBadgeProps {
  /** Personnage à afficher */
  character: Character
  /** Taille du badge */
  size?: 'sm' | 'md' | 'lg'
  /** Badge sélectionné */
  selected?: boolean
  /** Callback au clic */
  onClick?: (character: Character) => void
  /** data-testid for testing */
  'data-testid'?: string
}

/**
 * Classes de taille
 */
const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
}

/**
 * Composant CharacterBadge
 * Badge personnage avec couleur déterministe basée sur le nom
 */
export function CharacterBadge({
  character,
  size = 'md',
  selected = false,
  onClick,
  'data-testid': dataTestId,
}: CharacterBadgeProps) {
  const color = generateCharacterColor(character.name)
  const isClickable = !!onClick

  const handleClick = () => {
    onClick?.(character)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick?.(character)
    }
  }

  const baseClasses = [
    'inline-flex items-center gap-2 rounded-full font-medium transition-all',
    sizeClasses[size],
    isClickable ? 'cursor-pointer hover:shadow-md' : '',
    selected ? 'ring-2 ring-offset-2' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      className={baseClasses}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderColor: color,
        borderWidth: '1px',
        ...(selected && { ringColor: color }),
      }}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-pressed={isClickable ? selected : undefined}
      data-testid={dataTestId}
    >
      {/* Indicateur couleur */}
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      {/* Nom du personnage */}
      <span>{character.name}</span>

      {/* Badge genre (optionnel) */}
      {character.gender && character.gender !== 'neutral' && (
        <span className="text-xs opacity-70">{character.gender === 'male' ? '♂' : '♀'}</span>
      )}
    </span>
  )
}
