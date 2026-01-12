/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { PlayAST, PlayMetadata, Act, Scene } from '../models/Play'
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

  return {
    metadata,
    characters,
    acts,
    flatLines,
  }
}

/**
 * Extrait les métadonnées (titre, auteur, année)
 */
function extractMetadata(lines: string[], fileName: string): PlayMetadata {
  let title: string | undefined
  let author: string | undefined
  let year: string | undefined
  let category: string | undefined

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

    // Vérifier si c'est un mot-clé (Auteur, Annee, ACTE, Scene)
    if (
      /^Auteur\s*:/i.test(line) ||
      /^Ann[ée]e\s*:/i.test(line) ||
      /^Cat[ée]gorie\s*:/i.test(line) ||
      /^ACTE/i.test(line) ||
      /^Sc[èe]ne/i.test(line)
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

  // Chercher Auteur et Année juste après le titre
  if (afterTitle) {
    // Sauter les lignes vides
    while (i < lines.length && lines[i].trim() === '') {
      i++
    }

    // Vérifier les 5 prochaines lignes pour Auteur/Annee
    let checkCount = 0
    while (i < lines.length && checkCount < 5) {
      const line = lines[i].trim()

      if (line === '') {
        i++
        continue
      }

      // Si on rencontre un ACTE ou Scene, on arrête
      if (/^ACTE/i.test(line) || /^Sc[èe]ne/i.test(line)) {
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

      // Si c'est autre chose, on arrête
      break
    }
  }

  return {
    title: title || fileName,
    author,
    year,
    category,
  }
}

/**
 * Parse la structure (actes, scènes, répliques, didascalies)
 */
function parseStructure(lines: string[]): Act[] {
  const acts: Act[] = []
  let currentAct: Act | null = null
  let currentScene: Scene | null = null
  let i = 0

  // Sauter les métadonnées initiales
  let foundFirstAct = false
  while (i < lines.length && !foundFirstAct) {
    const line = lines[i].trim()
    if (/^ACTE/i.test(line)) {
      foundFirstAct = true
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

      i++
      continue
    }

    // Détecter Scène (chiffres arabes ou romains)
    const sceneMatchArabic = line.match(/^Sc[èe]ne\s+(\d+)(?:\s*[-–—:]\s*(.+))?/i)
    const sceneMatchRoman = line.match(/^Sc[èe]ne\s+([IVXLCDM]+)(?:\s*[-–—:]\s*(.+))?/i)

    if (sceneMatchArabic || sceneMatchRoman) {
      // Sauvegarder la scène précédente
      if (currentScene && currentAct) {
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
    if (isCharacterLine(rawLine, lines[i + 1], previousLine)) {
      const characterName = extractCharacterName(line)
      i++ // Aller à la ligne suivante

      // Collecter le texte de la réplique
      const replicaText: string[] = []
      while (i < lines.length) {
        const nextLine = lines[i]

        // Arrêter si nouvelle réplique, acte ou scène
        if (
          (nextLine.trim() === '' &&
            i + 1 < lines.length &&
            isCharacterLine(lines[i + 1], lines[i + 2], lines[i])) ||
          /^ACTE/i.test(nextLine.trim()) ||
          /^Sc[èe]ne/i.test(nextLine.trim())
        ) {
          break
        }

        replicaText.push(nextLine)
        i++
      }

      // Créer la ligne de dialogue
      if (currentScene) {
        const dialogueLine: Line = {
          id: generateUUID(),
          type: 'dialogue',
          actIndex: currentAct ? currentAct.actNumber - 1 : 0,
          sceneIndex: currentScene ? currentScene.sceneNumber - 1 : 0,
          characterId: characterName,
          text: replicaText.join('\n').trim(),
          isStageDirection: false,
        }
        currentScene.lines.push(dialogueLine)
      }

      continue
    }

    // Détecter didascalie (bloc de texte hors réplique)
    if (line !== '' && currentScene) {
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
              isCharacterLine(lines[i], lines[i + 1], lines[i - 1])
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
        if (isCharacterLine(nextLine, lines[i + 1], prevLine)) {
          break
        }

        didascalieText.push(nextLine)
        i++
      }

      const didascalieContent = didascalieText.join('\n').trim()
      if (didascalieContent && currentScene) {
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
function isCharacterLine(line: string, nextLine?: string, previousLine?: string): boolean {
  if (!line || !nextLine) {
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

  // La ligne suivante ne doit pas être vide (début de la réplique)
  // Note: on accepte qu'elle soit vide si c'est une réplique vide (rare)

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
 * Extrait la liste unique des personnages
 */
function extractCharacters(acts: Act[]) {
  const characterSet = new Set<string>()

  for (const act of acts) {
    for (const scene of act.scenes) {
      for (const line of scene.lines) {
        if (line.type === 'dialogue' && line.characterId) {
          characterSet.add(line.characterId)
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
