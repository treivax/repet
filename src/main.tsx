/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'
import { initializeDatabase } from './core/storage'
import { ttsEngine } from './core/tts'
import { installNetworkInterceptor } from './core/tts/offline/NetworkInterceptor'
import { exposeCleanerToWindow, exposePiperDebugToWindow } from './core/tts/offline/CacheCleaner'
import { ttsProviderManager } from './core/tts/providers/TTSProviderManager'

// Installer l'intercepteur réseau AVANT toute autre initialisation
// pour garantir le mode 100% offline
console.warn("[Main] 🔒 Installation de l'intercepteur réseau pour mode offline complet")
installNetworkInterceptor()

// Exposer les fonctions de nettoyage de cache pour faciliter le debug
exposeCleanerToWindow()

// Fonction d'initialisation asynchrone
async function initializeApp() {
  try {
    console.warn('[Main] 🚀 Initialisation de la base de données et du moteur TTS...')

    // Initialiser la base de données et le TTS
    await Promise.all([initializeDatabase(), ttsEngine.initialize()])

    console.warn('[Main] ✅ Base de données et TTS initialisés')

    // Exposer les utilitaires de debug Piper
    const piperProvider = ttsProviderManager.getActiveProvider()
    if (piperProvider && piperProvider.type === 'piper-wasm') {
      exposePiperDebugToWindow(piperProvider)
    }

    console.warn('[Main] ✅ Application prête à démarrer')

    // Rendre l'application React APRÈS l'initialisation complète
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  } catch (error) {
    console.error("[Main] ❌ Erreur fatale lors de l'initialisation:", error)

    // Afficher un message d'erreur dans le DOM
    const root = document.getElementById('root')
    if (root) {
      root.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <div style="
            background: rgba(254, 202, 202, 0.1);
            border: 2px solid #fc8181;
            border-radius: 12px;
            padding: 2rem;
            max-width: 500px;
            margin: 1rem;
          ">
            <h2 style="color: #feb2b2; font-size: 1.5rem; margin-bottom: 1rem;">
              ⚠️ Erreur d'initialisation
            </h2>
            <p style="color: #fbd5d5; margin-bottom: 1.5rem;">
              ${error instanceof Error ? error.message : 'Erreur inconnue'}
            </p>
            <button
              onclick="window.location.reload()"
              style="
                background: #e53e3e;
                color: white;
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 6px;
                font-size: 1rem;
                cursor: pointer;
                transition: background 0.2s;
              "
              onmouseover="this.style.background='#c53030'"
              onmouseout="this.style.background='#e53e3e'"
            >
              Recharger la page
            </button>
          </div>
        </div>
      `
    }
  }
}

// Démarrer l'initialisation
initializeApp()
