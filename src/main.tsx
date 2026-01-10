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

// Initialiser la base de données et le TTS
Promise.all([initializeDatabase(), ttsEngine.initialize()])
  .then(() => {
    // Application initialisée avec succès
  })
  .catch((error) => {
    console.error("Erreur fatale lors de l'initialisation:", error)
  })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
