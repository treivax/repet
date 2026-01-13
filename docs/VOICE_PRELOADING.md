# Préchargement automatique des voix au démarrage

## 🎯 Fonctionnalité

Depuis la dernière mise à jour, **toutes les voix Piper sont automatiquement pré-chargées au démarrage de l'application** avec une barre de progression visible.

### Pourquoi ?

- **Expérience utilisateur optimale** : Pas d'attente lors de la première utilisation de chaque voix
- **Fichiers locaux** : Les modèles sont déjà dans le build, donc pas de téléchargement réseau
- **Transparence** : L'utilisateur voit exactement ce qui se charge
- **Performance** : Une fois chargées, les synthèses sont instantanées (<1 seconde)

## 📊 Comportement

### Au démarrage de l'application

1. **Affichage du preloader** : Écran de chargement avec barre de progression
2. **Chargement séquentiel** : Chaque voix est chargée l'une après l'autre
3. **Progression détaillée** :
   - Barre de progression globale (0-100%)
   - État de chaque voix (en attente / en cours / chargée)
   - Progression individuelle de la voix en cours de chargement
4. **Fin du chargement** : L'application devient disponible

### Durée attendue

- **4 voix françaises** : ~2-4 minutes au total (première visite)
- **Visites suivantes** : Instantané grâce au cache navigateur

Détail par voix :
- `fr_FR-tom-medium` (61 MB) : ~30-60 secondes
- `fr_FR-siwis-medium` (61 MB) : ~30-60 secondes
- `fr_FR-upmc-medium` (74 MB) : ~40-70 secondes
- `fr_FR-mls-medium` (74 MB) : ~40-70 secondes

## 🏗️ Architecture technique

### Composant VoicePreloader

```typescript
// src/components/voice-preloader/VoicePreloader.tsx

interface VoiceLoadingState {
  voiceId: string
  displayName: string
  progress: number    // 0-100
  loaded: boolean
  error?: string
}
```

### Processus de chargement

```
1. App.tsx démarre
   ↓
2. Affiche <VoicePreloader />
   ↓
3. VoicePreloader.useEffect()
   ↓
4. Pour chaque voix :
   - Appelle provider.preloadModel(voiceId, onProgress)
   - Met à jour la progression (0-100%)
   - Met en cache la session TtsSession
   ↓
5. Toutes les voix chargées
   ↓
6. onComplete() appelé
   ↓
7. App affiche <Router /> (application normale)
```

### Cache de sessions

Les sessions chargées sont stockées en mémoire dans `PiperWASMProvider` :

```typescript
class PiperWASMProvider {
  private sessionCache: Map<string, TtsSession> = new Map()
  
  async preloadModel(voiceId: string, onProgress?: (percent: number) => void) {
    // Évite de recharger si déjà en cache
    if (this.sessionCache.has(voiceId)) {
      return
    }
    
    // Crée et met en cache la session
    const session = await TtsSession.create({ voiceId, progress: onProgress })
    this.sessionCache.set(voiceId, session)
  }
}
```

## 🎨 Interface utilisateur

### Écran de chargement

```
┌─────────────────────────────────────────────┐
│              Répét                          │
│  Chargement des voix de synthèse vocale...  │
│                                             │
│  Progression globale            75%         │
│  ███████████████████████░░░░░░░             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ✓ Siwis (Femme, France)             │   │
│  │   Chargée                           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Tom (Homme, France)          75%    │   │
│  │ ███████████████████░░░░░░░          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ UPMC Jessica (Femme, France)        │   │
│  │   En attente...                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ MLS Pierre (Homme, France)          │   │
│  │   En attente...                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Les voix sont chargées une seule fois.     │
│  Ensuite, la synthèse sera instantanée! 🚀  │
└─────────────────────────────────────────────┘
```

### États visuels

- **En attente** : Gris foncé, texte "En attente..."
- **En cours** : Bleu, barre de progression + pourcentage
- **Chargée** : Vert, texte "✓ Chargée"
- **Erreur** : Rouge, texte "✗ Erreur" + message détaillé

## 🔧 Configuration

### Désactiver le préchargement automatique

Si vous souhaitez revenir au chargement à la demande :

```typescript
// Dans src/App.tsx

function App() {
  // Commenter ou supprimer cette condition
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

### Personnaliser les voix à précharger

```typescript
// Dans src/components/voice-preloader/VoicePreloader.tsx

const preloadAllVoices = async () => {
  const provider = ttsProviderManager.getActiveProvider() as PiperWASMProvider
  const availableVoices = provider.getVoices()
  
  // Filtrer uniquement certaines voix
  const voicesToPreload = availableVoices.filter(v => 
    v.id === 'fr_FR-tom-medium' || v.id === 'fr_FR-siwis-medium'
  )
  
  for (const voice of voicesToPreload) {
    await provider.preloadModel(voice.id, onProgress)
  }
}
```

### Charger en parallèle (non recommandé)

Par défaut, les voix sont chargées séquentiellement pour :
- Afficher une progression claire
- Éviter de saturer la mémoire/CPU

Si vous voulez charger en parallèle (plus rapide mais moins de contrôle) :

```typescript
const voicePromises = availableVoices.map(voice => 
  provider.preloadModel(voice.id, (percent) => {
    // Gérer la progression de chaque voix individuellement
  })
)

await Promise.all(voicePromises)
```

## 🐛 Gestion des erreurs

### Erreur de chargement d'une voix

Si une voix échoue à charger :
- Elle est marquée en rouge avec le message d'erreur
- Les autres voix continuent à se charger
- L'application devient disponible une fois toutes les voix traitées

### Erreur fatale

Si le provider Piper n'est pas disponible :
- Écran d'erreur rouge affiché
- Bouton "Recharger la page"

```
┌────────────────────────────────────┐
│  ⚠️ Erreur de chargement           │
│                                    │
│  Provider Piper WASM non disponible│
│                                    │
│  [ Recharger la page ]             │
└────────────────────────────────────┘
```

## 📊 Métriques et diagnostics

### Console logs attendus

```
[VoicePreloader] 🚀 Préchargement de 4 voix...
[VoicePreloader] 📥 Chargement 1/4: Siwis (Femme, France)
[PiperWASM] 📥 Pré-chargement du modèle fr_FR-siwis-medium...
[PiperWASM] 📥 Chargement modèle fr_FR-siwis-medium: 10% (6MB/61MB)
[PiperWASM] 📥 Chargement modèle fr_FR-siwis-medium: 50% (30MB/61MB)
[PiperWASM] 📥 Chargement modèle fr_FR-siwis-medium: 100% (61MB/61MB)
[PiperWASM] ✅ Modèle fr_FR-siwis-medium pré-chargé avec succès (35000ms)
[VoicePreloader] ✅ Siwis (Femme, France) chargée avec succès
[VoicePreloader] 📥 Chargement 2/4: Tom (Homme, France)
...
[VoicePreloader] ✅ Toutes les voix sont chargées !
```

### Vérifier le cache après chargement

```javascript
// Dans la console, après le chargement
window.piperDebug.getSessionCacheStats()
// → { voiceCount: 4, voices: ['fr_FR-siwis-medium', 'fr_FR-tom-medium', ...] }
```

## 🎯 Avantages vs inconvénients

### ✅ Avantages

- **Expérience utilisateur fluide** : Pas de latence pendant l'utilisation
- **Prévisibilité** : L'utilisateur sait exactement ce qui se passe
- **Performance maximale** : Synthèses instantanées après le chargement
- **Offline-first** : Tout fonctionne sans connexion internet

### ⚠️ Inconvénients

- **Temps de démarrage** : 2-4 minutes avant de pouvoir utiliser l'app (première fois)
- **Utilisation mémoire** : ~400 MB de RAM pour 4 voix
- **Non skippable** : L'utilisateur doit attendre

### 🔄 Compromis possible

Si le temps de démarrage est un problème, on peut envisager :

1. **Précharger uniquement 2 voix principales** (1 homme + 1 femme)
2. **Charger les autres à la demande** (lazy loading)
3. **Permettre de skip** le préchargement avec un bouton "Utiliser l'app maintenant"

## 📚 Fichiers concernés

- `src/components/voice-preloader/VoicePreloader.tsx` - Composant UI du preloader
- `src/components/voice-preloader/index.ts` - Export du composant
- `src/App.tsx` - Intégration du preloader dans l'app
- `src/core/tts/providers/PiperWASMProvider.ts` - Méthode `preloadModel()`
- `docs/PIPER_SESSION_CACHE.md` - Documentation du cache de sessions

## 🔗 Voir aussi

- [PIPER_SESSION_CACHE.md](./PIPER_SESSION_CACHE.md) - Détails sur le cache de sessions
- [Thread de discussion](zed:///agent/thread/e8f8566f-bd80-4bf1-af82-d3bb8729d4a4) - Contexte et historique des changements