/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useState, useEffect } from 'react'

/**
 * Hook pour récupérer les voix françaises disponibles sur le device
 * Utilise l'API Web Speech Synthesis
 *
 * @returns Array de voix françaises disponibles
 *
 * @example
 * const frenchVoices = useFrenchVoices()
 * console.log(`${frenchVoices.length} voix françaises disponibles`)
 */
export function useFrenchVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    // Fonction pour charger et filtrer les voix
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      const frenchVoices = availableVoices.filter((voice) =>
        voice.lang.toLowerCase().startsWith('fr')
      )
      setVoices(frenchVoices)
    }

    // Charger les voix immédiatement
    loadVoices()

    // Certains navigateurs chargent les voix de manière asynchrone
    // Il faut écouter l'événement 'voiceschanged'
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    // Cleanup
    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  return voices
}
