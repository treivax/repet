/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { SpeechConfig } from './types'

/**
 * Item dans la file d'attente
 */
interface QueueItem {
  config: SpeechConfig
  utterance: SpeechSynthesisUtterance
}

/**
 * File d'attente pour la lecture séquentielle des répliques
 */
export class SpeechQueue {
  private queue: QueueItem[] = []
  private isProcessing = false
  private currentUtterance: SpeechSynthesisUtterance | null = null

  /**
   * Ajoute une réplique à la file d'attente
   *
   * @param config - Configuration de lecture
   * @param utterance - Utterance SpeechSynthesis
   */
  enqueue(config: SpeechConfig, utterance: SpeechSynthesisUtterance): void {
    this.queue.push({ config, utterance })

    if (!this.isProcessing) {
      this.processNext()
    }
  }

  /**
   * Traite le prochain item de la file
   */
  private processNext(): void {
    if (this.queue.length === 0) {
      this.isProcessing = false
      this.currentUtterance = null
      return
    }

    this.isProcessing = true
    const item = this.queue.shift()!
    this.currentUtterance = item.utterance

    // Quand la lecture se termine, passer au suivant
    item.utterance.onend = () => {
      this.processNext()
    }

    speechSynthesis.speak(item.utterance)
  }

  /**
   * Vide la file d'attente et arrête la lecture
   */
  clear(): void {
    this.queue = []
    this.isProcessing = false
    this.currentUtterance = null
    speechSynthesis.cancel()
  }

  /**
   * Pause la lecture en cours
   */
  pause(): void {
    if (this.currentUtterance && this.isProcessing) {
      speechSynthesis.pause()
    }
  }

  /**
   * Reprend la lecture
   */
  resume(): void {
    if (this.currentUtterance && this.isProcessing) {
      speechSynthesis.resume()
    }
  }

  /**
   * Vérifie si la file est vide
   *
   * @returns true si vide
   */
  isEmpty(): boolean {
    return this.queue.length === 0
  }

  /**
   * Nombre d'items en attente
   *
   * @returns Taille de la file
   */
  size(): number {
    return this.queue.length
  }
}
