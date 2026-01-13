# Scripts - Répét

Scripts utilitaires pour la gestion de l'application.

---

## 📥 download-piper-models.js

**Script de téléchargement des modèles Piper pour mode déconnecté**

### Usage

```bash
# Automatique lors de npm install
npm install

# Manuel
npm run download-models

# Direct
node scripts/download-piper-models.js
```

### Fonction

Télécharge tous les fichiers nécessaires pour un fonctionnement 100% hors ligne :

1. **Modèles de voix Piper** (~60 MB)
   - `fr_FR-siwis-medium` (Femme)
   - `fr_FR-tom-medium` (Homme)
   - `fr_FR-upmc-medium` (Femme)
   - `fr_FR-mls-medium` (Homme)

2. **Fichiers WASM Piper** (~7 MB)
   - `piper_phonemize.wasm`
   - `piper_phonemize.data`

3. **Manifest** (liste des modèles)
   - `manifest.json`

### Structure de sortie

```
public/
├── voices/
│   ├── fr_FR-siwis-medium/
│   │   ├── fr_FR-siwis-medium.onnx
│   │   └── fr_FR-siwis-medium.onnx.json
│   ├── fr_FR-tom-medium/
│   │   ├── fr_FR-tom-medium.onnx
│   │   └── fr_FR-tom-medium.onnx.json
│   ├── fr_FR-upmc-medium/
│   │   ├── fr_FR-upmc-medium.onnx
│   │   └── fr_FR-upmc-medium.onnx.json
│   ├── fr_FR-mls-medium/
│   │   ├── fr_FR-mls-medium.onnx
│   │   └── fr_FR-mls-medium.onnx.json
│   └── manifest.json
└── wasm/
    ├── piper_phonemize.wasm
    └── piper_phonemize.data
```

### Sources

- **Modèles** : [HuggingFace - rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices)
- **WASM** : [jsDelivr CDN - @rhasspy/piper-phonemize-wasm](https://cdn.jsdelivr.net/npm/@rhasspy/piper-phonemize-wasm@1.0.0/)

### Temps d'exécution

- **~2-5 minutes** selon la connexion Internet
- **~67 MB** de données téléchargées au total

### Gestion des erreurs

Le script :
- ✅ Crée automatiquement les dossiers nécessaires
- ✅ Affiche la progression pour chaque fichier
- ✅ Gère les erreurs réseau
- ✅ Retourne un code d'erreur si échec
- ✅ Peut être ré-exécuté sans problème (écrase les fichiers existants)

### Dépannage

#### Erreur de téléchargement

```
❌ Erreur lors du téléchargement de https://...
```

**Solutions** :
1. Vérifier la connexion Internet
2. Vérifier que HuggingFace n'est pas bloqué
3. Réessayer : `npm run download-models`

#### Problème de permissions

```
Error: EACCES: permission denied
```

**Solutions** :
1. Vérifier les permissions du dossier `public/`
2. Exécuter avec les bonnes permissions : `sudo npm run download-models` (Linux/Mac)

#### Espace disque insuffisant

```
Error: ENOSPC: no space left on device
```

**Solutions** :
1. Libérer ~100 MB d'espace disque
2. Vérifier : `df -h` (Linux/Mac) ou voir l'espace disque (Windows)

---

## 🔮 Scripts Futurs

### cleanup-cache.js

Nettoyage du cache audio IndexedDB

### validate-models.js

Validation de l'intégrité des modèles téléchargés

### benchmark-voices.js

Benchmark de performance des différentes voix

---

**Documentation complète** : Voir [docs/OFFLINE_MODE.md](../docs/OFFLINE_MODE.md)