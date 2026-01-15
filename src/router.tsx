/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './components/common/Layout'
import { Header } from './components/common/Header'
import { LibraryScreen } from './screens/LibraryScreen'
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
      <Layout header={<Header title="Répét" />}>
        <LibraryScreen />
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
