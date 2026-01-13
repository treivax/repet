# ✅ Tests à Faire - Mode Déconnecté

**Prérequis** : Avoir chargé `common.md` en mémoire et vérifié l'implémentation

---

## 1️⃣ Vérification des Fichiers

```bash
# Vérifier que les modèles sont téléchargés
ls -lh public/voices/
# ✅ Devrait afficher 4 dossiers + manifest.json

# Vérifier les fichiers WASM
ls -lh public/wasm/
# ✅ Devrait afficher 3 fichiers (ort-wasm-simd.wasm, piper_phonemize.*)

# Vérifier la taille totale
du -sh public/voices/
# ✅ Environ 270 MB

du -sh public/wasm/
# ✅ Environ 29 MB
```

---

## 2️⃣ Type-Check et Build

```bash
# Vérifier qu'il n'y a pas d'erreurs TypeScript
npm run type-check
# ✅ Aucune erreur attendue

# Builder l'application
npm run build
# ✅ Le build doit réussir

# Vérifier que les fichiers sont copiés dans dist/
ls -lh dist/wasm/
ls -lh dist/voices/
# ✅ Tous les fichiers doivent être présents
```

---

## 3️⃣ Test en Mode Dev

```bash
# Lancer le serveur de développement
npm run dev
```

**Dans le navigateur** :

1. Ouvrir http://localhost:5173
2. Ouvrir DevTools (F12)
3. Aller dans l'onglet **Network**
4. Filtrer par "wasm"
5. Importer une pièce de test
6. Aller dans les paramètres de la pièce
7. Sélectionner "Piper (Voix naturelles)"
8. Lancer une lecture
9. **Vérifier dans Network** :
   - ✅ `/wasm/ort-wasm-simd.wasm` → Status 200 (local)
   - ✅ `/wasm/piper_phonemize.wasm` → Status 200 (local)
   - ✅ `/wasm/piper_phonemize.data` → Status 200 (local)

---

## 4️⃣ Test Hors Ligne (Dev)

**Dans le navigateur** (toujours sur http://localhost:5173) :

1. **Network** → Cocher **"Offline"**
2. Recharger la page (F5)
3. ✅ La page devrait se charger (grâce au cache)
4. Importer une pièce (fichier local)
5. ✅ L'import devrait fonctionner
6. Aller dans paramètres → Choisir "Piper"
7. Lancer une lecture
8. **Observer** :
   - ✅ Les fichiers WASM se chargent en local
   - ⚠️ **Limitation connue** : Le modèle .onnx sera téléchargé depuis HuggingFace (nécessite Internet)
   - Si déjà en cache navigateur → ✅ Fonctionnera hors ligne

---

## 5️⃣ Test Web Speech API (Vraiment Hors Ligne)

**Dans le navigateur** (mode Offline activé) :

1. Paramètres de la pièce
2. Sélectionner **"Google / Web Speech API"**
3. Lancer une lecture
4. ✅ **Devrait fonctionner sans Internet** (utilise voix système)

---

## 6️⃣ Test en Mode Production

```bash
# Builder
npm run build

# Lancer le serveur de preview
npm run preview
```

**Dans le navigateur** :

1. Ouvrir http://localhost:4173
2. Répéter les tests 3, 4, 5 ci-dessus
3. ✅ Le comportement doit être identique au mode dev

---

## 7️⃣ Test Console (Logs)

**Dans la console du navigateur**, rechercher :

```
[PiperWASM] 🔧 Initialisation du provider...
[PiperWASM] ✅ ONNX Runtime configuré
[PiperWASM]    - WASM Path: /wasm/
[PiperWASM]    - Threads: 1 (single-threaded)
[PiperWASM]    - SIMD: enabled
[PiperWASM] ✅ Cache audio initialisé
```

✅ Ces logs confirment que le provider utilise bien les fichiers locaux

---

## 8️⃣ Vérifier la Taille du Build

```bash
# Taille totale du build
du -sh dist/
# ✅ Environ 390 MB

# Détails
du -sh dist/wasm/    # ~116 MB
du -sh dist/voices/  # ~270 MB
du -sh dist/assets/  # ~1 MB
```

---

## 📊 Résultat Attendu

### ✅ Ce qui doit fonctionner

- Interface complète de l'app
- Import de pièces
- Fichiers WASM chargés en local
- Web Speech API hors ligne
- Build de production

### ⚠️ Limitation Connue

- Les modèles Piper .onnx sont téléchargés depuis HuggingFace
- **Première utilisation d'une voix Piper nécessite Internet**
- Une fois en cache navigateur, fonctionnera hors ligne

### 💡 Solution

**Pour un vrai mode 100% déconnecté** :
→ Utiliser **Web Speech API** (Google)
→ Pas de téléchargement, voix système

---

## 🐛 En Cas de Problème

### Erreur "Failed to fetch WASM"

```bash
# Vider le cache et reconstruire
rm -rf dist/
npm run build
```

### Modèles manquants

```bash
# Re-télécharger les modèles
rm -rf public/voices/*
npm run download-models
```

### Erreurs TypeScript

```bash
# Vérifier
npm run type-check
```

---

## 📝 Rapport de Test

Après avoir effectué tous les tests, noter :

- [ ] Test 1 : Fichiers présents ✅ / ❌
- [ ] Test 2 : Build réussi ✅ / ❌
- [ ] Test 3 : Mode dev local fonctionne ✅ / ❌
- [ ] Test 4 : Mode hors ligne (limitations observées)
- [ ] Test 5 : Web Speech API offline ✅ / ❌
- [ ] Test 6 : Mode production ✅ / ❌
- [ ] Test 7 : Logs corrects ✅ / ❌
- [ ] Test 8 : Taille du build acceptable ✅ / ❌

---

**Date de test** : _______________  
**Testé par** : _______________  
**Résultat global** : ✅ / ⚠️ / ❌