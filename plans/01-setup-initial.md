# 🚀 Prompt 01 : Setup Initial & Configuration

**Durée** : ~1h | **Prérequis** : Node.js 18+

---

## ⚠️ PRÉREQUIS OBLIGATOIRE

**AVANT D'EXÉCUTER CE PROMPT**, charge le fichier `.github/prompts/common.md` dans ton contexte.

Ce fichier contient TOUS les standards du projet (TypeScript, React, architecture, conventions).
Sans lui, tu ne pourras pas respecter les exigences du projet.

---

## 📋 Contexte

Tu initialises le projet Répét, une PWA de répétition théâtrale en React + TypeScript.

**Standards** : Respecte `.github/prompts/common.md` (déjà chargé en prérequis)

## 🎯 Tâches

### 1. Initialiser le Projet

Dans `/home/resinsec/dev/repet` :

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom zustand dexie dexie-react-hooks
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa @types/node prettier
npx tailwindcss init -p
```

### 2. Structure de Dossiers

Créer :
- `src/core/{parser,storage,tts,models}/`
- `src/{state,screens,hooks,utils,styles}/`
- `src/components/{common,play,settings,reader}/`
- `public/icons/`
- `docs/`

### 3. Fichiers de Configuration

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### tailwind.config.js
```js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### vite.config.ts
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Répét - Répétition Théâtre',
        short_name: 'Répét',
        description: 'Application de répétition de théâtre en italiennes',
        theme_color: '#2563eb',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
```

#### src/styles/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
}

body {
  margin: 0;
  min-height: 100vh;
}
```

#### src/main.tsx
```tsx
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

#### src/App.tsx
```tsx
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <h1 className="text-3xl font-bold text-center pt-10">Répét</h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mt-4">
        Application de répétition théâtrale
      </p>
    </div>
  )
}

export default App
```

### 4. Documentation

#### README.md
```markdown
# Répét

Application PWA de répétition de théâtre en italiennes.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state)
- Dexie.js (IndexedDB)
- Web Speech API

## Développement

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
npm run preview
\`\`\`

## License

MIT - See LICENSE file
```

#### package.json scripts
Ajouter :
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx"
  }
}
```

### 5. Fichier LICENSE

Créer `LICENSE` avec licence MIT standard.

## ✅ Validation

```bash
npm run type-check  # 0 erreur
npm run dev         # Démarre sur http://localhost:5173
```

Vérifier :
- [ ] Page "Répét" s'affiche
- [ ] Pas d'erreur console
- [ ] Tailwind fonctionne (titre bleu en gras)
- [ ] Structure dossiers créée

## 📝 Livrables

- [x] Projet initialisé
- [x] Dépendances installées
- [x] Structure dossiers
- [x] Configurations (TS, Tailwind, Vite, PWA)
- [x] README.md
- [x] LICENSE
- [x] App.tsx minimal fonctionnel
