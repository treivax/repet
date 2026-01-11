/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { create } from 'zustand'

/**
 * Type d'erreur
 */
export type ErrorType = 'error' | 'warning' | 'info'

/**
 * Message d'erreur
 */
export interface ErrorMessage {
  /** ID unique */
  id: string
  /** Type d'erreur */
  type: ErrorType
  /** Message */
  message: string
  /** Timestamp */
  timestamp: number
}

/**
 * Thème de l'application
 */
export type Theme = 'light' | 'dark'

/**
 * État du UI Store
 */
interface UIState {
  /** Chargement global en cours */
  isLoading: boolean
  /** Messages d'erreur */
  errors: ErrorMessage[]
  /** Modale paramètres ouverte */
  isSettingsOpen: boolean
  /** Modale import ouverte */
  isImportOpen: boolean
  /** Sidebar navigation ouverte */
  isSidebarOpen: boolean
  /** Modale aide ouverte */
  isHelpOpen: boolean
  /** Thème actuel */
  theme: Theme

  // Actions
  /** Démarre le chargement */
  startLoading: () => void
  /** Arrête le chargement */
  stopLoading: () => void
  /** Ajoute une erreur */
  addError: (message: string, type?: ErrorType) => void
  /** Supprime une erreur */
  removeError: (id: string) => void
  /** Nettoie toutes les erreurs */
  clearErrors: () => void
  /** Toggle modale paramètres */
  toggleSettings: () => void
  /** Toggle modale import */
  toggleImport: () => void
  /** Toggle sidebar */
  toggleSidebar: () => void
  /** Toggle modale aide */
  toggleHelp: () => void
  /** Ferme toutes les modales */
  closeAllModals: () => void
  /** Change le thème */
  setTheme: (theme: Theme) => void
  /** Toggle le thème */
  toggleTheme: () => void
}

/**
 * Store Zustand pour l'état de l'interface
 */
export const useUIStore = create<UIState>((set) => ({
  // État initial
  isLoading: false,
  errors: [],
  isSettingsOpen: false,
  isImportOpen: false,
  isSidebarOpen: false,
  isHelpOpen: false,
  theme: (localStorage.getItem('theme') as Theme) || 'light',

  // Actions
  startLoading: () => {
    set({ isLoading: true })
  },

  stopLoading: () => {
    set({ isLoading: false })
  },

  addError: (message: string, type: ErrorType = 'error') => {
    const error: ErrorMessage = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: Date.now(),
    }

    set((state) => ({
      errors: [...state.errors, error],
    }))

    // Auto-supprimer après 5 secondes
    setTimeout(() => {
      set((state) => ({
        errors: state.errors.filter((e) => e.id !== error.id),
      }))
    }, 5000)
  },

  removeError: (id: string) => {
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== id),
    }))
  },

  clearErrors: () => {
    set({ errors: [] })
  },

  toggleSettings: () => {
    set((state) => ({ isSettingsOpen: !state.isSettingsOpen }))
  },

  toggleImport: () => {
    set((state) => ({ isImportOpen: !state.isImportOpen }))
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }))
  },

  toggleHelp: () => {
    set((state) => ({ isHelpOpen: !state.isHelpOpen }))
  },

  closeAllModals: () => {
    set({
      isSettingsOpen: false,
      isImportOpen: false,
      isSidebarOpen: false,
      isHelpOpen: false,
    })
  },

  setTheme: (theme: Theme) => {
    localStorage.setItem('theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    set({ theme })
  },

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', newTheme)
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return { theme: newTheme }
    })
  },
}))
