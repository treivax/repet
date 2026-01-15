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
      fontSize = this.DEFAULT_FONT_SIZE,
      margin = this.DEFAULT_MARGIN,
    } = options

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

      this.addActContent(pdf, act, charactersMap, margin, fontSize)
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
      pdf.text(line, centerX - textWidth / 2, titleY + index * 10)
    })

    // Auteur (sous le titre)
    if (author) {
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'normal')
      const authorY = titleY + titleLines.length * 10 + 20
      const authorWidth = pdf.getTextWidth(author)
      pdf.text(author, centerX - authorWidth / 2, authorY)
    }

    // Pied de page (application)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'italic')
    const footerText = 'Généré avec Répét'
    const footerWidth = pdf.getTextWidth(footerText)
    pdf.text(footerText, centerX - footerWidth / 2, pageHeight - margin)
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
    pdf.text('Distribution des rôles', margin, yPosition)
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
          pdf.text(line, margin, yPosition)
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
        pdf.text(presentation.characterName, margin + 5, yPosition)
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
            pdf.text(line, margin + 10, yPosition)
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
    fontSize: number
  ): void {
    let yPosition = margin + 10

    // Titre de l'acte
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0) // Reset to black
    const actTitle = `Acte ${act.actNumber}${act.title ? ' : ' + act.title : ''}`
    pdf.text(actTitle, margin, yPosition)
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
      pdf.text(sceneTitle, margin, yPosition)
      yPosition += 10

      // Parcourir les lignes
      for (const line of scene.lines) {
        // Vérifier l'espace disponible avant d'ajouter la ligne
        yPosition = this.addLine(pdf, line, charactersMap, margin, yPosition, fontSize)
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
      pdf.setTextColor(rgb.r, rgb.g, rgb.b)

      // Vérifier si on a assez d'espace pour le nom
      if (currentY + 6 > maxY) {
        pdf.addPage()
        currentY = margin + 10
      }

      pdf.text(characterName, margin, currentY)
      currentY += 6

      // Parser le texte pour extraire les didascalies
      const segments = parseTextWithStageDirections(line.text)

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
            pdf.text(stageLine, margin + 5, currentY)
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
            pdf.text(textLine, margin + 5, currentY)
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
        pdf.text(textLine, margin + 5, currentY)
        currentY += 5
      }

      currentY += 3

      // Revenir au noir
      pdf.setTextColor(0, 0, 0)
    }

    return currentY
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
    const lines: string[] = []
    const words = text.split(/\s+/)
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const textWidth = pdf.getTextWidth(testLine)

      if (textWidth > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines.length > 0 ? lines : [text]
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

      pdf.text(pageNumber, x, y)
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
