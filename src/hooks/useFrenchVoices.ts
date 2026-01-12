/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useState, useEffect } from 'react'
import { voiceManager } from '../core/tts/voice-manager'

/**
 * Hook pour récupérer les voix françaises disponibles sur le device
 * Utilise le VoiceManager existant pour une meilleure compatibilité
 * N'appelle pas initialize() car c'est fait au démarrage de l'app
 *
 * @returns Array de voix françaises disponibles
 *
 * @example
 * const frenchVoices = useFrenchVoices()
 * console.log(`${frenchVoices.length} voix françaises disponibles`)
 */
export function useFrenchVoices(): number {
  const [voiceCount, setVoiceCount] = useState<number>(0)

  useEffect(() => {
    let mounted = true

    const updateVoiceCount = () => {
      if (mounted) {
        const frenchVoices = voiceManager.getFrenchVoices()
        setVoiceCount(frenchVoices.length)
      }
    }

    // Essayer de récupérer les voix immédiatement
    updateVoiceCount()

    // Écouter les changements de voix (peut se charger de façon asynchrone)
    const handleVoicesChanged = () => {
      updateVoiceCount()
    }

    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
    }

    // Retry après un délai au cas où les voix ne sont pas encore chargées
    const timeoutId = setTimeout(() => {
      updateVoiceCount()
    }, 1000)

    return () => {
      mounted = false
      if (typeof speechSynthesis !== 'undefined') {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
      }
      clearTimeout(timeoutId)
    }
  }, [])

  return voiceCount
}
