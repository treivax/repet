# Optimisation de la Première Lecture Audio - Analyse Technique

**Date:** 2025-01-XX  
**Version:** v0.4.1  
**Focus:** Réduction du temps de génération audio lors de la première lecture d'une réplique

---

## 📊 État Actuel du Pipeline TTS

### Flow de Génération (Première Lecture)

```
User Click sur Réplique
    ↓
1. Vérification Cache AudioCacheService
   ├─ ✅ Trouvé → Lecture immédiate (~50-100ms)
   └─ ❌ Pas trouvé → Génération nécessaire
    ↓
2. Chargement Session TTS (si pas en cache)
   ├─ Téléchargement modèle ONNX (~60-76 MB)
   ├─ Chargement en mémoire
   ├─ Initialisation ONNX Runtime
   └─ Temps: 2000-5000ms (première fois)
    ↓
3. Phonémisation du Texte
   ├─ Conversion texte → phonèmes (espeak-ng)
   ├─ Gérée en interne par piper-tts-web
   └─ Temps: 50-200ms
    ↓
4. Inférence ONNX
   ├─ Génération audio via modèle neuronal
   ├─ CPU/WASM single-threaded
   └─ Temps: 500-2000ms (selon longueur texte)
    ↓
5. Post-traitement
   ├─ Création Blob audio
   ├─ Mise en cache IndexedDB
   ├─ Application modifiers (rate, pitch, volume)
   └─ Temps: 50-100ms
    ↓
6. Lecture Audio
   └─ Temps: Durée de l'audio
```

**Temps Total (Première Lecture):**
- Réplique courte (10-20 mots): **3-6 secondes**
- Réplique moyenne (30-50 mots): **4-8 secondes**
- Réplique longue (100+ mots): **6-12 secondes**

---

## 🎯 Opportunités d'Optimisation

### 1. Preloading Prédictif des Sessions ⭐⭐⭐

#### Problème Actuel
La session TTS (modèle ONNX) n'est chargée qu'au moment du premier clic. Cela ajoute **2-5 secondes** de latence.

#### Solution: Preload Intelligent

**A. Preload au Chargement de la Pièce**

```typescript
// src/screens/PlayScreen.tsx
useEffect(() => {
  if (currentPlay && playSettings) {
    // Identifier les voix utilisées dans la scène courante
    const voicesInScene = getVoicesForCurrentScene(
      currentPlay,
      playSettings,
      currentActIndex,
      currentSceneIndex
    )
    
    // Preloader les 2-3 premières voix (prioriser par usage)
    const priorityVoices = voicesInScene.slice(0, 3)
    
    Promise.all(
      priorityVoices.map(voiceId => 
        ttsProviderManager.getActiveProvider().preloadModel(voiceId)
      )
    ).then(() => {
      console.log('✅ Voix principales préchargées')
    })
  }
}, [currentPlay, currentActIndex, currentSceneIndex])
```

**Impact:**
- ✅ Première lecture: **3-6s → 1-2s** (-60-70%)
- ✅ Sessions en cache pour toute la scène
- ⚠️ Augmentation mémoire: +150-200 MB (2-3 modèles)

**B. Preload Progressif en Arrière-Plan**

```typescript
// Preload pendant la lecture
async function preloadNextVoices(currentLineIndex: number) {
  const nextLines = getNextLines(currentLineIndex, 5) // 5 prochaines répliques
  const nextVoices = new Set(nextLines.map(line => getVoiceForLine(line)))
  
  for (const voiceId of nextVoices) {
    if (!sessionCache.has(voiceId)) {
      await ttsProviderManager.getActiveProvider().preloadModel(voiceId)
    }
  }
}
```

**Impact:**
- ✅ Preload invisible pour l'utilisateur
- ✅ Sessions prêtes avant que l'utilisateur arrive
- ⚠️ Bande passante utilisée en arrière-plan

---

### 2. Prefetching Audio des Prochaines Répliques ⭐⭐⭐

#### Problème Actuel
Chaque réplique est générée au moment du clic. Aucune anticipation.

#### Solution: Génération Anticipée

**A. Prefetch des N Prochaines Répliques**

```typescript
// src/utils/audioPrefetcher.ts
class AudioPrefetcher {
  private prefetchQueue: Set<number> = new Set()
  private isProcessing = false
  
  async prefetchNextLines(currentLineIndex: number, count: number = 3) {
    const nextLines = getNextLines(currentLineIndex, count)
    
    for (const line of nextLines) {
      // Vérifier si déjà en cache
      const cached = await audioCacheService.getAudio(
        line.text,
        getVoiceForLine(line)
      )
      
      if (!cached && !this.prefetchQueue.has(line.index)) {
        this.prefetchQueue.add(line.index)
        this.processPrefetchQueue()
      }
    }
  }
  
  private async processPrefetchQueue() {
    if (this.isProcessing) return
    this.isProcessing = true
    
    while (this.prefetchQueue.size > 0) {
      const lineIndex = this.prefetchQueue.values().next().value
      this.prefetchQueue.delete(lineIndex)
      
      try {
        // Générer en arrière-plan (pas de lecture)
        await generateAudioSilently(lineIndex)
      } catch (error) {
        console.warn('Prefetch failed:', error)
      }
    }
    
    this.isProcessing = false
  }
}
```

**Usage:**

```typescript
// Après chaque lecture
onAudioEnd(() => {
  audioPrefetcher.prefetchNextLines(currentLineIndex, 3)
})
```

**Impact:**
- ✅ Répliques suivantes déjà générées
- ✅ Lecture immédiate au clic (~50-100ms)
- ✅ Expérience fluide
- ⚠️ CPU utilisé en arrière-plan
- ⚠️ Stockage IndexedDB augmenté

---

### 3. Optimisation de la Segmentation Texte ⭐⭐

#### Problème Actuel
Les répliques longues sont traitées en un seul bloc, augmentant le temps de génération.

#### Solution: Streaming Audio Progressif

**A. Décomposition Intelligente**

```typescript
// src/utils/textSegmentation.ts
function segmentTextForStreaming(text: string): string[] {
  const segments: string[] = []
  
  // Séparer par phrases (. ! ?)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  
  let currentSegment = ''
  const MAX_WORDS_PER_SEGMENT = 20
  
  for (const sentence of sentences) {
    const words = sentence.split(' ')
    
    if (currentSegment.split(' ').length + words.length > MAX_WORDS_PER_SEGMENT) {
      if (currentSegment) segments.push(currentSegment.trim())
      currentSegment = sentence
    } else {
      currentSegment += ' ' + sentence
    }
  }
  
  if (currentSegment) segments.push(currentSegment.trim())
  
  return segments
}
```

**B. Génération et Lecture en Streaming**

```typescript
async function playTextWithStreaming(text: string, voiceId: string) {
  const segments = segmentTextForStreaming(text)
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    
    // Générer segment actuel
    const audioPromise = ttsProviderManager.speak(segment, { voiceId })
    
    // Précharger segment suivant en parallèle
    if (i + 1 < segments.length) {
      generateAudioSilently(segments[i + 1], voiceId)
    }
    
    // Attendre et jouer segment actuel
    const { audio } = await audioPromise
    await playAudio(audio)
  }
}
```

**Impact:**
- ✅ Début de lecture plus rapide (premier segment)
- ✅ Perception de rapidité améliorée
- ✅ Parallélisation génération + lecture
- ⚠️ Complexité accrue
- ⚠️ Gestion des pauses entre segments

---

### 4. Optimisation ONNX Runtime ⭐⭐

#### Problème Actuel
ONNX Runtime utilise WASM single-threaded par défaut.

#### Solution: WebAssembly SIMD + Threads

**A. Vérifier Configuration Actuelle**

```typescript
// src/core/tts/providers/PiperWASMProvider.ts
async initialize() {
  const ort = await import('onnxruntime-web')
  
  // Vérifier support SIMD
  if (ort.env.wasm.simd) {
    console.log('✅ SIMD activé')
  }
  
  // Activer threads si disponible
  ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4
  ort.env.wasm.proxy = true // Web Worker
  
  console.log(`⚡ ONNX Threads: ${ort.env.wasm.numThreads}`)
}
```

**B. Configuration Vite pour SharedArrayBuffer**

Déjà en place dans `vite.config.ts`:
```typescript
server: {
  headers: {
    'Cross-Origin-Embedder-Policy': 'credentialless',
    'Cross-Origin-Opener-Policy': 'same-origin',
  },
}
```

**Impact:**
- ✅ Inférence 2-4x plus rapide (multi-core)
- ✅ Gain: 500-2000ms → 200-800ms
- ⚠️ Nécessite HTTPS + headers COOP/COEP

---

### 5. Cache Warmup au Démarrage de l'App ⭐

#### Problème Actuel
Première visite = tout doit être téléchargé et généré.

#### Solution: Warm Cache avec Répliques Communes

**A. Générer Cache Initial**

```typescript
// src/core/tts/warmCache.ts
const COMMON_PHRASES = [
  'Bonjour',
  'Comment allez-vous ?',
  'Merci beaucoup',
  'Au revoir',
  // 20-30 phrases courantes du théâtre français
]

async function warmAudioCache() {
  const voices = ['fr_FR-siwis-medium', 'fr_FR-tom-medium']
  
  for (const voiceId of voices) {
    // Preload modèle
    await ttsProviderManager.getActiveProvider().preloadModel(voiceId)
    
    // Générer phrases communes
    for (const phrase of COMMON_PHRASES) {
      try {
        await ttsProviderManager.speak(phrase, { voiceId })
      } catch (error) {
        console.warn('Warm cache failed:', phrase, error)
      }
    }
  }
}

// Appeler au chargement de l'app (après un délai)
setTimeout(() => warmAudioCache(), 5000)
```

**Impact:**
- ✅ Sessions déjà chargées
- ✅ Cache IndexedDB pré-rempli
- ✅ Phrases courantes instantanées
- ⚠️ Bande passante initiale importante
- ⚠️ Délai d'initialisation

---

### 6. Compression Audio et Format Optimisé ⭐

#### Problème Actuel
Audio généré en WAV non compressé (volumineux).

#### Solution: Conversion Opus/MP3

**A. Compression Post-Génération**

```typescript
async function compressAudio(audioBlob: Blob): Promise<Blob> {
  // Utiliser Web Audio API pour encoder en Opus
  const audioContext = new AudioContext()
  const arrayBuffer = await audioBlob.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  
  // Encoder en format compressé (Opus ou MP3)
  const mediaRecorder = new MediaRecorder(
    audioContext.createMediaStreamSource(audioBuffer),
    { mimeType: 'audio/webm;codecs=opus' }
  )
  
  // ... recorder logic
  
  return compressedBlob
}
```

**Impact:**
- ✅ Taille cache réduite de 70-80%
- ✅ Plus d'audios en cache (quota)
- ⚠️ Temps de compression additionnel (+100-200ms)
- ⚠️ Perte qualité minime

---

### 7. Parallélisation Session + Génération ⭐⭐

#### Problème Actuel
Chargement session → Puis génération (séquentiel).

#### Solution: Pipeline Parallèle

**A. Générer Pendant le Chargement**

```typescript
async function synthesizeWithParallelLoading(
  text: string,
  voiceId: string
): Promise<SynthesisResult> {
  // Démarrer chargement session
  const sessionPromise = loadOrCreateSession(voiceId)
  
  // En parallèle, préparer le texte
  const textPreprocessingPromise = preprocessText(text)
  
  // Attendre les deux
  const [session, preprocessedText] = await Promise.all([
    sessionPromise,
    textPreprocessingPromise
  ])
  
  // Synthétiser
  return session.predict(preprocessedText)
}
```

**Impact:**
- ✅ Gain: 50-100ms sur temps total
- ✅ Optimisation CPU
- ⚠️ Gain marginal si preprocessing léger

---

### 8. Didascalies: Voix Dédiée Légère ⭐⭐

#### Problème Actuel
Didascalies utilisent le même modèle que les répliques.

#### Solution: Modèle Léger pour Didascalies

**A. Ajouter Voix Didascalie**

```typescript
// Utiliser un modèle plus petit et plus rapide pour les didascalies
const STAGE_DIRECTION_VOICE = {
  id: 'fr_FR-siwis-low',  // Modèle qualité "low" (~20 MB vs 60 MB)
  name: 'Didascalies (Rapide)',
  speakerId: 0,
}
```

**B. Détection Automatique**

```typescript
function getVoiceForSegment(segment: TextSegment, characterVoiceId: string) {
  if (segment.type === 'stage-direction') {
    return STAGE_DIRECTION_VOICE.id
  }
  return characterVoiceId
}
```

**Impact:**
- ✅ Génération didascalies 2-3x plus rapide
- ✅ Moins de mémoire utilisée
- ✅ Qualité suffisante pour contexte
- ⚠️ Voix différente (peut être voulu)

---

## 📊 Plan d'Implémentation Priorisé

### Phase 1: Quick Wins (2-3h) ⭐⭐⭐

**Implémentations:**
1. ✅ Preload sessions au chargement de scène
2. ✅ Prefetch 2-3 prochaines répliques
3. ✅ Vérifier config ONNX threads

**Gains estimés:**
- Première lecture: **3-6s → 1-2s** (-60-70%)
- Lectures suivantes: **Quasi instantanées**

**Effort:** Faible - Modifications existantes

---

### Phase 2: Optimisations Avancées (4-6h) ⭐⭐

**Implémentations:**
1. ✅ Streaming audio progressif
2. ✅ Compression audio Opus
3. ✅ Voix légère pour didascalies

**Gains estimés:**
- Perception rapidité: **+50%**
- Stockage cache: **-70%**
- Génération didascalies: **-50%**

**Effort:** Moyen - Nouveaux systèmes

---

### Phase 3: Optimisations Expérimentales (6-8h) ⭐

**Implémentations:**
1. ⚡ Cache warmup intelligent
2. ⚡ Pipeline parallèle avancé
3. ⚡ Web Worker pour génération

**Gains estimés:**
- Première visite: **+30%**
- CPU utilisation: **Meilleure**

**Effort:** Élevé - Refactoring significatif

---

## 🔬 Métriques à Suivre

### KPIs Performance

```typescript
interface AudioGenerationMetrics {
  // Temps
  sessionLoadTime: number        // Chargement modèle ONNX
  phonemizationTime: number      // Conversion texte → phonèmes
  inferenceTime: number          // Génération audio ONNX
  postProcessingTime: number     // Blob + cache + modifiers
  totalTime: number              // Temps total perçu
  
  // Cache
  cacheHitRate: number           // % hits vs miss
  cacheSizeMB: number            // Taille totale IndexedDB
  
  // Qualité
  userWaitTime: number           // Temps avant début lecture
  prefetchSuccessRate: number    // % prefetch réussis
}
```

### Outils de Mesure

```typescript
// src/utils/performanceMonitor.ts
class AudioPerformanceMonitor {
  startMeasure(lineIndex: number) {
    performance.mark(`audio-gen-start-${lineIndex}`)
  }
  
  endMeasure(lineIndex: number) {
    performance.mark(`audio-gen-end-${lineIndex}`)
    performance.measure(
      `audio-generation-${lineIndex}`,
      `audio-gen-start-${lineIndex}`,
      `audio-gen-end-${lineIndex}`
    )
    
    const measure = performance.getEntriesByName(
      `audio-generation-${lineIndex}`
    )[0]
    
    console.log(`⏱️ Audio gen time: ${measure.duration.toFixed(0)}ms`)
  }
}
```

---

## 💡 Recommandations Finales

### Court Terme (Déployer v0.4.2)

**Implémenter:**
1. ✅ Preload sessions (Phase 1.1)
2. ✅ Prefetch 2 prochaines répliques (Phase 1.2)
3. ✅ Monitoring performance

**Impact:**
- Gain immédiat: **60-70%** sur première lecture
- Effort: 2-3 heures
- Risque: Faible

### Moyen Terme (v0.5.0)

**Implémenter:**
1. ✅ Streaming progressif
2. ✅ Compression audio
3. ✅ Tests utilisateurs

**Impact:**
- Expérience perçue: **Très améliorée**
- Effort: 4-6 heures
- Risque: Moyen (tests requis)

### Long Terme (v0.6.0+)

**Explorer:**
1. 🔬 Web Worker pour génération
2. 🔬 Cache warmup prédictif
3. 🔬 Modèles TTS plus légers

**Impact:**
- Innovation continue
- Effort: Variable
- Risque: Expérimental

---

## 🎯 Objectifs de Performance

### Cibles v0.4.2 (Phase 1)

| Métrique | Actuel | Cible | Amélioration |
|----------|--------|-------|--------------|
| Première lecture (courte) | 3-6s | 1-2s | **-60-70%** |
| Première lecture (moyenne) | 4-8s | 2-3s | **-60%** |
| Lectures suivantes | 50-100ms | 50-100ms | = (déjà optimal) |
| Sessions préchargées | 0 | 2-3 | ✅ |
| Répliques prefetch | 0 | 2-3 | ✅ |

### Cibles v0.5.0 (Phase 2)

| Métrique | v0.4.2 | Cible | Amélioration |
|----------|--------|-------|--------------|
| Perception rapidité | Bon | Excellent | **+50%** |
| Cache utilisé | 100% | 30% | **-70%** |
| Didascalies | 1-2s | 0.5-1s | **-50%** |

---

**Créé par:** AI Assistant  
**Dernière mise à jour:** 2025-01-XX  
**Status:** 📋 Plan d'action prêt pour implémentation