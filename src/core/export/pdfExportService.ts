/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Play, Act, CastSection } from '../models/Play'
import type { Character } from '../models/Character'
import type { Line } from '../models/Line'
import { generateCharacterColor } from '../../utils/colors'
import { parseTextWithStageDirections } from '../../utils/textParser'
import { NotesStorage } from '../storage/notesStorage'
import { AttachableType, NoteDisplayState } from '../models/note'
import type { Note } from '../models/note'

/**
 * Options pour l'export PDF
 */
export interface PDFExportOptions {
  /** Titre de la pièce */
  playTitle?: string

  /** Auteur de la pièce */
  playAuthor?: string

  /** Inclure la page de couverture */
  includeCover?: boolean

  /** Inclure la distribution des rôles */
  includeCast?: boolean

  /** Inclure les numéros de page */
  includePageNumbers?: boolean

  /** Thème (clair/sombre) */
  theme?: 'light' | 'dark'

  /** Taille de police (pt) */
  fontSize?: number

  /** Marge (mm) */
  margin?: number

  /** Inclure les notes dans l'export */
  includeNotes?: boolean
}

/**
 * Service d'export PDF pour les pièces de théâtre
 * Génère des PDF au format A4 fidèles à l'affichage
 */
export class PDFExportService {
  // Dimensions A4 en mm
  private readonly A4_WIDTH = 210
  private readonly A4_HEIGHT = 297

  // Marges par défaut (mm)
  private readonly DEFAULT_MARGIN = 15

  // Taille de police par défaut (pt)
  private readonly DEFAULT_FONT_SIZE = 11

  /**
   * Exporte une pièce au format PDF
   */
  async exportPlayToPDF(
    play: Play,
    charactersMap: Record<string, Character>,
    options: PDFExportOptions = {}
  ): Promise<void> {
    const {
      playTitle = play.ast.metadata.title || 'Pièce sans titre',
      playAuthor = play.ast.metadata.author || '',
      includeCover = true,
      includeCast = true,
      includePageNumbers = true,
      includeNotes = true,
      fontSize = this.DEFAULT_FONT_SIZE,
      margin = this.DEFAULT_MARGIN,
    } = options

    // Charger les notes si nécessaire
    let notes: Note[] = []
    let notesMap: Map<string, Note> | null = null

    if (includeNotes) {
      notes = await NotesStorage.getNotesByPlayId(play.id)
      notesMap = new Map()
      for (const note of notes) {
        const key = `${note.attachedToType}:${note.attachedToIndex}`
        notesMap.set(key, note)
      }
    }

    // Créer le document PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Page de couverture
    if (includeCover) {
      this.addCoverPage(pdf, playTitle, playAuthor, margin)
    }

    // Distribution des rôles (Cast)
    if (includeCast && play.ast.metadata.castSection) {
      pdf.addPage()
      this.addCastPage(pdf, play.ast.metadata.castSection, charactersMap, margin, fontSize)
    }

    // Contenu de la pièce
    for (const act of play.ast.acts) {
      // Nouvelle page pour chaque acte
      pdf.addPage()

      this.addActContent(pdf, act, charactersMap, margin, fontSize, notesMap)
    }

    // Ajouter les numéros de page
    if (includePageNumbers) {
      this.addPageNumbers(pdf, includeCover ? 1 : 0)
    }

    // Télécharger le PDF
    const filename = this.sanitizeFilename(playTitle)
    pdf.save(`${filename}.pdf`)
  }

  /**
   * Ajoute une page de couverture
   */
  private addCoverPage(pdf: jsPDF, title: string, author: string, margin: number): void {
    const pageWidth = this.A4_WIDTH
    const pageHeight = this.A4_HEIGHT
    const centerX = pageWidth / 2

    // Titre principal (centré verticalement)
    pdf.setFontSize(28)
    pdf.setFont('helvetica', 'bold')
    const titleLines = pdf.splitTextToSize(title, pageWidth - 2 * margin)
    const titleY = pageHeight / 2 - (titleLines.length * 10) / 2

    titleLines.forEach((line: string, index: number) => {
      const textWidth = pdf.getTextWidth(line)
      pdf.text(line, centerX - textWidth / 2, titleY + index * 10, { align: 'left', charSpace: 0 })
    })

    // Auteur (sous le titre)
    if (author) {
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'normal')
      const authorY = titleY + titleLines.length * 10 + 20
      const authorWidth = pdf.getTextWidth(author)
      pdf.text(author, centerX - authorWidth / 2, authorY, { align: 'left', charSpace: 0 })
    }

    // Pied de page (application)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'italic')
    const footerText = 'Généré avec Répét'
    const footerWidth = pdf.getTextWidth(footerText)
    pdf.text(footerText, centerX - footerWidth / 2, pageHeight - margin, {
      align: 'left',
      charSpace: 0,
    })
  }

  /**
   * Ajoute la page de distribution
   */
  private addCastPage(
    pdf: jsPDF,
    castSection: CastSection,
    _charactersMap: Record<string, Character>,
    margin: number,
    fontSize: number
  ): void {
    let yPosition = margin + 10

    // Titre "Distribution des rôles"
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Distribution des rôles', margin, yPosition, { align: 'left', charSpace: 0 })
    yPosition += 15

    pdf.setFontSize(fontSize)
    pdf.setFont('helvetica', 'normal')

    // Blocs de texte libre
    if (castSection.textBlocks) {
      for (const block of castSection.textBlocks) {
        const lines = pdf.splitTextToSize(block, this.A4_WIDTH - 2 * margin)

        // Vérifier si on doit ajouter une nouvelle page
        if (yPosition + lines.length * 5 > this.A4_HEIGHT - margin) {
          pdf.addPage()
          yPosition = margin + 10
        }

        pdf.setFont('helvetica', 'italic')
        lines.forEach((line: string) => {
          pdf.text(line, margin, yPosition, { align: 'left', charSpace: 0 })
          yPosition += 5
        })
        yPosition += 5
      }
    }

    // Présentations des personnages
    if (castSection.presentations) {
      for (const presentation of castSection.presentations) {
        // Vérifier si on doit ajouter une nouvelle page
        if (yPosition + 15 > this.A4_HEIGHT - margin) {
          pdf.addPage()
          yPosition = margin + 10
        }

        // Nom du personnage (gras)
        pdf.setFont('helvetica', 'bold')
        pdf.text(presentation.characterName, margin + 5, yPosition, { align: 'left', charSpace: 0 })
        yPosition += 6

        // Description (italique)
        if (presentation.description) {
          pdf.setFont('helvetica', 'italic')
          const descLines = pdf.splitTextToSize(
            presentation.description,
            this.A4_WIDTH - 2 * margin - 10
          )

          descLines.forEach((line: string) => {
            if (yPosition > this.A4_HEIGHT - margin) {
              pdf.addPage()
              yPosition = margin + 10
            }
            pdf.text(line, margin + 10, yPosition, { align: 'left', charSpace: 0 })
            yPosition += 5
          })
        }
        yPosition += 5
      }
    }
  }

  /**
   * Ajoute le contenu d'un acte
   */
  private addActContent(
    pdf: jsPDF,
    act: Act,
    charactersMap: Record<string, Character>,
    margin: number,
    fontSize: number,
    notesMap: Map<string, Note> | null
  ): void {
    let yPosition = margin + 10

    // Titre de l'acte
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0) // Reset to black
    const actTitle = `Acte ${act.actNumber}${act.title ? ' : ' + act.title : ''}`
    pdf.text(actTitle, margin, yPosition, { align: 'left', charSpace: 0 })
    yPosition += 12

    // Parcourir les scènes
    for (const scene of act.scenes) {
      // Vérifier si on a assez d'espace pour le titre de scène
      if (yPosition + 20 > this.A4_HEIGHT - margin) {
        pdf.addPage()
        yPosition = margin + 10
      }

      // Titre de la scène
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0) // Reset to black
      const sceneTitle = `Scène ${scene.sceneNumber}${scene.title ? ' - ' + scene.title : ''}`
      pdf.text(sceneTitle, margin, yPosition, { align: 'left', charSpace: 0 })
      yPosition += 10

      // Parcourir les lignes
      for (let lineIndex = 0; lineIndex < scene.lines.length; lineIndex++) {
        const line = scene.lines[lineIndex]
        // Vérifier l'espace disponible avant d'ajouter la ligne
        yPosition = this.addLine(pdf, line, charactersMap, margin, yPosition, fontSize)

        // Ajouter une note si elle existe pour cette ligne
        if (notesMap) {
          const noteKey = `${AttachableType.LINE}:${lineIndex}`
          const note = notesMap.get(noteKey)
          if (note && note.displayState === NoteDisplayState.MAXIMIZED && note.content.trim()) {
            yPosition = this.addNote(pdf, note, margin, yPosition, fontSize)
          }
        }
      }

      yPosition += 5 // Espacement entre scènes
    }
  }

  /**
   * Ajoute une ligne (réplique ou didascalie) au PDF
   * Gère automatiquement les sauts de page si nécessaire
   * @returns Position Y finale après l'ajout de la ligne
   */
  private addLine(
    pdf: jsPDF,
    line: Line,
    charactersMap: Record<string, Character>,
    margin: number,
    yPosition: number,
    fontSize: number
  ): number {
    let currentY = yPosition
    const maxWidth = this.A4_WIDTH - 2 * margin
    const maxY = this.A4_HEIGHT - margin // Respecter la marge du bas

    pdf.setFontSize(fontSize)

    if (line.type === 'dialogue') {
      // Nom du personnage (gras + couleur)
      pdf.setFont('helvetica', 'bold')
      const characterName = line.characterId
        ? charactersMap[line.characterId]?.name || 'Inconnu'
        : 'Inconnu'

      // Générer la couleur du personnage
      const allCharacterNames = Object.values(charactersMap).map((char) => char.name)
      const characterColor = generateCharacterColor(characterName, allCharacterNames)

      // Convertir la couleur hex en RGB
      const rgb = this.hexToRgb(characterColor)

      // Parser le texte pour extraire les didascalies
      const segments = parseTextWithStageDirections(line.text)

      // Vérifier si on a assez d'espace pour le nom + au moins une ligne de texte
      // On veut garantir que le nom et la première ligne restent ensemble
      const minHeight = 6 + 5 // nom (6mm) + première ligne (5mm)

      if (currentY + minHeight > maxY) {
        // Pas assez d'espace, on change de page AVANT d'écrire le nom
        pdf.addPage()
        currentY = margin + 10
      }

      // Écrire le nom du personnage
      pdf.setTextColor(rgb.r, rgb.g, rgb.b)
      pdf.text(characterName, margin, currentY, { align: 'left', charSpace: 0 })
      currentY += 6

      // Afficher chaque segment
      for (const segment of segments) {
        if (segment.type === 'stage-direction') {
          // Didascalie dans réplique : italique + gris
          pdf.setFont('helvetica', 'italic')
          pdf.setTextColor(128, 128, 128) // Gris

          const stageText = `(${segment.content})`
          const stageLines = this.splitTextManually(pdf, stageText, maxWidth - 5)

          for (const stageLine of stageLines) {
            if (currentY + 5 > maxY) {
              pdf.addPage()
              currentY = margin + 10
            }
            pdf.text(stageLine, margin + 5, currentY, { align: 'left', charSpace: 0 })
            currentY += 5
          }

          // Revenir au noir et normal
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(0, 0, 0)
        } else {
          // Texte normal de la réplique : noir
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(0, 0, 0)

          const textLines = this.splitTextManually(pdf, segment.content, maxWidth - 5)

          for (const textLine of textLines) {
            if (currentY + 5 > maxY) {
              pdf.addPage()
              currentY = margin + 10
            }
            pdf.text(textLine, margin + 5, currentY, { align: 'left', charSpace: 0 })
            currentY += 5
          }
        }
      }

      currentY += 3 // Espacement après la réplique
    } else if (line.type === 'stage-direction') {
      // Didascalie hors réplique : italique + gris
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(128, 128, 128) // Gris

      const directionLines = this.splitTextManually(pdf, line.text, maxWidth - 10)

      for (const textLine of directionLines) {
        // Vérifier si on a assez d'espace pour cette ligne
        if (currentY + 5 > maxY) {
          pdf.addPage()
          currentY = margin + 10
        }
        pdf.text(textLine, margin + 5, currentY, { align: 'left', charSpace: 0 })
        currentY += 5
      }

      currentY += 3

      // Revenir au noir
      pdf.setTextColor(0, 0, 0)
    }

    return currentY
  }

  /**
   * Ajoute une note au PDF avec le style sticky note jaune
   */
  private addNote(
    pdf: jsPDF,
    note: Note,
    margin: number,
    yPosition: number,
    fontSize: number
  ): number {
    let currentY = yPosition
    const maxY = this.A4_HEIGHT - margin

    // Dimensions de la note
    const noteMargin = 5
    const noteWidth = this.A4_WIDTH - 2 * margin - 10 // Légèrement réduit pour décalage visuel
    const padding = 3

    // Vérifier si on a assez d'espace pour au moins le début de la note
    const minNoteHeight = 15
    if (currentY + minNoteHeight > maxY) {
      pdf.addPage()
      currentY = margin + 10
    }

    // Fond jaune pastel (sticky note)
    pdf.setFillColor(254, 252, 232) // bg-yellow-50

    // Border jaune
    pdf.setDrawColor(254, 240, 138) // border-yellow-200
    pdf.setLineWidth(0.3)

    // Calculer la hauteur nécessaire pour le contenu
    pdf.setFontSize(fontSize - 1)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(75, 85, 99) // text-gray-600

    const lines = this.splitTextManually(pdf, note.content, noteWidth - 2 * padding)
    const lineHeight = 5
    const noteHeight = Math.max(15, lines.length * lineHeight + 2 * padding + 3)

    // Vérifier si la note entière tient sur la page
    if (currentY + noteHeight > maxY) {
      // Si la note est trop longue, la commencer sur une nouvelle page
      pdf.addPage()
      currentY = margin + 10
    }

    // Dessiner le rectangle avec fond et bordure
    pdf.rect(margin + noteMargin, currentY, noteWidth, noteHeight, 'FD')

    // Ajouter le texte de la note
    let textY = currentY + padding + 5
    for (const line of lines) {
      if (textY + lineHeight > maxY) {
        // Si on dépasse, continuer sur la page suivante
        pdf.addPage()
        currentY = margin + 10
        textY = currentY + padding + 5

        // Redessiner le fond sur la nouvelle page
        pdf.setFillColor(254, 252, 232)
        pdf.setDrawColor(254, 240, 138)
        pdf.rect(margin + noteMargin, currentY, noteWidth, lineHeight + padding, 'FD')
      }

      pdf.text(line, margin + noteMargin + padding, textY, { align: 'left', charSpace: 0 })
      textY += lineHeight
    }

    // Réinitialiser les styles
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.setDrawColor(0, 0, 0)

    // Retourner la position Y après la note avec un petit espacement
    return textY + 3
  }

  /**
   * Convertit une couleur hexadécimale en RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    // Supprimer le # si présent
    hex = hex.replace(/^#/, '')

    // Convertir en RGB
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    return { r, g, b }
  }

  /**
   * Divise le texte manuellement en lignes sans utiliser splitTextToSize
   * pour éviter les problèmes d'espacement
   */
  private splitTextManually(pdf: jsPDF, text: string, maxWidth: number): string[] {
    if (!text || text.trim().length === 0) {
      return []
    }

    const lines: string[] = []
    const trimmedText = text.trim()

    // Si le texte est vide après trim, retourner vide
    if (trimmedText.length === 0) {
      return []
    }

    // Diviser en mots, en préservant les espaces multiples comme un seul
    const words = trimmedText.split(/\s+/)

    if (words.length === 0) {
      return []
    }

    let currentLine = ''

    for (const word of words) {
      // Construire la ligne de test
      const testLine = currentLine ? `${currentLine} ${word}` : word

      // Mesurer la largeur en unités internes de jsPDF
      // Utiliser getTextDimensions pour plus de précision
      const dims = pdf.getTextDimensions(testLine)
      const width = dims.w

      if (width > maxWidth && currentLine) {
        // La ligne de test est trop longue, sauvegarder la ligne courante
        lines.push(currentLine)
        currentLine = word

        // Vérifier si le mot seul est trop long
        const wordDims = pdf.getTextDimensions(word)
        if (wordDims.w > maxWidth) {
          // Le mot est trop long, on le coupe caractère par caractère
          let charLine = ''
          for (const char of word) {
            const testChar = charLine + char
            const charDims = pdf.getTextDimensions(testChar)
            if (charDims.w > maxWidth && charLine) {
              lines.push(charLine)
              charLine = char
            } else {
              charLine = testChar
            }
          }
          currentLine = charLine
        }
      } else {
        currentLine = testLine
      }
    }

    // Ajouter la dernière ligne
    if (currentLine) {
      lines.push(currentLine)
    }

    return lines.length > 0 ? lines : []
  }

  /**
   * Ajoute les numéros de page
   */
  private addPageNumbers(pdf: jsPDF, startPage: number): void {
    const totalPages = pdf.getNumberOfPages()

    for (let i = startPage + 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      const pageNumber = `${i - startPage}`
      const textWidth = pdf.getTextWidth(pageNumber)
      const x = (this.A4_WIDTH - textWidth) / 2
      const y = this.A4_HEIGHT - 10

      pdf.text(pageNumber, x, y, { align: 'left', charSpace: 0 })
    }
  }

  /**
   * Nettoie un nom de fichier pour le rendre sûr
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9_\-\s]/gi, '_')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .substring(0, 50)
  }

  /**
   * Exporte en capturant le rendu HTML (alternative si le rendu direct ne suffit pas)
   * Cette méthode est plus lente mais plus fidèle visuellement
   */
  async exportPlayFromHTML(
    containerElement: HTMLElement,
    playTitle: string,
    options: PDFExportOptions = {}
  ): Promise<void> {
    const { includePageNumbers = true, margin = this.DEFAULT_MARGIN } = options

    // Capturer le contenu HTML en canvas
    const canvas = await html2canvas(containerElement, {
      scale: 2, // Meilleure qualité
      useCORS: true,
      logging: false,
      backgroundColor: options.theme === 'dark' ? '#1a1a1a' : '#ffffff',
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Calculer les dimensions
    const imgWidth = this.A4_WIDTH - 2 * margin
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pageHeight = this.A4_HEIGHT - 2 * margin

    let heightLeft = imgHeight
    let position = margin

    // Ajouter l'image sur plusieurs pages si nécessaire
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Ajouter les numéros de page
    if (includePageNumbers) {
      this.addPageNumbers(pdf, 0)
    }

    // Télécharger
    const filename = this.sanitizeFilename(playTitle)
    pdf.save(`${filename}.pdf`)
  }
}

// Instance singleton
export const pdfExportService = new PDFExportService()
