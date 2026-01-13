/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { viteStaticCopy } from 'vite-plugin-static-copy'

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

  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        // Fichiers WASM de ONNX Runtime
        {
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: 'wasm',
        },
        {
          src: 'node_modules/onnxruntime-web/dist/*.mjs',
          dest: 'wasm',
        },
        {
          src: 'node_modules/onnxruntime-web/dist/*.js',
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
        // ✅ Copier manuellement les assets nécessaires depuis public/
        {
          src: 'public/icons/**/*',
          dest: 'icons',
        },
        {
          src: 'public/vite.svg',
          dest: '.',
        },
        // ❌ Modèles de voix Piper (EXCLUS - seront téléchargés depuis CDN)
        // Les voix ne sont PAS copiées dans le build online
      ],
    }),
    VitePWA({
      registerType: 'prompt',
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
      workbox: {
        // Cache minimal pour iOS
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,mjs}'],
        // Pas de gros fichiers à mettre en cache
        globIgnores: ['**/voices/**/*', '**/wasm/ort-wasm-simd-threaded*.wasm'],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50 MB (limite iOS)
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
            // Cache les fichiers voix depuis le CDN (stratégie CacheFirst avec LRU)
            urlPattern: /^https:\/\/cdn\.repet\.com\/voices\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'voice-models-cache',
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
  define: {
    // Variable d'environnement pour identifier le build
    'import.meta.env.VITE_BUILD_MODE': JSON.stringify('online'),
  },
  build: {
    // Optimisations pour réduire la taille du build
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer les console.log en production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // Code splitting agressif pour charger uniquement ce qui est nécessaire
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          tts: ['@mintplex-labs/piper-tts-web', 'onnxruntime-web'],
          storage: ['dexie', 'dexie-react-hooks'],
        },
      },
    },
  },
})
