/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type {
  PlayAST,
  PlayMetadata,
  Act,
  Scene,
  CastSection,
  CastPresentation,
} from '../models/Play'
import type { Line } from '../models/Line'
import { createCharacter } from '../models/Character'
import { generateUUID } from '../../utils/uuid'

/**
 * Convertit un chiffre romain en chiffre arabe
 */
function romanToArabic(roman: string): number {
  const romanMap: { [key: string]: number } = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  }

  let result = 0
  for (let i = 0; i < roman.length; i++) {
    const current = romanMap[roman[i]]
    const next = romanMap[roman[i + 1]]
    if (next && current < next) {
      result -= current
    } else {
      result += current
    }
  }
  return result
}

/**
 * Parse un fichier texte et retourne un AST complet
 * Conforme à la spécification spec/appli.txt
 *
 * @param text - Contenu du fichier .txt
 * @param fileName - Nom du fichier original
 * @returns PlayAST object parsé
 */
export function parsePlayText(text: string, fileName: string): PlayAST {
  const lines = text.split('\n')
  const metadata = extractMetadata(lines, fileName)
  const acts = parseStructure(lines)
  const characters = extractCharacters(acts)
  const flatLines = generateFlatLines(acts)

  // Validation : si castSection existe, la pièce DOIT avoir au moins un ACTE ou une Scène explicite
  if (metadata.castSection) {
    // Vérifier si on a au moins un ACTE ou Scène dans le texte original
    const hasActOrScene = lines.some(
      (line) => /^ACTE/i.test(line.trim()) || /^Sc[èe]ne/i.test(line.trim())
    )

    if (!hasActOrScene) {
      throw new Error(
        'Une pièce avec section Personnages/Comédiens/Rôles doit avoir au moins un ACTE ou une Scène explicite'
      )
    }
  }

  return {
    metadata,
    characters,
    acts,
    flatLines,
  }
}

/**
 * Extrait les métadonnées (titre, auteur, année, section personnages)
 */
function extractMetadata(lines: string[], fileName: string): PlayMetadata {
  let title: string | undefined
  let author: string | undefined
  let year: string | undefined
  let category: string | undefined
  let castSection: CastSection | undefined

  let i = 0
  let afterTitle = false

  // Ignorer les lignes vides au début
  while (i < lines.length && lines[i].trim() === '') {
    i++
  }

  // Premier bloc non vide = titre potentiel
  const firstBlock: string[] = []
  while (i < lines.length && lines[i].trim() !== '') {
    const line = lines[i].trim()

    // Vérifier si c'est un mot-clé (Auteur, Annee, ACTE, Scene, section personnages)
    if (
      /^Auteur\s*:/i.test(line) ||
      /^Ann[ée]e\s*:/i.test(line) ||
      /^Cat[ée]gorie\s*:/i.test(line) ||
      /^ACTE/i.test(line) ||
      /^Sc[èe]ne/i.test(line) ||
      /^(Personnages|Com[ée]diens|R[ôo]les|Pr[ée]sentation|Introduction)\s*:?$/i.test(line)
    ) {
      break
    }

    firstBlock.push(line)
    i++
  }

  // Si on a un premier bloc, c'est le titre
  if (firstBlock.length > 0) {
    title = firstBlock.join(' ').trim()
    afterTitle = true
  }

  // Chercher Auteur, Année, Catégorie et section Personnages juste après le titre
  if (afterTitle) {
    // Sauter les lignes vides
    while (i < lines.length && lines[i].trim() === '') {
      i++
    }

    // Vérifier les prochaines lignes pour métadonnées et section personnages
    let checkCount = 0
    while (i < lines.length && checkCount < 20) {
      const line = lines[i].trim()

      if (line === '') {
        i++
        continue
      }

      // Si on rencontre un ACTE ou Scene, on arrête
      if (/^ACTE/i.test(line) || /^Sc[èe]ne/i.test(line)) {
        break
      }

      // Vérifier si c'est une réplique (ligne en MAJUSCULES)
      if (isLikelyCharacterLine(line)) {
        break
      }

      const authorMatch = line.match(/^Auteur\s*:\s*(.+)/i)
      if (authorMatch) {
        author = authorMatch[1].trim()
        i++
        checkCount++
        continue
      }

      const yearMatch = line.match(/^Ann[ée]e\s*:\s*(.+)/i)
      if (yearMatch) {
        year = yearMatch[1].trim()
        i++
        checkCount++
        continue
      }

      const categoryMatch = line.match(/^Cat[ée]gorie\s*:\s*(.+)/i)
      if (categoryMatch) {
        category = categoryMatch[1].trim()
        i++
        checkCount++
        continue
      }

      // Vérifier section Personnages/Comédiens/Rôles/Présentation/Introduction
      const castMatch = line.match(
        /^(Personnages|Com[ée]diens|R[ôo]les|Pr[ée]sentation|Introduction)\s*:?$/i
      )
      if (castMatch) {
        i++ // Passer le titre de la section

        // Sauter les lignes vides
        while (i < lines.length && lines[i].trim() === '') {
          i++
        }

        // Parser le contenu de la section Cast et récupérer l'index final
        const result = parseCastSection(lines, i)
        castSection = result.section
        i = result.endIndex

        checkCount++
        continue
      }

      // Si c'est autre chose, on arrête
      break
    }
  }

  return {
    title: title || fileName,
    author,
    year,
    category,
    castSection,
  }
}

/**
 * Vérifie si une ligne est un nom de personnage dans la section Cast
 * Plus permissif que isCharacterLine() - n'exige pas de ligne vide avant pour le format sans deux-points
 */
function isCharacterLineInCastSection(line: string, _nextLine?: string): boolean {
  if (!line) {
    return false
  }

  const trim = line.trim()

  // La ligne doit commencer au premier caractère (pas d'indentation)
  if (line.length > 0 && line[0] === ' ') {
    return false
  }

  // Extraire le nom (avant ':' s'il existe)
  let name: string
  const hasColon = trim.endsWith(':')

  if (hasColon) {
    // Format avec deux-points : PERSONNAGE:
    name = trim.slice(0, -1).trim()
  } else {
    // Format sans deux-points : dans la section Cast, pas besoin de ligne vide avant
    name = trim
  }

  // Le nom doit être en MAJUSCULES
  if (name !== name.toUpperCase()) {
    return false
  }

  // Le nom doit commencer par une lettre
  if (!/^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/.test(name)) {
    return false
  }

  // Le nom peut contenir lettres, espaces, tirets, chiffres
  if (!/^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ0-9\s\-']+$/.test(name)) {
    return false
  }

  return true
}

/**
 * Parse le contenu de la section Cast (Personnages/Comédiens/Rôles)
 * Supporte blocs de texte et présentations de personnages
 */
function parseCastSection(
  lines: string[],
  startIndex: number
): { section: CastSection; endIndex: number } {
  const textBlocks: string[] = []
  const presentations: CastPresentation[] = []
  let i = startIndex

  while (i < lines.length) {
    const rawLine = lines[i]
    const line = rawLine.trim()

    // Arrêter si ACTE ou Scene
    if (/^ACTE/i.test(line) || /^Sc[èe]ne/i.test(line)) {
      break
    }

    // Ligne vide - sauter
    if (line === '') {
      i++
      continue
    }

    // Détecter une présentation de personnage (format réplique, plus permissif dans Cast)
    const nextLine = i + 1 < lines.length ? lines[i + 1] : undefined

    if (isCharacterLineInCastSection(rawLine, nextLine)) {
      // Dans la section DISTRIBUTION, on n'utilise que extractCharacterName
      // (pas de multi-personnages dans la distribution)
      const characterName = extractCharacterName(line)
      i++ // Aller à la ligne suivante

      // Collecter la description du personnage
      const descLines: string[] = []
      while (i < lines.length) {
        const descLine = lines[i]
        const descTrim = descLine.trim()

        // Arrêter si ACTE ou Scene
        if (/^ACTE/i.test(descTrim) || /^Sc[èe]ne/i.test(descTrim)) {
          break
        }

        // Arrêter si nouvelle présentation de personnage
        if (
          isCharacterLineInCastSection(descLine, i + 1 < lines.length ? lines[i + 1] : undefined)
        ) {
          break
        }

        // Arrêter si ligne vide suivie d'une présentation
        if (
          descTrim === '' &&
          i + 1 < lines.length &&
          isCharacterLineInCastSection(
            lines[i + 1],
            i + 2 < lines.length ? lines[i + 2] : undefined
          )
        ) {
          break
        }

        descLines.push(descLine)
        i++
      }

      presentations.push({
        characterName,
        description: descLines.join('\n').trim(),
      })
      continue
    }

    // Sinon, c'est un bloc de texte
    const blockLines: string[] = []
    while (i < lines.length) {
      const blockLine = lines[i]
      const blockTrim = blockLine.trim()

      // Arrêter si ACTE ou Scene
      if (/^ACTE/i.test(blockTrim) || /^Sc[èe]ne/i.test(blockTrim)) {
        break
      }

      // Arrêter si présentation de personnage
      if (
        isCharacterLineInCastSection(blockLine, i + 1 < lines.length ? lines[i + 1] : undefined)
      ) {
        break
      }

      // Arrêter si ligne vide suivie d'une présentation de personnage
      if (blockTrim === '' && i + 1 < lines.length) {
        if (
          isCharacterLineInCastSection(
            lines[i + 1],
            i + 2 < lines.length ? lines[i + 2] : undefined
          )
        ) {
          break
        }
      }

      blockLines.push(blockLine)
      i++

      // Si ligne vide, vérifier si on continue
      if (blockTrim === '') {
        break
      }
    }

    const blockText = blockLines.join('\n').trim()
    if (blockText) {
      textBlocks.push(blockText)
    }
  }

  return { section: { textBlocks, presentations }, endIndex: i }
}

/**
 * Vérifie si une ligne ressemble à un nom de personnage (heuristique pour metadata)
 */
function isLikelyCharacterLine(line: string): boolean {
  const trim = line.trim()
  if (trim === '') return false

  // Extraire le nom (avant ':' s'il existe)
  const name = trim.endsWith(':') ? trim.slice(0, -1).trim() : trim

  // Le nom doit être en MAJUSCULES
  if (name !== name.toUpperCase()) {
    return false
  }

  // Le nom doit commencer par une lettre
  if (!/^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/.test(name)) {
    return false
  }

  // Le nom peut contenir lettres, espaces, tirets, chiffres
  if (!/^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ0-9\s\-']+$/.test(name)) {
    return false
  }

  return true
}

/**
 * Parse la structure (actes, scènes, répliques, didascalies)
 * Supporte : actes+scènes, scènes seules, actes seuls, ou répliques directes
 */
function parseStructure(lines: string[]): Act[] {
  const acts: Act[] = []
  let currentAct: Act | null = null
  let currentScene: Scene | null = null
  let i = 0
  const defaultActNumber = 1
  let defaultSceneNumber = 1

  // Sauter les métadonnées initiales (titre, auteur, année, section personnages)
  while (i < lines.length) {
    const line = lines[i].trim()

    // Arrêter si on trouve un ACTE ou une Scène
    if (/^ACTE/i.test(line) || /^Sc[èe]ne/i.test(line)) {
      break
    }

    // Vérifier si c'est le début d'une section Cast
    const castMatch = line.match(
      /^(Personnages|Com[ée]diens|R[ôo]les|Pr[ée]sentation|Introduction)\s*:?$/i
    )
    if (castMatch) {
      i++ // Passer le titre de la section

      // Sauter les lignes vides après le titre
      while (i < lines.length && lines[i].trim() === '') {
        i++
      }

      // Sauter tout le contenu de la section Cast jusqu'à ACTE ou Scène
      while (i < lines.length) {
        const castLine = lines[i].trim()

        // Arrêter si ACTE ou Scène
        if (/^ACTE/i.test(castLine) || /^Sc[èe]ne/i.test(castLine)) {
          break
        }

        i++
      }

      // La boucle externe continuera et vérifiera si on a atteint ACTE ou Scène
      continue
    }

    // Arrêter si on trouve une réplique ou didascalie (en dehors d'une section Cast)
    if (
      (line !== '' && isLikelyCharacterLine(line)) ||
      (line.startsWith('(') && line.endsWith(')'))
    ) {
      break
    }

    i++
  }

  while (i < lines.length) {
    const rawLine = lines[i]
    const line = rawLine.trim()

    // Détecter ACTE (chiffres arabes ou romains)
    const actMatchArabic = line.match(/^ACTE\s+(\d+)(?:\s*[-–—:]\s*(.+))?/i)
    const actMatchRoman = line.match(/^ACTE\s+([IVXLCDM]+)(?:\s*[-–—:]\s*(.+))?/i)

    if (actMatchArabic || actMatchRoman) {
      // Sauvegarder l'acte précédent
      if (currentAct && currentScene) {
        currentAct.scenes.push(currentScene)
        currentScene = null
      }
      if (currentAct) {
        acts.push(currentAct)
      }

      // Créer nouvel acte
      const actNum = actMatchArabic
        ? parseInt(actMatchArabic[1], 10)
        : romanToArabic(actMatchRoman![1])
      const actTitle = actMatchArabic ? actMatchArabic[2]?.trim() : actMatchRoman![2]?.trim()

      currentAct = {
        actNumber: actNum,
        title: actTitle,
        scenes: [],
      }

      defaultSceneNumber = 1 // Réinitialiser le compteur de scènes

      i++
      continue
    }

    // Détecter Scène (chiffres arabes ou romains)
    const sceneMatchArabic = line.match(/^Sc[èe]ne\s+(\d+)(?:\s*[-–—:]\s*(.+))?/i)
    const sceneMatchRoman = line.match(/^Sc[èe]ne\s+([IVXLCDM]+)(?:\s*[-–—:]\s*(.+))?/i)

    if (sceneMatchArabic || sceneMatchRoman) {
      // Si on a une scène mais pas d'acte, créer un acte par défaut
      if (!currentAct) {
        currentAct = {
          actNumber: defaultActNumber,
          scenes: [],
        }
      }

      // Sauvegarder la scène précédente
      if (currentScene) {
        currentAct.scenes.push(currentScene)
      }

      // Créer nouvelle scène
      const sceneNum = sceneMatchArabic
        ? parseInt(sceneMatchArabic[1], 10)
        : romanToArabic(sceneMatchRoman![1])
      const sceneTitle = sceneMatchArabic
        ? sceneMatchArabic[2]?.trim()
        : sceneMatchRoman![2]?.trim()

      currentScene = {
        sceneNumber: sceneNum,
        title: sceneTitle,
        lines: [],
      }

      i++
      continue
    }

    // Détecter réplique : PERSONNAGE: (sur sa propre ligne) ou PERSONNAGE (sans : si précédé d'une ligne vierge)
    const previousLine = i > 0 ? lines[i - 1] : undefined
    if (isCharacterLine(rawLine, i + 1 < lines.length ? lines[i + 1] : undefined, previousLine)) {
      // Si on a une réplique mais pas de scène, créer une scène par défaut
      if (!currentScene) {
        if (!currentAct) {
          currentAct = {
            actNumber: defaultActNumber,
            scenes: [],
          }
        }
        currentScene = {
          sceneNumber: defaultSceneNumber,
          lines: [],
        }
      }

      const { characterIds, isAll } = parseCharacterNames(line)
      i++ // Aller à la ligne suivante

      // Collecter le texte de la réplique (peut être vide)
      const replicaText: string[] = []
      while (i < lines.length) {
        const nextLine = lines[i]

        // Arrêter si nouvelle réplique, acte ou scène
        if (
          (nextLine.trim() === '' &&
            i + 1 < lines.length &&
            isCharacterLine(
              lines[i + 1],
              i + 2 < lines.length ? lines[i + 2] : undefined,
              lines[i]
            )) ||
          /^ACTE/i.test(nextLine.trim()) ||
          /^Sc[èe]ne/i.test(nextLine.trim())
        ) {
          break
        }

        replicaText.push(nextLine)
        i++
      }

      // Créer la ligne de dialogue (le texte peut être vide)
      // Pour compatibilité, characterId contient le premier personnage (ou 'TOUS')
      const dialogueLine: Line = {
        id: generateUUID(),
        type: 'dialogue',
        actIndex: currentAct ? currentAct.actNumber - 1 : 0,
        sceneIndex: currentScene ? currentScene.sceneNumber - 1 : 0,
        characterId: characterIds[0],
        characterIds: characterIds,
        isAllCharacters: isAll,
        text: replicaText.join('\n').trim(),
        isStageDirection: false,
      }
      currentScene.lines.push(dialogueLine)

      continue
    }

    // Détecter didascalie (bloc de texte hors réplique)
    if (line !== '') {
      // Si on a une didascalie mais pas de scène, créer une scène par défaut
      if (!currentScene) {
        if (!currentAct) {
          currentAct = {
            actNumber: defaultActNumber,
            scenes: [],
          }
        }
        currentScene = {
          sceneNumber: defaultSceneNumber,
          lines: [],
        }
      }

      // Collecter le bloc de didascalie
      const didascalieText: string[] = []
      while (i < lines.length) {
        const nextLine = lines[i]
        const nextTrim = nextLine.trim()

        // Arrêter si ligne vide suivie d'une réplique, acte ou scène
        if (nextTrim === '') {
          didascalieText.push(nextLine)
          i++

          // Vérifier la prochaine ligne non-vide
          if (i < lines.length) {
            const afterEmpty = lines[i].trim()
            if (
              /^ACTE/i.test(afterEmpty) ||
              /^Sc[èe]ne/i.test(afterEmpty) ||
              isCharacterLine(
                lines[i],
                i + 1 < lines.length ? lines[i + 1] : undefined,
                lines[i - 1]
              )
            ) {
              break
            }
          }
          continue
        }

        // Arrêter si acte ou scène
        if (/^ACTE/i.test(nextTrim) || /^Sc[èe]ne/i.test(nextTrim)) {
          break
        }

        // Arrêter si réplique
        const prevLine = i > 0 ? lines[i - 1] : undefined
        if (isCharacterLine(nextLine, i + 1 < lines.length ? lines[i + 1] : undefined, prevLine)) {
          break
        }

        didascalieText.push(nextLine)
        i++
      }

      const didascalieContent = didascalieText.join('\n').trim()
      if (didascalieContent) {
        const stageDirectionLine: Line = {
          id: generateUUID(),
          type: 'stage-direction',
          actIndex: currentAct ? currentAct.actNumber - 1 : 0,
          sceneIndex: currentScene ? currentScene.sceneNumber - 1 : 0,
          characterId: undefined,
          text: didascalieContent,
          isStageDirection: true,
        }
        currentScene.lines.push(stageDirectionLine)
      }

      continue
    }

    i++
  }

  // Sauvegarder la dernière scène et acte
  if (currentScene && currentAct) {
    currentAct.scenes.push(currentScene)
  }
  if (currentAct) {
    acts.push(currentAct)
  }

  return acts
}

/**
 * Vérifie si une ligne est un nom de personnage (PERSONNAGE: ou PERSONNAGE sans :)
 * Format 1: PERSONNAGE: (avec deux-points)
 * Format 2: PERSONNAGE (sans deux-points, mais doit être précédé d'une ligne vierge)
 */
function isCharacterLine(line: string, _nextLine?: string, previousLine?: string): boolean {
  if (!line) {
    return false
  }

  const trim = line.trim()

  // La ligne doit commencer au premier caractère (pas d'indentation)
  if (line.length > 0 && line[0] === ' ') {
    return false
  }

  // Extraire le nom (avant ':' s'il existe)
  let name: string
  const hasColon = trim.endsWith(':')

  if (hasColon) {
    // Format avec deux-points : PERSONNAGE:
    name = trim.slice(0, -1).trim()
  } else {
    // Format sans deux-points : doit être précédé d'une ligne vierge
    if (previousLine === undefined || previousLine.trim() !== '') {
      return false
    }
    name = trim
  }

  // Le nom doit être en MAJUSCULES (sauf le mot 'et' qui peut être en minuscule pour les multi-personnages)
  // On remplace temporairement 'et' par 'ET' pour la vérification
  const nameForCheck = name.replace(/\s+et\s+/g, ' ET ')
  if (nameForCheck !== nameForCheck.toUpperCase()) {
    return false
  }

  // Le nom doit commencer par une lettre
  if (!/^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/.test(name)) {
    return false
  }

  // Le nom peut contenir lettres (majuscules et minuscules pour 'et'), espaces, tirets, chiffres, et séparateurs multi-personnages (+, &, virgule)
  if (!/^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÿÇa-zàâäéèêëïîôùûüÿç0-9\s\-'+,&]+$/.test(name)) {
    return false
  }

  // La ligne suivante peut être vide (réplique vide), undefined (fin de fichier), ou contenir du texte
  // On accepte tous ces cas

  return true
}

/**
 * Extrait le nom du personnage d'une ligne "PERSONNAGE:" ou "PERSONNAGE"
 */
function extractCharacterName(line: string): string {
  const trim = line.trim()
  if (trim.endsWith(':')) {
    return trim.slice(0, -1).trim() // Enlever ':' et trim
  }
  return trim // Pas de ':', retourner tel quel
}

/**
 * Parse une ligne de personnage(s) pour extraire la liste des personnages
 * Supporte les séparateurs: virgule (,), plus (+), esperluette (&), et le mot 'et'
 * Exemples: "ALAIN + PASCAL", "XAVIER, JEAN CLAUDE et AMANDINE", "TOUS"
 * Retourne { characterIds: string[], isAll: boolean }
 */
function parseCharacterNames(line: string): { characterIds: string[]; isAll: boolean } {
  const characterName = extractCharacterName(line)

  // Vérifier si c'est le mot-clé TOUS
  if (characterName.toUpperCase() === 'TOUS') {
    return { characterIds: ['TOUS'], isAll: true }
  }

  // Remplacer les séparateurs par des virgules pour simplifier le split
  // On gère: virgule, +, &, et le mot 'et' (en minuscule ou majuscule)
  const normalized = characterName
    .replace(/\s+et\s+/gi, ',') // Remplacer " et " par ","
    .replace(/\+/g, ',') // Remplacer + par ,
    .replace(/&/g, ',') // Remplacer & par ,

  // Split par virgule et nettoyer chaque nom
  const names = normalized
    .split(',')
    .map((name) => name.trim().toUpperCase())
    .filter((name) => name.length > 0)

  // Si aucun nom détecté, fallback sur le nom original
  if (names.length === 0) {
    const fallbackName = characterName.trim().toUpperCase()
    return { characterIds: fallbackName ? [fallbackName] : ['UNKNOWN'], isAll: false }
  }

  // Retourner la liste des personnages (simple ou multiple)
  return { characterIds: names, isAll: false }
}

/**
 * Extrait la liste unique des personnages
 */
function extractCharacters(acts: Act[]) {
  const characterSet = new Set<string>()

  for (const act of acts) {
    for (const scene of act.scenes) {
      for (const line of scene.lines) {
        if (line.type === 'dialogue') {
          // Gérer les répliques multi-personnages
          if (line.characterIds && line.characterIds.length > 0) {
            for (const charId of line.characterIds) {
              // Ne pas ajouter "TOUS" comme personnage individuel
              if (charId !== 'TOUS') {
                characterSet.add(charId)
              }
            }
          } else if (line.characterId) {
            // Fallback pour compatibilité
            if (line.characterId !== 'TOUS') {
              characterSet.add(line.characterId)
            }
          }
        }
      }
    }
  }

  return Array.from(characterSet).map((name) => createCharacter(name, name))
}

/**
 * Génère le tableau aplati de toutes les lignes
 */
function generateFlatLines(acts: Act[]): Line[] {
  const flatLines: Line[] = []

  for (const act of acts) {
    const actIndex = act.actNumber - 1

    for (const scene of act.scenes) {
      const sceneIndex = scene.sceneNumber - 1

      for (const line of scene.lines) {
        flatLines.push({
          ...line,
          actIndex,
          sceneIndex,
        })
      }
    }
  }

  return flatLines
}
