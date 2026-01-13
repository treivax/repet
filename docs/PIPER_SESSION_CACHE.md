# Cache de sessions Piper TTS - Optimisation des temps de chargement

## 🎯 Problème résolu

### Avant (workaround initial)
- **Symptôme** : Temps de chargement excessif (plusieurs minutes) pour chaque voix
- **Cause** : Le singleton `TtsSession._instance` était réinitialisé à `null` avant chaque synthèse pour contourner le bug de réutilisation de modèle
- **Conséquence** : Rechargement complet à chaque synthèse :
  - Fichiers WASM ONNX Runtime (~11 MB)
  - Fichier piper_phonemize (~18 MB)
  - Modèle .onnx de la voix (61-74 MB selon la voix)
  - **Total : ~100 MB rechargés à chaque fois !**

### Après (cache de sessions)
- **Solution** : Cache intelligent par `voiceId`
- **Premier chargement** : ~30-60 secondes (téléchargement initial du modèle)
- **Synthèses suivantes avec la même voix** : <1 seconde (session en cache)
- **Changement de voix** : ~30-60 secondes (nouveau modèle)
- **Retour à une voix déjà utilisée** : <1 seconde (session en cache)

## 🏗️ Architecture

```typescript
class PiperWASMProvider {
  // Cache Map<voiceId, TtsSession>
  private sessionCache: Map<string, TtsSession> = new Map()

  async synthesize(text: string, options: SynthesisOptions) {
    // 1. Vérifier le cache de sessions
    let session = this.sessionCache.get(options.voiceId)
    
    if (!session) {
      // 2. Créer une nouvelle session
      session = await TtsSession.create({
        voiceId: piperVoiceId,
        progress: (progress) => { /* ... */ }
      })
      
      // 3. Mettre en cache
      this.sessionCache.set(options.voiceId, session)
    }
    
    // 4. Synthétiser avec la session (réutilisée ou nouvelle)
    const audioBlob = await session.predict(text)
    
    // 5. Le résultat audio est aussi mis en cache (IndexedDB)
    await audioCacheService.cacheAudio(...)
  }
}
```

## 📊 Deux niveaux de cache

### 1. Cache de sessions (en mémoire)
- **Contenu** : Instances `TtsSession` avec modèles ONNX chargés
- **Stockage** : RAM (Map JavaScript)
- **Durée** : Tant que l'onglet est ouvert
- **Taille** : ~100 MB par voix en mémoire
- **Avantage** : Pas de rechargement réseau/disque

### 2. Cache audio (IndexedDB)
- **Contenu** : Fichiers audio générés (WAV/Blob)
- **Stockage** : IndexedDB (disque)
- **Durée** : Persistant entre sessions
- **Taille** : ~50-200 KB par audio généré
- **Avantage** : Pas de re-synthèse pour le même texte

## 🔧 Utilitaires de diagnostic

Les utilitaires sont automatiquement exposés dans `window` au démarrage :

### Diagnostiquer le cache de sessions

```javascript
// Voir combien de voix sont en cache
window.piperDebug.getSessionCacheStats()
// → { voiceCount: 2, voices: ['fr_FR-tom-medium', 'fr_FR-siwis-medium'] }

// Voir les stats du cache audio
await window.piperDebug.getCacheStats()
// → { count: 15, size: 2457600, sizeFormatted: '2.34 MB' }

// Tout afficher
await window.piperDebug.logAllStats()
```

### Vider les caches

```javascript
// Vider uniquement le cache de sessions (force rechargement des modèles)
await window.piperDebug.clearSessionCache()

// Vider uniquement le cache audio (re-synthèse nécessaire)
await window.clearAudioCache()

// Vider TOUT (OPFS + IndexedDB + sessions)
await window.clearAllCaches()
```

### Pré-charger un modèle

Utile pour charger un modèle en arrière-plan avant utilisation :

```javascript
// Pré-charger fr_FR-tom-medium
await window.piperDebug.preloadModel('fr_FR-tom-medium')
// → Logs de progression + temps de chargement
```

### Statistiques de stockage

```javascript
// Obtenir les stats du navigateur
await window.getStorageStats()
// → { quota: 100GB, usage: 500MB, percentUsed: 0.5%, details: {...} }

// Afficher dans la console
await window.logStorageStats()
```

## 📈 Métriques attendues

### Première utilisation d'une voix
```
[PiperWASM] 🔄 Création d'une nouvelle session pour fr_FR-tom-medium
[PiperWASM] 📥 Chargement modèle fr_FR-tom-medium: 10% (7MB/70MB)
[PiperWASM] 📥 Chargement modèle fr_FR-tom-medium: 50% (35MB/70MB)
[PiperWASM] 📥 Chargement modèle fr_FR-tom-medium: 100% (70MB/70MB)
[PiperWASM] ✅ Session créée et mise en cache pour fr_FR-tom-medium (35000ms)
[PiperWASM] 🎤 Synthèse avec fr_FR-tom-medium
[PiperWASM] ✅ Synthèse terminée en 450ms
```

### Réutilisation d'une voix déjà chargée
```
[PiperWASM] ♻️ Utilisation de la session en cache pour fr_FR-tom-medium
[PiperWASM] 🎤 Synthèse avec fr_FR-tom-medium
[PiperWASM] ✅ Synthèse terminée en 420ms
```

### Avec audio déjà en cache
```
[PiperWASM] 🔍 Vérification du cache pour voiceId="fr_FR-tom-medium"
[PiperWASM] ✅ Audio trouvé dans le cache (156800 bytes)
```

## 🧠 Considérations mémoire

### Utilisation RAM typique

Pour 4 voix françaises chargées :
- **fr_FR-tom-medium** : ~100 MB
- **fr_FR-siwis-medium** : ~100 MB
- **fr_FR-upmc-medium** : ~100 MB
- **fr_FR-mls-medium** : ~100 MB
- **Total** : ~400 MB

### Quand vider le cache ?

Le cache de sessions est automatiquement vidé :
- Fermeture de l'onglet
- Rechargement de la page
- Appel manuel à `dispose()`

Vous pouvez manuellement vider pour libérer de la RAM :
```javascript
await window.piperDebug.clearSessionCache()
```

## 🚀 Stratégies d'optimisation

### Pré-chargement au démarrage

Si vous savez quelles voix seront utilisées, pré-chargez-les :

```typescript
// Dans votre code d'initialisation
const commonVoices = ['fr_FR-tom-medium', 'fr_FR-siwis-medium']

for (const voiceId of commonVoices) {
  piperProvider.preloadModel(voiceId).catch(console.error)
}
```

### Lazy loading

Laissez le cache se construire naturellement au fur et à mesure de l'utilisation.

### Stratégie hybride

Pré-chargez 1-2 voix principales, laissez les autres se charger à la demande.

## 🐛 Debugging temps de chargement

Si une voix est encore lente :

1. **Vérifier le cache de sessions**
   ```javascript
   window.piperDebug.getSessionCacheStats()
   ```

2. **Vérifier les logs console**
   - "♻️ Utilisation de la session en cache" → OK
   - "🔄 Création d'une nouvelle session" → Normal la 1ère fois

3. **Mesurer le temps réel**
   ```javascript
   const start = Date.now()
   await window.piperDebug.preloadModel('fr_FR-tom-medium')
   console.log(`Temps: ${Date.now() - start}ms`)
   ```

4. **Vérifier la taille des fichiers**
   ```bash
   ls -lh public/models/piper/*.onnx
   ls -lh public/wasm/
   ```

## 🔄 Différences avec l'ancienne approche

| Aspect | Avant (workaround) | Après (cache) |
|--------|-------------------|---------------|
| Rechargement WASM | Chaque synthèse | 1 fois au total |
| Rechargement modèle | Chaque synthèse | 1 fois par voix |
| Temps 1ère synthèse | 30-60s | 30-60s (identique) |
| Temps synthèses suivantes | 30-60s | <1s (**60x plus rapide**) |
| Mémoire RAM | ~100 MB temporaire | ~100 MB par voix persistant |
| Utilisation disque | Cache OPFS | Cache OPFS + IndexedDB |

## 📝 Notes techniques

### Pourquoi on doit toujours faire `_instance = null` ?

La bibliothèque `@mintplex-labs/piper-tts-web` utilise un singleton global. Pour créer une session avec un nouveau `voiceId`, on doit :

```typescript
(TtsSession as any)._instance = null  // Reset singleton
session = await TtsSession.create({ voiceId })  // Crée nouvelle instance
```

Sans le reset, `TtsSession.create()` retournerait toujours la même instance avec le premier `voiceId` chargé.

### Pourquoi ne pas utiliser `predict()` directement ?

```typescript
// ❌ predict() utilise aussi le singleton en interne
const blob = await predict({ text, voiceId })

// ✅ TtsSession.create() + cache nous donne le contrôle
const session = await TtsSession.create({ voiceId })
sessionCache.set(voiceId, session)
const blob = await session.predict(text)
```

## 📚 Références

- Code source : `src/core/tts/providers/PiperWASMProvider.ts`
- Utilitaires debug : `src/core/tts/offline/CacheCleaner.ts`
- Thread de discussion : [Piper WASM TTS session reuse](zed:///agent/thread/e8f8566f-bd80-4bf1-af82-d3bb8729d4a4)