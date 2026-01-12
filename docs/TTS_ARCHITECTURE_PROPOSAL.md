# Architecture TTS Multi-Provider pour Répét

**Date** : Janvier 2025  
**Version** : 1.0  
**Statut** : Proposition

---

## 🎯 Objectif

Permettre à Répét d'utiliser **plusieurs fournisseurs TTS** avec une architecture modulaire et extensible :

1. **Web Speech API** (actuel, par défaut)
2. **Google Cloud TTS** (option premium)
3. **Piper WASM** (futur, gratuit et hors ligne)
4. Extensible pour d'autres providers

---

## 📐 Architecture Proposée

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   TTSSettingsPanel (sélection provider + config)     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Core TTS Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              TTSProviderManager                      │   │
│  │  - getAvailableProviders()                          │   │
│  │  - setActiveProvider(type)                          │   │
│  │  - speak(text, config)                              │   │
│  │  - stop(), pause(), resume()                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│              ┌────────────┼────────────┐                     │
│              ▼            ▼            ▼                     │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────┐          │
│  │  WebSpeech   │  │  Google  │  │    Piper     │          │
│  │   Provider   │  │   Cloud  │  │    WASM      │          │
│  │              │  │  Provider│  │   Provider   │          │
│  └──────────────┘  └──────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Storage Layer                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         AudioCacheService (IndexedDB)                │   │
│  │  - cacheAudio(key, blob)                            │   │
│  │  - getAudio(key)                                    │   │
│  │  - clearCache()                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Interfaces et Types

### 1. Types Communs

```typescript
// src/core/tts/providers/types.ts

/**
 * Type de provider TTS
 */
export type TTSProviderType = 'web-speech' | 'google-cloud' | 'piper-wasm'

/**
 * État de disponibilité d'un provider
 */
export interface TTSProviderAvailability {
  available: boolean
  reason?: string // Si non disponible
}

/**
 * Configuration d'un provider
 */
export interface TTSProviderConfig {
  type: TTSProviderType
  enabled: boolean
  settings: Record<string, unknown>
}

/**
 * Configuration Google Cloud
 */
export interface GoogleCloudConfig {
  apiKey: string
  preferredVoice?: string
}

/**
 * Configuration Piper WASM
 */
export interface PiperWASMConfig {
  modelPath?: string
  voiceId?: string
}

/**
 * Information sur une voix (générique)
 */
export interface VoiceDescriptor {
  id: string
  name: string
  language: string
  gender?: 'male' | 'female' | 'neutral'
  provider: TTSProviderType
  quality?: 'low' | 'medium' | 'high' | 'premium'
  requiresDownload?: boolean
  downloadSize?: number // en MB
  isLocal?: boolean
}

/**
 * Résultat de synthèse
 */
export interface SynthesisResult {
  audio: AudioBuffer | Blob | string // selon le provider
  duration: number
  fromCache: boolean
}

/**
 * Événements de synthèse
 */
export interface SynthesisEvents {
  onStart?: () => void
  onProgress?: (percent: number) => void
  onEnd?: () => void
  onError?: (error: Error) => void
}
```

### 2. Interface Provider

```typescript
// src/core/tts/providers/TTSProvider.ts

/**
 * Interface commune à tous les providers TTS
 */
export interface TTSProvider {
  /**
   * Type du provider
   */
  readonly type: TTSProviderType

  /**
   * Nom affiché du provider
   */
  readonly name: string

  /**
   * Initialise le provider
   */
  initialize(config?: Record<string, unknown>): Promise<void>

  /**
   * Vérifie si le provider est disponible
   */
  checkAvailability(): Promise<TTSProviderAvailability>

  /**
   * Récupère la liste des voix disponibles
   */
  getVoices(): Promise<VoiceDescriptor[]>

  /**
   * Synthétise du texte en audio
   * @param text - Texte à synthétiser
   * @param voiceId - ID de la voix à utiliser
   * @param options - Options de synthèse (rate, pitch, volume)
   * @param events - Callbacks d'événements
   */
  synthesize(
    text: string,
    voiceId: string,
    options?: {
      rate?: number
      pitch?: number
      volume?: number
    },
    events?: SynthesisEvents
  ): Promise<SynthesisResult>

  /**
   * Arrête la lecture en cours
   */
  stop(): void

  /**
   * Met en pause la lecture
   */
  pause?(): void

  /**
   * Reprend la lecture
   */
  resume?(): void

  /**
   * Nettoie les ressources
   */
  dispose(): Promise<void>
}
```

---

## 📦 Implémentation des Providers

### 1. WebSpeechProvider (existant, à adapter)

```typescript
// src/core/tts/providers/WebSpeechProvider.ts

export class WebSpeechProvider implements TTSProvider {
  readonly type: TTSProviderType = 'web-speech'
  readonly name = 'Voix Système'

  private synth: SpeechSynthesis
  private currentUtterance: SpeechSynthesisUtterance | null = null

  async initialize(): Promise<void> {
    if (!('speechSynthesis' in window)) {
      throw new Error('Web Speech API non disponible')
    }
    this.synth = window.speechSynthesis
    
    // Attendre que les voix soient chargées
    return new Promise((resolve) => {
      const voices = this.synth.getVoices()
      if (voices.length > 0) {
        resolve()
      } else {
        this.synth.addEventListener('voiceschanged', () => resolve(), { once: true })
      }
    })
  }

  async checkAvailability(): Promise<TTSProviderAvailability> {
    if ('speechSynthesis' in window) {
      return { available: true }
    }
    return { 
      available: false, 
      reason: 'Web Speech API non supportée par ce navigateur' 
    }
  }

  async getVoices(): Promise<VoiceDescriptor[]> {
    const voices = this.synth.getVoices()
    
    return voices
      .filter(v => v.lang.startsWith('fr'))
      .map(v => ({
        id: v.voiceURI,
        name: v.name,
        language: v.lang,
        provider: 'web-speech' as const,
        quality: 'medium',
        isLocal: v.localService
      }))
  }

  async synthesize(
    text: string,
    voiceId: string,
    options = {},
    events?: SynthesisEvents
  ): Promise<SynthesisResult> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)
      
      const voice = this.synth.getVoices().find(v => v.voiceURI === voiceId)
      if (voice) utterance.voice = voice
      
      utterance.rate = options.rate ?? 1.0
      utterance.pitch = options.pitch ?? 1.0
      utterance.volume = options.volume ?? 1.0

      utterance.onstart = () => events?.onStart?.()
      utterance.onend = () => {
        events?.onEnd?.()
        // Web Speech API ne retourne pas l'audio, juste la lecture
        resolve({ 
          audio: '', 
          duration: 0, 
          fromCache: false 
        })
      }
      utterance.onerror = (e) => {
        const error = new Error(`Erreur TTS: ${e.error}`)
        events?.onError?.(error)
        reject(error)
      }

      this.currentUtterance = utterance
      this.synth.speak(utterance)
    })
  }

  stop(): void {
    this.synth.cancel()
    this.currentUtterance = null
  }

  pause(): void {
    this.synth.pause()
  }

  resume(): void {
    this.synth.resume()
  }

  async dispose(): Promise<void> {
    this.stop()
  }
}
```

### 2. GoogleCloudProvider (nouveau)

```typescript
// src/core/tts/providers/GoogleCloudProvider.ts

export class GoogleCloudProvider implements TTSProvider {
  readonly type: TTSProviderType = 'google-cloud'
  readonly name = 'Google Cloud (Premium)'

  private apiKey: string = ''
  private audioCache: AudioCacheService

  constructor(private cacheService: AudioCacheService) {
    this.audioCache = cacheService
  }

  async initialize(config?: { apiKey?: string }): Promise<void> {
    if (!config?.apiKey) {
      throw new Error('API Key Google Cloud requise')
    }
    this.apiKey = config.apiKey
    
    // Tester la clé
    await this.testApiKey()
  }

  private async testApiKey(): Promise<void> {
    // Test simple avec une requête de liste de voix
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/voices?key=${this.apiKey}`
    )
    
    if (!response.ok) {
      throw new Error('API Key invalide ou quota dépassé')
    }
  }

  async checkAvailability(): Promise<TTSProviderAvailability> {
    if (!this.apiKey) {
      return { 
        available: false, 
        reason: 'API Key non configurée' 
      }
    }
    
    try {
      await this.testApiKey()
      return { available: true }
    } catch (error) {
      return { 
        available: false, 
        reason: error instanceof Error ? error.message : 'Erreur inconnue' 
      }
    }
  }

  async getVoices(): Promise<VoiceDescriptor[]> {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/voices?key=${this.apiKey}`
    )
    
    if (!response.ok) {
      throw new Error('Impossible de récupérer les voix')
    }
    
    const data = await response.json()
    
    return data.voices
      .filter((v: any) => v.languageCodes.some((l: string) => l.startsWith('fr')))
      .map((v: any) => ({
        id: v.name,
        name: v.name,
        language: v.languageCodes[0],
        gender: v.ssmlGender?.toLowerCase(),
        provider: 'google-cloud' as const,
        quality: v.name.includes('Neural2') || v.name.includes('Wavenet') 
          ? 'premium' 
          : 'high',
        isLocal: false
      }))
  }

  async synthesize(
    text: string,
    voiceId: string,
    options = {},
    events?: SynthesisEvents
  ): Promise<SynthesisResult> {
    // Vérifier le cache d'abord
    const cacheKey = this.getCacheKey(text, voiceId, options)
    const cached = await this.audioCache.getAudio(cacheKey)
    
    if (cached) {
      events?.onStart?.()
      events?.onEnd?.()
      return { 
        audio: cached, 
        duration: 0, // TODO: calculer depuis le blob
        fromCache: true 
      }
    }

    // Synthétiser
    events?.onStart?.()
    
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'fr-FR',
            name: voiceId
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: options.rate ?? 1.0,
            pitch: options.pitch ?? 0,
            volumeGainDb: this.volumeToDb(options.volume ?? 1.0)
          }
        })
      }
    )

    if (!response.ok) {
      const error = new Error('Erreur lors de la synthèse')
      events?.onError?.(error)
      throw error
    }

    const data = await response.json()
    const audioContent = data.audioContent // base64
    
    // Convertir en blob
    const blob = this.base64ToBlob(audioContent, 'audio/mp3')
    
    // Mettre en cache
    await this.audioCache.cacheAudio(cacheKey, blob)
    
    events?.onEnd?.()
    
    return { 
      audio: blob, 
      duration: 0, // TODO: calculer
      fromCache: false 
    }
  }

  private getCacheKey(text: string, voiceId: string, options: any): string {
    return `google-cloud:${voiceId}:${options.rate ?? 1}:${text.substring(0, 100)}`
  }

  private volumeToDb(volume: number): number {
    // Convertir 0-1 en dB (-96 à +16)
    if (volume === 0) return -96
    if (volume === 1) return 0
    return 20 * Math.log10(volume)
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  stop(): void {
    // Google Cloud est asynchrone, pas de lecture en cours
  }

  async dispose(): Promise<void> {
    this.apiKey = ''
  }
}
```

### 3. PiperWASMProvider (futur)

```typescript
// src/core/tts/providers/PiperWASMProvider.ts

export class PiperWASMProvider implements TTSProvider {
  readonly type: TTSProviderType = 'piper-wasm'
  readonly name = 'Piper (Hors Ligne)'

  private piperModule: any // Module WASM
  private loadedModels = new Map<string, any>()
  private audioCache: AudioCacheService

  constructor(private cacheService: AudioCacheService) {
    this.audioCache = cacheService
  }

  async initialize(): Promise<void> {
    // Charger le module WASM Piper
    // TODO: Implémenter après compilation de Piper en WASM
    try {
      const module = await import('@repet/piper-wasm')
      this.piperModule = module
    } catch (error) {
      throw new Error('Module Piper WASM non disponible')
    }
  }

  async checkAvailability(): Promise<TTSProviderAvailability> {
    // Vérifier que WASM est supporté
    if (typeof WebAssembly === 'undefined') {
      return { 
        available: false, 
        reason: 'WebAssembly non supporté' 
      }
    }
    
    return { available: true }
  }

  async getVoices(): Promise<VoiceDescriptor[]> {
    // Liste des modèles Piper disponibles
    return [
      {
        id: 'fr_FR-siwis-medium',
        name: 'Française (Siwis)',
        language: 'fr-FR',
        gender: 'female',
        provider: 'piper-wasm',
        quality: 'high',
        requiresDownload: true,
        downloadSize: 30,
        isLocal: true
      },
      {
        id: 'fr_FR-mls-medium',
        name: 'Française (MLS)',
        language: 'fr-FR',
        gender: 'female',
        provider: 'piper-wasm',
        quality: 'high',
        requiresDownload: true,
        downloadSize: 25,
        isLocal: true
      }
    ]
  }

  async synthesize(
    text: string,
    voiceId: string,
    options = {},
    events?: SynthesisEvents
  ): Promise<SynthesisResult> {
    // Charger le modèle si nécessaire
    if (!this.loadedModels.has(voiceId)) {
      await this.downloadAndLoadModel(voiceId, events)
    }

    const model = this.loadedModels.get(voiceId)
    
    events?.onStart?.()
    
    // Synthétiser avec Piper WASM
    const audioBuffer = await this.piperModule.synthesize(model, text, {
      speed: options.rate ?? 1.0
    })
    
    events?.onEnd?.()
    
    return {
      audio: audioBuffer,
      duration: audioBuffer.duration,
      fromCache: false
    }
  }

  private async downloadAndLoadModel(
    voiceId: string, 
    events?: SynthesisEvents
  ): Promise<void> {
    // Télécharger le modèle depuis Hugging Face ou CDN
    const modelUrl = `https://huggingface.co/rhasspy/piper-voices/resolve/main/${voiceId}.onnx`
    
    const response = await fetch(modelUrl)
    const total = parseInt(response.headers.get('content-length') || '0')
    
    if (!response.body) throw new Error('Pas de body')
    
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let received = 0
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      chunks.push(value)
      received += value.length
      
      events?.onProgress?.(received / total * 100)
    }
    
    // Assembler et charger le modèle
    const modelData = new Uint8Array(received)
    let position = 0
    for (const chunk of chunks) {
      modelData.set(chunk, position)
      position += chunk.length
    }
    
    const model = await this.piperModule.loadModel(modelData)
    this.loadedModels.set(voiceId, model)
    
    // Sauvegarder en IndexedDB pour usage futur
    await this.audioCache.cacheModel(voiceId, modelData)
  }

  stop(): void {
    // Arrêter la synthèse en cours si possible
  }

  async dispose(): Promise<void> {
    this.loadedModels.clear()
    if (this.piperModule?.dispose) {
      await this.piperModule.dispose()
    }
  }
}
```

---

## 🎛️ Manager Central

```typescript
// src/core/tts/providers/TTSProviderManager.ts

export class TTSProviderManager {
  private providers = new Map<TTSProviderType, TTSProvider>()
  private activeProvider: TTSProvider | null = null
  private audioCache: AudioCacheService

  constructor(cacheService: AudioCacheService) {
    this.audioCache = cacheService
    this.registerProviders()
  }

  private registerProviders(): void {
    // Enregistrer tous les providers
    this.providers.set('web-speech', new WebSpeechProvider())
    this.providers.set('google-cloud', new GoogleCloudProvider(this.audioCache))
    this.providers.set('piper-wasm', new PiperWASMProvider(this.audioCache))
  }

  async initialize(type: TTSProviderType, config?: Record<string, unknown>): Promise<void> {
    const provider = this.providers.get(type)
    if (!provider) {
      throw new Error(`Provider ${type} non trouvé`)
    }

    await provider.initialize(config)
    this.activeProvider = provider
  }

  async getAvailableProviders(): Promise<Array<{
    type: TTSProviderType
    name: string
    available: boolean
    reason?: string
  }>> {
    const results = []
    
    for (const [type, provider] of this.providers) {
      const availability = await provider.checkAvailability()
      results.push({
        type,
        name: provider.name,
        available: availability.available,
        reason: availability.reason
      })
    }
    
    return results
  }

  async getVoices(providerType?: TTSProviderType): Promise<VoiceDescriptor[]> {
    if (providerType) {
      const provider = this.providers.get(providerType)
      return provider ? provider.getVoices() : []
    }
    
    // Retourner toutes les voix de tous les providers
    const allVoices: VoiceDescriptor[] = []
    for (const provider of this.providers.values()) {
      try {
        const voices = await provider.getVoices()
        allVoices.push(...voices)
      } catch (error) {
        console.warn(`Erreur récupération voix ${provider.type}:`, error)
      }
    }
    return allVoices
  }

  async speak(
    text: string,
    voiceId: string,
    options?: {
      rate?: number
      pitch?: number
      volume?: number
    },
    events?: SynthesisEvents
  ): Promise<SynthesisResult> {
    if (!this.activeProvider) {
      throw new Error('Aucun provider actif')
    }

    return this.activeProvider.synthesize(text, voiceId, options, events)
  }

  stop(): void {
    this.activeProvider?.stop()
  }

  pause(): void {
    this.activeProvider?.pause?.()
  }

  resume(): void {
    this.activeProvider?.resume?.()
  }

  async dispose(): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.dispose()
    }
    this.providers.clear()
    this.activeProvider = null
  }
}
```

---

## 💾 Service de Cache Audio

```typescript
// src/core/tts/AudioCacheService.ts

interface CachedAudio {
  key: string
  blob: Blob
  createdAt: number
  accessCount: number
  lastAccess: number
}

export class AudioCacheService {
  private dbName = 'RepetAudioCache'
  private storeName = 'audioCache'
  private db: IDBDatabase | null = null

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' })
        }
      }
    })
  }

  async cacheAudio(key: string, blob: Blob): Promise<void> {
    if (!this.db) throw new Error('DB non initialisée')

    const cached: CachedAudio = {
      key,
      blob,
      createdAt: Date.now(),
      accessCount: 0,
      lastAccess: Date.now()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(cached)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getAudio(key: string): Promise<Blob | null> {
    if (!this.db) throw new Error('DB non initialisée')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)
      
      request.onsuccess = () => {
        const cached = request.result as CachedAudio | undefined
        if (cached) {
          // Mettre à jour les stats
          cached.accessCount++
          cached.lastAccess = Date.now()
          store.put(cached)
          
          resolve(cached.blob)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async clearCache(): Promise<void> {
    if (!this.db) throw new Error('DB non initialisée')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCacheSize(): Promise<number> {
    if (!this.db) throw new Error('DB non initialisée')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()
      
      request.onsuccess = () => {
        const items = request.result as CachedAudio[]
        const totalSize = items.reduce((sum, item) => sum + item.blob.size, 0)
        resolve(totalSize)
      }
      request.onerror = () => reject(request.error)
    })
  }
}
```

---

## 🎨 Composants UI

### Panneau de Paramètres TTS

```typescript
// src/components/settings/TTSProviderSettings.tsx

export function TTSProviderSettings() {
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [selectedType, setSelectedType] = useState<TTSProviderType>('web-speech')
  const [googleApiKey, setGoogleApiKey] = useState('')

  useEffect(() => {
    loadProviders()
  }, [])

  async function loadProviders() {
    const available = await ttsManager.getAvailableProviders()
    setProviders(available)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Moteur de Synthèse Vocale</h3>
      
      {providers.map(provider => (
        <div key={provider.type} className="border rounded-lg p-4">
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="tts-provider"
              value={provider.type}
              checked={selectedType === provider.type}
              onChange={() => setSelectedType(provider.type)}
              disabled={!provider.available}
            />
            <div className="flex-1">
              <div className="font-medium">{provider.name}</div>
              {!provider.available && (
                <div className="text-sm text-red-600">{provider.reason}</div>
              )}
            </div>
            <ProviderBadge type={provider.type} />
          </label>
          
          {/* Configuration spécifique */}
          {selectedType === provider.type && provider.type === 'google-cloud' && (
            <div className="mt-3 ml-8 space-y-2">
              <label className="block text-sm">
                API Key Google Cloud :
                <input
                  type="password"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="mt-1 block w-full rounded border px-3 py-2"
                />
              </label>
              <p className="text-xs text-gray-600">
                Obtenez une clé gratuite sur{' '}
                <a 
                  href="https://console.cloud.google.com" 
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  console.cloud.google.com
                </a>
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ProviderBadge({ type }: { type: TTSProviderType }) {
  const badges = {
    'web-speech': { label: 'Système', color: 'bg-gray-100 text-gray-800' },
    'google-cloud': { label: 'Premium', color: 'bg-blue-100 text-blue-800' },
    'piper-wasm': { label: 'Hors ligne', color: 'bg-green-100 text-green-800' }
  }
  
  const badge = badges[type]
  
  return (
    <span className={`px-2 py-1 text-xs rounded ${badge.color}`}>
      {badge.label}
    </span>
  )
}
```

---

## 🚀 Plan de Migration

### Phase 1 : Refactoring (1 semaine)

1. Créer les interfaces `TTSProvider`
2. Adapter `WebSpeechProvider` depuis code existant
3. Créer `TTSProviderManager`
4. Mettre à jour les composants UI

**Breaking changes** : Aucun (compatibilité maintenue)

### Phase 2 : Google Cloud (1 semaine)

1. Implémenter `GoogleCloudProvider`
2. Créer `AudioCacheService`
3. Ajouter UI pour configuration API key
4. Tests sur différentes pièces

### Phase 3 : Piper WASM (2-4 semaines)

1. POC : Compiler Piper en WASM
2. Implémenter `PiperWASMProvider`
3. Système de téléchargement de modèles
4. Gestion du cache de modèles
5. Tests de performance

---

## 📊 Métriques de Succès

- ✅ Nombre de voix disponibles > 10 (vs 1-2 actuellement)
- ✅ Qualité audio perçue (sondage utilisateurs)
- ✅ Taux d'adoption des providers alternatifs
- ✅ Réduction des coûts API (grâce au cache)
- ✅ Performance (latence de synthèse < 2s)

---

## 🔒 Sécurité

### API Keys

- ❌ Ne JAMAIS commit d'API key dans le code
- ✅ Stockage sécurisé local (localStorage chiffré ou non exposé)
- ✅ L'utilisateur fournit sa propre clé
- ✅ Option : Backend proxy avec rate limiting

### CORS

- Google Cloud TTS supporte CORS
- Pas de problème pour appels directs depuis le navigateur

---

**Auteurs** : Répét Contributors  
**Licence** : MIT  
**Date** : Janvier 2025