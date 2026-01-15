/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { PlayAST, Act, Scene } from '../core/models/Play'
import type { Line } from '../core/models/Line'
import type {
  PlaybackItem,
  LinePlaybackItem,
  StageDirectionPlaybackItem,
  StructurePlaybackItem,
  PresentationPlaybackItem,
} from '../core/models/types'

/**
 * Options pour la construction de la séquence de lecture
 */
export interface PlaybackSequenceOptions {
  /** Inclure les didascalies hors répliques comme cartes */
  includeStageDirections: boolean

  /** Inclure les éléments de structure comme cartes */
  includeStructure: boolean

  /** Inclure la section de présentation comme carte */
  includePresentation: boolean
}

/**
 * Construit la séquence complète d'éléments de lecture à partir de l'AST
 *
 * La séquence inclut :
 * - Les répliques normales
 * - Les didascalies hors répliques (si includeStageDirections)
 * - Les éléments de structure : titre, actes, scènes (si includeStructure)
 * - La section de présentation (si includePresentation)
 *
 * @param ast - L'AST de la pièce
 * @param options - Options de construction
 * @returns La séquence ordonnée d'éléments de lecture
 */
export function buildPlaybackSequence(
  ast: PlayAST,
  options: PlaybackSequenceOptions
): PlaybackItem[] {
  console.warn('[buildPlaybackSequence] 🔍 Début de construction avec options:', options)
  console.warn("[buildPlaybackSequence] 📚 Nombre d'actes:", ast.acts.length)
  console.warn('[buildPlaybackSequence] 📄 Nombre de lignes plates:', ast.flatLines.length)

  const items: PlaybackItem[] = []
  let index = 0
  let globalLineIndex = 0 // Compteur global pour les lignes

  // 1. Titre de la pièce - toujours inclus pour l'affichage
  if (ast.metadata.title) {
    items.push({
      type: 'structure',
      structureType: 'title',
      index: index++,
      text: ast.metadata.title,
      title: ast.metadata.title,
      shouldRead: options.includeStructure, // Lire seulement si toggle activé
    } as StructurePlaybackItem)
  }

  // 2. Section de présentation (Cast) après le titre - toujours incluse pour l'affichage
  if (ast.metadata.castSection) {
    const presentationText = buildPresentationText(ast)
    if (presentationText) {
      items.push({
        type: 'presentation',
        index: index++,
        text: presentationText,
        castSection: ast.metadata.castSection,
        shouldRead: options.includePresentation, // Lire seulement si toggle activé
      } as PresentationPlaybackItem)
    }
  }

  // 3. Parcourir les actes et scènes
  ast.acts.forEach((act: Act, actIndex: number) => {
    // Annonce de l'acte - toujours inclus pour l'affichage
    // Construire le texte : "Acte X" + titre si présent
    // Remplacer les tirets/deux-points par des virgules pour meilleure prononciation
    let actText = `Acte ${act.actNumber || actIndex + 1}`
    if (act.title) {
      actText = `${actText}, ${act.title}`
    }
    items.push({
      type: 'structure',
      structureType: 'act',
      index: index++,
      text: actText,
      title: act.title,
      actIndex,
      shouldRead: options.includeStructure, // Lire seulement si toggle activé
    } as StructurePlaybackItem)

    act.scenes.forEach((scene: Scene, sceneIndex: number) => {
      // Annonce de la scène - toujours incluse pour l'affichage
      // Construire le texte : "Scène X" + titre si présent
      // Remplacer les tirets/deux-points par des virgules pour meilleure prononciation
      let sceneText = `Scène ${scene.sceneNumber || sceneIndex + 1}`
      if (scene.title) {
        sceneText = `${sceneText}, ${scene.title}`
      }
      items.push({
        type: 'structure',
        structureType: 'scene',
        index: index++,
        text: sceneText,
        title: scene.title,
        actIndex,
        sceneIndex,
        shouldRead: options.includeStructure, // Lire seulement si toggle activé
      } as StructurePlaybackItem)

      // Parcourir les lignes de la scène
      console.warn(
        `[buildPlaybackSequence] 🎬 Acte ${actIndex + 1}, Scène ${sceneIndex + 1}: ${scene.lines.length} lignes`
      )

      scene.lines.forEach((line: Line, lineIndexInScene: number) => {
        console.warn(
          `[buildPlaybackSequence]   Ligne ${lineIndexInScene}: type="${line.type}", globalLineIndex=${globalLineIndex}, text="${line.text?.substring(0, 30)}..."`
        )

        // Distinguer dialogues et didascalies hors répliques
        if (line.type === 'stage-direction') {
          // Didascalie hors réplique (carte) - toujours incluse pour l'affichage
          console.warn(`[buildPlaybackSequence]   ✅ Ajout didascalie (carte) index=${index}`)
          items.push({
            type: 'stage-direction',
            index: index++,
            text: line.text,
            actIndex,
            sceneIndex,
            shouldRead: options.includeStageDirections, // Lire seulement si toggle activé
          } as StageDirectionPlaybackItem)
          // Incrémenter le compteur global
          globalLineIndex++
        } else if (line.type === 'dialogue') {
          // Réplique normale - toujours inclure
          console.warn(
            `[buildPlaybackSequence]   ✅ Ajout dialogue (réplique) index=${index}, lineIndex=${globalLineIndex}`
          )
          items.push({
            type: 'line',
            index: index++,
            lineIndex: globalLineIndex,
            actIndex,
            sceneIndex,
          } as LinePlaybackItem)
          // Incrémenter le compteur global
          globalLineIndex++
        } else {
          console.warn(`[buildPlaybackSequence]   ⚠️  Type de ligne inconnu: "${line.type}"`)
          globalLineIndex++
        }
      })
    })
  })

  console.warn(`[buildPlaybackSequence] ✅ Séquence construite: ${items.length} items`)
  console.warn(`[buildPlaybackSequence] 📊 Répartition:`, {
    presentation: items.filter((i) => i.type === 'presentation').length,
    structure: items.filter((i) => i.type === 'structure').length,
    stageDirection: items.filter((i) => i.type === 'stage-direction').length,
    line: items.filter((i) => i.type === 'line').length,
  })

  return items
}

/**
 * Construit le texte complet de la section de présentation (Cast)
 * Inclut les blocs de texte et les présentations de personnages (nom + description)
 */
function buildPresentationText(ast: PlayAST): string {
  if (!ast.metadata.castSection) return ''

  const parts: string[] = []
  const castSection = ast.metadata.castSection

  // Ajouter les blocs de texte
  if (castSection.textBlocks) {
    parts.push(...castSection.textBlocks)
  }

  // Ajouter les présentations de personnages (nom + description)
  if (castSection.presentations) {
    castSection.presentations.forEach((presentation) => {
      if (presentation.characterName) {
        parts.push(presentation.characterName)
      }
      if (presentation.description) {
        parts.push(presentation.description)
      }
    })
  }

  return parts.join('. ')
}

/**
 * Trouve un playback item par son index
 */
export function findPlaybackItem(items: PlaybackItem[], index: number): PlaybackItem | undefined {
  return items.find((item) => item.index === index)
}

/**
 * Trouve le playback item correspondant à une réplique donnée
 */
export function findPlaybackItemForLine(
  items: PlaybackItem[],
  lineIndex: number
): LinePlaybackItem | undefined {
  return items.find(
    (item): item is LinePlaybackItem =>
      item.type === 'line' && (item as LinePlaybackItem).lineIndex === lineIndex
  )
}

/**
 * Récupère le prochain playback item dans la séquence
 */
export function getNextPlaybackItem(
  items: PlaybackItem[],
  currentIndex: number
): PlaybackItem | undefined {
  const currentItem = items.find((item) => item.index === currentIndex)
  if (!currentItem) return undefined

  return items.find((item) => item.index === currentIndex + 1)
}

/**
 * Récupère le playback item précédent dans la séquence
 */
export function getPreviousPlaybackItem(
  items: PlaybackItem[],
  currentIndex: number
): PlaybackItem | undefined {
  const currentItem = items.find((item) => item.index === currentIndex)
  if (!currentItem) return undefined

  return items.find((item) => item.index === currentIndex - 1)
}
