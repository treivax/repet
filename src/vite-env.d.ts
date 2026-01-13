/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_MODE: 'offline' | 'online'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
