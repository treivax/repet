/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { create } from 'zustand'
import { Annotation } from '../core/models/Annotation'
import { playsRepository } from '../core/storage/plays'

/**
 * État du store des annotations
 */
interface AnnotationsState {
  /** Annotations par pièce (clé = playId) */
  annotations: Record<string, Annotation[]>

  /** État global d'expansion par pièce (clé = playId) */
  areAllExpanded: Record<string, boolean>

  // Actions

  /**
   * Charge les annotations d'une pièce dans le store
   * Appelé lors du chargement d'une pièce
   */
  loadAnnotations: (playId: string, annotations: Annotation[]) => void

  /**
   * Crée une nouvelle annotation pour un élément de lecture (playback item)
   */
  addAnnotation: (playId: string, playbackItemIndex: number, content?: string) => Promise<void>

  /**
   * Met à jour le contenu d'une annotation
   */
  updateAnnotation: (playId: string, annotationId: string, content: string) => Promise<void>

  /**
   * Supprime une annotation
   */
  deleteAnnotation: (playId: string, annotationId: string) => Promise<void>

  /**
   * Toggle l'état d'expansion d'une annotation (minimisé/étendu)
   */
  toggleAnnotation: (playId: string, annotationId: string) => Promise<void>

  /**
   * Étend ou minimise toutes les annotations d'une pièce
   */
  toggleAllAnnotations: (playId: string, expanded: boolean) => Promise<void>

  /**
   * Vide les annotations d'une pièce du store (sans supprimer de la DB)
   */
  clearAnnotations: (playId: string) => void

  /**
   * Récupère les annotations pour une pièce
   */
  getAnnotations: (playId: string) => Annotation[]

  /**
   * Récupère une annotation spécifique pour un élément de lecture
   */
  getAnnotationForItem: (playId: string, playbackItemIndex: number) => Annotation | undefined
}

/**
 * Store Zustand pour la gestion des annotations
 */
export const useAnnotationsStore = create<AnnotationsState>((set, get) => ({
  // État initial
  annotations: {},
  areAllExpanded: {},

  // Actions
  loadAnnotations: (playId: string, annotations: Annotation[]) => {
    set((state) => ({
      annotations: {
        ...state.annotations,
        [playId]: annotations,
      },
    }))
  },

  addAnnotation: async (playId: string, playbackItemIndex: number, content = '') => {
    try {
      // Créer la nouvelle annotation
      const newAnnotation: Annotation = {
        id: crypto.randomUUID(),
        playbackItemIndex,
        content,
        isExpanded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Sauvegarder en DB
      await playsRepository.addAnnotation(playId, newAnnotation)

      // Mettre à jour le store
      set((state) => {
        const currentAnnotations = state.annotations[playId] ?? []
        return {
          annotations: {
            ...state.annotations,
            [playId]: [...currentAnnotations, newAnnotation],
          },
        }
      })
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'annotation:", error)
      throw error
    }
  },

  updateAnnotation: async (playId: string, annotationId: string, content: string) => {
    try {
      // Mettre à jour en DB
      await playsRepository.updateAnnotation(playId, annotationId, {
        content,
        updatedAt: new Date(),
      })

      // Mettre à jour le store
      set((state) => {
        const currentAnnotations = state.annotations[playId] ?? []
        const updatedAnnotations = currentAnnotations.map((annotation) =>
          annotation.id === annotationId
            ? { ...annotation, content, updatedAt: new Date() }
            : annotation
        )

        return {
          annotations: {
            ...state.annotations,
            [playId]: updatedAnnotations,
          },
        }
      })
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'annotation:", error)
      throw error
    }
  },

  deleteAnnotation: async (playId: string, annotationId: string) => {
    try {
      // Supprimer de la DB
      await playsRepository.deleteAnnotation(playId, annotationId)

      // Mettre à jour le store
      set((state) => {
        const currentAnnotations = state.annotations[playId] ?? []
        const filteredAnnotations = currentAnnotations.filter((a) => a.id !== annotationId)

        return {
          annotations: {
            ...state.annotations,
            [playId]: filteredAnnotations,
          },
        }
      })
    } catch (error) {
      console.error("Erreur lors de la suppression de l'annotation:", error)
      throw error
    }
  },

  toggleAnnotation: async (playId: string, annotationId: string) => {
    try {
      const currentAnnotations = get().annotations[playId] ?? []
      const annotation = currentAnnotations.find((a) => a.id === annotationId)

      if (!annotation) {
        throw new Error(`Annotation ${annotationId} non trouvée`)
      }

      const newExpandedState = !annotation.isExpanded

      // Mettre à jour en DB
      await playsRepository.updateAnnotation(playId, annotationId, {
        isExpanded: newExpandedState,
        updatedAt: new Date(),
      })

      // Mettre à jour le store
      set((state) => {
        const annotations = state.annotations[playId] ?? []
        const updatedAnnotations = annotations.map((a) =>
          a.id === annotationId ? { ...a, isExpanded: newExpandedState, updatedAt: new Date() } : a
        )

        return {
          annotations: {
            ...state.annotations,
            [playId]: updatedAnnotations,
          },
        }
      })
    } catch (error) {
      console.error("Erreur lors du toggle de l'annotation:", error)
      throw error
    }
  },

  toggleAllAnnotations: async (playId: string, expanded: boolean) => {
    try {
      const currentAnnotations = get().annotations[playId] ?? []

      // Mettre à jour toutes les annotations
      const updatedAnnotations = currentAnnotations.map((annotation) => ({
        ...annotation,
        isExpanded: expanded,
        updatedAt: new Date(),
      }))

      // Sauvegarder en DB
      await playsRepository.updateAllAnnotations(playId, updatedAnnotations)

      // Mettre à jour le store
      set((state) => ({
        annotations: {
          ...state.annotations,
          [playId]: updatedAnnotations,
        },
        areAllExpanded: {
          ...state.areAllExpanded,
          [playId]: expanded,
        },
      }))
    } catch (error) {
      console.error('Erreur lors du toggle de toutes les annotations:', error)
      throw error
    }
  },

  clearAnnotations: (playId: string) => {
    set((state) => {
      const { [playId]: _, ...remainingAnnotations } = state.annotations
      const { [playId]: __, ...remainingExpanded } = state.areAllExpanded

      return {
        annotations: remainingAnnotations,
        areAllExpanded: remainingExpanded,
      }
    })
  },

  getAnnotations: (playId: string) => {
    return get().annotations[playId] ?? []
  },

  getAnnotationForItem: (playId: string, playbackItemIndex: number) => {
    const annotations = get().annotations[playId] ?? []
    return annotations.find((a) => a.playbackItemIndex === playbackItemIndex)
  },
}))
