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
 * Configuration Vite pour le build OFFLINE
 *
 * Ce build embarque TOUS les assets (voix + WASM) pour fonctionner 100% hors ligne.
 * Cible: Desktop (Chrome, Firefox, Edge, Safari) et Android moderne.
 *
 * Taille totale: ~675 MB
 * - Voix: ~268 MB (modèles .onnx)
 * - WASM: ~116 MB (ONNX Runtime + Piper)
 * - Application: ~5-10 MB
 *
 * Déploiement: app.repet.com
 */
export default defineConfig({
  // Exclure public/voices de la copie automatique (sera géré par viteStaticCopy)
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
      filename: './dist-offline/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    viteStaticCopy({
      targets: [
        // ✅ OPTIMISÉ : Ne copier QUE les fichiers WASM nécessaires (36 MB au lieu de 116 MB)
        // ONNX Runtime - fichier WASM principal (multi-threaded avec SIMD)
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
        // ✅ Fichiers publics nécessaires (icons, manifests, etc.)
        {
          src: 'public/icons/**/*',
          dest: 'icons',
        },
        {
          src: 'public/vite.svg',
          dest: '',
        },
        {
          src: 'public/test-play.txt',
          dest: '',
        },
        // ✅ Modèles de voix Piper (INCLUS pour offline)
        // Copier uniquement les dossiers de modèles (pas les fichiers à la racine)
        {
          src: 'public/voices/fr_FR-siwis-medium/**/*',
          dest: 'voices/fr_FR-siwis-medium',
        },
        {
          src: 'public/voices/fr_FR-tom-medium/**/*',
          dest: 'voices/fr_FR-tom-medium',
        },
        {
          src: 'public/voices/fr_FR-upmc-medium/**/*',
          dest: 'voices/fr_FR-upmc-medium',
        },
        // Fichiers à la racine de voices (manifest, etc.)
        {
          src: 'public/voices/manifest.json',
          dest: 'voices',
        },
        {
          src: 'public/voices/.gitkeep',
          dest: 'voices',
        },
      ],
    }),
    VitePWA({
      registerType: 'prompt',
      // Inclure la version dans le nom du fichier SW pour forcer la mise à jour
      injectRegister: 'auto',
      manifest: {
        name: 'Répét - Répétition Théâtre',
        short_name: 'Répét',
        description: 'Application de répétition de théâtre en italiennes (Mode Offline)',
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,mjs}'],
        // Exclure les très gros fichiers du precache (seront chargés à la demande)
        globIgnores: [
          '**/voices/**/*.onnx', // Modèles vocaux (~60-76 MB chacun)
          '**/wasm/ort-wasm-simd-threaded*.wasm', // WASM threadé volumineux
        ],
        maximumFileSizeToCacheInBytes: 100 * 1024 * 1024, // 100 MB
        // Runtime caching strategies
        runtimeCaching: [
          {
            // Cache Google Fonts
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
            // Cache les fichiers WASM locaux (chargés à la demande)
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
            // Cache des modèles vocaux (Network First pour toujours avoir la dernière version)
            urlPattern: /.*\/voices\/.*\.(onnx|json)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: `voice-models-cache-v${APP_VERSION}`,
              networkTimeoutSeconds: 30,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
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
    'import.meta.env.VITE_BUILD_MODE': JSON.stringify('offline'),
    // Version de l'application
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(APP_VERSION),
  },
})
