# Rapport d'Incident - Fichiers WASM JSEP Manquants

**Date** : 2025-01-16  
**Sévérité** : 🔴 CRITIQUE - Application non fonctionnelle  
**Durée** : ~20 minutes  
**Status** : ✅ RÉSOLU

---

## 📋 Résumé

L'application ne démarrait plus sur `app.repet.ecanasso.org` suite au déploiement de la version 0.2.1, avec une erreur critique indiquant que les fichiers WASM JSEP étaient introuvables.

---

## 🐛 Symptômes

### Erreur Principale
```
no available backend found. ERR: 
[wasm] TypeError: Failed to fetch dynamically imported module: 
https://app.repet.ecanasso.org/wasm/ort-wasm-simd-threaded.jsep.mjs
```

### Erreurs Console
```
ort-wasm-simd-threaded.jsep.mjs:1 
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "text/html". 
Strict MIME type checking is enforced for module scripts per HTML spec.
```

### Impact Utilisateur
- ❌ Application complètement inutilisable
- ❌ Écran blanc au chargement
- ❌ Impossible d'importer ou de lire des pièces
- ✅ Build online (ios.repet.ecanasso.org) non affecté

---

## 🔍 Cause Racine

### Analyse

ONNX Runtime Web cherche à charger le fichier `ort-wasm-simd-threaded.jsep.mjs` pour le backend JSEP (JavaScript Execution Provider), qui permet l'accélération GPU/WebGPU.

**Fichiers manquants** :
- `ort-wasm-simd-threaded.jsep.mjs` (~49 KB)
- `ort-wasm-simd-threaded.jsep.wasm` (~23.8 MB)

### Configuration

**vite.config.online.ts** (✅ CORRECT) :
```typescript
{
  src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm',
  dest: 'wasm',
},
{
  src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs',
  dest: 'wasm',
},
```

**vite.config.offline.ts** (❌ MANQUANT) :
```typescript
// Seulement les fichiers de base étaient copiés :
{
  src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm',
  dest: 'wasm',
},
{
  src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs',
  dest: 'wasm',
},
// ❌ Les fichiers .jsep manquaient !
```

### Pourquoi le problème n'avait pas été détecté avant ?

1. **Build online fonctionnait** : Le fichier était présent dans `vite.config.online.ts`
2. **Tests locaux** : En développement, Vite peut servir les fichiers directement depuis node_modules
3. **Version précédente** : Peut-être qu'ONNX Runtime ne cherchait pas le backend JSEP avant (version antérieure ou configuration différente)

---

## 🚀 Solution Implémentée

### Commit : `e7c8e8d`

**Modification** : `vite.config.offline.ts`

```diff
         {
           src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs',
           dest: 'wasm',
         },
+        {
+          src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm',
+          dest: 'wasm',
+        },
+        {
+          src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs',
+          dest: 'wasm',
+        },
         // Fichiers WASM de Piper (phonemize)
```

### Impact sur la Taille du Build

**Avant** : ~249 MB (offline)  
**Après** : ~273 MB (offline)  
**Différence** : +24 MB (~9.6% d'augmentation)

**Détail** :
- `ort-wasm-simd-threaded.jsep.wasm` : 23.8 MB (5.66 MB gzippé)
- `ort-wasm-simd-threaded.jsep.mjs` : 49 KB

---

## ⏱️ Chronologie

| Heure | Événement |
|-------|-----------|
| 00:15 | Déploiement v0.2.1 (commit `3a30aa5`) |
| 00:18 | Correction lint (commit `cb5ad85`) |
| 00:22 | Debug logs (commit `5e1c1d7`) |
| 00:30 | **Rapport utilisateur** : Application ne démarre plus |
| 00:32 | Identification du problème WASM |
| 00:35 | Rollback v0.2.1 → v0.2.0 (commit `84ce89b`) |
| 00:40 | Identification de la cause racine |
| 00:45 | Fix implémenté et testé localement |
| 00:48 | Déploiement du fix (commit `e7c8e8d`) |
| 00:55 | **Application fonctionnelle** ✅ |

**Durée totale de l'incident** : ~25 minutes  
**Downtime** : ~20 minutes

---

## 📊 Actions Prises

### Immédiate (Rollback)

1. ✅ Revert des commits v0.2.1 (3 commits)
2. ✅ Push du rollback vers `main`
3. ✅ Déploiement automatique via GitHub Actions
4. ✅ Retour à v0.2.0 fonctionnelle

### Correctif (Fix)

1. ✅ Analyse du problème dans `vite.config.offline.ts`
2. ✅ Ajout des fichiers `.jsep.mjs` et `.jsep.wasm`
3. ✅ Build et vérification locale
4. ✅ Commit et déploiement du fix

---

## 🎓 Leçons Apprises

### Ce qui a bien fonctionné

✅ **Rollback rapide** : Réaction immédiate pour restaurer le service  
✅ **Diagnostic précis** : Logs d'erreur clairs ont permis d'identifier rapidement  
✅ **Build différenciés** : Le build online continuait de fonctionner  
✅ **CI/CD automatisé** : Déploiement rapide du fix

### Ce qui doit être amélioré

❌ **Tests de build** : Pas de vérification que tous les fichiers WASM nécessaires sont présents  
❌ **Tests e2e pré-déploiement** : L'application aurait dû être testée en production avant rollout complet  
❌ **Monitoring** : Pas d'alerte automatique sur l'erreur de démarrage

---

## 🔒 Prévention Future

### 1. Tests de Build Automatisés

Ajouter un test qui vérifie la présence des fichiers WASM critiques :

```typescript
// tests/build/wasm-files.spec.ts
describe('WASM Files', () => {
  it('should include all required ONNX Runtime files', () => {
    const requiredFiles = [
      'wasm/ort-wasm-simd-threaded.wasm',
      'wasm/ort-wasm-simd-threaded.mjs',
      'wasm/ort-wasm-simd-threaded.jsep.wasm',
      'wasm/ort-wasm-simd-threaded.jsep.mjs',
    ]
    
    requiredFiles.forEach(file => {
      expect(fs.existsSync(`dist-offline/${file}`)).toBe(true)
      expect(fs.existsSync(`dist-online/${file}`)).toBe(true)
    })
  })
})
```

### 2. Checklist Pré-Déploiement

- [ ] Build offline réussi
- [ ] Build online réussi
- [ ] Tous les fichiers WASM présents dans les deux builds
- [ ] Test de démarrage de l'application (smoke test)
- [ ] Vérification console : pas d'erreurs critiques

### 3. Déploiement Progressif

Considérer un déploiement progressif :
1. Déployer d'abord sur un environnement de staging
2. Tests automatisés sur staging
3. Tests manuels sur staging
4. Déploiement en production si tout est OK

### 4. Monitoring Amélioré

- Ajouter une alerte si l'application ne démarre pas (erreur au chargement)
- Logger les erreurs de chargement WASM côté serveur
- Healthcheck endpoint qui vérifie la disponibilité des fichiers WASM

---

## 📝 Notes Techniques

### Backends ONNX Runtime

ONNX Runtime Web supporte plusieurs backends d'exécution :

1. **WASM** (de base) : `ort-wasm-simd-threaded.wasm/mjs`
   - CPU uniquement
   - Multi-threaded avec SharedArrayBuffer
   - SIMD pour accélération

2. **JSEP** (JavaScript Execution Provider) : `ort-wasm-simd-threaded.jsep.wasm/mjs`
   - Accélération GPU via WebGPU/WebGL
   - Fallback vers CPU si GPU non disponible
   - Fichiers plus volumineux (~2x la taille)

3. **WebNN** : API native de ML
   - Pas encore utilisé dans notre config

### Pourquoi JSEP est maintenant requis ?

ONNX Runtime essaie de charger le meilleur backend disponible dans cet ordre :
1. WebGPU (via JSEP)
2. WebGL (via JSEP)
3. WASM (CPU)

Si les fichiers JSEP sont manquants, l'initialisation échoue même si on voulait utiliser uniquement le backend WASM CPU.

---

## 🔗 Références

- **Commit Fix** : `e7c8e8d` - fix: Ajouter fichiers WASM .jsep manquants au build offline
- **Commit Rollback** : `84ce89b` - revert: Rollback v0.2.1 - problème critique WASM au déploiement
- **ONNX Runtime Web** : https://onnxruntime.ai/docs/tutorials/web/
- **Issue similaire** : Fichiers WASM manquants dans les builds Vite

---

**Incident résolu** ✅  
**Application fonctionnelle** ✅  
**Documentation complète** ✅