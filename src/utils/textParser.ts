/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

export type TextSegmentType = 'text' | 'stage-direction'

export interface TextSegment {
  type: TextSegmentType
  content: string
}

/**
 * Parse le texte pour extraire les didascalies (texte entre parenthèses)
 * et retourne un tableau de segments avec leur type
 *
 * @param text - Texte à parser
 * @returns Tableau de segments avec leur type (texte normal ou didascalie)
 *
 * @example
 * ```ts
 * parseTextWithStageDirections("Bonjour (sourit) comment allez-vous?")
 * // Returns:
 * // [
 * //   { type: 'text', content: 'Bonjour ' },
 * //   { type: 'stage-direction', content: 'sourit' },
 * //   { type: 'text', content: ' comment allez-vous?' }
 * // ]
 * ```
 */
export function parseTextWithStageDirections(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  let currentPos = 0
  let openParen = -1

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(' && openParen === -1) {
      // Début d'une didascalie
      if (i > currentPos) {
        segments.push({ type: 'text', content: text.substring(currentPos, i) })
      }
      openParen = i
    } else if (text[i] === ')' && openParen !== -1) {
      // Fin d'une didascalie
      segments.push({ type: 'stage-direction', content: text.substring(openParen + 1, i) })
      currentPos = i + 1
      openParen = -1
    }
  }

  // Ajouter le reste du texte
  if (currentPos < text.length) {
    segments.push({ type: 'text', content: text.substring(currentPos) })
  }

  return segments
}

/**
 * Reconstruit un texte complet à partir de segments en filtrant optionnellement les didascalies
 *
 * @param segments - Segments de texte
 * @param includeStageDirections - Inclure les didascalies dans le texte final
 * @returns Texte reconstruit
 */
export function reconstructText(segments: TextSegment[], includeStageDirections = true): string {
  return segments
    .filter((segment) => includeStageDirections || segment.type !== 'stage-direction')
    .map((segment) => {
      if (segment.type === 'stage-direction') {
        return `(${segment.content})`
      }
      return segment.content
    })
    .join('')
}
