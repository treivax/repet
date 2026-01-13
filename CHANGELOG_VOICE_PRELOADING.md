# Changelog - Préchargement automatique des voix au démarrage

## 🎉 Nouvelle fonctionnalité : Préchargement automatique des voix

### Date : 14 janvier 2025

---

## 📝 Résumé des changements

L'application charge maintenant **automatiquement toutes les voix Piper au démarrage** avec une interface de progression visible, garantissant une expérience utilisateur optimale sans latence pendant l'utilisation.

---

## ✨ Ce qui a changé

### Avant

- ❌ Première utilisation de chaque voix : **30-60 secondes d'attente**
- ❌ Pas de feedback visuel pendant le chargement
- ❌ Expérience utilisateur frustrante lors du premier dialogue
- ✅ Démarrage instantané de l'application

### Après

- ✅ Préchargement au démarrage : **2-4 minutes** (unique, première fois)
- ✅ Barre de progression détaillée avec état de chaque voix
- ✅ Synthèses vocales **instantanées** (<1 seconde) pendant l'utilisation
- ✅ Expérience fluide sans interruption
- ⚠️ Démarrage différé (attente du chargement des voix)

---

## 🎯 Motivations

1. **Fichiers locaux** : Les modèles sont déjà dans le build (pas de téléchargement réseau)
2. **Expérience utilisateur** : Éliminer toute latence pendant l'utilisation
3. **Transparence** : L'utilisateur voit exactement ce qui se passe
4. **Prévisibilité** : Temps d'attente initial clairement affiché

---

## 🏗️ Modifications techniques

### Nouveaux fichiers

```
src/components/voice-preloader/
├── VoicePreloader.tsx    # Composant de préchargement avec UI
└── index.ts              # Export du composant
```

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/App.tsx` | Ajout du `VoicePreloader` avant le routeur |
| `src/core/tts/providers/PiperWASMProvider.ts` | Amélioration de `preloadModel()` pour utiliser le cache de sessions |
| `src/main.tsx` | Exposition des utilitaires de debug `window.piperDebug` |
| `src/core/tts/offline/CacheCleaner.ts` | Ajout de `exposePiperDebugToWindow()` |

### Nouvelles documentations

```
docs/
├── VOICE_PRELOADING.md         # Documentation complète du préchargement
├── PIPER_SESSION_CACHE.md      # Documentation du cache de sessions
└── CHANGELOG_VOICE_PRELOADING.md  # Ce fichier
```

---

## 📊 Performances

### Cache de sessions (en mémoire)

Les sessions `TtsSession` sont maintenant cachées par `voiceId` :

- **Premier chargement d'une voix** : 30-60 secondes
- **Réutilisation de la même voix** : <1 seconde (**60x plus rapide**)
- **Utilisation RAM** : ~100 MB par voix (~400 MB pour 4 voix)

### Préchargement au démarrage

| Phase | Durée | Description |
|-------|-------|-------------|
| Initialisation | <1s | Démarrage de l'app, configuration ONNX |
| Chargement voix 1 | 30-60s | `fr_FR-siwis-medium` (61 MB) |
| Chargement voix 2 | 30-60s | `fr_FR-tom-medium` (61 MB) |
| Chargement voix 3 | 40-70s | `fr_FR-upmc-medium` (74 MB) |
| Chargement voix 4 | 40-70s | `fr_FR-mls-medium` (74 MB) |
| **Total** | **2-4 min** | Première visite uniquement |

**Visites suivantes** : Quasi-instantané grâce au cache navigateur (OPFS + IndexedDB)

---

## 🎨 Nouvelle interface utilisateur

### Écran de chargement

Au démarrage, l'utilisateur voit :

1. **Titre de l'application** : "Répét"
2. **Message** : "Chargement des voix de synthèse vocale..."
3. **Barre de progression globale** : 0-100% avec pourcentage
4. **Liste des voix** avec état individuel :
   - 🟢 **Vert** : Voix chargée (✓ Chargée)
   - 🔵 **Bleu** : Voix en cours de chargement (avec barre de progression)
   - ⚪ **Gris** : Voix en attente (En attente...)
   - 🔴 **Rouge** : Erreur de chargement (✗ Erreur + message)
5. **Conseil** : "Les voix sont chargées une seule fois. Ensuite, la synthèse vocale sera instantanée ! 🚀"

### Gestion d'erreur

En cas d'erreur fatale (provider indisponible) :
- Écran rouge avec message d'erreur
- Bouton "Recharger la page"

---

## 🔧 Utilitaires de diagnostic

### Nouveaux outils dans la console

```javascript
// Voir les voix en cache
window.piperDebug.getSessionCacheStats()
// → { voiceCount: 4, voices: ['fr_FR-tom-medium', 'fr_FR-siwis-medium', ...] }

// Voir toutes les statistiques
await window.piperDebug.logAllStats()

// Vider le cache de sessions (libérer RAM)
await window.piperDebug.clearSessionCache()

// Pré-charger une voix manuellement
await window.piperDebug.preloadModel('fr_FR-tom-medium')

// Stats du cache audio
await window.piperDebug.getCacheStats()
// → { count: 15, size: 2457600, sizeFormatted: '2.34 MB' }
```

### Outils existants

```javascript
// Vider le cache OPFS Piper
await window.clearPiperCache()

// Vider le cache audio IndexedDB
await window.clearAudioCache()

// Vider tous les caches
await window.clearAllCaches()

// Stats de stockage navigateur
await window.logStorageStats()
```

---

## 🧪 Comment tester

### Test 1 : Première visite (cache vide)

1. Vider tous les caches :
   ```javascript
   await window.clearAllCaches()
   ```

2. Recharger la page (Ctrl+R ou Cmd+R)

3. **Attendu** :
   - Écran de préchargement affiché
   - 4 voix se chargent séquentiellement
   - Progression de 0% à 100%
   - Durée totale : 2-4 minutes
   - Application disponible après 100%

4. Vérifier le cache :
   ```javascript
   window.piperDebug.getSessionCacheStats()
   // → { voiceCount: 4, voices: [...] }
   ```

### Test 2 : Visite suivante (cache présent)

1. Recharger la page

2. **Attendu** :
   - Préchargement toujours affiché
   - Chargement beaucoup plus rapide (<30 secondes)
   - Grâce au cache OPFS des modèles

### Test 3 : Synthèse vocale

1. Une fois l'app chargée, créer un dialogue avec plusieurs personnages

2. Lire le dialogue

3. **Attendu** :
   - Première réplique de chaque voix : <1 seconde (session en cache)
   - Répliques suivantes : <1 seconde également
   - Pas de latence perceptible

---

## 🐛 Problèmes connus et solutions

### Le préchargement est trop long

**Solution 1** : Pré-charger uniquement 2 voix principales

Modifier `VoicePreloader.tsx` :
```typescript
const voicesToPreload = availableVoices.filter(v => 
  v.id === 'fr_FR-tom-medium' || v.id === 'fr_FR-siwis-medium'
)
```

**Solution 2** : Permettre de skip le préchargement

Ajouter un bouton "Utiliser l'app maintenant" qui appelle `onComplete()` immédiatement.

### Erreur "Provider Piper WASM non disponible"

**Causes possibles** :
- WebAssembly non supporté par le navigateur
- Fichiers WASM manquants dans `public/wasm/`
- Problème d'initialisation du provider

**Solution** :
- Vérifier la console pour les erreurs détaillées
- Tester dans un navigateur moderne (Chrome, Firefox, Edge)
- Vérifier que les fichiers WASM sont bien présents

### Utilisation mémoire élevée

**Normal** : 4 voix × ~100 MB = ~400 MB RAM

**Solutions** :
- Réduire le nombre de voix pré-chargées
- Implémenter un système de déchargement des voix inutilisées
- Vider manuellement le cache de sessions :
  ```javascript
  await window.piperDebug.clearSessionCache()
  ```

---

## 🔄 Migration pour les développeurs

### Aucune action requise

Le changement est **transparent** pour le code existant :
- Les APIs de synthèse vocale restent identiques
- Le cache de sessions est automatique
- Les voix sont pré-chargées au démarrage

### Si vous voulez désactiver le préchargement

Modifier `src/App.tsx` :

```typescript
function App() {
  const { setTheme } = useUIStore()
  // const [voicesLoaded, setVoicesLoaded] = useState(false)

  // ... thème setup ...

  // Commenter cette condition
  // if (!voicesLoaded) {
  //   return <VoicePreloader onComplete={() => setVoicesLoaded(true)} />
  // }

  return (
    <>
      <Router />
      <Toast />
      <HelpScreen />
    </>
  )
}
```

---

## 📚 Ressources

- **Documentation technique** : `docs/VOICE_PRELOADING.md`
- **Cache de sessions** : `docs/PIPER_SESSION_CACHE.md`
- **Thread de discussion** : [Piper WASM TTS session reuse](https://github.com/...)
- **Code source** :
  - `src/components/voice-preloader/VoicePreloader.tsx`
  - `src/core/tts/providers/PiperWASMProvider.ts`

---

## 🎯 Prochaines étapes possibles

### Améliorations futures envisagées

1. **Préchargement optionnel** : Bouton "Skip" pour utiliser l'app immédiatement
2. **Chargement en arrière-plan** : Afficher l'app et charger les voix en background
3. **Préchargement intelligent** : Charger uniquement les voix utilisées récemment
4. **Indicateur de cache** : Afficher l'état du cache dans les paramètres
5. **Gestion mémoire** : Décharger les voix inutilisées après X minutes

### Feedback souhaité

- Le temps de chargement initial est-il acceptable ?
- Faut-il ajouter un bouton "Skip" ?
- D'autres voix doivent-elles être ajoutées ?

---

## 👥 Contributeurs

- [@resinsec](https://github.com/resinsec) - Implémentation du cache de sessions
- [Assistant IA] - Conception du système de préchargement

---

## 📄 Licence

Copyright (c) 2025 Répét Contributors  
Licensed under the MIT License