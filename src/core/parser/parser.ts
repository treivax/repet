/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { Play, PlayAST, PlayMetadata, Act, Scene } from '../models/Play'
import { createCharacter } from '../models/Character'
import { Line } from '../models/Line'
import {
  ContentNode,
  ActNode,
  SceneNode,
  LineNode,
  DidascalieNode,
  TextSegment,
} from '../models/ContentNode'
import { tokenize, extractNumber } from './tokenizer'
import { ParserContext, Token } from './types'
import { generateUUID } from '../../utils/uuid'

/**
 * Parse un fichier texte et retourne un objet Play
 *
 * @deprecated Utiliser textParser.ts à la place (conforme spec)
 * @param text - Contenu du fichier .txt
 * @param fileName - Nom du fichier original
 * @returns Play object parsé
 * @throws Error si le format est invalide
 */
export function parsePlayText(text: string, fileName: string): Play {
  try {
    const tokens = tokenize(text)
    const context = initializeContext(tokens)

    // Extraire métadonnées
    extractMetadata(context)

    // Extraire le titre (premier bloc non-métadonnée)
    if (!context.title) {
      context.title = extractTitle(context)
    }

    // Parser le contenu
    const content = parseContent(context)

    // Générer les lignes aplaties pour navigation
    const lines = generateLines(content)

    // Créer métadonnées
    const metadata: PlayMetadata = {
      title: context.title || 'Sans titre',
      author: context.author,
      year: context.year,
      category: context.category,
    }

    // Créer personnages
    const characters = Array.from(context.characters.entries()).map(([name, id]) => {
      return createCharacter(name, id)
    })

    // Convertir content en acts/scenes (simplifié pour legacy)
    const acts: Act[] = []
    let currentAct: Act | null = null
    let currentScene: Scene | null = null

    content.forEach((node: ContentNode) => {
      if (node.type === 'act') {
        const actNode = node as ActNode
        if (currentAct && currentScene) {
          currentAct.scenes.push(currentScene)
        }
        if (currentAct) {
          acts.push(currentAct)
        }
        currentAct = {
          actNumber: actNode.number || 1,
          title: actNode.title,
          scenes: [],
        }
        currentScene = null
      } else if (node.type === 'scene') {
        const sceneNode = node as SceneNode
        if (currentScene && currentAct) {
          currentAct.scenes.push(currentScene)
        }
        currentScene = {
          sceneNumber: sceneNode.number || 1,
          title: sceneNode.title,
          lines: [],
        }
      }
    })

    if (currentScene && currentAct) {
      ;(currentAct as Act).scenes.push(currentScene)
    }
    if (currentAct) {
      acts.push(currentAct as Act)
    }

    // Créer AST
    const ast: PlayAST = {
      metadata,
      characters,
      acts,
      flatLines: lines,
    }

    // Créer l'objet Play
    const play: Play = {
      id: generateUUID(),
      fileName,
      ast,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return play
  } catch (error) {
    throw new Error(
      `Erreur lors du parsing : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    )
  }
}

/**
 * Initialise le contexte de parsing
 */
function initializeContext(tokens: Token[]): ParserContext {
  return {
    tokens,
    position: 0,
    characters: new Map(),
  }
}

/**
 * Extrait les métadonnées du contexte
 */
function extractMetadata(context: ParserContext): void {
  for (const token of context.tokens) {
    if (token.type === 'author' && !context.author) {
      context.author = token.content
    } else if (token.type === 'year' && !context.year) {
      context.year = token.content
    } else if (token.type === 'category' && !context.category) {
      context.category = token.content
    }
  }
}

/**
 * Extrait le titre (premier bloc de texte non-métadonnée)
 */
function extractTitle(context: ParserContext): string {
  for (const token of context.tokens) {
    if (
      token.type === 'text' &&
      token.content.length > 0 &&
      !/^(Auteur|Ann[ée]e|Cat[ée]gorie)/i.test(token.content)
    ) {
      return token.content
    }
  }
  return 'Sans titre'
}

/**
 * Parse le contenu principal (actes, scènes, répliques)
 */
function parseContent(context: ParserContext): ContentNode[] {
  const content: ContentNode[] = []

  while (context.position < context.tokens.length) {
    const token = context.tokens[context.position]

    if (token.type === 'act') {
      content.push(parseAct(context))
    } else if (token.type === 'scene') {
      content.push(parseScene(context))
    } else if (token.type === 'character_line') {
      content.push(parseLine(context))
    } else if (token.type === 'didascalie') {
      const node: DidascalieNode = {
        type: 'didascalie',
        content: token.content,
      }
      content.push(node)
      context.position++
    } else {
      context.position++
    }
  }

  return content
}

/**
 * Parse un acte
 */
function parseAct(context: ParserContext): ActNode {
  const token = context.tokens[context.position]
  const number = extractNumber(token.content)
  const title = token.content

  context.position++

  const children: ContentNode[] = []

  // Parser les scènes et répliques de l'acte
  while (
    context.position < context.tokens.length &&
    context.tokens[context.position].type !== 'act'
  ) {
    const current = context.tokens[context.position]

    if (current.type === 'scene') {
      children.push(parseScene(context))
    } else if (current.type === 'character_line') {
      children.push(parseLine(context))
    } else if (current.type === 'didascalie') {
      children.push({
        type: 'didascalie',
        content: current.content,
      })
      context.position++
    } else {
      context.position++
    }
  }

  return {
    type: 'act',
    number,
    title,
    children,
  }
}

/**
 * Parse une scène
 */
function parseScene(context: ParserContext): SceneNode {
  const token = context.tokens[context.position]
  const number = extractNumber(token.content)
  const title = token.content

  context.position++

  const children: ContentNode[] = []

  // Parser les répliques de la scène
  while (
    context.position < context.tokens.length &&
    context.tokens[context.position].type !== 'act' &&
    context.tokens[context.position].type !== 'scene'
  ) {
    const current = context.tokens[context.position]

    if (current.type === 'character_line') {
      children.push(parseLine(context))
    } else if (current.type === 'didascalie') {
      children.push({
        type: 'didascalie',
        content: current.content,
      })
      context.position++
    } else {
      context.position++
    }
  }

  return {
    type: 'scene',
    number,
    title,
    children,
  }
}

/**
 * Parse une réplique de personnage
 */
function parseLine(context: ParserContext): LineNode {
  const token = context.tokens[context.position]
  const [characterName, ...restParts] = token.content.split(':')
  const characterNameClean = characterName.trim()
  const firstPart = restParts.join(':').trim()

  // Enregistrer le personnage
  if (!context.characters.has(characterNameClean)) {
    context.characters.set(characterNameClean, generateUUID())
  }

  const characterId = context.characters.get(characterNameClean)!

  context.position++

  // Collecter tout le texte de la réplique
  const textParts: string[] = []
  if (firstPart) {
    textParts.push(firstPart)
  }

  // Continuer tant qu'on a du texte (pas un autre personnage/acte/scène)
  while (
    context.position < context.tokens.length &&
    context.tokens[context.position].type === 'text'
  ) {
    textParts.push(context.tokens[context.position].content)
    context.position++
  }

  const fullText = textParts.join(' ')

  // Parser les segments (texte + didascalies inline)
  const segments = parseSegments(fullText)

  return {
    type: 'line',
    id: generateUUID(),
    characterId,
    segments,
  }
}

/**
 * Parse les segments d'une réplique (texte + didascalies inline)
 */
function parseSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  let current = ''
  let inDidascalie = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (char === '(' && !inDidascalie) {
      // Fin du segment texte
      if (current.trim()) {
        segments.push({ type: 'text', content: current.trim() })
      }
      current = ''
      inDidascalie = true
    } else if (char === ')' && inDidascalie) {
      // Fin de la didascalie
      if (current.trim()) {
        segments.push({ type: 'didascalie', content: current.trim() })
      }
      current = ''
      inDidascalie = false
    } else {
      current += char
    }
  }

  // Texte restant
  if (current.trim()) {
    segments.push({
      type: inDidascalie ? 'didascalie' : 'text',
      content: current.trim(),
    })
  }

  return segments
}

/**
 * Génère un tableau aplati de lignes à partir de l'AST de contenu
 * Permet la navigation séquentielle dans la pièce
 */
function generateLines(content: ContentNode[]): Line[] {
  const lines: Line[] = []
  let actIndex = -1
  let sceneIndex = -1

  function processNode(node: ContentNode): void {
    if (node.type === 'act') {
      actIndex++
      sceneIndex = -1
      processChildren(node.children)
    } else if (node.type === 'scene') {
      sceneIndex++
      processChildren(node.children)
    } else if (node.type === 'line') {
      // Convertir les segments en texte simple
      const text = node.segments.map((seg) => seg.content).join(' ')
      lines.push({
        id: node.id,
        type: 'dialogue',
        actIndex: Math.max(0, actIndex),
        sceneIndex: Math.max(0, sceneIndex),
        characterId: node.characterId,
        text,
        isStageDirection: false,
      })
    } else if (node.type === 'didascalie') {
      lines.push({
        id: generateUUID(),
        type: 'stage-direction',
        actIndex: Math.max(0, actIndex),
        sceneIndex: Math.max(0, sceneIndex),
        characterId: undefined,
        text: node.content,
        isStageDirection: true,
      })
    }
  }

  function processChildren(children: ContentNode[]): void {
    for (const child of children) {
      processNode(child)
    }
  }

  for (const node of content) {
    processNode(node)
  }

  return lines
}
