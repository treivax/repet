/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Network Interceptor pour mode offline complet
 * Intercepte les requêtes fetch vers CDN et les redirige vers fichiers locaux
 */

interface URLMapping {
  pattern: RegExp
  localPath: (url: string) => string | null
}

/**
 * Mappings des URLs externes vers chemins locaux
 */
const URL_MAPPINGS: URLMapping[] = [
  // HuggingFace - Modèles vocaux Piper
  // Pattern: https://huggingface.co/diffusionstudio/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx
  // Devient: /models/piper/fr_FR-siwis-medium.onnx
  {
    pattern:
      /https:\/\/huggingface\.co\/diffusionstudio\/piper-voices\/resolve\/main\/.+\/([^/]+\.(onnx|json))$/,
    localPath: (url: string) => {
      const match = url.match(
        /https:\/\/huggingface\.co\/diffusionstudio\/piper-voices\/resolve\/main\/.+\/([^/]+\.(onnx|json))$/
      )
      if (match) {
        const fileName = match[1]
        // Les modèles sont dans /models/piper/
        // On extrait juste le nom de fichier final (ex: fr_FR-siwis-medium.onnx)
        return `/models/piper/${fileName}`
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
        // Les fichiers WASM ONNX sont dans /wasm/
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
        // Les fichiers piper_phonemize sont dans /wasm/
        return `/wasm/piper_phonemize${suffix}`
      }
      return null
    },
  },
]

/**
 * Fonction pour intercepter une URL et la rediriger si nécessaire
 */
export function interceptURL(url: string): string {
  for (const mapping of URL_MAPPINGS) {
    if (mapping.pattern.test(url)) {
      const localPath = mapping.localPath(url)
      if (localPath) {
        console.warn(`[NetworkInterceptor] 🔀 Redirection: ${url} → ${localPath}`)
        return localPath
      }
    }
  }

  // Si pas de mapping trouvé, retourner l'URL originale
  // (mais logger un avertissement si c'est une URL externe)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.warn(`[NetworkInterceptor] ⚠️ Requête externe non mappée: ${url}`)
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

    // Intercepter et rediriger si nécessaire
    const interceptedURL = interceptURL(url)

    // Si l'URL a été redirigée, utiliser la nouvelle URL
    if (interceptedURL !== url) {
      return originalFetch(interceptedURL, init)
    }

    // Sinon, utiliser fetch normal
    return originalFetch(input, init)
  }

  console.warn('[NetworkInterceptor] ✅ Intercepteur réseau installé')
}

/**
 * Désinstaller l'intercepteur (pour les tests)
 */
export function uninstallNetworkInterceptor(): void {
  // Note: on ne peut pas vraiment restaurer fetch car on n'a pas gardé de référence
  // à l'original de manière globale. Cette fonction est principalement pour la documentation.
  console.warn(
    '[NetworkInterceptor] ⚠️ Désinstallation non implémentée (redémarrer la page pour réinitialiser)'
  )
}

/**
 * Vérifier si une URL serait interceptée
 */
export function wouldIntercept(url: string): boolean {
  return URL_MAPPINGS.some((mapping) => mapping.pattern.test(url))
}

/**
 * Liste toutes les URLs qui seraient interceptées
 */
export function listInterceptedPatterns(): string[] {
  return URL_MAPPINGS.map((mapping) => mapping.pattern.source)
}
