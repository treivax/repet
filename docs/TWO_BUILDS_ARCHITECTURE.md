# Architecture à Deux Builds - Répét

## Vue d'ensemble

Répét dispose de **deux versions distinctes** pour s'adapter aux contraintes des différentes plateformes :

1. **Version Offline** - Pour Desktop et Android (app.repet.com)
2. **Version Online** - Pour iOS, Safari et macOS (ios.repet.com)

Cette architecture permet de résoudre les limitations strictes de stockage d'iOS (~50 MB) tout en conservant une expérience offline complète sur les plateformes qui le supportent.

---

## 📦 Version Offline (Desktop/Android)

### Caractéristiques

- ✅ **100% hors ligne** après le premier chargement
- ✅ Embarque **tous les assets** (voix + WASM)
- ✅ Taille totale : **~675 MB**
  - Voix : ~268 MB (modèles .onnx)
  - WASM : ~116 MB (ONNX Runtime + Piper)
  - Application : ~5-10 MB
- ✅ Parfait pour Desktop (Chrome, Firefox, Edge, Safari) et Android moderne

### URL de déploiement

```
https://app.repet.com
```

### Configuration

Fichier : `vite.config.offline.ts`

```typescript
// Inclut les voix dans le build
{
  src: 'public/voices/**/*',
  dest: 'voices',
}
```

Variable d'environnement :
```typescript
'import.meta.env.VITE_BUILD_MODE': 'offline'
```

### Build

```bash
# Développement
npm run dev:offline

# Build de production
npm run build:offline

# Preview
npm run preview:offline
```

Sortie : `dist-offline/`

---

## 🌐 Version Online (iOS/Safari/macOS)

### Caractéristiques

- ✅ **Léger** : ~5-10 MB seulement
- ✅ **Compatible iOS/Safari** : respecte les limites strictes (~50 MB cache)
- ✅ Les voix sont **téléchargées à la demande** depuis le CDN
- ✅ **Cache intelligent** avec stratégie LRU (Least Recently Used)
- ⚠️ **Nécessite une connexion Internet** pour le premier téléchargement des voix

### URL de déploiement

```
https://ios.repet.com
```

Alternative :
```
https://app.repet.com/ios
```

### Configuration

Fichier : `vite.config.online.ts`

```typescript
// N'INCLUT PAS les voix dans le build
// {
//   src: 'public/voices/**/*',  // ❌ Commenté
//   dest: 'voices',
// }
```

Variable d'environnement :
```typescript
'import.meta.env.VITE_BUILD_MODE': 'online'
```

### Build

```bash
# Développement
npm run dev:online

# Build de production
npm run build:online

# Preview
npm run preview:online
```

Sortie : `dist-online/`

---

## 🔧 Fonctionnement Technique

### NetworkInterceptor

Le `NetworkInterceptor` s'adapte automatiquement au mode de build :

#### Mode Offline
```typescript
// Intercepte les URLs externes et les redirige vers fichiers locaux
fetch('https://huggingface.co/.../fr_FR-siwis-medium.onnx')
  ↓
fetch('/voices/fr_FR-siwis-medium.onnx')  // Fichier local
```

#### Mode Online
```typescript
// Laisse passer les requêtes réseau
fetch('https://cdn.repet.com/voices/fr_FR-siwis-medium.onnx')
  ↓
fetch('https://cdn.repet.com/voices/fr_FR-siwis-medium.onnx')  // CDN distant
  ↓
Stockage dans IndexedDB (cache LRU)
```

### VoiceCacheService (Mode Online)

Service de gestion du cache des voix téléchargées :

- **Téléchargement avec progression** : Affiche la taille, vitesse, ETA
- **Stockage IndexedDB** : Persistance des voix téléchargées
- **Stratégie LRU** : Éviction automatique des voix les moins utilisées
- **Gestion du quota** : Respecte les limites de stockage de la plateforme

```typescript
import { getVoiceCacheService } from '@/core/tts/online/VoiceCacheService'

const cache = getVoiceCacheService()

// Télécharger une voix
const data = await cache.getVoiceFile(url, (progress) => {
  console.log(`${progress.percentage}% - ${progress.speed} MB/s`)
})

// Statistiques
const stats = await cache.getCacheStats()
console.log(`Cache: ${stats.totalEntries} voix, ${stats.totalSize} bytes`)
```

---

## 🎨 Composants UI

### OnlineModeBanner

Bannière d'information affichée en mode online pour informer l'utilisateur :

```tsx
import { OnlineModeBanner } from '@/components/common/OnlineModeBanner'

function App() {
  return (
    <>
      <OnlineModeBanner />
      {/* Reste de l'application */}
    </>
  )
}
```

Affiche :
- Information sur le mode online
- Nécessité d'une connexion Internet
- Taille des voix à télécharger
- Lien vers la version offline

### VoiceDownloadProgress

Composant de progression du téléchargement des voix :

```tsx
import { VoiceDownloadProgress } from '@/components/common/VoiceDownloadProgress'

function VoiceLoader() {
  const [progress, setProgress] = useState<DownloadProgress | null>(null)

  return (
    <>
      {progress && <VoiceDownloadProgress progress={progress} />}
    </>
  )
}
```

Affiche :
- Nom du fichier
- Barre de progression visuelle
- Pourcentage
- Taille téléchargée / totale
- Vitesse de téléchargement
- Temps restant estimé (ETA)

---

## 📊 Comparaison des Builds

| Aspect | Offline | Online |
|--------|---------|--------|
| **Taille totale** | ~675 MB | ~5-10 MB |
| **Connexion requise** | Non (après 1er chargement) | Oui (pour voix) |
| **Voix embarquées** | ✅ Toutes (3 voix FR) | ❌ Aucune |
| **Téléchargement voix** | ❌ Non | ✅ À la demande |
| **Cache des voix** | Local (dans build) | IndexedDB (LRU) |
| **Compatible iOS** | ❌ Non (trop lourd) | ✅ Oui |
| **Compatible Desktop** | ✅ Oui | ✅ Oui |
| **Compatible Android** | ✅ Oui | ✅ Oui |
| **Expérience offline** | ✅ Complète | ⚠️ Partielle* |

\* En mode online, les voix déjà téléchargées fonctionnent hors ligne, mais de nouvelles voix nécessitent une connexion.

---

## 🚀 Déploiement

### Build des deux versions

```bash
# Build complet (offline + online)
npm run build

# Build offline uniquement
npm run build:offline

# Build online uniquement
npm run build:online
```

### Structure des dossiers

```
repet/
├── dist-offline/     # Build offline (~675 MB)
│   ├── index.html
│   ├── assets/
│   ├── voices/      # ✅ Voix embarquées
│   └── wasm/
└── dist-online/      # Build online (~5-10 MB)
    ├── index.html
    ├── assets/
    └── wasm/        # ❌ Pas de dossier voices/
```

### Hébergement

#### Version Offline (app.repet.com)

Déployer le contenu de `dist-offline/` :

```bash
# Exemple avec Netlify
netlify deploy --prod --dir=dist-offline

# Exemple avec Vercel
vercel --prod dist-offline

# Exemple avec serveur statique
rsync -av dist-offline/ user@server:/var/www/app.repet.com/
```

#### Version Online (ios.repet.com)

Déployer le contenu de `dist-online/` :

```bash
# Exemple avec Netlify
netlify deploy --prod --dir=dist-online

# Exemple avec Vercel
vercel --prod dist-online

# Exemple avec serveur statique
rsync -av dist-online/ user@server:/var/www/ios.repet.com/
```

### CDN pour les voix (Mode Online)

Les fichiers vocaux doivent être hébergés sur un CDN accessible publiquement :

```bash
# Structure du CDN
https://cdn.repet.com/voices/
├── fr_FR-siwis-medium.onnx       (61 MB)
├── fr_FR-siwis-medium.onnx.json  (5 KB)
├── fr_FR-tom-medium.onnx         (61 MB)
├── fr_FR-tom-medium.onnx.json    (5 KB)
├── fr_FR-upmc-medium.onnx        (74 MB)
└── fr_FR-upmc-medium.onnx.json   (5 KB)
```

#### Options d'hébergement CDN

1. **Cloudflare R2** (recommandé)
   - Gratuit jusqu'à 10 GB de stockage
   - Pas de frais de bande passante
   - Configuration CORS simple

2. **AWS S3 + CloudFront**
   - Scalable
   - Configuration CORS requise
   - Coût selon usage

3. **Bunny CDN**
   - Rapide et abordable
   - Bande passante illimitée

4. **GitHub Releases**
   - Gratuit
   - Bande passante illimitée
   - Max 2 GB par fichier (suffisant)

#### Configuration CORS (requis)

Le CDN doit autoriser les requêtes cross-origin :

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Allow-Headers: Range
```

#### Upload des voix vers le CDN

```bash
# Exemple avec Cloudflare R2 (via rclone)
rclone copy public/voices/ r2:repet-voices/

# Exemple avec AWS S3
aws s3 sync public/voices/ s3://repet-voices/ --acl public-read

# Exemple avec GitHub Releases
gh release create v1.0.0 public/voices/*
```

---

## 🔍 Détection et Redirection

### Détection automatique de la plateforme

Vous pouvez ajouter une page d'accueil qui redirige automatiquement vers la bonne version :

```typescript
// landing.html ou App.tsx
function detectPlatform() {
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
  const isMacOS = /Macintosh/.test(ua)

  if (isIOS || (isSafari && isMacOS)) {
    window.location.href = 'https://ios.repet.com'
  } else {
    window.location.href = 'https://app.repet.com'
  }
}

detectPlatform()
```

### Sélecteur manuel

Ou proposer un choix à l'utilisateur :

```html
<!-- index.html -->
<div class="platform-selector">
  <h1>Choisissez votre plateforme</h1>
  
  <a href="https://app.repet.com">
    <h2>Desktop / Android</h2>
    <p>Version complète hors ligne (~675 MB)</p>
  </a>
  
  <a href="https://ios.repet.com">
    <h2>iOS / Safari / macOS</h2>
    <p>Version légère en ligne (~5 MB)</p>
  </a>
</div>
```

---

## 🧪 Tests

### Tester le mode offline localement

```bash
npm run dev:offline
# Ouvrir http://localhost:5173
# Les voix sont servies localement depuis /voices/
```

### Tester le mode online localement

```bash
npm run dev:online
# Ouvrir http://localhost:5173
# Les voix doivent être servies depuis le CDN
```

**Note** : Pour tester le mode online en local, vous devez :
1. Déployer les voix sur le CDN
2. OU configurer un serveur local simulant le CDN
3. OU mocker les requêtes dans le NetworkInterceptor

### Tests manuels requis

#### Version Offline
- [ ] Charger l'application (doit télécharger ~675 MB)
- [ ] Vérifier que les voix se chargent sans erreur
- [ ] Passer en mode avion
- [ ] Vérifier que l'application fonctionne entièrement hors ligne
- [ ] Tester la lecture audio avec les 3 voix

#### Version Online
- [ ] Charger l'application (doit charger ~5-10 MB)
- [ ] Lancer la lecture audio
- [ ] Observer le téléchargement de la voix (barre de progression)
- [ ] Vérifier la mise en cache (rechargement rapide)
- [ ] Tester sur iOS/Safari réel
- [ ] Vérifier les quotas de stockage
- [ ] Tester le mode hors ligne après téléchargement

---

## 🐛 Dépannage

### Problème : Les voix ne se téléchargent pas en mode online

**Solutions** :
1. Vérifier que le CDN est accessible (CORS configuré)
2. Vérifier la console pour les erreurs réseau
3. Vérifier que `VITE_BUILD_MODE=online` est bien défini
4. Vérifier les quotas de stockage du navigateur

```typescript
// Vérifier le quota disponible
const estimate = await navigator.storage.estimate()
console.log('Quota:', estimate.quota)
console.log('Usage:', estimate.usage)
```

### Problème : Cache plein (iOS)

**Solutions** :
1. Vider le cache manuellement
2. Réduire le nombre de voix en cache (maxEntries)
3. Implémenter un sélecteur de voix (télécharger seulement celle nécessaire)

```typescript
import { getVoiceCacheService } from '@/core/tts/online/VoiceCacheService'

const cache = getVoiceCacheService()
await cache.clearCache()
```

### Problème : Build trop volumineux

**Solutions** :
1. Vérifier que vous utilisez la bonne config (`online` vs `offline`)
2. Vérifier que les voix sont bien exclues du build online
3. Analyser le bundle avec `vite-plugin-visualizer`

```bash
# Analyser la taille du build
npm run build:online
ls -lh dist-online/  # Doit être ~5-10 MB
```

---

## 📋 Checklist de Mise en Production

### Avant le déploiement

- [ ] Tester les deux builds en local
- [ ] Vérifier que les voix sont sur le CDN
- [ ] Configurer CORS sur le CDN
- [ ] Tester sur iOS/Safari réel
- [ ] Tester sur Desktop (Chrome, Firefox, Edge)
- [ ] Tester sur Android
- [ ] Vérifier les quotas de stockage
- [ ] Vérifier la console (0 erreur, 0 warning)

### Déploiement

- [ ] Build offline → `app.repet.com`
- [ ] Build online → `ios.repet.com`
- [ ] Voix → `cdn.repet.com/voices/`
- [ ] DNS configuré
- [ ] HTTPS actif
- [ ] PWA manifest valide
- [ ] Service Worker fonctionnel

### Post-déploiement

- [ ] Tester l'URL de production (offline)
- [ ] Tester l'URL de production (online)
- [ ] Vérifier Analytics (si activé)
- [ ] Vérifier les logs du CDN
- [ ] Documenter les URLs dans le README

---

## 📚 Ressources

- [Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [iOS Storage Limits](https://developer.apple.com/forums/thread/662139)

---

## 🤝 Contribution

Pour contribuer à l'architecture à deux builds :

1. **Modifications du build offline** : Éditer `vite.config.offline.ts`
2. **Modifications du build online** : Éditer `vite.config.online.ts`
3. **NetworkInterceptor** : Maintenir la compatibilité avec les deux modes
4. **Nouveaux composants** : Tester avec les deux builds
5. **Documentation** : Mettre à jour ce fichier

---

## 📝 Licence

Copyright (c) 2025 Répét Contributors
Licensed under the MIT License