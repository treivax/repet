/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { ContentNodeType, TextSegmentType } from './types';

/** Segment de texte (texte normal ou didascalie inline) */
export interface TextSegment {
  type: TextSegmentType;
  content: string;
}

/** Nœud de base pour l'AST */
export interface BaseContentNode {
  type: ContentNodeType;
}

/** Nœud Acte */
export interface ActNode extends BaseContentNode {
  type: 'act';
  number?: number;
  title: string;
  children: ContentNode[];
}

/** Nœud Scène */
export interface SceneNode extends BaseContentNode {
  type: 'scene';
  number?: number;
  title: string;
  children: ContentNode[];
}

/** Nœud Réplique */
export interface LineNode extends BaseContentNode {
  type: 'line';
  id: string;
  characterId: string;
  segments: TextSegment[];
}

/** Nœud Didascalie (standalone) */
export interface DidascalieNode extends BaseContentNode {
  type: 'didascalie';
  content: string;
}

/** Union de tous les types de nœuds */
export type ContentNode = ActNode | SceneNode | LineNode | DidascalieNode;

/** Type guard pour ActNode */
export function isActNode(node: ContentNode): node is ActNode {
  return node.type === 'act';
}

/** Type guard pour SceneNode */
export function isSceneNode(node: ContentNode): node is SceneNode {
  return node.type === 'scene';
}

/** Type guard pour LineNode */
export function isLineNode(node: ContentNode): node is LineNode {
  return node.type === 'line';
}

/** Type guard pour DidascalieNode */
export function isDidascalieNode(node: ContentNode): node is DidascalieNode {
  return node.type === 'didascalie';
}
