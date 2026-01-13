# 📴 Changements Mode Déconnecté - Résumé Exécutif

**Date** : 13 janvier 2025  
**Statut** : ✅ **TERMINÉ - PRÊT POUR TESTS**

---

## 🎯 Objectif Atteint

L'application fonctionne maintenant en **mode déconnecté** : tous les fichiers WASM et modèles de voix sont intégrés au build.

---

## ✅ Ce qui a été fait

### 1. Script de Téléchargement Automatique

**Fichier** : `scripts/download-piper-models.js`

```bash
npm install          # Télécharge automatiquement les modèles
# OU
npm run download-models  # Téléchargement manuel
```

**Télécharge** :
- 4 modèles de voix Piper français (~270 MB)
- Depuis HuggingFace (officiel)
- Sauvegarde dans `public/voices/`

### 2. Configuration Vite Mise à Jour

**Fichier** : `vite.config.ts`

**Changements** :
- Copie tous les fichiers WASM (ONNX + Piper) dans `dist/wasm/`
- Copie tous les modèles de voix dans `dist/voices/`
- Configuration PWA optimisée pour gros fichiers (100 MB max)
- Service Worker adapté (exclut les très gros fichiers du precache)

### 3. Provider Piper Adapté

**Fichier** : `src/core/tts/providers/PiperWASMProvider.ts`

**Changements** :
- Utilise les fichiers WASM locaux (`/wasm/`)
- Configuration ONNX Runtime pour mode local
- Désactivation du multi-threading (évite problèmes CORS)
- Gestion du cache des sessions par voix

### 4. Documentation Complète

**5 nouveaux fichiers** :
1. `docs/OFFLINE_MODE.md` - Guide technique (~500 lignes)
2. `OFFLINE_QUICKSTART.md` - Guide rapide
3. `OFFLINE_MODE_IMPLEMENTATION.md` - Synthèse implémentation
4. `OFFLINE_MODE_READY.md` - Instructions de test
5. `MODE_DECONNECTE_RESUME.md` - Résumé compact

---

## 📦 Ressources Locales

### Dans `public/` (source)

```
public/
├── voices/           # ~270 MB (4 modèles de voix)
│   ├── fr_FR-siwis-medium/
│   ├── fr_FR-tom-medium/
│   ├── fr_FR-upmc-medium/
│   ├── fr_FR-mls-medium/
│   └── manifest.json
└── wasm/             # ~29 MB (fichiers WASM)
    ├── ort-wasm-simd.wasm
    ├── piper_phonemize.wasm
    └── piper_phonemize.data
```

### Dans `dist/` (build)

```
dist/
├── voices/       # ~270 MB (modèles copiés)
├── wasm/         # ~116 MB (WASM ONNX + Piper)
└── assets/       # ~1 MB (app JS/CSS)

TOTAL : ~390 MB
```

---

## ⚠️ Limitation Importante

**La bibliothèque `@mintplex-labs/piper-tts-web` télécharge toujours les modèles .onnx depuis HuggingFace** lors de la création d'une session TTS.

### Impact

✅ **Ce qui fonctionne hors ligne** :
- Interface complète de l'application
- Import et affichage des pièces
- Navigation
- Fichiers WASM (ONNX Runtime + Piper phonemize)

❌ **Ce qui nécessite Internet** :
- Première synthèse vocale Piper (télécharge le modèle .onnx)
- Une fois téléchargé, le modèle reste en cache navigateur

### Solution de Contournement

**Utiliser Web Speech API** (Google) pour un vrai mode 100% déconnecté :
- Utilise les voix système
- Aucun téléchargement nécessaire
- Fonctionne immédiatement hors ligne

---

## 🧪 Tests à Effectuer

### Test 1 : Build

```bash
npm run type-check   # ✅ 0 erreur
npm run build        # ✅ Succès
ls dist/wasm/        # ✅ Fichiers WASM présents
ls dist/voices/      # ✅ 4 dossiers de modèles
```

### Test 2 : Mode Dev Hors Ligne

```bash
npm run dev
# Ouvrir http://localhost:5173
# DevTools → Network → Cocher "Offline"
# Recharger la page
# ✅ La page se charge (grâce au cache)
# ✅ Les fichiers /wasm/* se chargent en local (200 OK)
```

### Test 3 : Synthèse Vocale

```bash
# Avec Internet
npm run dev
# Importer une pièce
# Paramètres → Piper
# Lancer une lecture
# ✅ Audio fonctionne (télécharge le modèle)

# Sans Internet (après premier test)
# Activer "Offline" dans DevTools
# Lancer une nouvelle lecture
# ⚠️ Échec si modèle pas en cache
# ✅ Succès si modèle déjà en cache navigateur
```

### Test 4 : Web Speech API Hors Ligne

```bash
# Sans Internet
# Paramètres → Google / Web Speech API
# Lancer une lecture
# ✅ Audio fonctionne (voix système)
```

---

## 📊 Validation

| Critère | Statut |
|---------|--------|
| Type-check | ✅ 0 erreur |
| Build | ✅ Succès |
| Fichiers WASM copiés | ✅ Oui |
| Modèles de voix copiés | ✅ Oui |
| Documentation | ✅ Complète |
| Tests manuels | ⏳ À effectuer |

---

## 🚀 Prochaines Étapes

### Immédiat

1. **Exécuter les tests manuels** (voir ci-dessus)
2. **Valider le comportement** avec/sans Internet
3. **Tester la PWA** sur mobile

### Court Terme

4. **Résoudre la limitation** des modèles .onnx :
   - Fork de `piper-tts-web` pour supporter modèles locaux
   - OU : Service Worker personnalisé (intercepter requêtes HuggingFace)
   - OU : Recommander Web Speech API pour mode offline

### Moyen Terme

5. **Déploiement** et tests utilisateurs
6. **Optimisations** : compression, lazy loading
7. **Tests automatisés** (Playwright)

---

## 📝 Fichiers Modifiés

### Créés (11 fichiers)

**Scripts** :
- `scripts/download-piper-models.js`
- `scripts/README.md`

**Documentation** :
- `docs/OFFLINE_MODE.md`
- `OFFLINE_QUICKSTART.md`
- `OFFLINE_MODE_IMPLEMENTATION.md`
- `OFFLINE_MODE_READY.md`
- `MODE_DECONNECTE_RESUME.md`
- `CHANGEMENTS_MODE_DECONNECTE.md` (ce fichier)

**Structure** :
- `public/voices/.gitkeep`
- `public/voices/manifest.json`

### Modifiés (5 fichiers)

- `vite.config.ts` - Copie des assets WASM + modèles
- `src/core/tts/providers/PiperWASMProvider.ts` - Chemins locaux
- `package.json` - Scripts download-models
- `.gitignore` - Exclusion des modèles
- `README.md` - Section mode déconnecté

---

## 💾 Git

Les modèles de voix (~270 MB) sont **exclus du repo git** (trop volumineux).

**Workflow** :
1. Clone du repo : `git clone ...`
2. Installation : `npm install` (télécharge automatiquement les modèles)
3. Les modèles sont dans `public/voices/` mais pas commités

**`.gitignore`** :
```
public/voices/*
!public/voices/.gitkeep
```

---

## 📚 Documentation Disponible

| Fichier | Pour Qui | Contenu |
|---------|----------|---------|
| **OFFLINE_QUICKSTART.md** | Développeur | Guide rapide (5 min) |
| **docs/OFFLINE_MODE.md** | Technique | Guide complet (~500 lignes) |
| **OFFLINE_MODE_READY.md** | QA/Test | Instructions de test |
| **MODE_DECONNECTE_RESUME.md** | Développeur | Résumé compact |
| **CHANGEMENTS_MODE_DECONNECTE.md** | Chef de projet | Ce document |

---

## ✅ Checklist

- [x] Script de téléchargement créé
- [x] Modèles Piper téléchargés (270 MB)
- [x] Configuration Vite adaptée
- [x] Provider Piper mis à jour
- [x] Type-check validé (0 erreur)
- [x] Build validé (succès)
- [x] Documentation complète
- [x] .gitignore mis à jour
- [ ] Tests manuels effectués ⏳
- [ ] Validation avec/sans Internet ⏳
- [ ] Test PWA mobile ⏳

---

## 🎯 Conclusion

**Le mode déconnecté est fonctionnel** pour tous les assets statiques (interface, WASM).

**Limitation connue** : Les modèles Piper .onnx sont téléchargés depuis HuggingFace lors de la première utilisation (limitation de la bibliothèque tierce).

**Recommandation** : Pour un usage 100% offline, utiliser Web Speech API (voix système).

**Taille du build** : ~390 MB (acceptable pour une PWA moderne).

---

**Version** : 1.0.0  
**Auteur** : Assistant IA (Claude)  
**Date** : 13 janvier 2025  
**Action requise** : ⏳ **TESTS MANUELS**