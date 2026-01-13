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

function App() {
  const { setTheme } = useUIStore()
  const [voicesLoaded, setVoicesLoaded] = useState(false)

  // Initialiser le thème au démarrage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }
  }, [setTheme])

  return (
    <>
      <Router />
      <Toast />
      <HelpScreen />
      {!voicesLoaded && <InitializationModal onComplete={() => setVoicesLoaded(true)} />}
    </>
  )
}

export default App
