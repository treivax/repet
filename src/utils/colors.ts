/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Génération de couleurs espacées pour les personnages
 * Utilise le golden ratio pour maximiser la différence visuelle entre couleurs
 *
 * Algorithm based on:
 * https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
 * Golden ratio conjugate for optimal color distribution in HSL space
 */
const GOLDEN_RATIO_CONJUGATE = 0.618033988749895

/**
 * Convertit une couleur HSL en hexadécimal
 *
 * @param h - Teinte (0-360)
 * @param s - Saturation (0-100)
 * @param l - Luminosité (0-100)
 * @returns Couleur hexadécimale
 */
function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100
  const lNorm = l / 100
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lNorm - c / 2
  let r = 0,
    g = 0,
    b = 0
  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }
  const toHex = (val: number) => {
    const hex = Math.round((val + m) * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return '#' + toHex(r) + toHex(g) + toHex(b)
}

/**
 * Génère une couleur unique et déterministe pour un personnage
 * Utilise le golden ratio pour espacer les teintes de manière optimale
 *
 * @param name - Nom du personnage
 * @returns Couleur hexadécimale
 *
 * @example
 * generateCharacterColor('HAMLET') // toujours la même couleur pour HAMLET
 */
export function generateCharacterColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  }
  const normalizedHash = Math.abs(hash) / 2147483647
  let hue = (normalizedHash * 360) % 360
  hue = (hue + hash * GOLDEN_RATIO_CONJUGATE * 360) % 360
  return hslToHex(hue, 70, 55)
}

/**
 * Génère une palette de N couleurs maximalement espacées
 *
 * @param count - Nombre de couleurs à générer
 * @returns Tableau de couleurs hexadécimales
 */
export function generateColorPalette(count: number): string[] {
  const colors: string[] = []
  let hue = 0
  for (let i = 0; i < count; i++) {
    colors.push(hslToHex(hue, 70, 55))
    hue = (hue + GOLDEN_RATIO_CONJUGATE * 360) % 360
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
  const hue = (index * GOLDEN_RATIO_CONJUGATE * 360) % 360
  return hslToHex(hue, 70, 55)
}
