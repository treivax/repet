/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useEffect, useState } from 'react'
import './styles/globals.css'
import { Router } from './router'
import { Toast } from './components/common/Toast'
import { HelpScreen } from './screens/HelpScreen'
import { useUIStore } from './state/uiStore'
import { InitializationModal } from './components/voice-preloader'
import { UpdateManager } from './core/pwa/UpdateManager'
import { logVersionInfo, APP_VERSION } from './config/version'

/**
 * Extension de l'interface Window pour inclure les fonctions debug
 */
declare global {
  interface Window {
    forceReloadVoices: () => void
  }
}

/**
 * Clés localStorage pour la persistence du chargement des voix
 *
 * Le chargement des voix est persisté pour éviter de recharger à chaque démarrage.
 * Les voix sont rechargées uniquement si :
 * - C'est la première visite
 * - La version de l'app a changé (APP_VERSION différent)
 * - L'utilisateur force le rechargement (window.forceReloadVoices())
 */
const VOICES_LOADED_KEY = 'repet:voices_loaded'
const VOICES_VERSION_KEY = 'repet:voices_version'

function App() {
  const { setTheme } = useUIStore()

  /**
   * Détermine si les voix ont déjà été chargées pour cette version
   * Évite de relancer l'écran d'initialisation à chaque rafraîchissement
   */
  const getInitialVoicesLoadedState = () => {
    const loaded = localStorage.getItem(VOICES_LOADED_KEY)
    const loadedVersion = localStorage.getItem(VOICES_VERSION_KEY)

    // Si les voix ont été chargées ET que c'est la même version de l'app
    if (loaded === 'true' && loadedVersion === APP_VERSION) {
      console.warn('[App] ✅ Voix déjà chargées pour la version', APP_VERSION)
      return true
    }

    console.warn('[App] 🔄 Chargement initial des voix requis')
    return false
  }

  const [voicesLoaded, setVoicesLoaded] = useState(getInitialVoicesLoadedState)

  /**
   * Callback appelé lorsque toutes les voix sont chargées
   * Persiste l'état dans localStorage pour éviter de recharger au prochain démarrage
   */
  const handleVoicesLoaded = () => {
    console.warn("[App] 💾 Sauvegarde de l'état de chargement des voix")
    localStorage.setItem(VOICES_LOADED_KEY, 'true')
    localStorage.setItem(VOICES_VERSION_KEY, APP_VERSION)
    setVoicesLoaded(true)
  }

  /**
   * Force le rechargement des voix au prochain démarrage
   * Utile pour :
   * - Debug pendant le développement
   * - Résoudre des problèmes de cache corrompus
   * - Tester l'écran d'initialisation
   *
   * Usage: window.forceReloadVoices() dans la console, puis rafraîchir la page
   */
  const forceReloadVoices = () => {
    console.warn('[App] 🔄 Rechargement forcé des voix demandé')
    localStorage.removeItem(VOICES_LOADED_KEY)
    localStorage.removeItem(VOICES_VERSION_KEY)
    setVoicesLoaded(false)
  }

  // Exposer la fonction de rechargement globalement pour faciliter le debug
  useEffect(() => {
    window.forceReloadVoices = forceReloadVoices
    console.warn('[App] 🔧 Fonction debug exposée: window.forceReloadVoices()')
  }, [])

  // Initialiser le thème au démarrage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }
  }, [setTheme])

  // Afficher les informations de version au démarrage
  useEffect(() => {
    logVersionInfo()
  }, [])

  return (
    <>
      <Router />
      <Toast />
      <HelpScreen />
      <UpdateManager checkInterval={60 * 60 * 1000} autoUpdate={false} />
      {!voicesLoaded && <InitializationModal onComplete={handleVoicesLoaded} />}
    </>
  )
}

export default App
