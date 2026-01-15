/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import fs from 'fs'

// Lire la version depuis package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
const APP_VERSION = packageJson.version

/**
 * Configuration Vite pour le build ONLINE
 *
 * Ce build est LÉGER et télécharge les assets (voix + WASM si nécessaire) à la demande.
 * Cible: iOS/Safari/macOS (compatible avec les limites strictes de stockage iOS ~50 MB).
 *
 * Taille totale: ~5-10 MB
 * - Application: ~5-10 MB
 * - Voix: téléchargées depuis CDN au runtime
 * - WASM: embarqué (si compatible) ou téléchargé
 *
 * Déploiement: ios.repet.com (ou app.repet.com/ios)
 */
export default defineConfig({
  // ❌ Désactiver la copie automatique de public/ pour exclure les voix
  publicDir: false,

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.debug'],
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-state': ['zustand'],
          // TTS runtime (lazy loaded)
          'tts-runtime': ['onnxruntime-web'],
        },
      },
    },
  },
  plugins: [
    react(),
    visualizer({
      filename: './dist-online/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    viteStaticCopy({
      targets: [
        // ✅ OPTIMISÉ : Ne copier QUE les fichiers WASM nécessaires (30 MB au lieu de 106 MB)
        // ONNX Runtime - fichier WASM principal (configuré en single-thread pour iOS)
        {
          src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm',
          dest: 'wasm',
        },
        {
          src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs',
          dest: 'wasm',
        },
        // Fichiers WASM de Piper (phonemize)
        {
          src: 'public/wasm/piper_phonemize.wasm',
          dest: 'wasm',
        },
        {
          src: 'public/wasm/piper_phonemize.data',
          dest: 'wasm',
        },
        {
          src: 'public/wasm/piper_phonemize.js',
          dest: 'wasm',
        },
        // ✅ Copier manuellement les assets nécessaires depuis public/
        {
          src: 'public/icons/**/*',
          dest: 'icons',
        },
        {
          src: 'public/vite.svg',
          dest: '.',
        },
        // ✅ Headers pour COOP/COEP (nécessaire pour WASM avec SharedArrayBuffer)
        {
          src: 'public-online/_headers',
          dest: '.',
        },
        {
          src: 'public-online/.htaccess',
          dest: '.',
        },
        // ❌ Modèles de voix Piper (EXCLUS - seront téléchargés depuis CDN)
        // Les voix ne sont PAS copiées dans le build online
      ],
    }),
    VitePWA({
      registerType: 'prompt',
      // Inclure la version dans le nom du fichier SW pour forcer la mise à jour
      injectRegister: 'auto',
      manifest: {
        name: 'Répét - Répétition Théâtre (Online)',
        short_name: 'Répét Online',
        description:
          'Application de répétition de théâtre en italiennes (Mode Online - Compatible iOS)',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        orientation: 'any',
        categories: ['entertainment', 'education'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      // Stratégie de mise à jour
      workbox: {
        // Nettoyer les anciens caches lors de l'activation
        cleanupOutdatedCaches: true,
        // Cache minimal pour iOS - EXCLURE les gros fichiers WASM
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        // Exclure TOUS les fichiers du dossier wasm du precache (trop gros pour iOS)
        globIgnores: [
          '**/voices/**/*', // Modèles vocaux (téléchargés à la demande)
          '**/wasm/**/*', // TOUS les fichiers WASM (chargés à la demande via runtime caching)
        ],
        // Limite stricte pour respecter les contraintes iOS
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB (strict pour iOS)
        runtimeCaching: [
          {
            // Cache les fonts Google
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache les fichiers WASM locaux (chargés à la demande, pas en precache)
            urlPattern: /\/wasm\/.*\.(wasm|data|mjs)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: `wasm-runtime-cache-v${APP_VERSION}`,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year (fichiers immuables)
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache les fichiers voix depuis HuggingFace (stratégie NetworkFirst pour toujours avoir la dernière version)
            urlPattern: /^https:\/\/huggingface\.co\/rhasspy\/piper-voices\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: `voice-models-cache-v${APP_VERSION}`,
              networkTimeoutSeconds: 30,
              expiration: {
                maxEntries: 5, // Maximum 5 voix en cache (environ 300-400 MB)
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
                purgeOnQuotaError: true, // Purger automatiquement si quota dépassé
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
  cacheDir: 'node_modules/.vite',
  define: {
    // Variable d'environnement pour identifier le build
    'import.meta.env.VITE_BUILD_MODE': JSON.stringify('online'),
    // Version de l'application
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(APP_VERSION),
  },
})
