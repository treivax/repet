/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Network Interceptor pour modes offline et online
 *
 * Mode OFFLINE (default):
 * - Intercepte les requêtes fetch vers CDN et les redirige vers fichiers locaux
 * - Tous les assets (voix + WASM) sont embarqués dans le build
 *
 * Mode ONLINE:
 * - Laisse passer les requêtes réseau pour télécharger les voix depuis CDN
 * - Cache les voix téléchargées dans IndexedDB (avec stratégie LRU)
 */

interface URLMapping {
  pattern: RegExp
  localPath: (url: string) => string | null
}

/**
 * Mode de build de l'application
 */
export type BuildMode = 'offline' | 'online'

/**
 * Détecte le mode de build à partir des variables d'environnement
 */
export function getBuildMode(): BuildMode {
  return (import.meta.env.VITE_BUILD_MODE as BuildMode) || 'offline'
}

/**
 * Mappings des URLs externes vers chemins locaux (mode offline uniquement)
 */
const URL_MAPPINGS: URLMapping[] = [
  // HuggingFace - Modèles vocaux Piper
  // Pattern: https://huggingface.co/diffusionstudio/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx
  // Devient: /voices/fr_FR-siwis-medium/fr_FR-siwis-medium.onnx
  {
    pattern:
      /https:\/\/huggingface\.co\/diffusionstudio\/piper-voices\/resolve\/main\/.+\/([^/]+)\.(onnx|json)$/,
    localPath: (url: string) => {
      const match = url.match(
        /https:\/\/huggingface\.co\/diffusionstudio\/piper-voices\/resolve\/main\/.+\/([^/]+)\.(onnx|json)$/
      )
      if (match) {
        const baseName = match[1] // e.g., "fr_FR-siwis-medium"
        const extension = match[2] // e.g., "onnx" or "json"
        return `/voices/${baseName}/${baseName}.${extension}`
      }
      return null
    },
  },

  // Cloudflare CDN - ONNX Runtime WASM
  {
    pattern: /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/onnxruntime-web\/[\d.]+\/(.+)/,
    localPath: (url: string) => {
      const match = url.match(
        /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/onnxruntime-web\/[\d.]+\/(.+)/
      )
      if (match) {
        const fileName = match[1]
        return `/wasm/${fileName}`
      }
      return null
    },
  },

  // JSDelivr CDN - Piper WASM phonemizer
  {
    pattern:
      /https:\/\/cdn\.jsdelivr\.net\/npm\/@diffusionstudio\/piper-wasm@[\d.]+\/build\/piper_phonemize(.+)/,
    localPath: (url: string) => {
      const match = url.match(
        /https:\/\/cdn\.jsdelivr\.net\/npm\/@diffusionstudio\/piper-wasm@[\d.]+\/build\/piper_phonemize(.+)/
      )
      if (match) {
        const suffix = match[1]
        return `/wasm/piper_phonemize${suffix}`
      }
      return null
    },
  },

  // CDN Répét - Modèles vocaux (pour mode online)
  // Pattern: https://cdn.repet.com/voices/fr_FR-siwis-medium.onnx
  // En mode offline: redirige vers /voices/fr_FR-siwis-medium.onnx
  {
    pattern: /https:\/\/cdn\.repet\.com\/voices\/(.+)/,
    localPath: (url: string) => {
      const match = url.match(/https:\/\/cdn\.repet\.com\/voices\/(.+)/)
      if (match) {
        const fileName = match[1]
        return `/voices/${fileName}`
      }
      return null
    },
  },
]

/**
 * Fonction pour intercepter une URL et la rediriger si nécessaire (mode offline)
 */
export function interceptURL(url: string, mode: BuildMode = getBuildMode()): string {
  // En mode online, ne pas intercepter les URLs (laisser passer les requêtes réseau)
  if (mode === 'online') {
    return url
  }

  // Mode offline: intercepter et rediriger vers fichiers locaux
  for (const mapping of URL_MAPPINGS) {
    if (mapping.pattern.test(url)) {
      const localPath = mapping.localPath(url)
      if (localPath) {
        console.warn(`[NetworkInterceptor] 🔀 Redirection (offline): ${url} → ${localPath}`)
        return localPath
      }
    }
  }

  // Si pas de mapping trouvé, retourner l'URL originale
  // (mais logger un avertissement si c'est une URL externe en mode offline)
  if (mode === 'offline' && (url.startsWith('http://') || url.startsWith('https://'))) {
    console.warn(`[NetworkInterceptor] ⚠️ Requête externe non mappée (offline): ${url}`)
  }

  return url
}

/**
 * Patch la fonction fetch globale pour intercepter les requêtes
 */
export function installNetworkInterceptor(): void {
  if (typeof window === 'undefined') {
    console.warn('[NetworkInterceptor] Non disponible en dehors du navigateur')
    return
  }

  const mode = getBuildMode()

  // Sauvegarder la fonction fetch originale
  const originalFetch = window.fetch

  // Remplacer fetch par notre version interceptée
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url: string

    // Extraire l'URL de différents types d'input
    if (typeof input === 'string') {
      url = input
    } else if (input instanceof URL) {
      url = input.href
    } else if (input instanceof Request) {
      url = input.url
    } else {
      url = String(input)
    }

    // Intercepter et rediriger si nécessaire (selon le mode)
    const interceptedURL = interceptURL(url, mode)

    // Si l'URL a été redirigée, utiliser la nouvelle URL
    if (interceptedURL !== url) {
      return originalFetch(interceptedURL, init)
    }

    // Sinon, utiliser fetch normal
    return originalFetch(input, init)
  }

  console.warn(`[NetworkInterceptor] ✅ Intercepteur réseau installé (mode: ${mode})`)
}

/**
 * Désinstaller l'intercepteur (pour les tests)
 */
export function uninstallNetworkInterceptor(): void {
  console.warn(
    '[NetworkInterceptor] ⚠️ Désinstallation non implémentée (redémarrer la page pour réinitialiser)'
  )
}

/**
 * Vérifier si une URL serait interceptée
 */
export function wouldIntercept(url: string, mode: BuildMode = getBuildMode()): boolean {
  if (mode === 'online') {
    return false
  }
  return URL_MAPPINGS.some((mapping) => mapping.pattern.test(url))
}

/**
 * Liste toutes les URLs qui seraient interceptées
 */
export function listInterceptedPatterns(): string[] {
  return URL_MAPPINGS.map((mapping) => mapping.pattern.source)
}

/**
 * Convertir une URL HuggingFace vers l'URL CDN Répét (pour mode online)
 *
 * Exemple:
 * https://huggingface.co/diffusionstudio/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx
 * → https://cdn.repet.com/voices/fr_FR-siwis-medium.onnx
 */
export function convertToRepetCDN(huggingFaceUrl: string): string {
  const match = huggingFaceUrl.match(
    /https:\/\/huggingface\.co\/diffusionstudio\/piper-voices\/resolve\/main\/.+\/([^/]+\.(onnx|json))$/
  )

  if (match) {
    const fileName = match[1]
    // TODO: Remplacer par l'URL réelle du CDN lors du déploiement
    return `https://cdn.repet.com/voices/${fileName}`
  }

  return huggingFaceUrl
}

/**
 * Extraire le nom du fichier depuis une URL
 */
export function extractFileName(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const parts = pathname.split('/')
    return parts[parts.length - 1] || null
  } catch {
    return null
  }
}
