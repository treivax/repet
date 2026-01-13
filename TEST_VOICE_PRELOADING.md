# Guide de test - Préchargement des voix

## 🎯 Objectif

Vérifier que le préchargement automatique des voix fonctionne correctement au démarrage de l'application.

---

## ✅ Pré-requis

1. **Build de l'application** :
   ```bash
   npm run build
   ```

2. **Lancer le serveur de prévisualisation** :
   ```bash
   npm run preview
   ```

3. **Navigateur moderne** : Chrome, Firefox, Edge (avec support WebAssembly)

---

## 🧪 Tests à effectuer

### Test 1 : Premier chargement (cache vide)

**Objectif** : Vérifier le chargement complet des 4 voix depuis zéro

#### Étapes :

1. **Ouvrir la console du navigateur** (F12)

2. **Vider tous les caches** :
   ```javascript
   await window.clearAllCaches()
   ```

3. **Recharger la page** (Ctrl+R ou Cmd+R)

4. **Observer l'écran de chargement initial** :
   - ✅ Texte "Répét" affiché
   - ✅ Message "Initialisation de l'application..."
   - ✅ Spinner animé

5. **Observer l'écran de préchargement** :
   - ✅ Titre "Répét"
   - ✅ Message "Chargement des voix de synthèse vocale..."
   - ✅ Barre de progression globale (0-100%)
   - ✅ Liste de 4 voix :
     - Siwis (Femme, France)
     - Tom (Homme, France)
     - UPMC Jessica (Femme, France)
     - MLS Pierre (Homme, France)

6. **Observer le chargement séquentiel** :
   - ✅ Première voix passe de "En attente..." → "X%" → "✓ Chargée"
   - ✅ Fond change : gris → bleu (en cours) → vert (terminé)
   - ✅ Barre de progression individuelle visible pendant le chargement
   - ✅ Progression globale augmente de 0% à 25% pour la première voix

7. **Répéter pour les 4 voix** :
   - ✅ Chaque voix se charge séquentiellement
   - ✅ Progression globale : 0% → 25% → 50% → 75% → 100%

8. **Observer la fin du chargement** :
   - ✅ Progression globale atteint 100%
   - ✅ Toutes les voix marquées "✓ Chargée" (fond vert)
   - ✅ L'application normale s'affiche après ~500ms

#### Logs attendus dans la console :

```
[Main] 🔒 Installation de l'intercepteur réseau pour mode offline complet
[NetworkInterceptor] ✅ Intercepteur réseau installé
[CacheCleaner] 🔧 Fonctions exposées dans window:
[Main] 🚀 Initialisation de la base de données et du moteur TTS...
[PiperWASM] 🔧 Initialisation du provider...
[PiperWASM] ✅ ONNX Runtime configuré
[PiperWASM] ✅ Chemins WASM configurés pour TtsSession
[PiperWASM] ✅ Cache audio initialisé
[Main] ✅ Base de données et TTS initialisés
[Main] ✅ Application prête à démarrer
[PiperDebug] 🔧 Utilitaires de diagnostic exposés dans window.piperDebug:
[VoicePreloader] 🚀 Préchargement de 4 voix...
[VoicePreloader] 📥 Chargement 1/4: Siwis (Femme, France)
[PiperWASM] 📥 Pré-chargement du modèle fr_FR-siwis-medium...
[PiperWASM] 📥 Chargement modèle fr_FR-siwis-medium: 10% (...)
[PiperWASM] 📥 Chargement modèle fr_FR-siwis-medium: 50% (...)
[PiperWASM] 📥 Chargement modèle fr_FR-siwis-medium: 100% (...)
[PiperWASM] ✅ Modèle fr_FR-siwis-medium pré-chargé avec succès (35000ms)
[VoicePreloader] ✅ Siwis (Femme, France) chargée avec succès
[VoicePreloader] 📥 Chargement 2/4: Tom (Homme, France)
...
[VoicePreloader] ✅ Toutes les voix sont chargées !
```

#### Durée attendue :

- **Total** : 2-4 minutes pour 4 voix
- **Par voix** : 30-70 secondes selon la taille du modèle

---

### Test 2 : Vérification du cache de sessions

**Objectif** : Confirmer que les sessions sont bien en mémoire

#### Étapes :

1. **Après le chargement complet**, ouvrir la console

2. **Vérifier le cache de sessions** :
   ```javascript
   window.piperDebug.getSessionCacheStats()
   ```

   **Résultat attendu** :
   ```javascript
   {
     voiceCount: 4,
     voices: [
       'fr_FR-siwis-medium',
       'fr_FR-tom-medium',
       'fr_FR-upmc-medium',
       'fr_FR-mls-medium'
     ]
   }
   ```

3. **Vérifier les stats complètes** :
   ```javascript
   await window.piperDebug.logAllStats()
   ```

   **Résultat attendu** :
   ```
   [PiperDebug] 📊 Statistiques complètes
   [PiperDebug] 📊 Cache de sessions:
     - Voix en cache: 4
     - IDs: fr_FR-siwis-medium, fr_FR-tom-medium, ...
   [PiperDebug] 📊 Cache audio:
     - Nombre d'entrées: 0
     - Taille: 0 B
   ```

---

### Test 3 : Synthèse vocale après préchargement

**Objectif** : Vérifier que la synthèse est instantanée

#### Étapes :

1. **Créer un nouveau dialogue** :
   - Cliquer sur "Nouveau dialogue"
   - Donner un titre

2. **Ajouter des personnages** :
   - Ajouter "Alice" (femme)
   - Ajouter "Bob" (homme)

3. **Ajouter du texte** :
   - Coller quelques répliques
   - Assigner les personnages

4. **Lire le dialogue** :
   - Cliquer sur le bouton "Lire"

5. **Observer les temps de synthèse** dans la console :
   ```
   [PiperWASM] 🔍 Vérification du cache pour voiceId="fr_FR-tom-medium"
   [PiperWASM] ❌ Audio NON trouvé dans le cache
   [PiperWASM] ♻️ Utilisation de la session en cache pour fr_FR-tom-medium
   [PiperWASM] 🎤 Synthèse avec fr_FR-tom-medium
   [PiperWASM] ✅ Synthèse terminée en 420ms
   ```

#### Résultat attendu :

- ✅ Première synthèse de chaque voix : **< 1 seconde**
- ✅ Pas de message "🔄 Création d'une nouvelle session"
- ✅ Message "♻️ Utilisation de la session en cache"
- ✅ Audio généré et mis en cache

---

### Test 4 : Rechargement de la page (cache présent)

**Objectif** : Vérifier que le cache OPFS accélère le préchargement

#### Étapes :

1. **Recharger la page** (sans vider le cache)

2. **Observer le préchargement** :
   - ✅ Écran de préchargement toujours affiché
   - ✅ Chargement **beaucoup plus rapide** (30 secondes au lieu de 4 minutes)
   - ✅ Grâce au cache OPFS des modèles

3. **Vérifier dans la console** :
   - Moins de logs "📥 Chargement modèle X%"
   - Chargement quasi-instantané si déjà en cache

---

### Test 5 : Gestion d'erreur (simulation)

**Objectif** : Vérifier l'écran d'erreur

#### Étapes :

1. **Simuler une erreur** en désactivant WebAssembly (difficile)

   **OU**

2. **Vérifier le code d'erreur** :
   - Voir le composant `VoicePreloader.tsx`
   - Écran rouge avec message d'erreur
   - Bouton "Recharger la page"

---

## 📊 Métriques de performance

### Temps attendus (première visite)

| Phase | Durée |
|-------|-------|
| Écran initial | <1s |
| Initialisation React | 1-2s |
| Chargement voix 1 (61 MB) | 30-60s |
| Chargement voix 2 (61 MB) | 30-60s |
| Chargement voix 3 (74 MB) | 40-70s |
| Chargement voix 4 (74 MB) | 40-70s |
| **Total** | **2-4 min** |

### Temps attendus (visite suivante avec cache)

| Phase | Durée |
|-------|-------|
| Écran initial | <1s |
| Initialisation React | 1-2s |
| Chargement 4 voix (depuis cache OPFS) | 10-30s |
| **Total** | **15-35s** |

### Utilisation mémoire

| Ressource | Taille |
|-----------|--------|
| Session voix 1 | ~100 MB |
| Session voix 2 | ~100 MB |
| Session voix 3 | ~100 MB |
| Session voix 4 | ~100 MB |
| **Total RAM** | **~400 MB** |

---

## ❌ Problèmes connus et solutions

### Erreur "Provider Piper WASM non disponible"

**Cause** : Provider pas encore initialisé

**Solution** : ✅ **Déjà corrigé** - React ne démarre qu'après l'initialisation complète

---

### Temps de chargement excessif (>5 minutes)

**Causes possibles** :
- Connexion lente (ne devrait pas arriver, fichiers locaux)
- CPU lent (optimisation ONNX lente)
- Problème avec SIMD/threads

**Solutions** :
- Vérifier les logs de progression
- Vider les caches et réessayer
- Tester dans un navigateur différent

---

### L'écran de chargement ne disparaît jamais

**Cause** : Une voix a échoué à charger

**Solution** :
- Vérifier les logs d'erreur dans la console
- Vérifier que tous les fichiers `.onnx` sont présents dans `public/models/piper/`
- Vérifier que les fichiers WASM sont dans `public/wasm/`

---

## 🔧 Commandes utiles

### Vider tous les caches
```javascript
await window.clearAllCaches()
```

### Vider uniquement le cache de sessions
```javascript
await window.piperDebug.clearSessionCache()
```

### Vider uniquement le cache audio
```javascript
await window.clearAudioCache()
```

### Stats de stockage
```javascript
await window.logStorageStats()
```

### Pré-charger une voix manuellement
```javascript
await window.piperDebug.preloadModel('fr_FR-tom-medium')
```

---

## ✅ Checklist de validation

Avant de considérer le préchargement comme fonctionnel :

- [ ] Écran de chargement initial s'affiche
- [ ] Écran de préchargement s'affiche avec 4 voix
- [ ] Les 4 voix se chargent séquentiellement
- [ ] Barre de progression globale va de 0% à 100%
- [ ] Toutes les voix marquées "✓ Chargée" (fond vert)
- [ ] Application s'affiche après 100%
- [ ] Cache de sessions contient 4 voix (`window.piperDebug.getSessionCacheStats()`)
- [ ] Synthèse vocale instantanée (<1s) après préchargement
- [ ] Logs console corrects (pas d'erreurs)
- [ ] Rechargement de la page plus rapide (cache OPFS)

---

## 📚 Ressources

- **Documentation** : `docs/VOICE_PRELOADING.md`
- **Cache de sessions** : `docs/PIPER_SESSION_CACHE.md`
- **Changelog** : `CHANGELOG_VOICE_PRELOADING.md`
- **Code source** : `src/components/voice-preloader/VoicePreloader.tsx`

---

## 🎯 Résultat attendu final

Après avoir suivi tous les tests :

✅ **Premier chargement** : 2-4 minutes d'attente, puis application fluide  
✅ **Visites suivantes** : 15-35 secondes de chargement  
✅ **Synthèse vocale** : Instantanée (<1 seconde) pendant toute l'utilisation  
✅ **Expérience utilisateur** : Transparente et prévisible  
✅ **Pas de latence** : Aucune attente entre les répliques  

🚀 **L'application est prête pour une utilisation professionnelle !**