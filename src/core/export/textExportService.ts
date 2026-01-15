/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Service d'export de pièces de théâtre au format texte (.txt)
 *
 * Génère un fichier texte dans le format d'origine utilisé pour l'import,
 * permettant de sauvegarder et réutiliser les pièces modifiées.
 *
 * Format généré :
 * - Titre de la pièce
 * - Auteur (si disponible)
 * - Année (si disponible)
 * - Catégorie (si disponible)
 * - Section Cast/Personnages (si disponible)
 * - Actes et scènes
 * - Répliques : PERSONNAGE: texte ou PERSONNAGE (didascalie): texte
 * - Didascalies standalone : (texte)
 */

import type { PlayAST } from '../models/Play'

/**
 * Options d'export texte
 */
export interface TextExportOptions {
  /** Inclure les lignes vides pour l'espacement (défaut: true) */
  includeSpacing?: boolean
  /** Largeur maximale de ligne (0 = pas de limite, défaut: 0) */
  maxLineWidth?: number
}

/**
 * Exporte une pièce de théâtre au format texte
 *
 * @param play - L'AST de la pièce à exporter
 * @param options - Options d'export
 * @returns Le contenu texte de la pièce
 */
export function exportPlayToText(play: PlayAST, options: TextExportOptions = {}): string {
  const { includeSpacing = true, maxLineWidth = 0 } = options

  const lines: string[] = []

  // === Métadonnées ===

  // Titre (requis)
  if (play.metadata.title) {
    lines.push(play.metadata.title)
    if (includeSpacing) lines.push('')
  }

  // Auteur
  if (play.metadata.author) {
    lines.push(`Auteur: ${play.metadata.author}`)
  }

  // Année
  if (play.metadata.year) {
    lines.push(`Année: ${play.metadata.year}`)
  }

  // Catégorie
  if (play.metadata.category) {
    lines.push(`Catégorie: ${play.metadata.category}`)
  }

  // Espacement après métadonnées si présentes
  if ((play.metadata.author || play.metadata.year || play.metadata.category) && includeSpacing) {
    lines.push('')
  }

  // === Section Cast/Personnages ===
  if (play.metadata.castSection) {
    const { castSection } = play.metadata

    // Titre de la section
    lines.push('Personnages')
    if (includeSpacing) lines.push('')

    // Blocs de texte libre (didascalies)
    if (castSection.textBlocks && castSection.textBlocks.length > 0) {
      for (const block of castSection.textBlocks) {
        lines.push(block)
      }
      if (includeSpacing) lines.push('')
    }

    // Présentations de personnages
    if (castSection.presentations && castSection.presentations.length > 0) {
      for (const pres of castSection.presentations) {
        let presLine = pres.characterName.toUpperCase()
        if (pres.description) {
          presLine += `, ${pres.description}`
        }
        lines.push(presLine)
      }
      if (includeSpacing) lines.push('')
    }
  }

  // === Actes et Scènes ===
  for (let actIndex = 0; actIndex < play.acts.length; actIndex++) {
    const act = play.acts[actIndex]

    // Titre de l'acte
    let actTitle = `Acte ${romanNumeral(act.actNumber)}`
    if (act.title) {
      actTitle += ` - ${act.title}`
    }
    lines.push(actTitle)
    if (includeSpacing) lines.push('')

    // Scènes
    for (let sceneIndex = 0; sceneIndex < act.scenes.length; sceneIndex++) {
      const scene = act.scenes[sceneIndex]

      // Titre de la scène
      let sceneTitle = `Scène ${scene.sceneNumber}`
      if (scene.title) {
        sceneTitle += ` - ${scene.title}`
      }
      lines.push(sceneTitle)
      if (includeSpacing) lines.push('')

      // Répliques et didascalies
      for (let lineIndex = 0; lineIndex < scene.lines.length; lineIndex++) {
        const line = scene.lines[lineIndex]

        if (line.type === 'dialogue') {
          // Réplique : PERSONNAGE: texte
          // Dans le parser, characterId et characterIds contiennent directement les NOMS (pas des UUIDs)
          let characterName = 'INCONNU'

          if (line.isAllCharacters) {
            characterName = 'TOUS'
          } else if (line.characterIds && line.characterIds.length > 0) {
            // Multi-personnages ou personnage simple
            // characterIds contient déjà les noms en majuscules
            characterName = line.characterIds.join(', ')
          } else if (line.characterId) {
            // Fallback pour compatibilité
            // characterId contient déjà le nom en majuscules
            characterName = line.characterId
          }

          // Construire la ligne de réplique
          let replicLine = characterName + ':'

          // Ajouter le texte
          if (line.text) {
            // Si le texte est court, le mettre sur la même ligne
            if (line.text.length <= 60) {
              replicLine += ` ${line.text}`
              lines.push(replicLine)
            } else {
              // Texte long : ligne du personnage séparée
              lines.push(replicLine)

              // Texte sur ligne(s) suivante(s)
              if (maxLineWidth > 0) {
                const wrappedText = wrapText(line.text, maxLineWidth)
                lines.push(...wrappedText)
              } else {
                lines.push(line.text)
              }
            }
          } else {
            lines.push(replicLine)
          }
        } else if (line.type === 'stage-direction') {
          // Didascalie standalone : (texte)
          lines.push(`(${line.text})`)
        }

        // Espacement entre les répliques
        if (includeSpacing && lineIndex < scene.lines.length - 1) {
          lines.push('')
        }
      }

      // Espacement entre les scènes
      if (includeSpacing && sceneIndex < act.scenes.length - 1) {
        lines.push('')
      }
    }

    // Espacement entre les actes
    if (includeSpacing && actIndex < play.acts.length - 1) {
      lines.push('')
    }
  }

  return lines.join('\n')
}

/**
 * Convertit un nombre en chiffres romains
 */
function romanNumeral(num: number): string {
  const romanNumerals: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]

  let result = ''
  let n = num

  for (const [value, numeral] of romanNumerals) {
    while (n >= value) {
      result += numeral
      n -= value
    }
  }

  return result
}

/**
 * Découpe un texte en lignes de largeur maximale
 */
function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if (currentLine.length === 0) {
      currentLine = word
    } else if (currentLine.length + 1 + word.length <= maxWidth) {
      currentLine += ' ' + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine)
  }

  return lines
}

/**
 * Télécharge le fichier texte généré
 *
 * @param play - L'AST de la pièce
 * @param fileName - Nom du fichier à télécharger (sans extension)
 * @param options - Options d'export
 */
export function downloadPlayAsText(
  play: PlayAST,
  fileName?: string,
  options: TextExportOptions = {}
): void {
  const textContent = exportPlayToText(play, options)

  // Générer le nom de fichier
  const sanitizedFileName = fileName || play.metadata.title || 'piece-de-theatre'
  const finalFileName = sanitizedFileName.replace(/[^a-z0-9_-]/gi, '_') + '.txt'

  // Créer un Blob avec le contenu texte
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })

  // Créer un lien de téléchargement
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = finalFileName
  link.style.display = 'none'

  // Ajouter au DOM, cliquer, et nettoyer
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Libérer l'URL
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
