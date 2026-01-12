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

    const initializeVoices = async () => {
      try {
        // Utiliser le VoiceManager qui gère déjà le chargement asynchrone
        await voiceManager.initialize()

        if (mounted) {
          const frenchVoices = voiceManager.getFrenchVoices()
          setVoiceCount(frenchVoices.length)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des voix:', error)
        if (mounted) {
          setVoiceCount(0)
        }
      }
    }

    initializeVoices()

    return () => {
      mounted = false
    }
  }, [])

  return voiceCount
}
