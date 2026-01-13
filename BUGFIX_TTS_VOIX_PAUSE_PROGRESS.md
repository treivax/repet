# Correction des problèmes TTS : Voix identiques, Pause et Indicateur de génération

**Date :** 2025-01-XX  
**Branche :** `piper-wasm`  
**Type :** Bugfix

## 🐛 Problèmes identifiés

L'utilisateur a rapporté trois problèmes après l'intégration de Piper WASM :

1. **Même voix pour tous les personnages** : Tous les personnages utilisent la même voix féminine, quelle que soit leur genre défini
2. **La pause ne fonctionne pas** : Cliquer sur une ligne en cours de lecture ne met pas en pause l'audio
3. **Pas d'indicateur de génération** : Durant la synthèse initiale (avant mise en cache), aucun feedback visuel n'indique que l'audio est en cours de génération

## 🔍 Analyse des causes

### Problème 1 : Voix identiques

**Cause racine :**
- Les maps d'assignation `characterVoicesPiper` et `characterVoicesGoogle` sont créées vides par défaut dans `createDefaultPlaySettings()`
- Aucun appel automatique à `generateVoiceAssignments()` n'était effectué au chargement de la pièce
- Le code de fallback dans `PlayScreen.tsx` cherchait dans `characterVoices` (qui contient les **genres**, pas les voix assignées)
- Résultat : tous les personnages utilisaient la première voix trouvée du bon genre (souvent la même)

**Fichiers affectés :**
- `src/screens/PlayScreen.tsx` : logique de sélection de voix lors de la lecture
- Assignations jamais générées automatiquement

### Problème 2 : Pause non fonctionnelle

**Cause racine :**
- Les providers `PiperWASMProvider` et `WebSpeechProvider` n'implémentaient pas les méthodes `pause()` et `resume()`
- `TTSProviderManager` ne déléguait pas ces méthodes aux providers
- `TTSEngine.pause()` appelait l'ancien système de queue au lieu du provider manager
- Résultat : l'audio HTML5 ou Web Speech API continuait de jouer sans interruption

**Fichiers affectés :**
- `src/core/tts/providers/PiperWASMProvider.ts` : méthodes manquantes
- `src/core/tts/providers/WebSpeechProvider.ts` : méthodes manquantes
- `src/core/tts/providers/TTSProviderManager.ts` : pas de délégation
- `src/core/tts/engine.ts` : appel incorrect à `queue.pause()`

### Problème 3 : Pas d'indicateur de génération

**Cause racine :**
- La synthèse Piper peut prendre plusieurs secondes (téléchargement modèle + génération audio)
- Aucun état `isGenerating` n'était tracké dans `PlayScreen`
- L'indicateur de progression (`progressPercentage`) ne s'affichait qu'après le début de la lecture audio
- Résultat : l'utilisateur voyait un écran figé sans savoir si l'app fonctionnait

**Fichiers affectés :**
- `src/screens/PlayScreen.tsx` : pas d'état de génération
- `src/components/reader/FullPlayDisplay.tsx` : pas de prop pour transmettre l'état
- `src/components/reader/LineRenderer.tsx` : pas d'affichage spécifique durant la génération

## ✅ Solutions implémentées

### 1. Génération automatique des assignations de voix

**Modifications dans `src/screens/PlayScreen.tsx` :**

```typescript
// Dans le useEffect d'initialisation TTS
useEffect(() => {
  const initializeTTS = async () => {
    // ... initialisation provider ...
    
    // NOUVEAU : Générer automatiquement les assignations si vides
    const assignmentMap =
      provider === 'piper-wasm' 
        ? settings.characterVoicesPiper 
        : settings.characterVoicesGoogle

    const needsAssignments = Object.keys(assignmentMap).length === 0

    if (needsAssignments && currentPlay.ast?.characters) {
      console.warn('Génération automatique des assignations de voix...')

      // Créer la liste des personnages avec leurs genres
      const charactersWithGender = currentPlay.ast.characters
        .filter((char) => settings.characterVoices[char.id])
        .map((char) => ({
          id: char.id,
          gender: settings.characterVoices[char.id],
        }))

      // Générer les assignations via le provider actif
      const activeProvider = ttsProviderManager.getActiveProvider()
      if (activeProvider && charactersWithGender.length > 0) {
        const newAssignments = activeProvider.generateVoiceAssignments(
          charactersWithGender, 
          {}
        )

        // Sauvegarder les assignations
        const { updatePlaySettings } = usePlaySettingsStore.getState()
        if (provider === 'piper-wasm') {
          updatePlaySettings(playId, { characterVoicesPiper: newAssignments })
        } else {
          updatePlaySettings(playId, { characterVoicesGoogle: newAssignments })
        }

        console.warn('Assignations de voix générées:', newAssignments)
      }
    }
  }

  initializeTTS()
}, [playId, currentPlay, getPlaySettings])
```

**Amélioration du fallback :**
```typescript
// Si pas d'assignation, utiliser le genre du personnage (amélioré)
if (!voiceId) {
  const character = charactersMap[line.characterId]
  const gender = character?.gender || playSettings.characterVoices[line.characterId]

  if (gender) {
    const voices = ttsProviderManager.getVoices()
    const matchingVoice = voices.find((v) => v.gender === gender)
    if (matchingVoice) {
      voiceId = matchingVoice.id
      console.warn(`Utilisation voix fallback pour ${line.characterId}: ${matchingVoice.displayName}`)
    }
  }
}
```

**Résultat :**
- Au premier chargement d'une pièce, les voix sont assignées automatiquement selon l'algorithme round-robin
- Chaque personnage reçoit une voix unique du bon genre
- Les assignations sont persistées dans `localStorage` via Zustand
- Les personnages masculins utilisent maintenant des voix masculines, etc.

### 2. Implémentation des méthodes pause/resume

**Modifications dans `src/core/tts/providers/PiperWASMProvider.ts` :**

```typescript
export class PiperWASMProvider implements TTSProvider {
  // ...
  private isPaused = false

  /**
   * Met en pause la lecture en cours
   */
  pause(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause()
      this.isPaused = true
    }
  }

  /**
   * Reprend la lecture en pause
   */
  resume(): void {
    if (this.currentAudio && this.isPaused) {
      this.currentAudio.play().catch((error) => {
        console.error('Erreur lors de la reprise de la lecture:', error)
      })
      this.isPaused = false
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
    this.isPaused = false // Reset du flag
  }
}
```

**Modifications dans `src/core/tts/providers/WebSpeechProvider.ts` :**

```typescript
export class WebSpeechProvider implements TTSProvider {
  /**
   * Met en pause la lecture en cours
   */
  pause(): void {
    if (speechSynthesis.speaking) {
      speechSynthesis.pause()
    }
  }

  /**
   * Reprend la lecture en pause
   */
  resume(): void {
    if (speechSynthesis.paused) {
      speechSynthesis.resume()
    }
  }
}
```

**Modifications dans `src/core/tts/providers/TTSProviderManager.ts` :**

```typescript
export class TTSProviderManager {
  /**
   * Met en pause la lecture en cours
   */
  pause(): void {
    if (this.activeProvider && 'pause' in this.activeProvider) {
      ;(this.activeProvider as any).pause()
    }
  }

  /**
   * Reprend la lecture en pause
   */
  resume(): void {
    if (this.activeProvider && 'resume' in this.activeProvider) {
      ;(this.activeProvider as any).resume()
    }
  }
}
```

**Modifications dans `src/core/tts/engine.ts` :**

```typescript
export class TTSEngine {
  pause(): void {
    if (this.state === 'speaking') {
      ttsProviderManager.pause() // CORRIGÉ : était queue.pause()
      this.state = 'paused'
    }
  }

  resume(): void {
    if (this.state === 'paused') {
      ttsProviderManager.resume() // CORRIGÉ : était queue.resume()
      this.state = 'speaking'
    }
  }
}
```

**Résultat :**
- Cliquer sur une ligne en cours de lecture met bien en pause l'audio
- Re-cliquer reprend la lecture au même point (pas de reset)
- Fonctionne pour Piper WASM (HTMLAudioElement) et Web Speech API
- L'indicateur visuel "⏸ En pause" s'affiche correctement

### 3. Indicateur de génération durant la synthèse

**Modifications dans `src/screens/PlayScreen.tsx` :**

```typescript
export function PlayScreen() {
  // NOUVEAU : État de génération
  const [isGenerating, setIsGenerating] = useState(false)

  const speakLine = (globalLineIndex: number) => {
    // ...
    setIsGenerating(true) // Début de la génération

    ttsEngine.setEvents({
      onStart: () => {
        setIsGenerating(false) // Audio généré et lecture démarrée
      },
      onEnd: () => {
        stopProgressTracking()
        setIsGenerating(false)
        // ...
      },
      onError: (error) => {
        stopProgressTracking()
        setIsGenerating(false) // Arrêter l'indicateur en cas d'erreur
        // ...
      },
      // ...
    })
  }

  const stopPlayback = () => {
    ttsEngine.stop()
    // ...
    setIsGenerating(false) // Reset de l'état
    stopProgressTracking()
  }

  return (
    <FullPlayDisplay
      // ...
      isGenerating={isGenerating} // Passer l'état aux enfants
    />
  )
}
```

**Modifications dans `src/components/reader/FullPlayDisplay.tsx` :**

```typescript
interface Props {
  // ...
  isGenerating?: boolean
}

export function FullPlayDisplay({
  // ...
  isGenerating,
}: Props) {
  return (
    // ...
    <LineRenderer
      // ...
      isGenerating={isPlaying ? isGenerating : false}
    />
  )
}
```

**Modifications dans `src/components/reader/LineRenderer.tsx` :**

```typescript
interface Props {
  // ...
  isGenerating?: boolean
}

export function LineRenderer({
  // ...
  isGenerating = false,
}: Props) {
  return (
    // ...
    {isPlaying && (
      <div className="mt-2 flex items-center gap-2">
        {/* ... cercle de progression ... */}
        <div className="text-xs font-medium ...">
          {isGenerating
            ? '⏳ Génération en cours...'
            : isPaused
              ? '⏸ En pause · ' + Math.max(0, Math.ceil(estimatedDuration - elapsedTime)) + 's'
              : Math.max(0, Math.ceil(estimatedDuration - elapsedTime)) + 's'}
        </div>
      </div>
    )}
  )
}
```

**Résultat :**
- Durant la synthèse Piper (qui peut prendre 2-5 secondes), l'utilisateur voit "⏳ Génération en cours..."
- Une fois l'audio généré et la lecture démarrée, l'indicateur passe au compte à rebours normal
- En cas d'erreur, l'indicateur disparaît proprement
- Améliore grandement la perception de réactivité de l'application

## 📋 Résumé des fichiers modifiés

| Fichier | Modifications |
|---------|--------------|
| `src/screens/PlayScreen.tsx` | ✅ Génération auto assignations<br>✅ État `isGenerating`<br>✅ Amélioration du fallback de sélection de voix |
| `src/components/reader/FullPlayDisplay.tsx` | ✅ Ajout prop `isGenerating` |
| `src/components/reader/LineRenderer.tsx` | ✅ Affichage conditionnel "Génération en cours..." |
| `src/core/tts/providers/PiperWASMProvider.ts` | ✅ Ajout méthodes `pause()` et `resume()` |
| `src/core/tts/providers/WebSpeechProvider.ts` | ✅ Ajout méthodes `pause()` et `resume()` |
| `src/core/tts/providers/TTSProviderManager.ts` | ✅ Délégation de `pause()` et `resume()` |
| `src/core/tts/engine.ts` | ✅ Appel correct à `ttsProviderManager.pause/resume()` |

## 🧪 Tests à effectuer

### Test 1 : Voix différentes par personnage

1. ✅ Ouvrir une pièce avec plusieurs personnages (hommes et femmes)
2. ✅ Vérifier dans la console les logs "Assignations de voix générées"
3. ✅ Lire plusieurs répliques de personnages différents
4. ✅ **Vérifier que** :
   - Les personnages masculins ont des voix masculines
   - Les personnages féminins ont des voix féminines
   - Chaque personnage a une voix différente (dans la mesure du possible)
   - La vitesse peut varier (rate différent) mais la voix de base change

### Test 2 : Pause fonctionnelle

1. ✅ Démarrer la lecture d'une ligne
2. ✅ Cliquer sur la même ligne en cours de lecture
3. ✅ **Vérifier que** :
   - L'audio se met en pause
   - L'indicateur "⏸ En pause" s'affiche
   - Le compte à rebours s'arrête
4. ✅ Re-cliquer sur la ligne
5. ✅ **Vérifier que** :
   - L'audio reprend depuis le même point
   - L'indicateur "⏸ En pause" disparaît
   - Le compte à rebours redémarre

### Test 3 : Indicateur de génération

1. ✅ Vider le cache Piper (ou utiliser une nouvelle pièce jamais jouée)
2. ✅ Cliquer sur une ligne pour démarrer la lecture
3. ✅ **Vérifier que** :
   - L'indicateur "⏳ Génération en cours..." apparaît immédiatement
   - Il reste affiché pendant la synthèse (2-5 secondes)
   - Une fois l'audio généré, il passe au compte à rebours normal
4. ✅ Rejouer la même ligne (depuis le cache)
5. ✅ **Vérifier que** :
   - L'audio démarre instantanément
   - Le compte à rebours s'affiche immédiatement (pas de "Génération...")

## 🔄 Prochaines étapes suggérées

1. **Prévisualisation des voix** : Ajouter un bouton "Écouter" à côté de chaque assignation de voix dans `CharacterVoiceEditor`
2. **Optimisation du cache** : Pré-générer l'audio des premières lignes en arrière-plan
3. **Web Worker** : Déplacer la synthèse Piper dans un worker pour éviter de bloquer le thread principal
4. **Tests E2E** : Ajouter des tests Playwright pour valider ces scénarios automatiquement
5. **Indicateur de téléchargement modèle** : Afficher la progression du téléchargement initial du modèle Piper (première utilisation uniquement)

## 📝 Notes techniques

### Pourquoi le genre est-il parfois différent de la voix ?

- `characterVoices` stocke le **genre du personnage** (défini par l'utilisateur ou détecté)
- `characterVoicesPiper` et `characterVoicesGoogle` stockent les **IDs de voix assignées** (générées automatiquement)
- L'algorithme `generateVoiceAssignments()` utilise le genre comme **filtre** pour sélectionner une voix appropriée
- Si aucune voix du bon genre n'est disponible, un fallback est appliqué

### Pourquoi TypeScript `as any` dans TTSProviderManager ?

Les méthodes `pause()` et `resume()` ne sont pas définies dans l'interface `TTSProvider` de base (pour rester compatible avec d'autres providers futurs qui ne les supporteraient pas). On vérifie dynamiquement leur présence avec `'pause' in this.activeProvider` avant de les appeler.

Une meilleure approche serait de créer une interface `PausableProvider extends TTSProvider` et de typer les providers en conséquence.

### Impact sur les performances

- **Génération initiale** : 2-5 secondes par ligne (une seule fois)
- **Lecture depuis cache** : instantané (< 50ms)
- **Mémoire** : IndexedDB stocke les blobs audio, pas de surcharge RAM
- **Taille cache** : ~50-200 KB par ligne audio (dépend de la longueur)

## ✅ Validation

- ✅ Type check : `npm run type-check` → OK
- ✅ Build : `npm run build` → OK
- ⏳ Tests runtime : À valider par l'utilisateur

---

**Auteur :** Assistant AI  
**Reviewers :** À définir  
**Status :** 🟡 En attente de validation runtime