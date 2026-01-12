# Guide de Démarrage Rapide - Google Cloud TTS pour Répét

**Objectif** : Implémenter Google Cloud Text-to-Speech comme provider TTS alternatif  
**Durée estimée** : 1-2 semaines  
**Niveau** : Intermédiaire

---

## 🎯 Objectifs

À la fin de ce guide, Répét pourra :

- ✅ Utiliser Google Cloud TTS avec API key utilisateur
- ✅ Offrir 10-20 voix françaises de haute qualité
- ✅ Mettre en cache les audios générés (IndexedDB)
- ✅ Fonctionner hors ligne après génération
- ✅ Rester 100% compatible avec l'existant

---

## 📋 Prérequis

### Connaissances
- TypeScript / React
- Promises / async-await
- IndexedDB (bases)
- API REST

### Compte Google Cloud
1. Créer un compte Google Cloud : https://console.cloud.google.com
2. Activer l'API Text-to-Speech
3. Créer une API key avec restrictions (domaine uniquement)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    UI Components                        │
│  • TTSProviderSelector                                  │
│  • GoogleCloudAPIKeyInput                               │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Core TTS Layer                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │         TTSProviderManager                       │   │
│  │  - setProvider(type, config)                     │   │
│  │  - speak(text, voiceId)                          │   │
│  └──────────────────────────────────────────────────┘   │
│              │                     │                     │
│   ┌──────────▼──────────┐  ┌──────▼────────────┐        │
│   │ WebSpeechProvider   │  │ GoogleCloudProvider│        │
│   └─────────────────────┘  └────────────────────┘        │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              AudioCacheService                          │
│  - cacheAudio(key, blob)                                │
│  - getAudio(key) → Blob | null                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Étape 1 : Créer les Types (30 min)

### Fichier : `src/core/tts/providers/types.ts`

```typescript
/**
 * Type de provider TTS
 */
export type TTSProviderType = 'web-speech' | 'google-cloud'

/**
 * Configuration Google Cloud
 */
export interface GoogleCloudConfig {
  apiKey: string
  preferredVoice?: string
}

/**
 * Informations sur une voix (générique)
 */
export interface VoiceDescriptor {
  id: string
  name: string
  language: string
  gender?: 'male' | 'female' | 'neutral'
  provider: TTSProviderType
  quality: 'low' | 'medium' | 'high' | 'premium'
  isLocal: boolean
}

/**
 * Résultat de synthèse
 */
export interface SynthesisResult {
  audio: Blob | string // Blob pour Google, string pour Web Speech
  duration: number
  fromCache: boolean
}

/**
 * Événements de synthèse
 */
export interface SynthesisEvents {
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}
```

---

## 📝 Étape 2 : Interface Provider (30 min)

### Fichier : `src/core/tts/providers/TTSProvider.ts`

```typescript
import { TTSProviderType, VoiceDescriptor, SynthesisResult, SynthesisEvents } from './types'

/**
 * Interface commune à tous les providers TTS
 */
export interface TTSProvider {
  readonly type: TTSProviderType
  readonly name: string

  initialize(config?: Record<string, unknown>): Promise<void>
  getVoices(): Promise<VoiceDescriptor[]>
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
  stop(): void
  dispose(): Promise<void>
}
```

---

## 📝 Étape 3 : Service de Cache (2h)

### Fichier : `src/core/tts/AudioCacheService.ts`

```typescript
interface CachedAudio {
  key: string
  blob: Blob
  createdAt: number
  accessCount: number
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
      accessCount: 0
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
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)
      
      request.onsuccess = () => {
        const cached = request.result as CachedAudio | undefined
        resolve(cached ? cached.blob : null)
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
        const totalBytes = items.reduce((sum, item) => sum + item.blob.size, 0)
        resolve(totalBytes)
      }
      request.onerror = () => reject(request.error)
    })
  }
}

// Instance singleton
export const audioCacheService = new AudioCacheService()
```

---

## 📝 Étape 4 : Google Cloud Provider (4h)

### Fichier : `src/core/tts/providers/GoogleCloudProvider.ts`

```typescript
import { TTSProvider } from './TTSProvider'
import { TTSProviderType, VoiceDescriptor, SynthesisResult, SynthesisEvents } from './types'
import { AudioCacheService } from '../AudioCacheService'

interface GoogleCloudVoice {
  languageCodes: string[]
  name: string
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL'
  naturalSampleRateHertz: number
}

export class GoogleCloudProvider implements TTSProvider {
  readonly type: TTSProviderType = 'google-cloud'
  readonly name = 'Google Cloud (Premium)'

  private apiKey: string = ''
  private audioCache: AudioCacheService
  private audioContext: AudioContext | null = null

  constructor(cacheService: AudioCacheService) {
    this.audioCache = cacheService
  }

  async initialize(config?: { apiKey?: string }): Promise<void> {
    if (!config?.apiKey) {
      throw new Error('API Key Google Cloud requise')
    }
    this.apiKey = config.apiKey
    
    // Tester la clé
    await this.testApiKey()
    
    // Initialiser AudioContext pour la lecture
    this.audioContext = new AudioContext()
  }

  private async testApiKey(): Promise<void> {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/voices?key=${this.apiKey}`
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API Key invalide: ${error.error?.message || 'Erreur inconnue'}`)
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
      .filter((v: GoogleCloudVoice) => 
        v.languageCodes.some((l: string) => l.startsWith('fr'))
      )
      .map((v: GoogleCloudVoice) => ({
        id: v.name,
        name: v.name.replace(/-/g, ' '),
        language: v.languageCodes[0],
        gender: v.ssmlGender.toLowerCase() as 'male' | 'female' | 'neutral',
        provider: 'google-cloud' as const,
        quality: (v.name.includes('Neural2') || v.name.includes('Wavenet')) 
          ? 'premium' as const
          : 'high' as const,
        isLocal: false
      }))
  }

  async synthesize(
    text: string,
    voiceId: string,
    options = {},
    events?: SynthesisEvents
  ): Promise<SynthesisResult> {
    // Générer la clé de cache
    const cacheKey = this.getCacheKey(text, voiceId, options)
    
    // Vérifier le cache
    const cached = await this.audioCache.getAudio(cacheKey)
    if (cached) {
      console.log('Audio trouvé dans le cache')
      events?.onStart?.()
      await this.playAudioBlob(cached)
      events?.onEnd?.()
      return { 
        audio: cached, 
        duration: 0, 
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
            pitch: (options.pitch ?? 1.0) - 1.0, // Convertir 0-2 en -1 à +1
            volumeGainDb: this.volumeToDb(options.volume ?? 1.0)
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      const err = new Error(`Erreur synthèse: ${error.error?.message || 'Erreur inconnue'}`)
      events?.onError?.(err)
      throw err
    }

    const data = await response.json()
    const audioContent = data.audioContent // base64
    
    // Convertir en Blob
    const blob = this.base64ToBlob(audioContent, 'audio/mp3')
    
    // Mettre en cache
    await this.audioCache.cacheAudio(cacheKey, blob)
    
    // Lire l'audio
    await this.playAudioBlob(blob)
    
    events?.onEnd?.()
    
    return { 
      audio: blob, 
      duration: 0,
      fromCache: false 
    }
  }

  private async playAudioBlob(blob: Blob): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext non initialisé')
    }

    const arrayBuffer = await blob.arrayBuffer()
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
    
    const source = this.audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(this.audioContext.destination)
    
    return new Promise((resolve) => {
      source.onended = () => resolve()
      source.start(0)
    })
  }

  private getCacheKey(text: string, voiceId: string, options: any): string {
    const rate = options.rate ?? 1.0
    const pitch = options.pitch ?? 1.0
    const textHash = text.substring(0, 100) // Simplification
    return `gcloud:${voiceId}:${rate}:${pitch}:${textHash}`
  }

  private volumeToDb(volume: number): number {
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
    if (this.audioContext) {
      this.audioContext.suspend()
    }
  }

  async dispose(): Promise<void> {
    this.apiKey = ''
    if (this.audioContext) {
      await this.audioContext.close()
      this.audioContext = null
    }
  }
}
```

---

## 📝 Étape 5 : Adapter WebSpeechProvider (1h)

### Fichier : `src/core/tts/providers/WebSpeechProvider.ts`

Adapter le code existant pour implémenter l'interface `TTSProvider`.

```typescript
import { TTSProvider } from './TTSProvider'
import { TTSProviderType, VoiceDescriptor, SynthesisResult, SynthesisEvents } from './types'

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

  async getVoices(): Promise<VoiceDescriptor[]> {
    const voices = this.synth.getVoices()
    
    return voices
      .filter(v => v.lang.startsWith('fr'))
      .map(v => ({
        id: v.voiceURI,
        name: v.name,
        language: v.lang,
        provider: 'web-speech' as const,
        quality: 'medium' as const,
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
        resolve({ audio: '', duration: 0, fromCache: false })
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

  async dispose(): Promise<void> {
    this.stop()
  }
}
```

---

## 📝 Étape 6 : Manager Central (2h)

### Fichier : `src/core/tts/providers/TTSProviderManager.ts`

```typescript
import { TTSProvider } from './TTSProvider'
import { TTSProviderType, VoiceDescriptor, SynthesisResult, SynthesisEvents } from './types'
import { WebSpeechProvider } from './WebSpeechProvider'
import { GoogleCloudProvider } from './GoogleCloudProvider'
import { audioCacheService } from '../AudioCacheService'

export class TTSProviderManager {
  private providers = new Map<TTSProviderType, TTSProvider>()
  private activeProvider: TTSProvider | null = null

  constructor() {
    this.registerProviders()
  }

  private registerProviders(): void {
    this.providers.set('web-speech', new WebSpeechProvider())
    this.providers.set('google-cloud', new GoogleCloudProvider(audioCacheService))
  }

  async initialize(type: TTSProviderType, config?: Record<string, unknown>): Promise<void> {
    const provider = this.providers.get(type)
    if (!provider) {
      throw new Error(`Provider ${type} non trouvé`)
    }

    await provider.initialize(config)
    this.activeProvider = provider
  }

  async getVoices(providerType?: TTSProviderType): Promise<VoiceDescriptor[]> {
    if (providerType) {
      const provider = this.providers.get(providerType)
      return provider ? provider.getVoices() : []
    }
    
    // Retourner toutes les voix du provider actif
    return this.activeProvider ? this.activeProvider.getVoices() : []
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

  getActiveProviderType(): TTSProviderType | null {
    return this.activeProvider?.type ?? null
  }

  async dispose(): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.dispose()
    }
    this.providers.clear()
    this.activeProvider = null
  }
}

// Instance singleton
export const ttsProviderManager = new TTSProviderManager()
```

---

## 📝 Étape 7 : Composant UI (3h)

### Fichier : `src/components/settings/TTSProviderSettings.tsx`

```typescript
import { useState, useEffect } from 'react'
import { ttsProviderManager } from '../../core/tts/providers/TTSProviderManager'
import { TTSProviderType } from '../../core/tts/providers/types'

export function TTSProviderSettings() {
  const [selectedType, setSelectedType] = useState<TTSProviderType>('web-speech')
  const [googleApiKey, setGoogleApiKey] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Charger depuis localStorage
    const savedType = localStorage.getItem('tts-provider-type') as TTSProviderType
    const savedApiKey = localStorage.getItem('google-cloud-api-key')
    
    if (savedType) setSelectedType(savedType)
    if (savedApiKey) setGoogleApiKey(savedApiKey)
  }, [])

  async function handleProviderChange(type: TTSProviderType) {
    setSelectedType(type)
    setError(null)

    try {
      if (type === 'web-speech') {
        await ttsProviderManager.initialize('web-speech')
        localStorage.setItem('tts-provider-type', 'web-speech')
        setIsValid(true)
      } else if (type === 'google-cloud') {
        // Attendre que l'utilisateur entre l'API key
        setIsValid(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setIsValid(false)
    }
  }

  async function handleApiKeySubmit() {
    setError(null)
    
    try {
      await ttsProviderManager.initialize('google-cloud', { apiKey: googleApiKey })
      localStorage.setItem('tts-provider-type', 'google-cloud')
      localStorage.setItem('google-cloud-api-key', googleApiKey)
      setIsValid(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API Key invalide')
      setIsValid(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Moteur de Synthèse Vocale
      </h3>

      {/* Web Speech API */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="tts-provider"
            value="web-speech"
            checked={selectedType === 'web-speech'}
            onChange={() => handleProviderChange('web-speech')}
            className="w-4 h-4"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              Voix Système
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Utilise les voix installées sur votre système (1-2 voix sur Linux/Android)
            </div>
          </div>
          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            Gratuit
          </span>
        </label>
      </div>

      {/* Google Cloud TTS */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="tts-provider"
            value="google-cloud"
            checked={selectedType === 'google-cloud'}
            onChange={() => handleProviderChange('google-cloud')}
            className="w-4 h-4"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              Google Cloud (Premium)
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              10-20 voix françaises de haute qualité (1M caractères/mois gratuit)
            </div>
          </div>
          <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Premium
          </span>
        </label>

        {/* Configuration API Key */}
        {selectedType === 'google-cloud' && (
          <div className="mt-4 ml-7 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key Google Cloud
              </label>
              <input
                type="password"
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleApiKeySubmit}
              disabled={!googleApiKey}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Valider la clé
            </button>

            {isValid && selectedType === 'google-cloud' && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ API Key validée avec succès !
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  ✗ {error}
                </p>
              </div>
            )}

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
                <strong>Comment obtenir une API Key :</strong>
              </p>
              <ol className="text-xs text-blue-700 dark:text-blue-300 list-decimal list-inside space-y-1">
                <li>Allez sur <a href="https://console.cloud.google.com" target="_blank" className="underline">console.cloud.google.com</a></li>
                <li>Créez un projet ou sélectionnez-en un</li>
                <li>Activez l'API "Cloud Text-to-Speech"</li>
                <li>Créez une API key dans "Identifiants"</li>
                <li>Restreignez la clé à votre domaine (sécurité)</li>
              </ol>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                💡 Quota gratuit : 1 million de caractères/mois (~50 lectures complètes)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && selectedType === 'web-speech' && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            ✗ {error}
          </p>
        </div>
      )}
    </div>
  )
}
```

---

## 📝 Étape 8 : Intégration dans l'App (1h)

### 1. Initialiser le cache au démarrage

```typescript
// src/App.tsx ou src/main.tsx

import { audioCacheService } from './core/tts/AudioCacheService'

// Au démarrage de l'app
await audioCacheService.initialize()
```

### 2. Ajouter le composant dans les paramètres

```typescript
// src/screens/SettingsScreen.tsx

import { TTSProviderSettings } from '../components/settings/TTSProviderSettings'

export function SettingsScreen() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
      
      <TTSProviderSettings />
      
      {/* Autres paramètres... */}
    </div>
  )
}
```

### 3. Utiliser dans le lecteur

```typescript
// src/components/reader/PlaybackControls.tsx

import { ttsProviderManager } from '../../core/tts/providers/TTSProviderManager'

async function playLine(text: string, voiceId: string) {
  await ttsProviderManager.speak(text, voiceId, {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  }, {
    onStart: () => console.log('Début lecture'),
    onEnd: () => console.log('Fin lecture'),
    onError: (err) => console.error('Erreur:', err)
  })
}
```

---

## ✅ Checklist de Test

### Tests Unitaires
- [ ] AudioCacheService.cacheAudio() fonctionne
- [ ] AudioCacheService.getAudio() retourne le bon blob
- [ ] GoogleCloudProvider.testApiKey() rejette une clé invalide
- [ ] GoogleCloudProvider.synthesize() génère de l'audio
- [ ] Cache key génération est cohérente

### Tests d'Intégration
- [ ] Basculer de Web Speech à Google Cloud fonctionne
- [ ] API Key invalide affiche une erreur
- [ ] Audio généré est mis en cache
- [ ] Lecture depuis le cache est instantanée
- [ ] Voix listées correspondent à l'API

### Tests UI
- [ ] Formulaire API Key affiche/masque le mot de passe
- [ ] Message de succès après validation
- [ ] Message d'erreur si clé invalide
- [ ] Selection radio fonctionne
- [ ] Persistance dans localStorage

### Tests Navigateurs
- [ ] Chrome Desktop : ✅
- [ ] Chrome Android : ✅
- [ ] Firefox Desktop : ✅
- [ ] Safari iOS : ✅
- [ ] Edge : ✅

---

## 🐛 Problèmes Courants

### Erreur CORS
**Symptôme** : `No 'Access-Control-Allow-Origin' header`  
**Solution** : Google Cloud TTS supporte CORS, vérifier que l'API est bien activée

### API Key invalide
**Symptôme** : `API Key invalide: PERMISSION_DENIED`  
**Solution** : 
- Vérifier que l'API Text-to-Speech est activée
- Vérifier les restrictions de la clé (domaine)

### Cache ne fonctionne pas
**Symptôme** : Audio régénéré à chaque fois  
**Solution** : 
- Vérifier que `audioCacheService.initialize()` est appelé
- Vérifier IndexedDB dans DevTools

### Audio ne se joue pas
**Symptôme** : `DOMException: play() failed`  
**Solution** : 
- Nécessite interaction utilisateur sur certains navigateurs
- Utiliser AudioContext au lieu de HTMLAudioElement

---

## 📊 Métriques de Succès

- ✅ 10+ voix françaises disponibles
- ✅ Taux de mise en cache > 80%
- ✅ Latence première génération < 3s
- ✅ Latence depuis cache < 100ms
- ✅ 0 erreur CORS
- ✅ Taux d'adoption utilisateurs > 20%

---

## 📚 Ressources

### Documentation Google Cloud
- API Text-to-Speech : https://cloud.google.com/text-to-speech/docs
- Pricing : https://cloud.google.com/text-to-speech/pricing
- Quickstart : https://cloud.google.com/text-to-speech/docs/quickstart-client-libraries

### Tutoriels
- Créer une API Key : https://cloud.google.com/docs/authentication/api-keys
- Restreindre les clés : https://cloud.google.com/docs/authentication/api-keys#securing_an_api_key

### Code Exemples
- Voices API : https://cloud.google.com/text-to-speech/docs/list-voices
- Synthesize : https://cloud.google.com/text-to-speech/docs/create-audio

---

## 🎉 Prochaines Étapes

Après Phase 1 (Google Cloud) :
1. Recueillir feedback utilisateurs
2. Analyser utilisation du cache
3. Planifier Phase 2 (Piper WASM)

---

**Bonne implémentation ! 🚀**