/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Génération de couleurs espacées pour les personnages
 * Utilise l'ordre alphabétique et une palette maximalement contrastée
 * pour éviter les confusions visuelles
 */

/**
 * Palette de couleurs prédéfinies, ordonnées pour maximiser les différences
 * entre les premières couleurs (les plus utilisées).
 *
 * Les couleurs sont choisies pour être :
 * - Visuellement très distinctes les unes des autres
 * - Bien lisibles en mode clair et sombre
 * - Espacées dans le spectre pour éviter les confusions
 */
const COLOR_PALETTE = [
  '#DC2626', // 0: Rouge vif
  '#2563EB', // 1: Bleu roi
  '#059669', // 2: Vert émeraude
  '#EA580C', // 3: Orange vif
  '#7C3AED', // 4: Violet profond
  '#CA8A04', // 5: Jaune doré
  '#DB2777', // 6: Rose/Magenta vif
  '#0891B2', // 7: Teal/Cyan foncé
  '#65A30D', // 8: Lime/Vert olive
  '#C026D3', // 9: Fuchsia
  '#0284C7', // 10: Bleu ciel
  '#15803D', // 11: Vert forêt
  '#D97706', // 12: Ambre
  '#9333EA', // 13: Violet pourpre
  '#BE185D', // 14: Rose foncé
  '#0D9488', // 15: Turquoise
  '#16A34A', // 16: Vert prairie
  '#4F46E5', // 17: Indigo
  '#F59E0B', // 18: Orange ambre
  '#8B5CF6', // 19: Violet moyen
]

/**
 * Génère une couleur unique pour un personnage basée sur l'ordre alphabétique
 *
 * @param characterName - Nom du personnage
 * @param allCharacterNames - Liste de tous les noms de personnages (optionnel pour compatibilité)
 * @returns Couleur hexadécimale
 *
 * @example
 * // Avec liste complète (recommandé)
 * generateCharacterColor('Hamlet', ['Claudius', 'Gertrude', 'Hamlet', 'Ophélie'])
 * // Hamlet est 3ème alphabétiquement -> couleur index 2
 *
 * @example
 * // Sans liste (fallback sur première lettre)
 * generateCharacterColor('Hamlet') // Basé sur 'H'
 */
export function generateCharacterColor(
  characterName: string,
  allCharacterNames?: string[]
): string {
  if (allCharacterNames && allCharacterNames.length > 0) {
    // Trier alphabétiquement et trouver l'index
    const sortedNames = [...allCharacterNames].sort((a, b) =>
      a.localeCompare(b, 'fr', { sensitivity: 'base' })
    )
    const index = sortedNames.indexOf(characterName)
    if (index >= 0) {
      return COLOR_PALETTE[index % COLOR_PALETTE.length]
    }
  }

  // Fallback : utiliser la première lettre pour un index pseudo-alphabétique
  const firstChar = characterName.charAt(0).toUpperCase()
  const charCode = firstChar.charCodeAt(0)
  // A=65, Z=90 -> mapper sur 0-19
  let index = 0
  if (charCode >= 65 && charCode <= 90) {
    // Mapper A-Z sur 0-19 de façon espacée
    index = Math.floor(((charCode - 65) / 26) * COLOR_PALETTE.length)
  } else {
    // Pour les caractères non-ASCII, utiliser un hash simple
    let hash = 0
    for (let i = 0; i < characterName.length; i++) {
      hash = (hash << 5) - hash + characterName.charCodeAt(i)
      hash = hash & hash
    }
    index = Math.abs(hash) % COLOR_PALETTE.length
  }

  return COLOR_PALETTE[index]
}

/**
 * Génère un mapping complet de tous les personnages vers leurs couleurs
 * basé sur l'ordre alphabétique
 *
 * @param characterNames - Liste de tous les noms de personnages
 * @returns Map de nom -> couleur
 *
 * @example
 * const colors = generateCharacterColorMap(['Hamlet', 'Ophélie', 'Claudius'])
 * // { 'Claudius': '#DC2626', 'Hamlet': '#2563EB', 'Ophélie': '#059669' }
 */
export function generateCharacterColorMap(characterNames: string[]): Record<string, string> {
  const sortedNames = [...characterNames].sort((a, b) =>
    a.localeCompare(b, 'fr', { sensitivity: 'base' })
  )

  const colorMap: Record<string, string> = {}
  sortedNames.forEach((name, index) => {
    colorMap[name] = COLOR_PALETTE[index % COLOR_PALETTE.length]
  })

  return colorMap
}

/**
 * Génère une palette de N couleurs maximalement espacées
 *
 * @param count - Nombre de couleurs à générer
 * @returns Tableau de couleurs hexadécimales
 */
export function generateColorPalette(count: number): string[] {
  const colors: string[] = []
  for (let i = 0; i < Math.min(count, COLOR_PALETTE.length); i++) {
    colors.push(COLOR_PALETTE[i])
  }
  // Si on demande plus de couleurs que la palette, on recommence
  for (let i = COLOR_PALETTE.length; i < count; i++) {
    colors.push(COLOR_PALETTE[i % COLOR_PALETTE.length])
  }
  return colors
}

/**
 * Génère une couleur pour un index donné (pour attribution séquentielle)
 *
 * @param index - Index du personnage
 * @returns Couleur hexadécimale
 */
export function getColorByIndex(index: number): string {
  return COLOR_PALETTE[index % COLOR_PALETTE.length]
}
