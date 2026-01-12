/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { Character } from '../../core/models/Character'
import { CharacterBadge } from './CharacterBadge'

/**
 * Props du composant CharacterSelector
 */
export interface CharacterSelectorProps {
  /** Liste des personnages */
  characters: Character[]
  /** Personnage sélectionné */
  selectedCharacter: Character | null
  /** Callback de sélection */
  onSelectCharacter: (character: Character | null) => void
}

/**
 * Composant CharacterSelector
 * Liste des personnages pour sélection du rôle utilisateur
 */
export function CharacterSelector({
  characters,
  selectedCharacter,
  onSelectCharacter,
}: CharacterSelectorProps) {
  const handleSelect = (character: Character) => {
    if (selectedCharacter?.id === character.id) {
      // Désélectionner si déjà sélectionné
      onSelectCharacter(null)
    } else {
      onSelectCharacter(character)
    }
  }

  if (characters.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-gray-600">Aucun personnage disponible</p>
      </div>
    )
  }

  return (
    <div className="space-y-3" data-testid="character-selector">
      <h3 className="text-sm font-medium text-gray-700">Sélectionnez votre personnage</h3>

      <div className="flex flex-wrap gap-2">
        {characters.map((character) => (
          <CharacterBadge
            key={character.id}
            character={character}
            allCharacters={characters}
            size="md"
            selected={selectedCharacter?.id === character.id}
            onClick={handleSelect}
            data-testid={`character-badge-${character.id}`}
          />
        ))}
      </div>

      {selectedCharacter && (
        <p className="text-sm text-gray-600">
          Vous jouez : <span className="font-medium">{selectedCharacter.name}</span>
        </p>
      )}
    </div>
  )
}
