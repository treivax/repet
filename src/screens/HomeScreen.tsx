/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button } from '../components/common/Button'
import { PlayCard } from '../components/play/PlayCard'
import { useUIStore } from '../state/uiStore'
import { playsRepository } from '../core/storage/plays'
import { parsePlayText } from '../core/parser/textParser'
import { validateFile, validateTextContent } from '../utils/validation'
import type { Play } from '../core/models/Play'
import { generateUUID } from '../utils/uuid'

export function HomeScreen() {
  const navigate = useNavigate()
  const [recentPlays, setRecentPlays] = useState<Play[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const addError = useUIStore((state) => state.addError)

  useEffect(() => {
    const loadRecentPlays = async () => {
      try {
        const plays = await playsRepository.getAll()
        const sorted = plays.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        setRecentPlays(sorted.slice(0, 5))
      } catch {
        addError('Erreur lors du chargement des pièces')
      }
    }
    loadRecentPlays()
  }, [addError])

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileValidation = validateFile(file)
    if (!fileValidation.valid) {
      addError(fileValidation.error || 'Fichier invalide')
      event.target.value = ''
      return
    }

    setIsLoading(true)
    try {
      const text = await file.text()
      const contentValidation = validateTextContent(text)
      if (!contentValidation.valid) {
        addError(contentValidation.error || 'Contenu invalide')
        event.target.value = ''
        setIsLoading(false)
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

      const plays = await playsRepository.getAll()
      const sorted = plays.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setRecentPlays(sorted.slice(0, 5))

      navigate(`/play/${play.id}`)
    } catch {
      addError("Erreur lors de l'importation")
    } finally {
      setIsLoading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Répét</h1>
        <p className="mt-2 text-lg text-gray-600">Répétez vos pièces de théâtre en italiennes</p>
      </div>

      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <input
          type="file"
          accept=".txt"
          onChange={handleFileImport}
          className="hidden"
          id="file-input"
          disabled={isLoading}
        />
        <Button
          variant="primary"
          size="lg"
          loading={isLoading}
          disabled={isLoading}
          fullWidth
          onClick={() => document.getElementById('file-input')?.click()}
        >
          {isLoading ? 'Import en cours...' : 'Choisir un fichier'}
        </Button>
      </div>

      {recentPlays.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Pièces récentes</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentPlays.map((play) => (
              <PlayCard
                key={play.id}
                play={play}
                onClick={(p) => navigate(`/play/${p.id}`)}
                showConfigButton={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
