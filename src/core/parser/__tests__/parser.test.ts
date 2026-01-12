/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { describe, it, expect } from 'vitest'
import { parsePlayText } from '../textParser'

describe('TextParser - Conformité spec/appli.txt', () => {
  describe('Extraction du titre', () => {
    it('devrait extraire le titre comme premier bloc isolé', () => {
      const text = `Le Malade Imaginaire

Auteur: Molière

ACTE I`

      const result = parsePlayText(text, 'test.txt')
      expect(result.metadata.title).toBe('Le Malade Imaginaire')
    })

    it('devrait utiliser le nom de fichier si aucun titre', () => {
      const text = `ACTE I

Scene 1`

      const result = parsePlayText(text, 'ma-piece.txt')
      expect(result.metadata.title).toBe('ma-piece.txt')
    })

    it('devrait ignorer les lignes vides avant le titre', () => {
      const text = `


Le Titre de la Pièce

ACTE I`

      const result = parsePlayText(text, 'test.txt')
      expect(result.metadata.title).toBe('Le Titre de la Pièce')
    })
  })

  describe('Extraction auteur et année', () => {
    it("devrait extraire l'auteur après le titre", () => {
      const text = `Le Malade Imaginaire

Auteur: Molière

ACTE I`

      const result = parsePlayText(text, 'test.txt')
      expect(result.metadata.author).toBe('Molière')
    })

    it("devrait extraire l'année après le titre", () => {
      const text = `Le Malade Imaginaire

Annee: 1673

ACTE I`

      const result = parsePlayText(text, 'test.txt')
      expect(result.metadata.year).toBe('1673')
    })

    it('devrait extraire auteur et année', () => {
      const text = `Le Malade Imaginaire

Auteur: Molière
Annee: 1673

ACTE I`

      const result = parsePlayText(text, 'test.txt')
      expect(result.metadata.author).toBe('Molière')
      expect(result.metadata.year).toBe('1673')
    })

    it("ne devrait pas extraire l'auteur s'il n'est pas juste après le titre", () => {
      const text = `Le Malade Imaginaire

ACTE I

Auteur: Molière`

      const result = parsePlayText(text, 'test.txt')
      expect(result.metadata.author).toBeUndefined()
    })
  })

  describe('Détection actes et scènes', () => {
    it('devrait détecter un acte simple', () => {
      const text = `Le Titre

ACTE I

Scene 1`

      const result = parsePlayText(text, 'test.txt')
      expect(result.acts).toHaveLength(1)
      expect(result.acts[0].actNumber).toBe(1)
    })

    it('devrait détecter un acte avec numéro et titre', () => {
      const text = `Le Titre

ACTE II - Paris est un monde

Scene 1`

      const result = parsePlayText(text, 'test.txt')
      expect(result.acts).toHaveLength(1)
      expect(result.acts[0].actNumber).toBe(2)
      expect(result.acts[0].title).toBe('Paris est un monde')
    })

    it('devrait détecter "ACTE" avec variations de format', () => {
      const text = `Le Titre

ACTE 1 - Alegria

Scene 1`

      const result = parsePlayText(text, 'test.txt')
      expect(result.acts).toHaveLength(1)
      expect(result.acts[0].actNumber).toBe(1)
      expect(result.acts[0].title).toBe('Alegria')
    })

    it('devrait détecter une scène simple', () => {
      const text = `Le Titre

ACTE I

Scene 1

PERSONNAGE:
Texte`

      const result = parsePlayText(text, 'test.txt')
      expect(result.acts[0].scenes).toHaveLength(1)
      expect(result.acts[0].scenes[0].sceneNumber).toBe(1)
    })

    it('devrait détecter "Scène" avec accent', () => {
      const text = `Le Titre

ACTE I

Scène 1 - Présentation

PERSONNAGE:
Texte`

      const result = parsePlayText(text, 'test.txt')
      expect(result.acts[0].scenes).toHaveLength(1)
      expect(result.acts[0].scenes[0].sceneNumber).toBe(1)
      expect(result.acts[0].scenes[0].title).toBe('Présentation')
    })

    it('devrait gérer plusieurs actes et scènes', () => {
      const text = `Le Titre

ACTE I

Scene 1

PERSONNAGE:
Texte

Scene 2

PERSONNAGE:
Autre texte

ACTE II

Scene 1

PERSONNAGE:
Encore du texte`

      const result = parsePlayText(text, 'test.txt')
      expect(result.acts).toHaveLength(2)
      expect(result.acts[0].scenes).toHaveLength(2)
      expect(result.acts[1].scenes).toHaveLength(1)
    })
  })

  describe('Reconnaissance des répliques', () => {
    it('devrait reconnaître une réplique simple', () => {
      const text = `Le Titre

ACTE I

Scene 1

HAMLET:
Être ou ne pas être, telle est la question.`

      const result = parsePlayText(text, 'test.txt')
      const lines = result.acts[0].scenes[0].lines

      expect(lines).toHaveLength(1)
      expect(lines[0].type).toBe('dialogue')
      expect(lines[0].characterId).toBe('HAMLET')
      expect(lines[0].text).toBe('Être ou ne pas être, telle est la question.')
    })

    it('devrait gérer les répliques multi-lignes', () => {
      const text = `Le Titre

ACTE I

Scene 1

HAMLET:
Être ou ne pas être,
telle est la question.
Que reste-t-il?`

      const result = parsePlayText(text, 'test.txt')
      const lines = result.acts[0].scenes[0].lines

      expect(lines).toHaveLength(1)
      expect(lines[0].text).toContain('Être ou ne pas être')
      expect(lines[0].text).toContain('telle est la question')
      expect(lines[0].text).toContain('Que reste-t-il')
    })

    it('devrait gérer les répliques avec lignes vides', () => {
      const text = `Le Titre

ACTE I

Scene 1

HAMLET:
Première partie.

Deuxième partie après ligne vide.

OPHÉLIE:
Autre réplique.`

      const result = parsePlayText(text, 'test.txt')
      const lines = result.acts[0].scenes[0].lines

      expect(lines).toHaveLength(2)
      expect(lines[0].text).toContain('Première partie')
      expect(lines[0].text).toContain('Deuxième partie')
    })

    it('devrait gérer les noms avec espaces et tirets', () => {
      const text = `Le Titre

ACTE I

Scene 1

LE ROI-SOLEIL:
Ma réplique.

MARIE-ANTOINETTE:
Autre réplique.`

      const result = parsePlayText(text, 'test.txt')
      const lines = result.acts[0].scenes[0].lines

      expect(lines).toHaveLength(2)
      expect(lines[0].characterId).toBe('LE ROI-SOLEIL')
      expect(lines[1].characterId).toBe('MARIE-ANTOINETTE')
    })

    it('devrait extraire la liste des personnages', () => {
      const text = `Le Titre

ACTE I

Scene 1

HAMLET:
Texte.

OPHÉLIE:
Autre texte.

HAMLET:
Encore du texte.`

      const result = parsePlayText(text, 'test.txt')

      expect(result.characters).toHaveLength(2)
      expect(result.characters.map((c) => c.id)).toContain('HAMLET')
      expect(result.characters.map((c) => c.id)).toContain('OPHÉLIE')
    })

    it("devrait reconnaître une réplique sans deux-points précédée d'une ligne vierge", () => {
      const text = `Le Titre

ACTE I

Scene 1

HAMLET
Être ou ne pas être, telle est la question.`

      const result = parsePlayText(text, 'test.txt')
      const lines = result.acts[0].scenes[0].lines

      expect(lines).toHaveLength(1)
      expect(lines[0].type).toBe('dialogue')
      expect(lines[0].characterId).toBe('HAMLET')
      expect(lines[0].text).toBe('Être ou ne pas être, telle est la question.')
    })

    it('devrait reconnaître plusieurs répliques sans deux-points', () => {
      const text = `Le Titre

ACTE I

Scene 1

HAMLET
Première réplique.

OPHÉLIE
Deuxième réplique.

HAMLET
Troisième réplique.`

      const result = parsePlayText(text, 'test.txt')
      const lines = result.acts[0].scenes[0].lines

      expect(lines).toHaveLength(3)
      expect(lines[0].characterId).toBe('HAMLET')
      expect(lines[0].text).toBe('Première réplique.')
      expect(lines[1].characterId).toBe('OPHÉLIE')
      expect(lines[1].text).toBe('Deuxième réplique.')
      expect(lines[2].characterId).toBe('HAMLET')
      expect(lines[2].text).toBe('Troisième réplique.')
    })

    it('devrait accepter les noms composés sans deux-points', () => {
      const text = `Le Titre

ACTE I

Scene 1

JEAN-PIERRE
Ma première réplique.

MARIE LOUISE LEGRANCHU
Ma réplique aussi.`

      const result = parsePlayText(text, 'test.txt')
      const lines = result.acts[0].scenes[0].lines

      expect(lines).toHaveLength(2)
      expect(lines[0].characterId).toBe('JEAN-PIERRE')
      expect(lines[1].characterId).toBe('MARIE LOUISE LEGRANCHU')
    })

    it("ne devrait PAS reconnaître un nom sans deux-points si non précédé d'une ligne vierge", () => {
      const text = `Le Titre

ACTE I

Scene 1

Ceci est une didascalie
HAMLET
Ceci devrait être une didascalie aussi.`

      const result = parsePlayText(text, 'test.txt')
      const lines = result.acts[0].scenes[0].lines

      // Tout devrait être une didascalie, pas de réplique
      expect(lines).toHaveLength(1)
      expect(lines[0].type).toBe('stage-direction')
      expect(lines[0].text).toContain('Ceci est une didascalie')
      expect(lines[0].text).toContain('HAMLET')
    })

    it('devrait mélanger les formats avec et sans deux-points', () => {
      const text = `Le Titre

ACTE I

Scene 1

HAMLET:
Avec deux-points.

OPHÉLIE
Sans deux-points.

HAMLET:
Encore avec.

OPHÉLIE
Encore sans.`

      const result = parsePlayText(text, 'test.txt')
      const lines = result.acts[0].scenes[0].lines

      expect(lines).toHaveLength(4)
      expect(lines[0].characterId).toBe('HAMLET')
      expect(lines[0].text).toBe('Avec deux-points.')
      expect(lines[1].characterId).toBe('OPHÉLIE')
      expect(lines[1].text).toBe('Sans deux-points.')
      expect(lines[2].characterId).toBe('HAMLET')
      expect(lines[2].text).toBe('Encore avec.')
      expect(lines[3].characterId).toBe('OPHÉLIE')
      expect(lines[3].text).toBe('Encore sans.')
    })
  })

  describe('Didascalies', () => {
    it('devrait détecter les didascalies entre parenthèses dans une réplique', () => {
      const text = `Le Titre

ACTE I

Scene 1

HAMLET:
(pensif) Être ou ne pas être.`

      const result = parsePlayText(text, 'test.txt')
      const line = result.acts[0].scenes[0].lines[0]

      expect(line.text).toContain('(pensif)')
      expect(line.text).toContain('Être ou ne pas être')
    })

    it('devrait détecter les blocs de didascalies hors répliques', () => {
      const text = `Le Titre

ACTE I

Scene 1

Le roi entre majestueusement dans la salle.

HAMLET:
Ma réplique.`

      const result = parsePlayText(text, 'test.txt')
      const lines = result.acts[0].scenes[0].lines

      expect(lines).toHaveLength(2)
      expect(lines[0].type).toBe('stage-direction')
      expect(lines[0].isStageDirection).toBe(true)
      expect(lines[0].text).toBe('Le roi entre majestueusement dans la salle.')
      expect(lines[0].characterId).toBeUndefined()
    })

    it('devrait détecter les didascalies multi-lignes', () => {
      const text = `Le Titre

ACTE I

Scene 1

Tous les acteurs, sauf Loïck, Emmanuel et Xavier, sont assis sur scène,
face au public, commentant, se marrant.

PERSONNAGE:
Texte.`

      const result = parsePlayText(text, 'test.txt')
      const lines = result.acts[0].scenes[0].lines

      expect(lines[0].type).toBe('stage-direction')
      expect(lines[0].text).toContain('Tous les acteurs')
      expect(lines[0].text).toContain('face au public')
    })
  })

  describe('Construction du tableau flatLines', () => {
    it('devrait générer flatLines avec actIndex et sceneIndex', () => {
      const text = `Le Titre

ACTE I

Scene 1

PERSONNAGE:
Texte 1.

ACTE II

Scene 1

PERSONNAGE:
Texte 2.`

      const result = parsePlayText(text, 'test.txt')

      expect(result.flatLines).toHaveLength(2)
      expect(result.flatLines[0].actIndex).toBe(0)
      expect(result.flatLines[0].sceneIndex).toBe(0)
      expect(result.flatLines[1].actIndex).toBe(1)
      expect(result.flatLines[1].sceneIndex).toBe(0)
    })

    it('devrait générer des IDs uniques pour chaque ligne', () => {
      const text = `Le Titre

ACTE I

Scene 1

PERSONNAGE:
Texte 1.

PERSONNAGE:
Texte 2.`

      const result = parsePlayText(text, 'test.txt')

      const ids = result.flatLines.map((l) => l.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })

  describe('Parsing complet de ALEGRIA.txt (échantillon)', () => {
    it('devrait parser correctement un extrait de ALEGRIA', () => {
      // Échantillon représentatif de ALEGRIA.txt
      const content = `ACTE 1 - Alegria

Scène 1 - Présentation

Tous les acteurs, sauf Loïck, Emmanuel et Xavier, sont assis sur scène, face au public, commentant, se  marrant, en désignant les spectateurs et spectatrices. Pascal, lunettes sur le bout du nez, debout, passant auprès de tout le monde, prend des notes. Stéphanie et Fabrice, quant à eux, se parlent, doucement au creux de l'oreille, dans une certaine "complicité". Arrive Xavier, n'en croyant pas ses yeux.

XAVIER:
(hors de lui, à voix basse, gêné par rapport au public, avec des sourires de circonstance)
Mais vous faites quoi ?!!! On va commencer... Ils sont là, ils vous regardent, ils vous entendent !

ALAIN:
(hilare et complice, façon Muppet Show avec Chantal)
Bah, nous aussi on les voit ahahhahaah !

CHANTAL:
Et nous aussi on les entend ahahhahahah !

ALAIN:
 Qu'est-ce que tu dis ? Ahahahahhahahaha !!!
(Tous deux se marrent, fiers de leurs blagues.)

AMANDINE:
C'est vrai quoi, pour une fois, pourquoi ce ne serait pas nous d'abord qui les « spectaterait » ? Histoire de casser les codes ?`

      const result = parsePlayText(content, 'ALEGRIA.txt')

      // Vérifier le titre (utilise le nom du fichier car pas de titre isolé)
      expect(result.metadata.title).toBe('ALEGRIA.txt')

      // Vérifier l'acte
      expect(result.acts).toHaveLength(1)
      expect(result.acts[0].actNumber).toBe(1)
      expect(result.acts[0].title).toBe('Alegria')

      // Vérifier la scène
      expect(result.acts[0].scenes).toHaveLength(1)
      expect(result.acts[0].scenes[0].sceneNumber).toBe(1)
      expect(result.acts[0].scenes[0].title).toBe('Présentation')

      // Vérifier les personnages extraits
      const characterIds = result.characters.map((c) => c.id)
      expect(characterIds).toContain('XAVIER')
      expect(characterIds).toContain('ALAIN')
      expect(characterIds).toContain('CHANTAL')
      expect(characterIds).toContain('AMANDINE')

      // Vérifier les lignes
      const lines = result.acts[0].scenes[0].lines
      expect(lines.length).toBeGreaterThan(0)

      // Vérifier qu'il y a des didascalies et des dialogues
      const dialogues = lines.filter((l) => l.type === 'dialogue')
      const stageDirections = lines.filter((l) => l.type === 'stage-direction')

      expect(dialogues.length).toBeGreaterThan(0)
      expect(stageDirections.length).toBeGreaterThan(0)

      // Vérifier la première didascalie
      const firstStageDirection = lines.find((l) => l.isStageDirection)
      expect(firstStageDirection).toBeDefined()
      expect(firstStageDirection?.text).toContain('Tous les acteurs')

      // Vérifier flatLines
      expect(result.flatLines.length).toBeGreaterThan(0)

      result.flatLines.forEach((line) => {
        expect(line.id).toBeDefined()
        expect(line.type).toBeDefined()
        expect(line.actIndex).toBeGreaterThanOrEqual(0)
        expect(line.sceneIndex).toBeGreaterThanOrEqual(0)
        expect(line.text).toBeDefined()
        expect(typeof line.isStageDirection).toBe('boolean')
      })
    })
  })
})
