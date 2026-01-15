/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Configuration ONNX Runtime
 *
 * Ce fichier DOIT être importé AVANT tout import d'onnxruntime-web
 * pour que la configuration soit prise en compte.
 *
 * Il configure les chemins des fichiers WASM locaux pour éviter
 * les tentatives de chargement depuis CDN externe.
 */

// Configuration globale ONNX Runtime
// Note: Ceci doit être fait AVANT le premier import d'onnxruntime-web

// Définir la configuration globale avant que le module ne soit chargé
if (typeof window !== 'undefined') {
  // @ts-expect-error - Configuration globale avant import
  window.ort = window.ort || {}
  // @ts-expect-error - Configuration globale avant import
  window.ort.env = window.ort.env || {}
  // @ts-expect-error - Configuration globale avant import
  window.ort.env.wasm = window.ort.env.wasm || {}

  // Chemins WASM locaux avec URL ABSOLUE (CRITIQUE: doit être configuré avant l'import d'ort)
  // ONNX Runtime nécessite une URL absolue, pas juste un chemin relatif
  const wasmBaseUrl = `${window.location.origin}/wasm/`
  // @ts-expect-error - Configuration globale avant import
  window.ort.env.wasm.wasmPaths = wasmBaseUrl

  // Proxy désactivé pour compatibilité
  // @ts-expect-error - Configuration globale avant import
  window.ort.env.wasm.proxy = false

  // SIMD activé par défaut
  // @ts-expect-error - Configuration globale avant import
  window.ort.env.wasm.simd = true

  console.warn('[ONNX Config] ⚙️ Configuration pré-import appliquée')
  console.warn(`[ONNX Config]    - wasmPaths: ${wasmBaseUrl} (URL absolue)`)
  console.warn('[ONNX Config]    - proxy: false')
  console.warn('[ONNX Config]    - simd: true')
}

export {}
