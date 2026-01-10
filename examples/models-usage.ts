/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Exemples d'utilisation des modèles de données
 * Ce fichier montre comment utiliser les types et interfaces créés dans src/core/models
 */

import {
  Play,
  Character,
  ContentNode,
  ActNode,
  SceneNode,
  LineNode,
  DidascalieNode,
  TextSegment,
  Settings,
  DEFAULT_SETTINGS,
  createCharacter,
  isActNode,
  isSceneNode,
  isLineNode,
  isDidascalieNode,
} from '../src/core/models';

// ============================================
// 1. CRÉATION DE PERSONNAGES
// ============================================

// Créer un personnage avec valeurs par défaut
const hamlet = createCharacter('HAMLET');
console.log('Personnage créé:', hamlet);
// Output: { id: 'char_...', name: 'HAMLET', gender: 'neutral', color: '#666666' }

// Personnaliser un personnage
const ophelia: Character = {
  ...createCharacter('OPHÉLIE'),
  gender: 'female',
  voiceURI: 'Microsoft Hortense - French (France)',
  color: '#FF69B4',
};

// ============================================
// 2. CRÉATION DE SEGMENTS DE TEXTE
// ============================================

// Texte simple
const textSegment: TextSegment = {
  type: 'text',
  content: 'Être ou ne pas être, telle est la question.',
};

// Didascalie inline
const didascalieSegment: TextSegment = {
  type: 'didascalie',
  content: 'Il réfléchit profondément',
};

// ============================================
// 3. CRÉATION DE NŒUDS DE CONTENU
// ============================================

// Réplique simple
const simpleLine: LineNode = {
  type: 'line',
  id: 'line_001',
  characterId: hamlet.id,
  segments: [textSegment],
};

// Réplique avec didascalie inline
const lineWithDidascalie: LineNode = {
  type: 'line',
  id: 'line_002',
  characterId: hamlet.id,
  segments: [
    { type: 'text', content: 'Mourir...' },
    { type: 'didascalie', content: 'pause' },
    { type: 'text', content: 'dormir, peut-être rêver.' },
  ],
};

// Didascalie standalone
const stageDirection: DidascalieNode = {
  type: 'didascalie',
  content: 'Entre le fantôme du père d\'Hamlet',
};

// Scène
const scene: SceneNode = {
  type: 'scene',
  number: 1,
  title: 'Scène 1',
  children: [
    stageDirection,
    simpleLine,
    lineWithDidascalie,
  ],
};

// Acte
const act: ActNode = {
  type: 'act',
  number: 3,
  title: 'Acte III',
  children: [scene],
};

// ============================================
// 4. CRÉATION D'UNE PIÈCE COMPLÈTE
// ============================================

const play: Play = {
  id: crypto.randomUUID(),
  fileName: 'hamlet.txt',
  title: 'Hamlet',
  author: 'William Shakespeare',
  year: '1603',
  category: 'Tragédie',
  characters: [hamlet, ophelia],
  content: [act],
  createdAt: new Date(),
  updatedAt: new Date(),
};

console.log('Pièce créée:', play.title, 'par', play.author);

// ============================================
// 5. UTILISATION DES TYPE GUARDS
// ============================================

function processNode(node: ContentNode): void {
  if (isActNode(node)) {
    console.log(`Traitement de l'acte: ${node.title}`);
    node.children.forEach(processNode);
  } else if (isSceneNode(node)) {
    console.log(`Traitement de la scène: ${node.title}`);
    node.children.forEach(processNode);
  } else if (isLineNode(node)) {
    console.log(`Réplique du personnage ${node.characterId}`);
    node.segments.forEach((segment) => {
      if (segment.type === 'didascalie') {
        console.log(`  [${segment.content}]`);
      } else {
        console.log(`  ${segment.content}`);
      }
    });
  } else if (isDidascalieNode(node)) {
    console.log(`Stage direction: [${node.content}]`);
  }
}

// Parcourir le contenu de la pièce
play.content.forEach(processNode);

// ============================================
// 6. PARAMÈTRES DE L'APPLICATION
// ============================================

// Utiliser les paramètres par défaut
let settings: Settings = { ...DEFAULT_SETTINGS };
console.log('Paramètres par défaut:', settings);

// Personnaliser les paramètres
settings = {
  ...settings,
  theme: 'dark',
  readingSpeed: 0.8,
  voiceOff: false,
  hideUserLines: true,
};

console.log('Paramètres personnalisés:', settings);

// ============================================
// 7. RECHERCHE ET FILTRAGE
// ============================================

// Trouver toutes les répliques d'un personnage
function findCharacterLines(content: ContentNode[], characterId: string): LineNode[] {
  const lines: LineNode[] = [];

  function traverse(node: ContentNode): void {
    if (isLineNode(node)) {
      if (node.characterId === characterId) {
        lines.push(node);
      }
    } else if (isActNode(node) || isSceneNode(node)) {
      node.children.forEach(traverse);
    }
  }

  content.forEach(traverse);
  return lines;
}

const hamletLines = findCharacterLines(play.content, hamlet.id);
console.log(`Hamlet a ${hamletLines.length} répliques`);

// Compter les actes et scènes
function countStructure(content: ContentNode[]): { acts: number; scenes: number } {
  let acts = 0;
  let scenes = 0;

  function traverse(node: ContentNode): void {
    if (isActNode(node)) {
      acts++;
      node.children.forEach(traverse);
    } else if (isSceneNode(node)) {
      scenes++;
    }
  }

  content.forEach(traverse);
  return { acts, scenes };
}

const structure = countStructure(play.content);
console.log(`Structure: ${structure.acts} acte(s), ${structure.scenes} scène(s)`);

// ============================================
// 8. VALIDATION ET VÉRIFICATIONS
// ============================================

// Vérifier qu'un personnage existe
function characterExists(play: Play, characterId: string): boolean {
  return play.characters.some((char) => char.id === characterId);
}

// Valider que toutes les répliques ont un personnage valide
function validatePlay(play: Play): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  function validateNode(node: ContentNode): void {
    if (isLineNode(node)) {
      if (!characterExists(play, node.characterId)) {
        errors.push(`Réplique ${node.id}: personnage ${node.characterId} introuvable`);
      }
    } else if (isActNode(node) || isSceneNode(node)) {
      node.children.forEach(validateNode);
    }
  }

  play.content.forEach(validateNode);

  return {
    valid: errors.length === 0,
    errors,
  };
}

const validation = validatePlay(play);
console.log('Validation:', validation.valid ? 'OK' : `Erreurs: ${validation.errors.join(', ')}`);

// ============================================
// EXPORT POUR TESTS
// ============================================

export {
  hamlet,
  ophelia,
  play,
  settings,
  processNode,
  findCharacterLines,
  countStructure,
  validatePlay,
};
