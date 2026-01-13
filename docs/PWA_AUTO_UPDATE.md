# Auto-Update PWA : Guide Complet

Guide complet pour implémenter et gérer les mises à jour automatiques de **Répét** en tant que PWA (Progressive Web App) sur différentes plateformes.

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [État actuel de Répét](#état-actuel-de-répét)
3. [Navigateurs (Desktop & Mobile)](#navigateurs-desktop--mobile)
4. [Android](#android)
5. [iOS](#ios)
6. [Implémentation recommandée](#implémentation-recommandée)
7. [Bonnes pratiques](#bonnes-pratiques)
8. [Tests](#tests)
9. [Limitations et considérations](#limitations-et-considérations)

---

## Vue d'ensemble

### Comment fonctionne l'auto-update d'une PWA ?

Une PWA se met à jour via son **Service Worker** :

1. Le navigateur vérifie périodiquement si `sw.js` a changé
2. Si une nouvelle version est détectée, elle est téléchargée en arrière-plan
3. Le nouveau Service Worker attend que l'utilisateur ferme tous les onglets
4. Au prochain démarrage, la nouvelle version est activée

```
┌─────────────┐
│  Utilisateur │
│  ouvre l'app │
└──────┬──────┘
       │
       v
┌─────────────────────┐
│ Navigateur vérifie  │
│ sw.js sur le serveur│
└──────┬──────────────┘
       │
       v
   ┌───────┐
   │Changé?│
   └───┬───┘
       │
   ┌───┴────┐
   │  NON   │  OUI
   v        v
Utilise  Télécharge
version  nouveau SW
actuelle en arrière-plan
           │
           v
      ┌────────────┐
      │ Attend que │
      │ user ferme │
      │ tous tabs  │
      └─────┬──────┘
            │
            v
       ┌────────┐
       │ Active │
       │nouveau │
       │   SW   │
       └────────┘
```

---

## État actuel de Répét

### Configuration actuelle

**Fichier:** `vite.config.ts`

```typescript
VitePWA({
  registerType: 'autoUpdate',  // ✅ Auto-update activé
  manifest: { ... },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,mjs}'],
    maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
    // ...
  },
})
```

### Ce qui est déjà en place

✅ **Service Worker généré automatiquement** (`dist/sw.js`)  
✅ **Mode `autoUpdate`** configuré  
✅ **Script d'enregistrement** (`dist/registerSW.js`)  
✅ **Manifest PWA** (`manifest.webmanifest`)  
✅ **Precaching** des assets statiques  

### Ce qui manque pour une meilleure UX

❌ **Notification utilisateur** de nouvelle version disponible  
❌ **Bouton "Mettre à jour maintenant"**  
❌ **Feedback visuel** pendant le téléchargement  
❌ **Gestion intelligente** des mises à jour (éviter les interruptions)  

---

## Navigateurs (Desktop & Mobile)

### Fonctionnement natif

#### Chrome / Edge / Opera

- **Vérification** : Toutes les 24h ou au focus de l'onglet
- **Téléchargement** : En arrière-plan, transparent
- **Activation** : Au prochain démarrage (fermeture de tous les onglets)
- **Force update** : Possible via `skipWaiting()`

#### Firefox

- **Vérification** : Toutes les 24h
- **Téléchargement** : En arrière-plan
- **Activation** : Au prochain démarrage
- **Particularité** : Peut être plus agressif sur le cache

#### Safari (macOS)

- **Vérification** : Toutes les 24h
- **Téléchargement** : En arrière-plan
- **Activation** : Au prochain démarrage
- **Particularité** : Support PWA limité sur macOS (pas d'installation standalone)

### Implémentation navigateur

#### Option 1 : Auto-update silencieux (actuel)

**Avantage** : Aucune intervention utilisateur  
**Inconvénient** : L'utilisateur ne sait pas qu'une mise à jour est disponible

```typescript
// vite.config.ts (configuration actuelle)
VitePWA({
  registerType: 'autoUpdate',
})
```

L'utilisateur verra la nouvelle version après avoir fermé tous les onglets.

#### Option 2 : Prompt utilisateur (recommandé)

**Avantage** : Contrôle utilisateur, feedback visuel  
**Inconvénient** : Nécessite une action utilisateur

```typescript
// vite.config.ts
VitePWA({
  registerType: 'prompt',
  workbox: {
    // Configuration identique
  },
})
```

Puis dans le code :

```typescript
// src/components/UpdatePrompt.tsx
import { useRegisterSW } from 'virtual:pwa-register/react'

function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Service Worker enregistré
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <>
      {(offlineReady || needRefresh) && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center gap-4">
            {offlineReady ? (
              <span>✅ Application prête à fonctionner hors ligne</span>
            ) : (
              <span>🔄 Nouvelle version disponible</span>
            )}
            <div className="flex gap-2">
              {needRefresh && (
                <button
                  className="px-4 py-2 bg-white text-blue-600 rounded font-medium"
                  onClick={() => updateServiceWorker(true)}
                >
                  Mettre à jour
                </button>
              )}
              <button
                className="px-4 py-2 bg-blue-700 rounded"
                onClick={close}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

#### Option 3 : Auto-update avec notification

**Avantage** : Automatique + transparence  
**Inconvénient** : L'utilisateur est interrompu

```typescript
// src/hooks/useAutoUpdate.ts
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useEffect } from 'react'

export function useAutoUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onNeedRefresh() {
      // Afficher une notification toast
      console.log('🔄 Nouvelle version détectée, mise à jour automatique...')
      
      // Attendre 2 secondes pour que l'utilisateur voie le message
      setTimeout(() => {
        updateServiceWorker(true)
      }, 2000)
    },
  })

  return { needRefresh }
}
```

### Stratégies de mise à jour

#### 1. Update immédiat avec `skipWaiting()`

```typescript
// Service Worker personnalisé
self.addEventListener('install', (event) => {
  self.skipWaiting() // Active immédiatement
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()) // Prend contrôle des clients
})
```

⚠️ **Attention** : Peut causer des problèmes si du code est en cours d'exécution.

#### 2. Update au prochain chargement (actuel)

Le Service Worker attend que tous les onglets soient fermés.

✅ **Sûr** : Pas de conflit de version  
❌ **Lent** : L'utilisateur doit fermer tous les onglets

#### 3. Update intelligent

```typescript
// Mettre à jour seulement si inactif depuis > 5 min
let lastActivity = Date.now()

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    const inactive = Date.now() - lastActivity > 5 * 60 * 1000
    if (inactive && needRefresh) {
      updateServiceWorker(true)
    }
    lastActivity = Date.now()
  }
})
```

---

## Android

### Installation via navigateur

#### Chrome / Edge / Samsung Internet

1. **Installation** : Via le bouton "Ajouter à l'écran d'accueil"
2. **Type** : WebAPK (Android Package Kit virtuel)
3. **Mises à jour** : Gérées par Chrome automatiquement

### Fonctionnement des mises à jour

#### WebAPK Auto-Update

Chrome vérifie les mises à jour de la PWA selon ces critères :

1. **Déclencheurs de vérification** :
   - Tous les 3 jours minimum
   - Quand l'utilisateur ouvre l'app
   - Si le manifest ou les icônes ont changé

2. **Processus** :
   ```
   User ouvre PWA
        ↓
   Chrome vérifie manifest.webmanifest
        ↓
   Changement détecté ?
        ↓
   OUI → Télécharge nouveau WebAPK en arrière-plan
        ↓
   Installation silencieuse
        ↓
   Prochaine ouverture : nouvelle version
   ```

3. **Délai d'activation** :
   - Le nouveau WebAPK est installé en arrière-plan
   - L'ancienne version reste utilisée jusqu'à la prochaine ouverture
   - Pas de redémarrage forcé

#### Service Worker + WebAPK

Les deux systèmes fonctionnent ensemble :

```
┌─────────────────┐
│  WebAPK Update  │ → Met à jour l'app shell, manifest, icônes
└─────────────────┘
        +
┌─────────────────┐
│   SW Update     │ → Met à jour le contenu, assets, cache
└─────────────────┘
```

### Particularités Android

#### Avantages

✅ **Mise à jour automatique** du WebAPK par Chrome  
✅ **Pas d'action utilisateur** requise  
✅ **Service Worker standard** fonctionne normalement  
✅ **Apparaît dans la liste des apps** installées  
✅ **Notifications push** supportées  

#### Limitations

❌ **Délai de 3 jours** minimum entre les vérifications WebAPK  
❌ **Pas de contrôle** sur le timing de mise à jour du WebAPK  
❌ **Deux systèmes séparés** : WebAPK + Service Worker  

### Recommandations Android

```typescript
// src/utils/androidUpdate.ts

/**
 * Détecte si l'app tourne dans un WebAPK Android
 */
export function isAndroidWebAPK(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches &&
    /Android/i.test(navigator.userAgent)
  )
}

/**
 * Vérifie si une mise à jour du manifest est disponible
 * (Chrome le fera automatiquement, mais on peut informer l'utilisateur)
 */
export async function checkManifestUpdate(): Promise<boolean> {
  try {
    const response = await fetch('/manifest.webmanifest', {
      cache: 'no-store',
    })
    const manifest = await response.json()
    
    // Comparer avec la version actuelle (stocker dans localStorage)
    const currentVersion = localStorage.getItem('app-version')
    const newVersion = manifest.version // Ajouter un champ version au manifest
    
    if (currentVersion && newVersion !== currentVersion) {
      console.log('🔄 Nouvelle version du manifest détectée')
      localStorage.setItem('app-version', newVersion)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Erreur vérification manifest:', error)
    return false
  }
}
```

### Forcer la vérification (Android)

Chrome ne fournit pas d'API pour forcer une vérification WebAPK, mais vous pouvez :

1. **Changer le manifest** :
   ```json
   {
     "name": "Répét",
     "version": "1.2.0",  // Incrémenter la version
     "short_name": "Répét"
   }
   ```

2. **Informer l'utilisateur** :
   ```typescript
   if (isAndroidWebAPK() && await checkManifestUpdate()) {
     toast.info(
       'Une mise à jour sera installée automatiquement dans les prochaines 24h. ' +
       'Pour l\'obtenir immédiatement, fermez et rouvrez l\'application.'
     )
   }
   ```

---

## iOS

### Installation via Safari

#### PWA sur iOS

1. **Installation** : Via Safari → Partager → "Sur l'écran d'accueil"
2. **Type** : App standalone (pas de WebAPK)
3. **Moteur** : WebKit uniquement (pas de Chrome)

### Fonctionnement des mises à jour

#### Limitations iOS

⚠️ **iOS a un support PWA très limité** :

1. **Pas de Service Worker en standalone** (jusqu'à iOS 11.3)
2. **Cache vidé régulièrement** par iOS (économie de mémoire)
3. **Pas de mise à jour automatique** du cache applicatif
4. **Limite de stockage** : ~50 MB pour IndexedDB/localStorage

#### Service Worker sur iOS

**iOS 11.3+** : Support Service Worker basique

```typescript
// Vérifier le support Service Worker
if ('serviceWorker' in navigator) {
  // iOS supporte les SW, mais avec limitations
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('SW registered on iOS')
      
      // Vérifier les mises à jour manuellement toutes les 5 minutes
      setInterval(() => {
        registration.update()
      }, 5 * 60 * 1000)
    })
}
```

### Stratégies iOS

#### 1. Vérification manuelle fréquente

```typescript
// src/hooks/useIOSUpdate.ts

export function useIOSUpdate() {
  useEffect(() => {
    if (!isIOS()) return
    
    const checkForUpdates = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        
        if (registration) {
          // Force une vérification
          await registration.update()
        }
      }
    }
    
    // Vérifier au démarrage
    checkForUpdates()
    
    // Vérifier toutes les 5 minutes
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])
}

function isIOS(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent)
}
```

#### 2. Version number dans l'app

```typescript
// src/config/version.ts
export const APP_VERSION = '1.2.0' // Mise à jour manuelle à chaque release

// src/components/VersionChecker.tsx
export function VersionChecker() {
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null)
  
  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Fichier version.json déployé avec l'app
        const response = await fetch('/version.json', {
          cache: 'no-store',
        })
        const data = await response.json()
        setRemoteVersion(data.version)
      } catch (error) {
        console.error('Erreur vérification version:', error)
      }
    }
    
    checkVersion()
    
    // Vérifier toutes les heures
    const interval = setInterval(checkVersion, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])
  
  const needsUpdate = remoteVersion && remoteVersion !== APP_VERSION
  
  if (!needsUpdate) return null
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black p-4 text-center">
      <p className="font-bold mb-2">
        📱 Nouvelle version disponible ({remoteVersion})
      </p>
      <p className="text-sm mb-2">
        Pour iOS : Fermez l'app complètement et rouvrez-la pour mettre à jour.
      </p>
      <button
        className="px-4 py-2 bg-black text-yellow-500 rounded font-bold"
        onClick={() => {
          // Instructions détaillées
          alert(
            'Pour mettre à jour sur iOS :\n\n' +
            '1. Fermez cette app complètement (glisser vers le haut)\n' +
            '2. Ouvrez Safari\n' +
            '3. Allez sur repet.app\n' +
            '4. Réinstallez via Partager → Sur l\'écran d\'accueil'
          )
        }}
      >
        Comment mettre à jour ?
      </button>
    </div>
  )
}
```

#### 3. Demander la réinstallation

Pour iOS, la méthode la plus fiable reste de demander à l'utilisateur de **réinstaller l'app** :

```typescript
function showIOSUpdateInstructions() {
  const modal = `
    <div class="ios-update-modal">
      <h2>Mise à jour disponible</h2>
      <p>Pour mettre à jour Répét sur iOS :</p>
      <ol>
        <li>Fermez cette application</li>
        <li>Ouvrez Safari</li>
        <li>Visitez repet.app</li>
        <li>Tapez Partager → "Sur l'écran d'accueil"</li>
        <li>Acceptez le remplacement</li>
      </ol>
    </div>
  `
  
  // Afficher le modal
  showModal(modal)
}
```

### Particularités iOS

#### Avantages

✅ **Fonctionne hors ligne** (avec Service Worker)  
✅ **Icône sur l'écran d'accueil**  
✅ **Mode standalone** (sans barre Safari)  

#### Limitations

❌ **Pas de WebAPK** (pas de mise à jour automatique)  
❌ **Cache limité** (~50 MB)  
❌ **Cache vidé** régulièrement par iOS  
❌ **Pas de notifications push** (iOS 16.4+ seulement, très limité)  
❌ **Service Worker limité** (pas de background sync)  
❌ **Réinstallation manuelle** souvent nécessaire  

### Recommandations iOS

1. **Vérifier les mises à jour fréquemment** (toutes les 5-10 min)
2. **Afficher un message clair** quand une mise à jour est disponible
3. **Fournir des instructions** de réinstallation
4. **Ne pas compter sur le cache** pour persister longtemps
5. **Tester régulièrement** sur vrais appareils iOS

---

## Implémentation recommandée

### Architecture proposée

```
src/
├── components/
│   └── updates/
│       ├── UpdatePrompt.tsx          # Notification de mise à jour
│       ├── UpdateBanner.tsx          # Bannière persistante
│       └── VersionChecker.tsx        # Vérificateur de version
├── hooks/
│   ├── useServiceWorkerUpdate.ts     # Hook Service Worker
│   ├── useAutoUpdate.ts              # Logique auto-update
│   └── usePlatformUpdate.ts          # Détection plateforme
└── utils/
    ├── platformDetection.ts          # Détection OS/navigateur
    └── updateStrategies.ts           # Stratégies par plateforme
```

### Étape 1 : Détection de plateforme

```typescript
// src/utils/platformDetection.ts

export interface PlatformInfo {
  os: 'ios' | 'android' | 'desktop'
  browser: 'safari' | 'chrome' | 'firefox' | 'edge' | 'other'
  isStandalone: boolean
  isWebAPK: boolean
}

export function detectPlatform(): PlatformInfo {
  const ua = navigator.userAgent
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  
  // Détecter OS
  const isIOS = /iPhone|iPad|iPod/.test(ua)
  const isAndroid = /Android/.test(ua)
  
  // Détecter navigateur
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua)
  const isChrome = /Chrome/.test(ua)
  const isFirefox = /Firefox/.test(ua)
  const isEdge = /Edg/.test(ua)
  
  // WebAPK = standalone sur Android
  const isWebAPK = isAndroid && isStandalone
  
  return {
    os: isIOS ? 'ios' : isAndroid ? 'android' : 'desktop',
    browser: isSafari ? 'safari' : isChrome ? 'chrome' : isFirefox ? 'firefox' : isEdge ? 'edge' : 'other',
    isStandalone,
    isWebAPK,
  }
}
```

### Étape 2 : Hook Service Worker universel

```typescript
// src/hooks/useServiceWorkerUpdate.ts

import { useRegisterSW } from 'virtual:pwa-register/react'
import { useState, useEffect } from 'react'
import { detectPlatform } from '../utils/platformDetection'

export function useServiceWorkerUpdate() {
  const platform = detectPlatform()
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updating, setUpdating] = useState(false)
  
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('✅ Service Worker enregistré')
      
      // iOS : vérifier les mises à jour plus fréquemment
      if (platform.os === 'ios') {
        setInterval(() => {
          registration?.update()
        }, 5 * 60 * 1000) // Toutes les 5 minutes
      }
    },
    onNeedRefresh() {
      console.log('🔄 Mise à jour disponible')
      setUpdateAvailable(true)
    },
    onOfflineReady() {
      console.log('📴 Application prête hors ligne')
    },
  })
  
  const applyUpdate = async () => {
    setUpdating(true)
    
    try {
      await updateServiceWorker(true)
      
      // Sur iOS, suggérer un rechargement manuel
      if (platform.os === 'ios') {
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      setUpdating(false)
    }
  }
  
  const dismiss = () => {
    setUpdateAvailable(false)
    setNeedRefresh(false)
  }
  
  return {
    updateAvailable: updateAvailable || needRefresh,
    offlineReady,
    updating,
    applyUpdate,
    dismiss,
    platform,
  }
}
```

### Étape 3 : Composant de notification

```typescript
// src/components/updates/UpdatePrompt.tsx

import { useServiceWorkerUpdate } from '../../hooks/useServiceWorkerUpdate'

export function UpdatePrompt() {
  const { updateAvailable, updating, applyUpdate, dismiss, platform } = useServiceWorkerUpdate()
  
  if (!updateAvailable) return null
  
  // Message différent selon la plateforme
  const getMessage = () => {
    if (platform.os === 'ios') {
      return '📱 Nouvelle version disponible. Sur iOS, fermez et rouvrez l\'app pour mettre à jour.'
    }
    
    if (platform.isWebAPK) {
      return '🔄 Mise à jour disponible. Elle sera appliquée automatiquement.'
    }
    
    return '🔄 Une nouvelle version est disponible.'
  }
  
  const showUpdateButton = platform.os !== 'ios' || platform.isStandalone
  
  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-blue-600 text-white p-4 rounded-lg shadow-2xl z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="font-semibold mb-1">Mise à jour disponible</p>
          <p className="text-sm text-blue-100">{getMessage()}</p>
        </div>
        
        <div className="flex gap-2">
          {showUpdateButton && (
            <button
              onClick={applyUpdate}
              disabled={updating}
              className="px-4 py-2 bg-white text-blue-600 rounded font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? '⏳ Mise à jour...' : 'Mettre à jour'}
            </button>
          )}
          
          {platform.os === 'ios' && (
            <button
              onClick={() => {
                alert(
                  'Pour mettre à jour sur iOS :\n\n' +
                  '1. Fermez complètement l\'application\n' +
                  '2. Rouvrez-la\n\n' +
                  'OU\n\n' +
                  '1. Ouvrez Safari\n' +
                  '2. Visitez l\'app\n' +
                  '3. Réinstallez via Partager → Sur l\'écran d\'accueil'
                )
              }}
              className="px-4 py-2 bg-white text-blue-600 rounded font-medium hover:bg-blue-50"
            >
              Comment faire ?
            </button>
          )}
          
          <button
            onClick={dismiss}
            className="px-3 py-2 bg-blue-700 rounded hover:bg-blue-800"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Étape 4 : Intégration dans App.tsx

```typescript
// src/App.tsx

import { UpdatePrompt } from './components/updates/UpdatePrompt'

function App() {
  return (
    <>
      <Router />
      <UpdatePrompt />  {/* Ajouter le composant */}
      <Toast />
      <HelpScreen />
      {!voicesLoaded && <InitializationModal onComplete={() => setVoicesLoaded(true)} />}
    </>
  )
}
```

### Étape 5 : Modifier vite.config.ts

```typescript
// vite.config.ts

VitePWA({
  registerType: 'prompt',  // Changer de 'autoUpdate' à 'prompt'
  
  // Ajouter des options de développement (optionnel)
  devOptions: {
    enabled: false,  // Activer en true pour tester en dev
    type: 'module',
  },
  
  manifest: {
    // ... config existante
    
    // Ajouter un champ version pour faciliter le tracking
    description: 'Application de répétition de théâtre - v1.0.0',
  },
  
  workbox: {
    // ... config existante
    
    // Ajouter une stratégie pour vérifier le manifest
    runtimeCaching: [
      // ... caches existants
      
      {
        urlPattern: /^https:\/\/votre-domaine\.com\/manifest\.webmanifest$/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'manifest-cache',
          expiration: {
            maxAgeSeconds: 60, // 1 minute - force une vérification fréquente
          },
        },
      },
    ],
  },
})
```

### Étape 6 : Créer version.json

```json
// public/version.json
{
  "version": "1.0.0",
  "buildDate": "2025-01-13T12:00:00Z",
  "features": [
    "Auto-update amélioré",
    "Support iOS optimisé",
    "Support Android WebAPK"
  ]
}
```

Mettre à jour ce fichier à chaque release via CI/CD :

```bash
# scripts/update-version.sh
#!/bin/bash

VERSION=$1
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > public/version.json <<EOF
{
  "version": "$VERSION",
  "buildDate": "$DATE"
}
EOF
```

---

## Bonnes pratiques

### 1. Versionning sémantique

```json
{
  "name": "Répét",
  "version": "1.2.3",
  "description": "v1.2.3"
}
```

- **MAJOR** (1.x.x) : Breaking changes
- **MINOR** (x.2.x) : Nouvelles fonctionnalités
- **PATCH** (x.x.3) : Corrections de bugs

### 2. Changelog visible

```typescript
// Afficher le changelog après une mise à jour
useEffect(() => {
  const lastVersion = localStorage.getItem('last-version')
  const currentVersion = APP_VERSION
  
  if (lastVersion && lastVersion !== currentVersion) {
    showChangelog(currentVersion)
    localStorage.setItem('last-version', currentVersion)
  }
}, [])
```

### 3. Stratégie de cache

```typescript
// workbox configuration
{
  // Cache des assets avec révision (hash)
  globPatterns: ['**/*.{js,css,html,png}'],
  
  // Ne pas précacher les gros fichiers
  globIgnores: ['**/voices/**/*.onnx'],
  
  // Stratégies de cache runtime
  runtimeCaching: [
    {
      // Assets statiques : Cache First
      urlPattern: /^https:\/\/cdn\./,
      handler: 'CacheFirst',
    },
    {
      // API : Network First
      urlPattern: /^https:\/\/api\./,
      handler: 'NetworkFirst',
    },
    {
      // Manifest : Network First (vérification fréquente)
      urlPattern: /manifest\.webmanifest/,
      handler: 'NetworkFirst',
    },
  ],
}
```

### 4. Gestion des erreurs

```typescript
// src/hooks/useServiceWorkerUpdate.ts

const {
  updateServiceWorker,
} = useRegisterSW({
  onRegisterError(error) {
    console.error('❌ Erreur enregistrement SW:', error)
    
    // Notifier l'utilisateur
    toast.error('Impossible d\'enregistrer le Service Worker. Vérifiez votre connexion.')
    
    // Tracker l'erreur (Sentry, etc.)
    trackError('SW_REGISTER_ERROR', error)
  },
})
```

### 5. Tests de mise à jour

```typescript
// src/utils/testUpdate.ts

/**
 * Utilitaire de test pour simuler une mise à jour
 * À utiliser uniquement en développement
 */
export async function simulateUpdate() {
  if (import.meta.env.PROD) {
    console.warn('simulateUpdate() ne fonctionne qu\'en dev')
    return
  }
  
  const registration = await navigator.serviceWorker.getRegistration()
  
  if (registration) {
    // Forcer une vérification
    await registration.update()
    
    console.log('🔄 Vérification de mise à jour forcée')
  }
}

// Exposer en dev
if (import.meta.env.DEV) {
  (window as any).simulateUpdate = simulateUpdate
}
```

---

## Tests

### Test en local

#### 1. Build de production

```bash
npm run build
npm run preview
```

#### 2. Ouvrir dans le navigateur

```
http://localhost:4173
```

#### 3. Vérifier le Service Worker

1. Ouvrir DevTools (F12)
2. Onglet **Application**
3. Section **Service Workers**
4. Vérifier que le SW est actif

#### 4. Simuler une mise à jour

1. Modifier un fichier (ex: `src/App.tsx`)
2. Rebuild : `npm run build`
3. Dans DevTools → Application → Service Workers
4. Cliquer sur **Update** ou recharger la page
5. Le nouveau SW devrait apparaître en "waiting"
6. Fermer tous les onglets et rouvrir
7. Le nouveau SW devient actif

### Test sur Android

#### Prérequis

- Servir via HTTPS (requis pour les PWA)
- Utiliser ngrok, Netlify, Vercel, ou similaire

#### Procédure

```bash
# Option 1 : ngrok
npm run build
npm run preview &
ngrok http 4173

# Option 2 : Déployer sur Netlify
netlify deploy --prod

# Option 3 : Déployer sur Vercel
vercel --prod
```

Puis sur le téléphone Android :

1. Ouvrir Chrome
2. Visiter l'URL HTTPS
3. Menu → "Installer l'application"
4. Vérifier dans les apps installées
5. Modifier le code et redéployer
6. Attendre 3 jours OU forcer en changeant le manifest
7. Rouvrir l'app → mise à jour automatique

### Test sur iOS

#### Prérequis

- Servir via HTTPS
- iPhone/iPad physique (simulateur iOS limité)

#### Procédure

1. Déployer sur un serveur HTTPS
2. Sur l'iPhone, ouvrir Safari
3. Visiter l'URL
4. Partager → "Sur l'écran d'accueil"
5. Ouvrir l'app depuis l'écran d'accueil
6. Modifier le code et redéployer
7. Dans l'app, vérifier si la notification de mise à jour apparaît
8. Si non, fermer complètement l'app et rouvrir

### Test automatisé

```typescript
// tests/e2e/update.spec.ts (Playwright)

import { test, expect } from '@playwright/test'

test('service worker update cycle', async ({ page, context }) => {
  // Visiter l'app
  await page.goto('/')
  
  // Attendre que le SW soit enregistré
  await page.waitForFunction(() => {
    return navigator.serviceWorker.controller !== null
  })
  
  // Simuler une nouvelle version (modifier le SW)
  // ...
  
  // Vérifier qu'une notification apparaît
  const updatePrompt = page.locator('[data-testid="update-prompt"]')
  await expect(updatePrompt).toBeVisible()
  
  // Cliquer sur "Mettre à jour"
  await page.click('[data-testid="update-button"]')
  
  // Attendre le rechargement
  await page.waitForLoadState('networkidle')
  
  // Vérifier que la nouvelle version est active
  const version = await page.locator('[data-testid="app-version"]').textContent()
  expect(version).toBe('1.0.1')
})
```

---

## Limitations et considérations

### Limitations techniques

#### Navigateurs

- **Safari** : Support PWA limité sur macOS (pas d'installation)
- **Firefox** : Pas de support WebAPK sur Android
- **Internet Explorer** : Pas de support Service Worker

#### Plateformes

- **iOS < 11.3** : Pas de Service Worker
- **iOS** : Cache limité (~50 MB)
- **Android** : Délai de 3 jours pour WebAPK update

### Considérations UX

#### Quand mettre à jour ?

❌ **Mauvais moments** :
- Pendant une lecture de texte
- Pendant la saisie de données
- En pleine répétition

✅ **Bons moments** :
- Au démarrage de l'app
- Après 5 min d'inactivité
- Quand l'utilisateur clique "Mettre à jour"

#### Communication utilisateur

Toujours expliquer :
- **Pourquoi** mettre à jour (nouvelles fonctionnalités, corrections)
- **Quand** la mise à jour sera appliquée
- **Comment** l'utilisateur peut contrôler le processus

### Gestion des données

```typescript
// Vérifier la compatibilité des données avant mise à jour
self.addEventListener('activate', async (event) => {
  event.waitUntil((async () => {
    // Vérifier la version de la DB
    const db = await openDatabase()
    const currentVersion = await db.get('meta', 'version')
    
    if (currentVersion < REQUIRED_VERSION) {
      // Migration nécessaire
      await migrateDatabase(db, currentVersion, REQUIRED_VERSION)
    }
    
    // Nettoyer les anciens caches
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames
        .filter(name => name.startsWith('old-'))
        .map(name => caches.delete(name))
    )
  })())
})
```

### Monitoring

```typescript
// Tracker les métriques de mise à jour

interface UpdateMetrics {
  updateDetectedAt: number
  updateAppliedAt: number
  fromVersion: string
  toVersion: string
  platform: string
  userAccepted: boolean
}

function trackUpdateMetrics(metrics: UpdateMetrics) {
  // Envoyer à votre système d'analytics
  analytics.track('app_updated', metrics)
}
```

---

## Ressources

### Documentation officielle

- [MDN - Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Google - Workbox](https://developer.chrome.com/docs/workbox/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Web.dev - Progressive Web Apps](https://web.dev/progressive-web-apps/)

### Articles recommandés

- [The Service Worker Lifecycle](https://web.dev/service-worker-lifecycle/)
- [Offering a page reload for users](https://web.dev/service-worker-lifecycle/#offering-a-page-reload-for-users)
- [PWA on iOS](https://firt.dev/notes/pwa-ios/)
- [WebAPK on Android](https://developer.chrome.com/blog/webapk-update-frequency/)

### Outils de test

- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

---

## Résumé

### ✅ Ce qui fonctionne bien

| Plateforme | Auto-update | Transparence | UX |
|------------|-------------|--------------|-----|
| **Chrome Desktop** | ✅ Excellent | ✅ Clair | ⭐⭐⭐⭐⭐ |
| **Chrome Android (WebAPK)** | ✅ Automatique | ✅ Silencieux | ⭐⭐⭐⭐⭐ |
| **Firefox Desktop** | ✅ Bon | ⚠️ Moyen | ⭐⭐⭐⭐ |
| **Safari macOS** | ⚠️ Limité | ⚠️ Limité | ⭐⭐⭐ |
| **Safari iOS** | ❌ Manuel | ❌ Compliqué | ⭐⭐ |

### 📝 Recommandations finales

#### Pour Répét

1. **Implémenter le mode `prompt`** avec `UpdatePrompt.tsx`
2. **Ajouter détection de plateforme** pour UX adaptée
3. **Vérifications fréquentes sur iOS** (toutes les 5 min)
4. **Instructions claires pour iOS** (réinstallation)
5. **Version.json** pour tracking précis

#### Priorités

1. ⭐⭐⭐ **Navigateurs** : Excellent support, facile à implémenter
2. ⭐⭐ **Android** : Bon support, mais délai de 3 jours
3. ⭐ **iOS** : Support limité, nécessite workarounds

#### Code minimal requis

```typescript
// 1. Modifier vite.config.ts
VitePWA({ registerType: 'prompt' })

// 2. Ajouter UpdatePrompt.tsx
<UpdatePrompt />

// 3. Hook useServiceWorkerUpdate.ts
const { updateAvailable, applyUpdate } = useServiceWorkerUpdate()
```

**Temps estimé** : 2-3 heures d'implémentation + tests

---

**Auteur** : Guide Auto-Update PWA pour Répét  
**Date** : Janvier 2025  
**Version** : 1.0.0