# 📴 Mode Déconnecté - Résumé

**Date** : 13 janvier 2025  
**Statut** : ✅ IMPLÉMENTÉ - PRÊT POUR TESTS

---

## ✅ Ce qui fonctionne

- ✅ **Fichiers WASM locaux** : ONNX Runtime + Piper phonemize (~29 MB)
- ✅ **4 voix françaises téléchargées** : ~270 MB intégrés au build
- ✅ **Build validé** : 0 erreur TypeScript, build réussi (~390 MB)
- ✅ **Configuration PWA** optimisée pour gros fichiers
- ✅ **Documentation complète** (5 fichiers, ~2000 lignes)

---

## ⚠️ Limitation Actuelle

La bibliothèque `@mintplex-labs/piper-tts-web` télécharge **toujours** les modèles .onnx depuis HuggingFace au moment de créer une session TTS.

**Impact** :
- Les fichiers WASM sont 100% locaux ✅
- L'interface fonctionne hors ligne ✅
- **La première synthèse Piper nécessite Internet** ❌
- Une fois téléchargé, le modèle est en cache ✅

**Workaround** : Utiliser **Web Speech API** (Google) pour un vrai mode déconnecté.

---

## 🚀 Démarrage Rapide

```bash
# Installation (modèles déjà téléchargés)
npm install

# Vérifier les fichiers
ls public/voices/  # 4 dossiers + manifest.json
ls public/wasm/    # 3 fichiers WASM

# Développement
npm run dev        # http://localhost:5173

# Build
npm run build      # dist/ contient tout

# Preview
npm run preview    # http://localhost:4173
```

---

## 📦 Fichiers Créés/Modifiés

### Créés (6 fichiers)

1. `scripts/download-piper-models.js` - Script de téléchargement des modèles
2. `scripts/README.md` - Documentation du script
3. `docs/OFFLINE_MODE.md` - Guide technique complet (~500 lignes)
4. `OFFLINE_QUICKSTART.md` - Guide rapide
5. `OFFLINE_MODE_IMPLEMENTATION.md` - Synthèse implémentation
6. `OFFLINE_MODE_READY.md` - Instructions de test

### Modifiés (4 fichiers)

1. `vite.config.ts` - Copie des assets WASM + modèles
2. `src/core/tts/providers/PiperWASMProvider.ts` - Chemins locaux
3. `package.json` - Scripts download-models + postinstall
4. `.gitignore` - Exclusion des modèles (trop gros pour git)

### Téléchargés (270 MB)

```
public/voices/
├── fr_FR-siwis-medium/    (61 MB)
├── fr_FR-tom-medium/      (61 MB)
├── fr_FR-upmc-medium/     (74 MB)
├── fr_FR-mls-medium/      (74 MB)
└── manifest.json

public/wasm/
├── ort-wasm-simd.wasm      (11 MB)
├── piper_phonemize.wasm    (621 KB)
└── piper_phonemize.data    (18 MB)
```

---

## 🧪 Tests Requis

```bash
# 1. Type-check
npm run type-check
# ✅ 0 erreur

# 2. Build
npm run build
# ✅ dist/wasm/ et dist/voices/ présents

# 3. Test dev hors ligne
npm run dev
# Ouvrir DevTools → Network → Offline
# ✅ Vérifier que /wasm/* se charge en local

# 4. Test production
npm run preview
# Tester avec mode Offline activé
```

---

## 📚 Documentation

| Fichier | Description |
|---------|-------------|
| **OFFLINE_QUICKSTART.md** | Guide rapide (3 min) |
| **docs/OFFLINE_MODE.md** | Guide complet technique |
| **OFFLINE_MODE_READY.md** | Instructions de test |
| **scripts/README.md** | Doc du script de téléchargement |

---

## 🎯 Prochaines Étapes

### Immédiat
1. ⏳ **Exécuter les tests manuels** (voir OFFLINE_MODE_READY.md)
2. ⏳ **Valider le comportement** avec/sans Internet
3. ⏳ **Documenter les résultats** des tests

### Court Terme
4. 🔧 **Résoudre la limitation** des modèles .onnx :
   - Option A : Fork piper-tts-web pour modèles locaux
   - Option B : Service Worker personnalisé
   - Option C : Recommander Web Speech API offline

### Moyen Terme
5. 🚀 **Déploiement** staging → production
6. 📖 **Guide utilisateur** "Mode avion"
7. 🧪 **Tests automatisés** (Playwright)

---

## 💡 Recommandation

**Pour un vrai mode 100% déconnecté** : Utiliser **Web Speech API (Google)** qui utilise les voix système sans téléchargement.

**Piper sera utilisable hors ligne** uniquement après une première connexion pour télécharger les modèles (qui seront ensuite en cache navigateur).

---

**Version** : 1.0.0  
**Contact** : Voir [GitHub Issues](https://github.com/your-repo/repet/issues)