/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Réinitialiser l'état de la bannière (pour les tests ou paramètres)
 */
export function resetOnlineModeBanner() {
  localStorage.removeItem('online-mode-banner-dismissed')
}
