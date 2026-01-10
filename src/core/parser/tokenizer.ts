/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { Token } from './types'

/**
 * Découpe le texte brut en tokens
 *
 * @param text - Texte brut du fichier .txt
 * @returns Liste de tokens
 */
export function tokenize(text: string): Token[] {
  const lines = text.split('\n')
  const tokens: Token[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    const lineNumber = i + 1

    // Ligne vide
    if (trimmed === '') {
      tokens.push({ type: 'empty', content: '', lineNumber })
      continue
    }

    // Auteur
    if (/^Auteur\s*:?\s*/i.test(trimmed)) {
      const author = trimmed.replace(/^Auteur\s*:?\s*/i, '').trim()
      tokens.push({ type: 'author', content: author, lineNumber })
      continue
    }

    // Année
    if (/^Ann[ée]e\s*:?\s*/i.test(trimmed)) {
      const year = trimmed.replace(/^Ann[ée]e\s*:?\s*/i, '').trim()
      tokens.push({ type: 'year', content: year, lineNumber })
      continue
    }

    // Catégorie
    if (/^Cat[ée]gorie\s*:?\s*/i.test(trimmed)) {
      const category = trimmed.replace(/^Cat[ée]gorie\s*:?\s*/i, '').trim()
      tokens.push({ type: 'category', content: category, lineNumber })
      continue
    }

    // Acte
    if (/^Acte\s+/i.test(trimmed)) {
      tokens.push({ type: 'act', content: trimmed, lineNumber })
      continue
    }

    // Scène
    if (/^Sc[èe]ne\s+/i.test(trimmed)) {
      tokens.push({ type: 'scene', content: trimmed, lineNumber })
      continue
    }

    // Réplique : MAJUSCULES suivi de ':'
    if (/^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s'-]+\s*:/.test(trimmed)) {
      tokens.push({ type: 'character_line', content: trimmed, lineNumber })
      continue
    }

    // Didascalie standalone : texte entre parenthèses complet
    if (/^\(.*\)$/.test(trimmed)) {
      const content = trimmed.slice(1, -1).trim()
      tokens.push({ type: 'didascalie', content, lineNumber })
      continue
    }

    // Texte normal
    tokens.push({ type: 'text', content: trimmed, lineNumber })
  }

  return tokens
}

/**
 * Extrait le numéro d'un titre d'acte ou de scène
 *
 * @param text - Texte de l'acte/scène (ex: "Acte I", "Scène 2")
 * @returns Numéro extrait ou undefined
 */
export function extractNumber(text: string): number | undefined {
  // Nombres romains
  const romanMatch = text.match(/\b([IVXLCDM]+)\b/)
  if (romanMatch) {
    return romanToInt(romanMatch[1])
  }

  // Nombres arabes
  const arabicMatch = text.match(/\b(\d+)\b/)
  if (arabicMatch) {
    return parseInt(arabicMatch[1], 10)
  }

  return undefined
}

/**
 * Convertit un nombre romain en entier
 *
 * @param roman - Nombre romain (I, II, III, IV, V, etc.)
 * @returns Entier correspondant
 */
function romanToInt(roman: string): number {
  const values: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  }

  let total = 0
  for (let i = 0; i < roman.length; i++) {
    const current = values[roman[i]]
    const next = values[roman[i + 1]]

    if (next && current < next) {
      total -= current
    } else {
      total += current
    }
  }

  return total
}
