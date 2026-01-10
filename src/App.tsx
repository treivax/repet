/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import './styles/globals.css'
import { Router } from './router'
import { Toast } from './components/common/Toast'

function App() {
  return (
    <>
      <Router />
      <Toast />
    </>
  )
}

export default App
