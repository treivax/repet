/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { Line } from '../../core/models/Line'
import { Character } from '../../core/models/Character'
import { generateCharacterColor } from '../../utils/colors'

/**
 * Props du composant LineCue
 */
export interface LineCueProps {
  /** Ligne à afficher */
  line: Line
  /** Personnage de la ligne (null pour didascalie) */
  character: Character | null
  /** Ligne de l'utilisateur */
  isUserLine?: boolean
  /** Ligne actuellement lue (highlight) */
  isCurrent?: boolean
  /** Masquer la ligne (mode italiennes) */
  hidden?: boolean
}

/**
 * Composant LineCue
 * Affiche une réplique avec personnage, texte et didascalies
 */
export function LineCue({
  line,
  character,
  isUserLine = false,
  isCurrent = false,
  hidden = false,
}: LineCueProps) {
  // Didascalie standalone
  if (line.isStageDirection) {
    return (
      <div
        className={`py-2 px-4 rounded-lg ${isCurrent ? 'bg-gray-100 ring-2 ring-blue-500' : ''}`}
      >
        <p className="text-sm italic text-gray-600">({line.text})</p>
      </div>
    )
  }

  // Ligne de dialogue
  const characterColor = character ? generateCharacterColor(character.name) : '#666666'

  return (
    <div
      className={`py-3 px-4 rounded-lg transition-colors ${
        isCurrent ? 'bg-blue-50 ring-2 ring-blue-500' : ''
      } ${isUserLine && !hidden ? 'bg-yellow-50' : ''} ${hidden ? 'bg-purple-50 border-2 border-purple-300' : ''}`}
    >
      {/* Nom du personnage */}
      {character && (
        <div className="mb-1 flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: characterColor }}
            aria-hidden="true"
          />
          <span
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: characterColor }}
          >
            {character.name}
          </span>
          {isUserLine && !hidden && (
            <span className="rounded bg-yellow-200 px-2 py-0.5 text-xs font-medium text-yellow-800">
              Vous
            </span>
          )}
          {hidden && (
            <span className="rounded bg-purple-200 px-2 py-0.5 text-xs font-medium text-purple-800">
              🔒 Masqué
            </span>
          )}
        </div>
      )}

      {/* Texte de la réplique */}
      <div className={`text-base leading-relaxed ${hidden ? 'blur-sm select-none' : ''}`}>
        {hidden ? (
          <div>
            <p className="text-gray-400 font-mono">●●●●●●●●●●●●●●●</p>
            <p className="text-xs text-purple-600 mt-2 italic">Récitez votre réplique de mémoire</p>
          </div>
        ) : (
          <p className="text-gray-900">{line.text}</p>
        )}
      </div>
    </div>
  )
}
