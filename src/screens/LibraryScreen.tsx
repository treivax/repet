/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { PlayCard } from '../components/play/PlayCard'
import { Modal } from '../components/common/Modal'
import { useUIStore } from '../state/uiStore'
import { playsRepository } from '../core/storage/plays'
import { parsePlayText } from '../core/parser/textParser'
import { validateFile, validateTextContent } from '../utils/validation'
import type { Play } from '../core/models/Play'
import { getPlayTitle, getPlayAuthor, getPlayCategory } from '../core/models/playHelpers'
import { generateUUID } from '../utils/uuid'

const PLAY_ORDER_STORAGE_KEY = 'repet_play_order'

/**
 * Écran LibraryScreen
 * Bibliothèque complète des pièces avec recherche et gestion
 */
export function LibraryScreen() {
  const navigate = useNavigate()
  const [plays, setPlays] = useState<Play[]>([])
  const [filteredPlays, setFilteredPlays] = useState<Play[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [playToDelete, setPlayToDelete] = useState<Play | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const longPressTimer = useRef<number | null>(null)
  const addError = useUIStore((state) => state.addError)

  // Charger l'ordre personnalisé depuis le localStorage
  const loadPlayOrder = (): string[] => {
    try {
      const stored = localStorage.getItem(PLAY_ORDER_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  // Sauvegarder l'ordre personnalisé
  const savePlayOrder = (playIds: string[]) => {
    try {
      localStorage.setItem(PLAY_ORDER_STORAGE_KEY, JSON.stringify(playIds))
    } catch (error) {
      console.error('Erreur sauvegarde ordre:', error)
    }
  }

  // Appliquer l'ordre personnalisé aux pièces
  const applyCustomOrder = useRef((allPlays: Play[]): Play[] => {
    const customOrder = loadPlayOrder()
    if (customOrder.length === 0) {
      return allPlays.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }

    const orderedPlays: Play[] = []
    const playMap = new Map(allPlays.map((p) => [p.id, p]))

    // Ajouter les pièces selon l'ordre personnalisé
    customOrder.forEach((id) => {
      const play = playMap.get(id)
      if (play) {
        orderedPlays.push(play)
        playMap.delete(id)
      }
    })

    // Ajouter les nouvelles pièces (non présentes dans l'ordre personnalisé)
    playMap.forEach((play) => orderedPlays.push(play))

    return orderedPlays
  }).current

  // Charger toutes les pièces
  useEffect(() => {
    const loadPlays = async () => {
      try {
        const allPlays = await playsRepository.getAll()
        // Appliquer l'ordre personnalisé
        const sorted = applyCustomOrder(allPlays)
        setPlays(sorted)
        setFilteredPlays(sorted)
      } catch {
        addError('Erreur lors du chargement des pièces')
      } finally {
        setIsLoading(false)
      }
    }

    loadPlays()
  }, [addError, applyCustomOrder])

  // Filtrer les pièces lors de la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPlays(plays)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = plays.filter((play) => {
      return (
        getPlayTitle(play).toLowerCase().includes(query) ||
        getPlayAuthor(play)?.toLowerCase().includes(query) ||
        getPlayCategory(play)?.toLowerCase().includes(query)
      )
    })

    setFilteredPlays(filtered)
  }, [searchQuery, plays])

  const handlePlayClick = (play: Play) => {
    navigate(`/play/${play.id}/detail`)
  }

  const handleDeleteClick = (play: Play, event: React.MouseEvent) => {
    event.stopPropagation()
    setPlayToDelete(play)
  }

  const handleConfirmDelete = async () => {
    if (!playToDelete) return

    try {
      await playsRepository.delete(playToDelete.id)

      // Mettre à jour la liste
      const updatedPlays = plays.filter((p) => p.id !== playToDelete.id)
      setPlays(updatedPlays)
      setFilteredPlays(updatedPlays)

      setPlayToDelete(null)
    } catch {
      addError('Erreur lors de la suppression')
    }
  }

  const handleCancelDelete = () => {
    setPlayToDelete(null)
  }

  // Gestion du drag & drop
  const handleLongPressStart = (index: number) => {
    if (searchQuery.trim()) return // Pas de réorganisation en mode recherche

    longPressTimer.current = window.setTimeout(() => {
      setDraggingIndex(index)
    }, 500)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleDragStart = (index: number) => {
    if (searchQuery.trim()) return
    setDraggingIndex(index)
  }

  const handleDragOver = (event: React.DragEvent, index: number) => {
    event.preventDefault()
    if (draggingIndex === null) return
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (draggingIndex === null || dragOverIndex === null) {
      setDraggingIndex(null)
      setDragOverIndex(null)
      return
    }

    if (draggingIndex === dragOverIndex) {
      setDraggingIndex(null)
      setDragOverIndex(null)
      return
    }

    // Réorganiser les pièces
    const newPlays = [...filteredPlays]
    const [movedPlay] = newPlays.splice(draggingIndex, 1)
    newPlays.splice(dragOverIndex, 0, movedPlay)

    setPlays(newPlays)
    setFilteredPlays(newPlays)

    // Sauvegarder l'ordre
    savePlayOrder(newPlays.map((p) => p.id))

    setDraggingIndex(null)
    setDragOverIndex(null)
  }

  const handleTouchStart = (_e: React.TouchEvent, index: number) => {
    handleLongPressStart(index)
  }

  const handleTouchEnd = () => {
    handleLongPressEnd()
    handleDragEnd()
  }

  const handleMouseDown = (index: number) => {
    handleLongPressStart(index)
  }

  const handleMouseUp = () => {
    handleLongPressEnd()
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileValidation = validateFile(file)
    if (!fileValidation.valid) {
      addError(fileValidation.error || 'Fichier invalide')
      event.target.value = ''
      return
    }

    setIsImporting(true)
    try {
      const text = await file.text()
      const contentValidation = validateTextContent(text)
      if (!contentValidation.valid) {
        addError(contentValidation.error || 'Contenu invalide')
        event.target.value = ''
        setIsImporting(false)
        return
      }

      const ast = parsePlayText(text, file.name)

      // Convertir l'AST en objet Play
      const now = new Date()
      const play: Play = {
        id: generateUUID(),
        fileName: file.name,
        ast,
        createdAt: now,
        updatedAt: now,
      }

      await playsRepository.add(play)

      // Mettre à jour la liste
      const allPlays = await playsRepository.getAll()
      const sorted = applyCustomOrder(allPlays)
      setPlays(sorted)
      setFilteredPlays(sorted)

      // Naviguer vers le détail de la pièce nouvellement importée
      navigate(`/play/${play.id}/detail`)
    } catch {
      addError("Erreur lors de l'importation")
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  // Réinitialiser l'ordre lors de la recherche
  useEffect(() => {
    if (draggingIndex !== null) {
      setDraggingIndex(null)
      setDragOverIndex(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Bibliothèque</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {plays.length} pièce{plays.length !== 1 ? 's' : ''}
          </p>
        </div>
        <input
          type="file"
          accept=".txt"
          onChange={handleFileImport}
          className="hidden"
          id="file-input"
          data-testid="file-input"
          disabled={isImporting}
        />
        <Button
          variant="primary"
          loading={isImporting}
          disabled={isImporting}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          {isImporting ? 'Import en cours...' : 'Importer une pièce'}
        </Button>
      </div>

      {/* Search */}
      {plays.length > 0 && (
        <Input
          type="text"
          placeholder="Rechercher par titre, auteur ou catégorie..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          leftIcon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
        />
      )}

      {/* Empty State */}
      {plays.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
            Aucune pièce
          </h3>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Commencez par importer votre première pièce
          </p>
          <div className="mt-6">
            <Button
              variant="primary"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              Importer une pièce
            </Button>
          </div>
        </div>
      )}

      {/* No Results */}
      {plays.length > 0 && filteredPlays.length === 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Aucune pièce ne correspond à votre recherche
          </p>
          <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="mt-4">
            Effacer la recherche
          </Button>
        </div>
      )}

      {/* Plays Grid */}
      {filteredPlays.length > 0 && (
        <>
          {!searchQuery.trim() && (
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
              <span>Appui long pour réorganiser</span>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlays.map((play, index) => (
              <div
                key={play.id}
                className={`relative transition-all ${
                  draggingIndex === index
                    ? 'opacity-50 scale-95'
                    : dragOverIndex === index
                      ? 'scale-105'
                      : ''
                }`}
                draggable={!searchQuery.trim() && draggingIndex !== null}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onMouseDown={() => handleMouseDown(index)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleLongPressEnd}
              >
                {dragOverIndex === index && draggingIndex !== null && draggingIndex !== index && (
                  <div
                    className={`absolute inset-0 rounded-lg border-2 border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ${
                      draggingIndex < index ? 'border-r-4' : 'border-l-4'
                    }`}
                    style={{ zIndex: -1 }}
                  />
                )}
                <PlayCard play={play} onClick={handlePlayClick} showConfigButton={true} />
                <button
                  onClick={(e) => handleDeleteClick(play, e)}
                  className="absolute right-2 top-2 rounded-lg bg-white p-2 text-red-600 shadow-md opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100 focus:opacity-100 dark:bg-gray-800"
                  aria-label="Supprimer la pièce"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!playToDelete}
        onClose={handleCancelDelete}
        title="Supprimer la pièce"
        maxWidth="sm"
        actions={
          <>
            <Button variant="secondary" onClick={handleCancelDelete}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Êtes-vous sûr de vouloir supprimer{' '}
          <span className="font-semibold">{playToDelete && getPlayTitle(playToDelete)}</span> ?
        </p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Cette action est irréversible.
        </p>
      </Modal>
    </div>
  )
}
