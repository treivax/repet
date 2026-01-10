/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { Play } from '../../core/models/Play'
import { getPlayActs } from '../../core/models/playHelpers'

/**
 * Props du composant SceneNavigator
 */
export interface SceneNavigatorProps {
  /** Pièce courante */
  play: Play
  /** Index acte actuel */
  currentActIndex: number
  /** Index scène actuelle */
  currentSceneIndex: number
  /** Callback navigation */
  onNavigate: (actIndex: number, sceneIndex: number) => void
}

/**
 * Composant SceneNavigator
 * Dropdown de navigation entre actes et scènes
 */
export function SceneNavigator({
  play,
  currentActIndex,
  currentSceneIndex,
  onNavigate,
}: SceneNavigatorProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const [actIdx, sceneIdx] = event.target.value.split('-').map(Number)
    onNavigate(actIdx, sceneIdx)
  }

  // Construire la liste des scènes
  const sceneOptions: { actIndex: number; sceneIndex: number; label: string }[] = []

  const acts = getPlayActs(play)
  acts.forEach((act) => {
    const actNumber = act.actNumber
    act.scenes.forEach((scene) => {
      const sceneNumber = scene.sceneNumber
      sceneOptions.push({
        actIndex: actNumber - 1,
        sceneIndex: sceneNumber - 1,
        label: `Acte ${actNumber}, Scène ${sceneNumber}${scene.title ? ' - ' + scene.title : ''}`,
      })
    })
  })

  const currentValue = `${currentActIndex}-${currentSceneIndex}`

  return (
    <div className="relative inline-block">
      <label htmlFor="scene-navigator" className="sr-only">
        Navigation scènes
      </label>
      <select
        id="scene-navigator"
        value={currentValue}
        onChange={handleChange}
        className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-8 text-sm font-medium text-gray-900 transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {sceneOptions.map((option) => (
          <option
            key={`${option.actIndex}-${option.sceneIndex}`}
            value={`${option.actIndex}-${option.sceneIndex}`}
          >
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
