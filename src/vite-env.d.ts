/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_MODE: 'offline' | 'online'
  readonly VITE_APP_VERSION?: string
  readonly VITE_MODELS_CDN_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
