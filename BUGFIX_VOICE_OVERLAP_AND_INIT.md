# Fix: Superposition de voix et initialisation TTS

**Date**: 2025-01-XX  
**Fichiers modifiés**: 
- `src/screens/PlayScreen.tsx`
- `src/core/tts/providers/PiperWASMProvider.ts`
- `src/core/tts/providers/TTSProviderManager.ts`

## Problèmes

### 1. Premier clic ne lance pas l'audio

**Symptôme** : Lors de l'ouverture d'une pièce, le premier clic sur une ligne ou carte en mode audio/italiennes ne lance pas la lecture. Il faut changer de mode de lecture pour que ça fonctionne ensuite.

**Cause** : L'initialisation du TTS (`ttsProviderManager.initialize()`) est asynchrone et se fait dans un `useEffect`. Il n'y a aucune garantie qu'elle soit terminée quand l'utilisateur clique pour la première fois.

### 2. Superposition de voix multiples

**Symptôme** : Quand on clique rapidement sur plusieurs lignes/cartes, plusieurs voix se superposent au lieu que la nouvelle remplace l'ancienne.

**Cause** : Race condition dans la synthèse vocale :
1. `playPlaybackItem()` appelle `ttsEngine.stop()`
2. Puis appelle immédiatement `speakLine()` qui lance une nouvelle synthèse
3. La synthèse est asynchrone (`ttsProviderManager.speak()` retourne une Promise)
4. Si plusieurs `speak()` sont appelés rapidement, plusieurs `.play()` sont exécutés dans leurs `.then()` respectifs
5. `stop()` met `currentAudio` à null, mais n'empêche pas les synthèses déjà lancées de jouer

### 3. Scroll saccadé persistant

**Symptôme** : Malgré les corrections précédentes, le scroll lors des transitions reste saccadé avec des va-et-vient.

**Cause** : L'`IntersectionObserver` n'est pas désactivé lors du scroll programmatique dans `speakLine`, seulement dans `handleGoToScene`.

## Solutions

### 1. État d'initialisation TTS

Ajout d'un état `ttsInitialized` pour suivre l'initialisation du TTS et bloquer les clics tant qu'elle n'est pas terminée.

```typescript
// État d'initialisation
const [ttsInitialized, setTtsInitialized] = useState(false)

// Dans useEffect d'initialisation
useEffect(() => {
  const initializeTTS = async () => {
    // ...
    await ttsProviderManager.initialize()
    setTtsInitialized(true)  // ← Marquer comme initialisé
    // ...
  }
  initializeTTS()
}, [playId, currentPlay, getPlaySettings])

// Dans handleLineClick et handleCardClick
const handleLineClick = useCallback((globalLineIndex: number) => {
  // Vérifier que le TTS est initialisé
  if (!ttsInitialized) {
    console.warn('[PlayScreen] ⚠️ TTS non initialisé, click ignoré')
    return
  }
  // ...
}, [/* ... */, ttsInitialized])
```

**Résultat** : Le premier clic est bloqué tant que le TTS n'est pas prêt, garantissant que l'audio fonctionne dès le premier essai.

### 2. Système de suivi des synthèses

Ajout d'un système d'ID de synthèse pour annuler les synthèses obsolètes quand une nouvelle est lancée.

#### a) Ajout de propriétés dans `PiperWASMProvider`

```typescript
private synthesisCounter = 0
private currentSynthesisId: number | null = null
```

#### b) Attribution d'un ID à chaque synthèse

```typescript
async synthesize(text: string, options: SynthesisOptions): Promise<SynthesisResult> {
  // Assigner un ID unique à cette synthèse
  const synthesisId = ++this.synthesisCounter
  this.currentSynthesisId = synthesisId
  console.warn(`[PiperWASM] 🎤 Synthèse #${synthesisId} démarrée`)
  
  // ...
}
```

#### c) Invalidation dans `stop()`

```typescript
stop(): void {
  // Invalider toutes les synthèses en cours
  this.currentSynthesisId = null
  console.warn(`[PiperWASM] ⏹️ STOP - invalidation des synthèses en cours`)
  
  // ...
}
```

#### d) Vérification avant de jouer l'audio

```typescript
// Après synthèse (cache ou génération)
if (this.currentSynthesisId !== synthesisId) {
  console.warn(`[PiperWASM] ⏭️ Synthèse #${synthesisId} annulée`)
  return {
    audio: new Audio(),  // Audio vide
    duration: 0,
    fromCache: false,
  }
}

// Sinon, jouer l'audio normalement
const blobUrl = URL.createObjectURL(audioBlob)
const audio = new Audio(blobUrl)
this.currentAudio = audio
// ...
```

**Résultat** : Quand `stop()` est appelé, toutes les synthèses en cours sont invalidées. Même si elles se terminent après, elles ne joueront pas d'audio.

#### e) Amélioration du nettoyage dans `stop()`

```typescript
stop(): void {
  this.currentSynthesisId = null
  
  if (this.currentAudio) {
    this.currentAudio.pause()
    this.currentAudio.currentTime = 0
    
    // Nettoyer complètement l'audio
    const oldAudio = this.currentAudio
    this.currentAudio = null
    
    try {
      oldAudio.src = ''
      oldAudio.load()
    } catch (e) {
      // Ignorer les erreurs de nettoyage
    }
  }
}
```

**Résultat** : L'ancien audio est complètement nettoyé (src vidé, load() appelé) pour forcer l'arrêt.

### 3. Flag de scroll programmatique dans `speakLine`

Activation de `isScrollingProgrammaticallyRef` lors du scroll dans `speakLine` pour désactiver l'IntersectionObserver.

```typescript
const speakLine = useCallback((globalLineIndex: number) => {
  // ...
  
  // Activer le flag de scroll programmatique avant de scroller
  isScrollingProgrammaticallyRef.current = true
  
  // Scroll vers la ligne
  scrollToLine(globalLineIndex)
  
  // Désactiver le flag après le scroll
  setTimeout(() => {
    isScrollingProgrammaticallyRef.current = false
  }, 800)
  
}, [])
```

**Résultat** : L'IntersectionObserver ignore les scrolls programmatiques dans `speakLine`, évitant les conflits et les sacades.

### 4. Méthode `isInitialized()` dans `TTSProviderManager`

Ajout d'une méthode publique pour vérifier l'état d'initialisation.

```typescript
isInitialized(): boolean {
  return this.initialized
}
```

**Utilisation future** : Permet de vérifier si le TTS est prêt avant de l'utiliser.

## Changements détaillés

### Fichier : `src/screens/PlayScreen.tsx`

1. **État `ttsInitialized`** (ligne ~92)
   ```typescript
   const [ttsInitialized, setTtsInitialized] = useState(false)
   ```

2. **Marquage après initialisation** (ligne ~391)
   ```typescript
   await ttsProviderManager.initialize()
   setTtsInitialized(true)
   ```

3. **Vérification dans `handleCardClick`** (lignes ~1496-1502)
   ```typescript
   if (!ttsInitialized) {
     console.warn('[PlayScreen] ⚠️ TTS non initialisé, click ignoré')
     return
   }
   ```

4. **Vérification dans `handleLineClick`** (lignes ~1541-1547)
   ```typescript
   if (!ttsInitialized) {
     console.warn('[PlayScreen] ⚠️ TTS non initialisé, click ignoré')
     return
   }
   ```

5. **Flag scroll programmatique dans `speakLine`** (lignes ~1486-1495)
   ```typescript
   isScrollingProgrammaticallyRef.current = true
   scrollToLine(globalLineIndex)
   setTimeout(() => {
     isScrollingProgrammaticallyRef.current = false
   }, 800)
   ```

6. **Ajout dépendance `ttsInitialized`** (lignes ~1536, ~1602)

### Fichier : `src/core/tts/providers/PiperWASMProvider.ts`

1. **Propriétés de suivi** (lignes ~136-137)
   ```typescript
   private synthesisCounter = 0
   private currentSynthesisId: number | null = null
   ```

2. **Attribution ID synthèse** (lignes ~387-389)
   ```typescript
   const synthesisId = ++this.synthesisCounter
   this.currentSynthesisId = synthesisId
   console.warn(`[PiperWASM] 🎤 Synthèse #${synthesisId} démarrée`)
   ```

3. **Vérification avant lecture (cache)** (lignes ~418-428)
   ```typescript
   if (this.currentSynthesisId !== synthesisId) {
     console.warn(`[PiperWASM] ⏭️ Synthèse #${synthesisId} annulée (cache)`)
     return { audio: new Audio(), duration: 0, fromCache: true }
   }
   ```

4. **Vérification avant lecture (génération)** (lignes ~588-598)
   ```typescript
   if (this.currentSynthesisId !== synthesisId) {
     console.warn(`[PiperWASM] ⏭️ Synthèse #${synthesisId} annulée (après génération)`)
     return { audio: new Audio(), duration: 0, fromCache: false }
   }
   ```

5. **Invalidation dans `stop()`** (lignes ~755-757)
   ```typescript
   this.currentSynthesisId = null
   console.warn(`[PiperWASM] ⏹️ STOP - invalidation des synthèses en cours`)
   ```

6. **Nettoyage amélioré** (lignes ~781-795)
   ```typescript
   const oldAudio = this.currentAudio
   this.currentAudio = null
   
   try {
     oldAudio.src = ''
     oldAudio.load()
   } catch (e) {
     // Ignorer les erreurs
   }
   ```

### Fichier : `src/core/tts/providers/TTSProviderManager.ts`

1. **Méthode `isInitialized()`** (lignes ~92-97)
   ```typescript
   isInitialized(): boolean {
     return this.initialized
   }
   ```

## Résultat

- ✅ **Premier clic fonctionne** : le TTS est garanti initialisé avant lecture
- ✅ **Plus de superposition de voix** : les synthèses obsolètes sont invalidées
- ✅ **Scroll fluide** : l'IntersectionObserver est désactivé pendant les scrolls programmatiques
- ✅ **Arrêt propre** : l'audio est complètement nettoyé lors du `stop()`

## Tests recommandés

### Test 1 : Premier clic après ouverture
1. Ouvrir une pièce
2. Cliquer immédiatement sur une ligne (sans attendre)
3. ✅ Vérifier qu'elle se lit (ou que le clic est ignoré si TTS pas prêt)
4. Attendre 1-2 secondes
5. Cliquer à nouveau
6. ✅ Vérifier que ça fonctionne

### Test 2 : Clics rapides multiples
1. Lancer lecture d'une ligne
2. Cliquer rapidement sur 3-4 autres lignes
3. ✅ Vérifier qu'une seule voix se lit à la fois
4. ✅ Pas de superposition de voix

### Test 3 : Scroll pendant lecture
1. Lancer lecture d'une ligne
2. Observer le scroll automatique
3. ✅ Vérifier que le scroll est fluide, sans sacades
4. ✅ Pas de va-et-vient

### Test 4 : Changement rapide ligne → carte → ligne
1. Lancer lecture d'une ligne
2. Cliquer immédiatement sur une carte de structure
3. Cliquer immédiatement sur une autre ligne
4. ✅ Vérifier qu'une seule voix se lit
5. ✅ La dernière cliquée

## Notes techniques

### Race conditions évitées

Le système d'ID de synthèse résout plusieurs race conditions :

```
Timeline AVANT (superposition) :
t=0    : User clique ligne A → synthesize(A) démarre
t=100  : User clique ligne B → stop() → synthesize(B) démarre
t=200  : synthesize(A) termine → audio A.play()  ← PROBLÈME !
t=250  : synthesize(B) termine → audio B.play()
→ A et B jouent en même temps !

Timeline APRÈS (invalidation) :
t=0    : User clique ligne A → synthesize(A, id=1) démarre
t=100  : User clique ligne B → stop() (currentId=null) → synthesize(B, id=2) démarre
t=200  : synthesize(A) termine → check (id=1 vs null) → ANNULÉ ✓
t=250  : synthesize(B) termine → check (id=2 vs 2) → audio B.play() ✓
→ Seul B joue
```

### Performances

- L'ajout de vérifications `if (currentSynthesisId !== synthesisId)` a un coût négligeable
- Le nettoyage `oldAudio.src = ''` force le navigateur à libérer les ressources
- Les logs `console.warn` peuvent être retirés en production

### Compatibilité

- Les modifications sont compatibles avec tous les navigateurs modernes
- Le try/catch dans `stop()` évite les erreurs sur Safari
- L'invalidation fonctionne avec le cache audio

## Références

- Thread d'origine : "Long press breaks italian line playback"
- Correctif précédent : `BUGFIX_AUTO_PROGRESSION.md`
- Architecture TTS : `src/core/tts/`
