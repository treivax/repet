/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Configuration de versioning pour l'application et les modèles
 *
 * Ce fichier centralise les versions de l'application et des modèles vocaux.
 * Il est utilisé pour :
 * - Gérer les mises à jour PWA (auto-update)
 * - Invalider les caches de modèles lors de changements
 * - Afficher la version dans l'interface
 *
 * ⚠️ IMPORTANT: Bumper APP_VERSION à chaque déploiement pour forcer la mise à jour PWA
 * ⚠️ IMPORTANT: Bumper MODEL_VERSION lors de changements de modèles vocaux
 */

/**
 * Version de l'application (format semver)
 * À bumper à chaque déploiement pour déclencher l'auto-update PWA
 */
export const APP_VERSION = '1.0.4'

/**
 * Version des modèles vocaux
 * À bumper lorsque les modèles vocaux changent (nouveaux modèles, modifications, etc.)
 * Provoque le rechargement des modèles depuis le réseau en mode online
 */
export const MODEL_VERSION = '1.0.0'

/**
 * Build mode (défini par Vite via define)
 * - 'offline': Modèles dans le build (app.repet.com)
 * - 'online': Modèles téléchargés depuis CDN (ios.repet.com)
 */
export const BUILD_MODE = import.meta.env.VITE_BUILD_MODE as 'offline' | 'online'

/**
 * URL du CDN pour les modèles vocaux (mode online uniquement)
 * Peut être configuré via variable d'environnement
 */
export const MODELS_CDN_URL =
  import.meta.env.VITE_MODELS_CDN_URL || 'https://huggingface.co/rhasspy/piper-voices/resolve/main'

/**
 * Configuration complète de version
 */
export const VERSION_CONFIG = {
  app: APP_VERSION,
  models: MODEL_VERSION,
  buildMode: BUILD_MODE,
  modelsCdnUrl: MODELS_CDN_URL,
  buildDate: new Date().toISOString(),
} as const

/**
 * Clés de stockage local pour le versioning
 */
export const VERSION_STORAGE_KEYS = {
  APP_VERSION: 'repet:app_version',
  MODEL_VERSION: 'repet:model_version',
  LAST_UPDATE_CHECK: 'repet:last_update_check',
} as const

/**
 * Affiche les informations de version dans la console
 */
export function logVersionInfo(): void {
  console.warn('📦 Répét - Version Info')
  console.warn(`App Version: ${VERSION_CONFIG.app}`)
  console.warn(`Model Version: ${VERSION_CONFIG.models}`)
  console.warn(`Build Mode: ${VERSION_CONFIG.buildMode}`)
  if (VERSION_CONFIG.buildMode === 'online') {
    console.warn(`Models CDN: ${VERSION_CONFIG.modelsCdnUrl}`)
  }
  console.warn(`Build Date: ${VERSION_CONFIG.buildDate}`)
  console.warn('─'.repeat(50))
}

/**
 * Vérifie si les modèles doivent être rechargés
 * @returns true si la version des modèles a changé
 */
export function shouldReloadModels(): boolean {
  const storedVersion = localStorage.getItem(VERSION_STORAGE_KEYS.MODEL_VERSION)

  if (!storedVersion) {
    // Première visite
    localStorage.setItem(VERSION_STORAGE_KEYS.MODEL_VERSION, MODEL_VERSION)
    return true
  }

  if (storedVersion !== MODEL_VERSION) {
    // Version changée
    console.warn(`🔄 Model version changed: ${storedVersion} → ${MODEL_VERSION}`)
    localStorage.setItem(VERSION_STORAGE_KEYS.MODEL_VERSION, MODEL_VERSION)
    return true
  }

  return false
}

/**
 * Vérifie si l'application a été mise à jour
 * @returns true si la version de l'app a changé
 */
export function isAppUpdated(): boolean {
  const storedVersion = localStorage.getItem(VERSION_STORAGE_KEYS.APP_VERSION)

  if (!storedVersion) {
    // Première visite
    localStorage.setItem(VERSION_STORAGE_KEYS.APP_VERSION, APP_VERSION)
    return false
  }

  if (storedVersion !== APP_VERSION) {
    // Version changée
    console.warn(`🔄 App version updated: ${storedVersion} → ${APP_VERSION}`)
    localStorage.setItem(VERSION_STORAGE_KEYS.APP_VERSION, APP_VERSION)
    return true
  }

  return false
}
