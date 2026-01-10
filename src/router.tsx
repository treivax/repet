/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './components/common/Layout'
import { LibraryScreen } from './screens/LibraryScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { PlayScreen } from './screens/PlayScreen'
import { ReaderScreen } from './screens/ReaderScreen'
import { PlayDetailScreen } from './screens/PlayDetailScreen'

/**
 * Configuration des routes de l'application
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout
        header={
          <nav className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Répét</h1>
            <div className="flex gap-4">
              <a href="/" className="text-gray-700 hover:text-blue-600">
                Bibliothèque
              </a>
              <a href="/settings" className="text-gray-700 hover:text-blue-600">
                Paramètres
              </a>
            </div>
          </nav>
        }
      >
        <LibraryScreen />
      </Layout>
    ),
  },

  {
    path: '/settings',
    element: (
      <Layout
        header={
          <nav className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Répét</h1>
            <div className="flex gap-4">
              <a href="/" className="text-gray-700 hover:text-blue-600">
                Bibliothèque
              </a>
              <a href="/settings" className="text-gray-700 hover:text-blue-600">
                Paramètres
              </a>
            </div>
          </nav>
        }
      >
        <SettingsScreen />
      </Layout>
    ),
  },
  {
    path: '/play/:playId/detail',
    element: <PlayDetailScreen />,
  },
  {
    path: '/play/:playId',
    element: <PlayScreen />,
  },
  {
    path: '/reader/:playId',
    element: <ReaderScreen />,
  },
])

/**
 * Composant Router principal
 */
export function Router() {
  return <RouterProvider router={router} />
}
