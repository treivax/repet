# Analyse des Optimisations - Répét v0.4.1

**Date:** 2025-01-XX  
**Version:** v0.4.1  
**Objectif:** Identifier et implémenter des optimisations pour réduire les temps de génération et améliorer les performances

---

## 📊 État Actuel

### Temps de Build
- **Build Offline:** 2.60s
- **Build Online:** 3.87s
- **Type Check:** ~1-2s
- **Lint:** ~0.5-1s

### Taille des Bundles
- **dist-offline:** 929 MB (incluant modèles vocaux ~675 MB)
- **dist-online:** 130 MB (modèles chargés à la demande)

### Warnings Vite
```
(!) /home/resinsec/dev/repet/node_modules/onnxruntime-web/dist/ort.bundle.min.mjs 
is dynamically imported by piper-tts-web.js but also statically imported by 
PiperWASMProvider.ts, dynamic import will not move module into another chunk.

(!) /home/resinsec/dev/repet/src/core/tts/providers/PiperWASMProvider.ts 
is dynamically imported by playSettingsStore.ts but also statically imported by 
TTSProviderManager.ts, dynamic import will not move module into another chunk.

(!) Some chunks are larger than 500 kB after minification.
- index-BWDmuOzj.js: 895.60 kB (260.75 kB gzipped)
```

---

## 🎯 Opportunités d'Optimisation

### 1. Code Splitting & Lazy Loading ⭐⭐⭐

#### Problème Identifié
- Le bundle principal (`index.js`) fait 895 kB (260 kB gzippé)
- `PiperWASMProvider` est importé statiquement alors qu'il pourrait être lazy-loadé
- Imports mixtes (static + dynamic) empêchent le code splitting

#### Solutions Proposées

**A. Lazy Loading du TTS Provider**
```typescript
// src/core/tts/providers/TTSProviderManager.ts
export class TTSProviderManager {
  private provider: TTSProvider | null = null
  
  async initialize(): Promise<void> {
    if (!this.provider) {
      // Import dynamique du provider
      const { PiperWASMProvider } = await import('./PiperWASMProvider')
      this.provider = new PiperWASMProvider()
    }
    await this.provider.initialize()
  }
}
```

**B. Supprimer les imports statiques redondants**
- Dans `playSettingsStore.ts`, le dynamic import de `PiperWASMProvider` est déjà présent
- Retirer l'import statique de `TTSProviderManager.ts`

**Impact Estimé:**
- ✅ Réduction bundle initial: -80 KB gzippé (~30%)
- ✅ Amélioration First Contentful Paint: -200-300ms
- ✅ Code splitting fonctionnel

---

### 2. Manual Chunks Configuration ⭐⭐

#### Problème
Vite suggère d'utiliser `build.rollupOptions.output.manualChunks`

#### Solution
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@headlessui/react', '@heroicons/react'],
          'vendor-state': ['zustand'],
          
          // TTS chunks (lazy loaded)
          'tts-core': [
            './src/core/tts/providers/PiperWASMProvider.ts',
            './src/lib/piper-tts-web-patched/dist/piper-tts-web.js',
          ],
          'tts-runtime': ['onnxruntime-web'],
          
          // Storage chunks
          'storage': ['idb-keyval', 'localforage'],
        },
      },
    },
  },
})
```

**Impact Estimé:**
- ✅ Meilleure utilisation du cache navigateur
- ✅ Chunks vendors stables (changent rarement)
- ✅ Parallélisation du chargement

---

### 3. Tree Shaking & Dead Code Elimination ⭐⭐

#### Analyse
```bash
# Identifier les imports inutilisés
npx depcheck

# Analyser la taille du bundle
npx vite-bundle-visualizer
```

#### Actions
1. **Vérifier les imports de `piper-tts-web-patched`**
   - Le fork inclut `voices_static.json` (6355 lignes) potentiellement inutilisé
   
2. **Optimiser les imports de @heroicons/react**
   ```typescript
   // ❌ Avant
   import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid'
   
   // ✅ Après (tree-shakeable)
   import PlayIcon from '@heroicons/react/24/solid/PlayIcon'
   import PauseIcon from '@heroicons/react/24/solid/PauseIcon'
   ```

3. **Supprimer les dépendances dev inutiles en production**

**Impact Estimé:**
- ✅ Réduction bundle: -20-40 KB gzippé

---

### 4. Compression & Minification Avancée ⭐

#### Configuration Terser
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // Supprimer console.log en prod
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.debug'],
      },
      format: {
        comments: false,         // Supprimer commentaires
      },
    },
  },
})
```

**Impact Estimé:**
- ✅ Réduction bundle: -10-15 KB gzippé
- ✅ Amélioration parsing JS

---

### 5. Build Cache & Incremental Builds ⭐⭐⭐

#### Solution: Turbopack ou SWC
```bash
# Option 1: Vite avec SWC (plus rapide que esbuild)
npm install -D @vitejs/plugin-react-swc

# vite.config.ts
import react from '@vitejs/plugin-react-swc'
```

#### Build Cache
```typescript
// vite.config.ts
export default defineConfig({
  cacheDir: 'node_modules/.vite',
  build: {
    // Utiliser le cache lors des rebuilds
    watch: null,
  },
})
```

**Impact Estimé:**
- ✅ Rebuild time: 2.60s → 1.0-1.5s (-40-60%)
- ✅ Dev server start: plus rapide

---

### 6. Optimisation des Assets WASM ⭐

#### Problèmes
- `ort-wasm-simd-threaded.jsep.wasm`: 23.8 MB (5.6 MB gzippé)
- Chargé même si pas immédiatement nécessaire

#### Solutions
1. **Lazy loading du WASM**
   ```typescript
   // Charger ONNX Runtime uniquement à l'initialisation TTS
   const ort = await import('onnxruntime-web')
   ```

2. **Compression Brotli côté serveur**
   - Netlify/Vercel supportent Brotli automatiquement
   - `ort-wasm-simd-threaded.jsep.wasm.br`: ~4.2 MB (-25% vs gzip)

3. **Preload hints**
   ```html
   <link rel="preload" href="/wasm/ort-wasm-simd-threaded.jsep.wasm" as="fetch" crossorigin>
   ```

**Impact Estimé:**
- ✅ Amélioration temps chargement: -500-800ms
- ✅ Meilleure expérience utilisateur

---

### 7. Service Worker & Cache Strategy ⭐⭐

#### Optimisation Workbox
```typescript
// vite.config.ts - VitePWA
VitePWA({
  workbox: {
    // Stratégie de cache optimisée
    runtimeCaching: [
      // Modèles ONNX: Cache First (gros fichiers)
      {
        urlPattern: /\.onnx$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'tts-models-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 90, // 90 jours
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // WASM: Cache First
      {
        urlPattern: /\.wasm$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'wasm-cache',
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 an
          },
        },
      },
      // JSON configs: Network First (petits, souvent mis à jour)
      {
        urlPattern: /\.json$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'config-cache',
          networkTimeoutSeconds: 3,
        },
      },
    ],
  },
})
```

**Impact Estimé:**
- ✅ Chargement offline instantané
- ✅ Réduction bande passante: -90% (après 1ère visite)

---

### 8. Optimisation TypeScript Build ⭐

#### Configuration TSC
```json
// tsconfig.json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo",
    "skipLibCheck": true,  // Déjà présent, bon
    "composite": false,
    "isolatedModules": true, // Déjà présent, bon
  }
}
```

**Impact Estimé:**
- ✅ Type check: 2s → 0.8-1.2s (-40-60%)

---

### 9. Parallel Processing ⭐⭐

#### CI/CD Optimization
```yaml
# .github/workflows/deploy.yml
- name: Build with cache
  run: |
    npm ci --prefer-offline
    npm run build:offline & npm run build:online
    wait
```

#### Local Development
```json
// package.json
{
  "scripts": {
    "build:all": "npm run lint & npm run type-check & npm run build:offline & npm run build:online; wait",
    "prebuild": "npm run lint && npm run type-check"
  }
}
```

**Impact Estimé:**
- ✅ Build total: 6-8s → 3-4s (-50%)

---

## 📋 Plan d'Implémentation Priorisé

### Phase 1: Quick Wins (Gains Immédiats) - 1-2h
1. ✅ Activer SWC au lieu d'esbuild
2. ✅ Configurer manual chunks
3. ✅ Activer Terser avec drop_console
4. ✅ Optimiser imports @heroicons

**Gain estimé:** Build time -30%, Bundle size -15%

### Phase 2: Code Splitting (Impact Moyen) - 2-3h
1. ✅ Lazy loading du TTS Provider
2. ✅ Supprimer imports statiques redondants
3. ✅ Analyser et nettoyer dead code

**Gain estimé:** Bundle initial -30%, FCP -300ms

### Phase 3: Cache & Perf (Long Terme) - 3-4h
1. ✅ Optimiser stratégies cache Workbox
2. ✅ Implémenter preload hints
3. ✅ Tests de performance

**Gain estimé:** Temps chargement -50% (repeat visits)

---

## 🔬 Outils de Mesure

### 1. Bundle Analysis
```bash
npm install -D rollup-plugin-visualizer
npm run build:offline -- --mode analyze
```

### 2. Performance Profiling
```bash
# Lighthouse CI
npm install -D @lhci/cli
npx lhci autorun
```

### 3. Build Speed
```bash
# Measure build time
time npm run build:offline
```

---

## 📈 Objectifs de Performance

### Métriques Cibles (Post-Optimisation)

| Métrique | Actuel | Cible | Amélioration |
|----------|--------|-------|--------------|
| Build Time Offline | 2.60s | < 1.5s | -42% |
| Build Time Online | 3.87s | < 2.0s | -48% |
| Bundle Size (gzip) | 260 kB | < 180 kB | -31% |
| First Contentful Paint | ~1.2s | < 0.8s | -33% |
| Time to Interactive | ~2.5s | < 1.5s | -40% |

---

## ✅ Checklist d'Implémentation

- [ ] Phase 1: Quick Wins
  - [ ] Migrer vers @vitejs/plugin-react-swc
  - [ ] Configurer manualChunks
  - [ ] Activer Terser avec options avancées
  - [ ] Optimiser imports heroicons
  - [ ] Mesurer gains

- [ ] Phase 2: Code Splitting
  - [ ] Lazy load TTS Provider
  - [ ] Analyser bundle avec visualizer
  - [ ] Supprimer dead code
  - [ ] Tests fonctionnels
  - [ ] Mesurer gains

- [ ] Phase 3: Cache Strategy
  - [ ] Optimiser Workbox config
  - [ ] Ajouter preload hints
  - [ ] Tests offline
  - [ ] Tests performance Lighthouse
  - [ ] Documentation

---

## 📝 Notes

- Les temps de build actuels (2.60s / 3.87s) sont déjà **très corrects** pour un projet de cette taille
- Les optimisations doivent se concentrer sur:
  1. **Bundle size** (impact UX direct)
  2. **First Load Time** (expérience première visite)
  3. **Developer Experience** (rebuilds plus rapides)

- ⚠️ **Ne pas sur-optimiser** au détriment de la maintenabilité
- Toujours mesurer avant/après avec des outils objectifs

---

## 🚀 Prochaines Étapes

1. Valider cette analyse avec l'équipe
2. Implémenter Phase 1 (Quick Wins)
3. Mesurer les gains réels
4. Décider si Phase 2/3 sont nécessaires

**Créé par:** AI Assistant  
**Dernière mise à jour:** 2025-01-XX