# 🚀 Mode Déconnecté - Guide de Démarrage Rapide

**Préparez Répét pour un fonctionnement 100% hors ligne en 3 étapes**

---

## ⚡ Installation Rapide

### 1️⃣ Installer les dépendances

```bash
npm install
```

✅ Les modèles Piper seront téléchargés automatiquement (~67 MB, 2-5 min)

### 2️⃣ Vérifier l'installation

```bash
# Vérifier les fichiers WASM
ls public/wasm/
# ✓ ort-wasm-simd.wasm
# ✓ piper_phonemize.wasm
# ✓ piper_phonemize.data

# Vérifier les modèles de voix
ls public/voices/
# ✓ fr_FR-siwis-medium/
# ✓ fr_FR-tom-medium/
# ✓ fr_FR-upmc-medium/
# ✓ fr_FR-mls-medium/
# ✓ manifest.json
```

### 3️⃣ Lancer l'application

```bash
npm run dev
```

🎉 **C'est tout !** L'application fonctionne maintenant en mode déconnecté.

---

## 🧪 Test Hors Ligne

### En Mode Dev

1. Ouvrir http://localhost:5173
2. **DevTools** → **Network** → Cocher **Offline**
3. Recharger la page
4. Importer une pièce et lancer une lecture avec Piper
5. ✅ **Doit fonctionner sans Internet**

### En Mode Production

```bash
# Builder
npm run build

# Vérifier que tout est copié
ls dist/wasm/     # Fichiers WASM
ls dist/voices/   # Modèles Piper

# Prévisualiser
npm run preview

# Tester sur http://localhost:4173
```

---

## 📦 Que Contient le Build ?

```
dist/
├── wasm/                        # ~15 MB
│   ├── ort-wasm-simd.wasm      # ONNX Runtime
│   ├── piper_phonemize.wasm    # Piper phonemize
│   └── piper_phonemize.data    # Données phonétiques
│
├── voices/                      # ~60 MB
│   ├── fr_FR-siwis-medium/     # Voix féminine 1
│   ├── fr_FR-tom-medium/       # Voix masculine 1
│   ├── fr_FR-upmc-medium/      # Voix féminine 2
│   ├── fr_FR-mls-medium/       # Voix masculine 2
│   └── manifest.json
│
├── assets/                      # ~2 MB (JS/CSS app)
├── icons/                       # Icônes PWA
└── index.html                   # Point d'entrée
```

**Taille totale** : ~80-100 MB

---

## 🔧 Dépannage Express

### ❌ Les modèles ne se téléchargent pas

```bash
# Télécharger manuellement
npm run download-models
```

### ❌ Erreur "Failed to fetch WASM"

```bash
# Reconstruire
rm -rf dist/
npm run build
```

### ❌ Pas de son lors de la lecture

1. Vérifier la console pour les erreurs `[PiperWASM]`
2. Essayer avec **Google / Web Speech API** (Paramètres de la pièce)
3. Vérifier que l'audio n'est pas coupé dans le navigateur

### ❌ "Model not found"

```bash
# Re-télécharger les modèles
rm -rf public/voices/
npm run download-models
```

---

## 📊 Performance Attendue

| Action | Temps | Note |
|--------|-------|------|
| **Premier lancement** | 4-6s | Chargement WASM + modèle |
| **Répliques suivantes** | 0.5-1s | Modèle déjà chargé |
| **Répliques en cache** | <0.1s | Lecture directe |

---

## 🎯 Voix Disponibles

| Nom | Genre | Qualité | Taille |
|-----|-------|---------|--------|
| **Siwis** | Femme | Medium | ~15 MB |
| **Tom** | Homme | Medium | ~15 MB |
| **UPMC Jessica** | Femme | Medium | ~16 MB |
| **MLS Pierre** | Homme | Medium | ~14 MB |

Les voix sont automatiquement assignées aux personnages selon leur genre.

---

## 🌐 Déploiement

Le dossier `dist/` peut être déployé sur n'importe quel hébergement statique :

```bash
# Netlify
npm run deploy:netlify

# Vercel
npm run deploy:vercel

# Serveur custom
rsync -av dist/ user@server:/var/www/repet/
```

✅ **Fonctionne hors ligne** après la première visite (PWA + Service Worker)

---

## 📚 Documentation Complète

Pour plus de détails, voir :
- **[docs/OFFLINE_MODE.md](docs/OFFLINE_MODE.md)** - Documentation technique complète
- **[scripts/README.md](scripts/README.md)** - Détails sur le script de téléchargement

---

## ✅ Checklist de Validation

- [ ] `npm install` termine sans erreur
- [ ] Dossier `public/voices/` contient 4 sous-dossiers
- [ ] Dossier `public/wasm/` contient 3 fichiers
- [ ] `npm run dev` démarre sans erreur
- [ ] Test hors ligne réussi (DevTools → Offline)
- [ ] Audio Piper fonctionne
- [ ] `npm run build` crée `dist/wasm/` et `dist/voices/`
- [ ] PWA installable sur mobile/desktop

---

**Version** : 1.0.0  
**Date** : 2025-01-13  
**Support** : Voir [GitHub Issues](https://github.com/your-repo/repet/issues)