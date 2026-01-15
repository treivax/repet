# Mode Déconnecté - Répét

**Documentation pour le fonctionnement 100% hors ligne de l'application**

---

## 🎯 Objectif

Répét est conçu pour fonctionner **entièrement sans connexion Internet** une fois configuré. Tous les fichiers nécessaires (WASM, modèles de voix) sont intégrés au build de l'application.

---

## 📦 Ressources Locales

### Fichiers WASM

L'application utilise deux types de fichiers WebAssembly :

#### 1. ONNX Runtime (Inférence des modèles)

- **Source** : `node_modules/onnxruntime-web/dist/`
- **Destination** : `public/wasm/` → `dist/wasm/`
- **Fichiers** :
  - `ort-wasm-simd.wasm` (~8 MB)
  - `ort-wasm-simd.mjs`
  - `ort-wasm-simd.js`

#### 2. Piper Phonemize (Conversion texte → phonèmes)

- **Source** : CDN jsDelivr (téléchargé via script)
- **Destination** : `public/wasm/` → `dist/wasm/`
- **Fichiers** :
  - `piper_phonemize.wasm` (~2 MB)
  - `piper_phonemize.data` (~5 MB)

### Modèles de Voix Piper

#### Voix Disponibles

L'application intègre **4 voix françaises de qualité moyenne** :

| Nom du Modèle | Genre | Taille | Description |
|---------------|-------|--------|-------------|
| `fr_FR-siwis-medium` | Femme | ~15 MB | Voix féminine claire et naturelle |
| `fr_FR-tom-medium` | Homme | ~15 MB | Voix masculine posée |
| `fr_FR-upmc-medium` (speaker #0) | Femme | ~16 MB | Jessica, voix féminine expressive |
| `fr_FR-upmc-medium` (speaker #1) | Homme | ~16 MB | Pierre, voix masculine (multi-speaker) |

**Note** : Pierre utilise le même modèle ONNX que Jessica (`fr_FR-upmc-medium`) mais avec un `speakerId` différent (speaker #1). Le fork `piper-tts-web-patched` permet de sélectionner le speaker.

#### Structure des Fichiers

Chaque modèle contient 2 fichiers :

```
public/voices/
├── fr_FR-siwis-medium/
│   ├── fr_FR-siwis-medium.onnx      # Modèle neural (ONNX)
│   └── fr_FR-siwis-medium.onnx.json # Configuration
├── fr_FR-tom-medium/
│   ├── fr_FR-tom-medium.onnx
│   └── fr_FR-tom-medium.onnx.json
├── fr_FR-upmc-medium/               # Modèle multi-speaker
│   ├── fr_FR-upmc-medium.onnx       # Contient Jessica (speaker #0) et Pierre (speaker #1)
│   └── fr_FR-upmc-medium.onnx.json
└── manifest.json                     # Manifeste des modèles
```

**Taille totale** : ~46 MB (3 modèles ONNX) + ~15 MB (WASM) = **~61 MB**

**Note** : Le modèle UPMC est multi-speaker et contient 2 voix (Jessica et Pierre) dans un seul fichier `.onnx`.

---

## 🚀 Installation

### 1. Installation des Dépendances

```bash
npm install
```

Le script `postinstall` télécharge automatiquement les modèles Piper.

### 2. Téléchargement Manuel (optionnel)

Si le téléchargement automatique échoue :

```bash
npm run download-models
```

### 3. Vérification

Vérifiez que tous les fichiers sont présents :

```bash
ls -la public/wasm/
ls -la public/voices/
```

Vous devriez voir :

```
public/wasm/
  ✓ ort-wasm-simd.wasm
  ✓ piper_phonemize.wasm
  ✓ piper_phonemize.data

public/voices/
  ✓ fr_FR-siwis-medium/ (2 fichiers)
  ✓ fr_FR-tom-medium/ (2 fichiers)
  ✓ fr_FR-upmc-medium/ (2 fichiers)
  ✓ fr_FR-mls-medium/ (2 fichiers)
  ✓ manifest.json
```

---

## 🔧 Configuration Technique

### Vite Configuration

Le fichier `vite.config.ts` copie automatiquement les ressources nécessaires :

```typescript
viteStaticCopy({
  targets: [
    // ONNX Runtime WASM
    { src: 'node_modules/onnxruntime-web/dist/*.wasm', dest: 'wasm' },
    { src: 'node_modules/onnxruntime-web/dist/*.mjs', dest: 'wasm' },
    { src: 'node_modules/onnxruntime-web/dist/*.js', dest: 'wasm' },
    
    // Piper WASM
    { src: 'public/wasm/piper_phonemize.wasm', dest: 'wasm' },
    { src: 'public/wasm/piper_phonemize.data', dest: 'wasm' },
    
    // Modèles de voix
    { src: 'public/voices/**/*', dest: 'voices' },
  ],
})
```

### PWA Service Worker

Le service worker met en cache tous les fichiers pour un accès hors ligne :

```javascript
workbox: {
  globPatterns: [
    '**/*.{js,css,html,ico,png,svg,woff2,wasm,data,onnx,json,mjs}'
  ],
  maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // 20 MB
}
```

### ONNX Runtime Configuration

Le provider Piper configure ONNX pour utiliser les fichiers locaux :

```typescript
// Désactiver multi-threading (évite CORS)
ort.env.wasm.numThreads = 1
ort.env.wasm.simd = true
ort.env.wasm.wasmPaths = '/wasm/'
```

### Piper TTS Session

Les sessions Piper utilisent les chemins locaux :

```typescript
await TtsSession.create({
  voiceId: 'fr_FR-siwis-medium',
  wasmPaths: {
    onnxWasm: '/wasm/',
    piperData: '/wasm/piper_phonemize.data',
    piperWasm: '/wasm/piper_phonemize.wasm',
  },
  modelPaths: {
    model: '/voices/fr_FR-siwis-medium/fr_FR-siwis-medium.onnx',
    config: '/voices/fr_FR-siwis-medium/fr_FR-siwis-medium.onnx.json',
  },
})
```

---

## 🧪 Tests

### Test en Mode Développement

1. **Démarrer le serveur** :
   ```bash
   npm run dev
   ```

2. **Ouvrir l'application** : http://localhost:5173

3. **Vérifier les fichiers** :
   - Ouvrir DevTools → Network
   - Filtrer par "wasm" et "onnx"
   - Lancer une lecture avec Piper
   - ✅ Tous les fichiers doivent se charger avec status `200`
   - ✅ Les chemins doivent être locaux (`/wasm/...`, `/voices/...`)

4. **Tester hors ligne** :
   - DevTools → Network → Offline
   - Recharger la page
   - Lancer une lecture
   - ✅ Doit fonctionner sans erreur

### Test en Mode Production

1. **Builder l'application** :
   ```bash
   npm run build
   ```

2. **Vérifier le build** :
   ```bash
   ls -lh dist/wasm/
   ls -lh dist/voices/
   ```

3. **Prévisualiser** :
   ```bash
   npm run preview
   ```

4. **Tester** : http://localhost:4173
   - Même checklist que le mode dev

---

## 📊 Cache Audio

### Service de Cache

Le `AudioCacheService` met en cache les audios générés dans IndexedDB :

- **Base de données** : `RepetDB`
- **Table** : `audioCache`
- **Index** : `text`, `voiceId`, `parameters`

### Avantages

- ✅ Pas de re-génération pour les mêmes répliques
- ✅ Performance améliorée
- ✅ Économie de CPU
- ✅ Fonctionne hors ligne

### Gestion

```typescript
// Obtenir les statistiques
const stats = await piperProvider.getCacheStats()
// { count: 42, size: 1234567, sizeFormatted: '1.18 MB' }

// Vider le cache
await piperProvider.clearCache()
```

---

## 🔍 Dépannage

### Les modèles ne se téléchargent pas

**Symptômes** :
- Erreur lors de `npm install`
- Dossier `public/voices/` vide

**Solutions** :

1. **Télécharger manuellement** :
   ```bash
   npm run download-models
   ```

2. **Vérifier la connexion Internet** :
   - Le script nécessite Internet pour télécharger depuis HuggingFace
   - Essayer avec un autre réseau

3. **Proxy / Firewall** :
   - Vérifier que `huggingface.co` n'est pas bloqué
   - Configurer le proxy npm si nécessaire

### Erreurs WASM au chargement

**Symptômes** :
```
Failed to fetch /wasm/ort-wasm-simd.wasm
TypeError: Failed to fetch
```

**Solutions** :

1. **Vérifier la présence des fichiers** :
   ```bash
   ls dist/wasm/
   ```

2. **Reconstruire** :
   ```bash
   rm -rf dist/
   npm run build
   ```

3. **Vider le cache du navigateur** :
   - Chrome : DevTools → Application → Clear storage
   - Firefox : Ctrl+Shift+Del

### Audio ne joue pas

**Symptômes** :
- Pas de son
- Erreurs dans la console

**Solutions** :

1. **Vérifier la console** :
   - Rechercher `[PiperWASM]` ou `[Piper TTS]`
   - Noter les erreurs

2. **Tester avec Web Speech API** :
   - Paramètres → Moteur TTS → Google / Web Speech API
   - Si Google fonctionne → Problème spécifique Piper
   - Si Google ne fonctionne pas → Problème plus général

3. **Vérifier les permissions** :
   - Certains navigateurs bloquent l'audio
   - Interaction utilisateur nécessaire avant lecture

### Erreur "Model not found"

**Symptômes** :
```
Modèle Piper fr_FR-siwis-medium non trouvé
```

**Solutions** :

1. **Vérifier le manifest** :
   ```bash
   cat public/voices/manifest.json
   ```

2. **Re-télécharger les modèles** :
   ```bash
   rm -rf public/voices/
   npm run download-models
   ```

3. **Vérifier les chemins** :
   - Les noms de dossiers doivent correspondre aux `voiceId`
   - Les fichiers `.onnx` et `.onnx.json` doivent être présents

---

## 🚀 Déploiement

### Build de Production

```bash
npm run build
```

Le dossier `dist/` contient **tout** pour un déploiement autonome :

```
dist/
├── wasm/                # Fichiers WASM (~15 MB)
├── voices/              # Modèles Piper (~60 MB)
├── assets/              # JS/CSS de l'app
├── icons/               # Icônes PWA
├── index.html
└── sw.js                # Service Worker
```

**Taille totale** : ~80-100 MB

### Hébergement

#### Netlify

```bash
npm run deploy:netlify
```

#### Vercel

```bash
npm run deploy:vercel
```

#### Serveur Statique

Le dossier `dist/` peut être servi par n'importe quel serveur HTTP :

```bash
# Nginx
cp -r dist/* /var/www/html/

# Apache
cp -r dist/* /var/www/html/

# Python
cd dist && python -m http.server 8000
```

### Headers HTTP Requis

Pour le support WASM optimal, configurer les headers :

```nginx
# nginx.conf
add_header Cross-Origin-Embedder-Policy "credentialless";
add_header Cross-Origin-Opener-Policy "same-origin";
```

**Note** : Ces headers sont optionnels car nous utilisons `numThreads = 1`.

---

## 📈 Performance

### Temps de Chargement Initial

| Étape | Durée | Description |
|-------|-------|-------------|
| Chargement WASM | ~1-2s | Téléchargement et initialisation |
| Chargement modèle | ~2-3s | Première utilisation d'une voix |
| Synthèse audio | ~0.5-1s | Génération d'une réplique courte |
| **TOTAL** | **~4-6s** | Pour la première réplique |

### Synthèses Suivantes

| Scénario | Durée | Note |
|----------|-------|------|
| Même réplique (cachée) | ~0.1s | Lecture du cache IndexedDB |
| Nouvelle réplique (même voix) | ~0.5s | Modèle déjà chargé |
| Nouvelle réplique (autre voix) | ~2-3s | Chargement + synthèse |

### Optimisations

1. **Cache audio** : Répliques mises en cache après première génération
2. **Sessions persistantes** : Les modèles chargés restent en mémoire
3. **SIMD activé** : Accélération matérielle pour inférence
4. **Service Worker** : Assets mis en cache après première visite

---

## 🔮 Évolutions Futures

### Support Multi-Threading

Activer le multi-threading WASM pour meilleures performances :

```typescript
// Nécessite headers CORS stricts
ort.env.wasm.numThreads = 4
```

**Requis** :
- Headers `Cross-Origin-Embedder-Policy: require-corp`
- Headers `Cross-Origin-Opener-Policy: same-origin`

### Modèles Haute Qualité

Ajouter des voix `high` quality (~50 MB chacune) :

```typescript
{
  id: 'fr_FR-siwis-high',
  quality: 'high',
  downloadSize: 50_000_000,
}
```

### Compression

Utiliser GZIP/Brotli pour réduire la taille des modèles :

```nginx
gzip on;
gzip_types application/octet-stream;
```

---

## 📚 Références

- [Piper TTS](https://github.com/rhasspy/piper) - Moteur TTS open-source
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/) - Runtime d'inférence
- [Rhasspy Voices](https://huggingface.co/rhasspy/piper-voices) - Modèles de voix
- [MDN WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly) - Documentation WASM

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2025-01-13  
**Auteur** : Répét Contributors