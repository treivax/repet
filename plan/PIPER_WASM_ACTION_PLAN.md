# 🎯 Plan d'Action : Intégration Piper-WASM

**Projet** : Répét - Application PWA de répétition théâtrale  
**Branche** : `piper-wasm`  
**Date de création** : 2025-01-XX  
**Objectif** : Intégrer Piper-WASM comme moteur TTS alternatif avec sélection par l'utilisateur

---

## 📋 Préambule : Chargement du Contexte

**⚠️ IMPORTANT : Avant toute session de développement sur cette branche**

### Fichiers de contexte à charger SYSTÉMATIQUEMENT :

1. **`.github/prompts/common.md`** - Standards du projet (OBLIGATOIRE)
2. **`docs/ARCHITECTURE.md`** - Architecture complète
3. **`docs/TTS_ARCHITECTURE_PROPOSAL.md`** - Architecture TTS multi-provider
4. **`PROJECT_STATUS.md`** - État du projet
5. **`src/core/tts/`** - Code TTS existant

### Commande de vérification :

```bash
# Vérifier qu'on est sur la bonne branche
git branch --show-current  # Doit afficher : piper-wasm

# Vérifier les fichiers de contexte
ls -la .github/prompts/common.md docs/ARCHITECTURE.md docs/TTS_ARCHITECTURE_PROPOSAL.md
```

---

## 🎯 Objectifs du Projet

### Objectif Principal

Permettre aux utilisateurs de Répét de choisir entre deux moteurs de génération vocale :
- **"Natif Device"** (Web Speech API existante)
- **"Piper"** (Piper-WASM, nouveau) - **SÉLECTIONNÉ PAR DÉFAUT**

### Contraintes

✅ **Respecter** :
- Architecture SPA/PWA (pas de backend)
- Fonctionnement hors-ligne
- Standards du projet (voir `common.md`)
- Architecture multi-provider proposée
- Pas de hardcoding
- Types TypeScript stricts (pas de `any`)
- Tests manuels systématiques

❌ **Éviter** :
- Sur-ingénierie
- Code temporaire / dette technique
- Dépendances lourdes inutiles
- Breaking changes de l'API existante

---

## 📐 Architecture Cible

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────┐
│           ReaderScreen / UI Layer               │
│  - Contrôles TTS (play/pause/stop)             │
│  - Sélecteur de voix                            │
│  - **NOUVEAU : Sélecteur de moteur TTS**        │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         TTSProviderManager (NOUVEAU)            │
│  - Gère les providers disponibles               │
│  - Sélectionne le provider actif                │
│  - Interface unifiée pour l'UI                  │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
┌───────▼─────────┐  ┌──────▼──────────┐
│ WebSpeechProvider│  │ PiperWASMProvider│
│   (existant)     │  │    (NOUVEAU)     │
│                  │  │                  │
│ - Web Speech API│  │ - Piper WASM     │
│ - Voix système  │  │ - Modèles FR     │
│ - Synchrone     │  │ - Hors-ligne     │
└──────────────────┘  └──────────────────┘
```

### Composants Clés

#### 1. **TTSProviderManager** (nouveau)
- Registre des providers disponibles
- Sélection du provider actif
- Interface unifiée : `speak()`, `stop()`, `pause()`, `resume()`
- Gestion du cache audio (IndexedDB)

#### 2. **Provider Interface** (nouveau)
```typescript
interface TTSProvider {
  readonly type: TTSProviderType;
  readonly name: string;
  
  initialize(): Promise<void>;
  checkAvailability(): Promise<TTSProviderAvailability>;
  getVoices(): Promise<VoiceDescriptor[]>;
  synthesize(text: string, options: SynthesisOptions): Promise<SynthesisResult>;
  stop(): void;
  pause?(): void;
  resume?(): void;
  dispose(): Promise<void>;
}
```

#### 3. **WebSpeechProvider** (adapter l'existant)
- Wrapper autour du code TTS existant (`engine.ts`, `voice-manager.ts`)
- Implémente `TTSProvider`
- Conserve la compatibilité avec le code existant

#### 4. **PiperWASMProvider** (nouveau)
- Charge le module Piper WASM
- Télécharge et cache les modèles vocaux
- Génère l'audio via Piper
- Stocke l'audio dans IndexedDB

#### 5. **AudioCacheService** (nouveau)
- Cache audio dans IndexedDB
- Gestion des quotas de stockage
- Clés de cache : hash(text + voiceId + rate + pitch)

#### 6. **UI Settings Component** (nouveau)
- Sélecteur de moteur TTS : "Natif Device" vs "Piper"
- Affichage de la disponibilité de chaque moteur
- Gestion du téléchargement des modèles Piper
- Affichage de l'espace de stockage utilisé

---

## 🗓️ Plan d'Exécution Détaillé

### PHASE 0 : Préparation et Recherche (1 jour)

#### Objectifs
- Comprendre Piper-WASM
- Identifier les modèles vocaux français disponibles
- Définir l'architecture technique précise

#### Tâches

**0.1 - Recherche Piper-WASM**
- [ ] Identifier la librairie Piper-WASM officielle (GitHub)
- [ ] Lire la documentation d'intégration
- [ ] Vérifier les modèles vocaux français disponibles
- [ ] Estimer les tailles de téléchargement
- [ ] Vérifier la compatibilité navigateurs (WASM support)

**0.2 - Proof of Concept**
- [ ] Créer un fichier de test isolé `poc-piper.html`
- [ ] Charger Piper-WASM dans le navigateur
- [ ] Tester la génération d'audio basique
- [ ] Mesurer les performances (latence, taille)
- [ ] Valider la faisabilité technique

**0.3 - Documentation**
- [ ] Documenter les résultats du POC dans `plan/PIPER_WASM_POC_RESULTS.md`
- [ ] Lister les modèles vocaux français retenus
- [ ] Documenter les limitations identifiées

#### Validation Phase 0
- [ ] POC fonctionnel avec génération audio
- [ ] Modèles vocaux français identifiés (min. 2 voix)
- [ ] Architecture technique validée
- [ ] Documentation POC complète

---

### PHASE 1 : Architecture de Base (2-3 jours)

#### Objectifs
- Créer l'architecture multi-provider
- Refactorer le code TTS existant
- Aucun changement de fonctionnalité (Web Speech API fonctionne toujours)

#### Tâches

**1.1 - Créer les Types et Interfaces**

Fichier : `src/core/tts/provider/types.ts`
```typescript
export type TTSProviderType = 'web-speech' | 'piper-wasm';

export interface TTSProviderAvailability {
  available: boolean;
  reason?: string;
}

export interface TTSProviderConfig {
  type: TTSProviderType;
  enabled: boolean;
}

export interface VoiceDescriptor {
  id: string;
  name: string;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  provider: TTSProviderType;
  quality: 'low' | 'medium' | 'high';
  isLocal: boolean;
  requiresDownload?: boolean;
  downloadSize?: number;
}

export interface SynthesisOptions {
  voiceId: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface SynthesisResult {
  audio: Blob | HTMLAudioElement;
  duration: number;
  fromCache: boolean;
}

export interface SynthesisEvents {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export interface TTSProvider {
  readonly type: TTSProviderType;
  readonly name: string;
  
  initialize(): Promise<void>;
  checkAvailability(): Promise<TTSProviderAvailability>;
  getVoices(): Promise<VoiceDescriptor[]>;
  synthesize(
    text: string, 
    options: SynthesisOptions, 
    events?: SynthesisEvents
  ): Promise<SynthesisResult>;
  stop(): void;
  pause?(): void;
  resume?(): void;
  dispose(): Promise<void>;
}
```

**Validation** :
- [ ] Fichier créé avec header copyright
- [ ] Tous les types documentés (JSDoc)
- [ ] Pas de `any`
- [ ] Type check passe (`npm run type-check`)

---

**1.2 - Créer WebSpeechProvider**

Fichier : `src/core/tts/provider/WebSpeechProvider.ts`

Encapsuler le code existant (`engine.ts`, `voice-manager.ts`) dans un provider.

**Stratégie** :
1. Créer la classe `WebSpeechProvider implements TTSProvider`
2. Déléguer aux classes existantes (`TTSEngine`, `VoiceManager`)
3. Adapter les signatures de méthodes
4. Gérer la conversion des types

**Implémentation** :
```typescript
export class WebSpeechProvider implements TTSProvider {
  readonly type: TTSProviderType = 'web-speech';
  readonly name = 'Voix Système (Navigateur)';
  
  private engine: TTSEngine;
  
  constructor() {
    this.engine = new TTSEngine();
  }
  
  async initialize(): Promise<void> {
    await this.engine.initialize();
  }
  
  async checkAvailability(): Promise<TTSProviderAvailability> {
    const available = VoiceManager.isAvailable();
    return {
      available,
      reason: available ? undefined : 'Web Speech API non supportée'
    };
  }
  
  async getVoices(): Promise<VoiceDescriptor[]> {
    const voices = voiceManager.getAvailableVoices();
    return voices.map(v => ({
      id: v.uri,
      name: v.name,
      language: v.lang,
      provider: 'web-speech',
      quality: v.localService ? 'medium' : 'high',
      isLocal: v.localService
    }));
  }
  
  async synthesize(
    text: string,
    options: SynthesisOptions,
    events?: SynthesisEvents
  ): Promise<SynthesisResult> {
    // Adapter les événements
    this.engine.setEvents({
      onStart: events?.onStart,
      onEnd: events?.onEnd,
      onError: events?.onError,
      onProgress: (charIndex) => {
        events?.onProgress?.(charIndex / text.length);
      }
    });
    
    // Lancer la synthèse
    this.engine.speak({
      text,
      voiceURI: options.voiceId,
      rate: options.rate,
      pitch: options.pitch,
      volume: options.volume
    });
    
    // Web Speech API est synchrone, retourne un résultat fictif
    return {
      audio: new Audio(), // Placeholder
      duration: 0,
      fromCache: false
    };
  }
  
  stop(): void {
    this.engine.stop();
  }
  
  pause(): void {
    this.engine.pause();
  }
  
  resume(): void {
    this.engine.resume();
  }
  
  async dispose(): Promise<void> {
    this.stop();
  }
}
```

**Validation** :
- [ ] WebSpeechProvider créé
- [ ] Implémente toutes les méthodes de `TTSProvider`
- [ ] Délègue correctement à `TTSEngine`
- [ ] Type check passe
- [ ] Pas de régression (tests manuels)

---

**1.3 - Créer TTSProviderManager**

Fichier : `src/core/tts/provider/TTSProviderManager.ts`

```typescript
export class TTSProviderManager {
  private providers: Map<TTSProviderType, TTSProvider> = new Map();
  private activeProvider: TTSProvider | null = null;
  
  constructor() {
    this.registerProviders();
  }
  
  private registerProviders(): void {
    // Enregistrer Web Speech
    const webSpeech = new WebSpeechProvider();
    this.providers.set('web-speech', webSpeech);
    
    // Enregistrer Piper (sera ajouté en Phase 2)
    // const piper = new PiperWASMProvider();
    // this.providers.set('piper-wasm', piper);
  }
  
  async initialize(providerType: TTSProviderType = 'web-speech'): Promise<void> {
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new Error(`Provider inconnu: ${providerType}`);
    }
    
    const availability = await provider.checkAvailability();
    if (!availability.available) {
      throw new Error(`Provider non disponible: ${availability.reason}`);
    }
    
    await provider.initialize();
    this.activeProvider = provider;
  }
  
  async getAvailableProviders(): Promise<Array<{
    type: TTSProviderType;
    name: string;
    available: boolean;
    reason?: string;
  }>> {
    const results = [];
    
    for (const [type, provider] of this.providers) {
      const availability = await provider.checkAvailability();
      results.push({
        type,
        name: provider.name,
        available: availability.available,
        reason: availability.reason
      });
    }
    
    return results;
  }
  
  async getVoices(providerType?: TTSProviderType): Promise<VoiceDescriptor[]> {
    if (providerType) {
      const provider = this.providers.get(providerType);
      return provider ? provider.getVoices() : [];
    }
    
    // Toutes les voix de tous les providers
    const allVoices: VoiceDescriptor[] = [];
    for (const provider of this.providers.values()) {
      const voices = await provider.getVoices();
      allVoices.push(...voices);
    }
    return allVoices;
  }
  
  async speak(
    text: string,
    options: SynthesisOptions,
    events?: SynthesisEvents
  ): Promise<SynthesisResult> {
    if (!this.activeProvider) {
      throw new Error('Aucun provider actif. Appelez initialize() d\'abord.');
    }
    
    return this.activeProvider.synthesize(text, options, events);
  }
  
  stop(): void {
    this.activeProvider?.stop();
  }
  
  pause(): void {
    this.activeProvider?.pause?.();
  }
  
  resume(): void {
    this.activeProvider?.resume?.();
  }
  
  async switchProvider(providerType: TTSProviderType): Promise<void> {
    this.stop();
    await this.initialize(providerType);
  }
  
  async dispose(): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.dispose();
    }
    this.activeProvider = null;
  }
}

// Instance singleton
export const ttsProviderManager = new TTSProviderManager();
```

**Validation** :
- [ ] TTSProviderManager créé
- [ ] Gère correctement les providers
- [ ] Méthodes `initialize`, `getVoices`, `speak` fonctionnelles
- [ ] Singleton exporté
- [ ] Type check passe

---

**1.4 - Adapter le Code Existant**

**Objectif** : Faire utiliser `TTSProviderManager` par l'application sans changer l'API publique.

**Stratégie** : Créer un adapter/facade dans `src/core/tts/index.ts`

Fichier : `src/core/tts/index.ts` (modifier)

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

// Réexporter les types existants pour compatibilité
export * from './types';
export * from './engine';
export * from './voice-manager';
export * from './readingModes';

// Nouveaux exports
export * from './provider/types';
export { ttsProviderManager } from './provider/TTSProviderManager';
export { WebSpeechProvider } from './provider/WebSpeechProvider';

// Facade pour compatibilité avec le code existant
import { ttsProviderManager } from './provider/TTSProviderManager';
import type { SpeechConfig, TTSEvents } from './types';

/**
 * Instance TTS compatible avec l'API existante
 * @deprecated Utiliser ttsProviderManager directement
 */
export const ttsEngine = {
  async initialize() {
    await ttsProviderManager.initialize('web-speech');
  },
  
  setEvents(events: TTSEvents) {
    // Stocké pour utilisation ultérieure dans speak()
    (this as any)._events = events;
  },
  
  speak(config: SpeechConfig) {
    const events = (this as any)._events;
    ttsProviderManager.speak(config.text, {
      voiceId: config.voiceURI || '',
      rate: config.rate,
      pitch: config.pitch,
      volume: config.volume
    }, {
      onStart: () => events?.onStart?.(config.lineId),
      onEnd: () => events?.onEnd?.(config.lineId),
      onError: events?.onError,
      onProgress: (progress) => events?.onProgress?.(Math.floor(progress * config.text.length), config.lineId)
    });
  },
  
  stop() {
    ttsProviderManager.stop();
  },
  
  pause() {
    ttsProviderManager.pause();
  },
  
  resume() {
    ttsProviderManager.resume();
  },
  
  getState() {
    return 'idle' as const; // Simplification
  },
  
  isSpeaking() {
    return false; // TODO: Implémenter si nécessaire
  },
  
  isPaused() {
    return false; // TODO: Implémenter si nécessaire
  }
};
```

**Validation** :
- [ ] Code existant fonctionne sans modification
- [ ] `ReaderScreen` utilise toujours `ttsEngine`
- [ ] Aucune régression fonctionnelle
- [ ] Tests manuels : lecture audio fonctionne
- [ ] Console sans erreurs

---

**1.5 - Tests Manuels Phase 1**

**Checklist** :
- [ ] Application démarre sans erreur
- [ ] Aucune erreur console
- [ ] Lecture audio fonctionne (Web Speech API)
- [ ] Pause/Resume fonctionnent
- [ ] Stop fonctionne
- [ ] Sélection de voix fonctionne
- [ ] Mode Italiennes fonctionne
- [ ] Thème clair/sombre OK
- [ ] Responsive mobile/desktop OK

**Si bugs** : Corriger avant de passer à Phase 2

---

### PHASE 2 : Intégration Piper-WASM (3-5 jours)

#### Objectifs
- Intégrer Piper-WASM
- Créer `PiperWASMProvider`
- Permettre la génération audio avec Piper
- **Implémenter l'assignation intelligente des voix par genre**

#### Spécifications Fonctionnelles Importantes

##### Assignation des Voix par Genre

**Contexte** : L'application possède déjà un système d'assignation de voix dans "Voix des personnages" (écran `PlayDetailScreen`) où l'utilisateur peut définir le genre (homme/femme) de chaque personnage.

**Exigences** :

1. **Différenciation par Genre**
   - Les voix Piper doivent être clairement identifiées comme "Homme" ou "Femme"
   - Chaque modèle Piper doit avoir une propriété `gender: 'male' | 'female'`
   - L'UI doit afficher le genre de chaque voix disponible

2. **Assignation Automatique Intelligente**
   - Lorsqu'un personnage a un genre défini dans `settings.characterVoices[characterId]`
   - Le système doit automatiquement sélectionner une voix du même genre
   - **Objectif : Maximiser la diversité des voix** - Assigner des voix différentes à chaque personnage

3. **Algorithme de Distribution**
   ```
   Pour chaque personnage avec un genre défini :
     1. Filtrer les voix disponibles du même genre
     2. Sélectionner une voix pas encore assignée (si possible)
     3. Si toutes les voix du genre sont déjà assignées :
        → Réutiliser les voix en rotation (round-robin)
     4. Mémoriser l'assignation pour cohérence
   ```

4. **Compatibilité avec l'Existant**
   - Le système actuel utilise `voiceManager.selectVoiceForGender(gender)`
   - Cette logique doit être étendue au `TTSProviderManager`
   - Les deux providers (Web Speech et Piper) doivent supporter cette fonctionnalité

5. **Persistance**
   - L'assignation des voix doit être cohérente durant toute la session
   - Les voix assignées doivent être mémorisées pour chaque personnage
   - Lors du changement de provider, réassigner intelligemment les voix

**Exemple de Configuration Modèles Piper** :

```typescript
const PIPER_MODELS = [
  // Voix Féminines
  {
    id: 'fr_FR-siwis-medium',
    name: 'Siwis',
    displayName: 'Siwis (Femme, Qualité Moyenne)',
    language: 'fr-FR',
    gender: 'female' as const,
    quality: 'medium' as const,
    url: '...',
    size: 5_000_000
  },
  {
    id: 'fr_FR-upmc-medium',
    name: 'UPMC',
    displayName: 'UPMC (Femme, Qualité Moyenne)',
    language: 'fr-FR',
    gender: 'female' as const,
    quality: 'medium' as const,
    url: '...',
    size: 6_000_000
  },
  
  // Voix Masculines
  {
    id: 'fr_FR-tom-medium',
    name: 'Tom',
    displayName: 'Tom (Homme, Qualité Moyenne)',
    language: 'fr-FR',
    gender: 'male' as const,
    quality: 'medium' as const,
    url: '...',
    size: 5_500_000
  },
  {
    id: 'fr_FR-gilles-medium',
    name: 'Gilles',
    displayName: 'Gilles (Homme, Qualité Moyenne)',
    language: 'fr-FR',
    gender: 'male' as const,
    quality: 'medium' as const,
    url: '...',
    size: 6_500_000
  }
] as const;
```

**Implémentation Requise** :

- [ ] Modèles Piper avec propriété `gender`
- [ ] Méthode `selectVoiceForGender(gender)` dans `PiperWASMProvider`
- [ ] Algorithme de distribution intelligent des voix
- [ ] Cache d'assignation voix ↔ personnage
- [ ] Tests avec plusieurs personnages de genres différents

#### Tâches

**2.1 - Installer Piper-WASM**

```bash
# Identifier le package NPM (exemple hypothétique)
npm install piper-tts-wasm

# OU si CDN :
# Ajouter <script> dans index.html
```

- [ ] Package installé
- [ ] Documentation lue
- [ ] Exemple basique testé

---

**2.2 - Créer PiperWASMProvider**

Fichier : `src/core/tts/provider/PiperWASMProvider.ts`

**Implémentation** :

```typescript
import type { TTSProvider, TTSProviderType, VoiceDescriptor, SynthesisOptions, SynthesisResult, SynthesisEvents, TTSProviderAvailability } from './types';

/**
 * Configuration des modèles Piper disponibles
 * 
 * IMPORTANT : Inclure plusieurs voix par genre pour maximiser
 * la diversité des voix assignées aux personnages
 */
const PIPER_MODELS = [
  // Voix Féminines (plusieurs pour diversité)
  {
    id: 'fr_FR-siwis-medium',
    name: 'Siwis',
    displayName: 'Siwis (Femme)',
    language: 'fr-FR',
    gender: 'female' as const,
    quality: 'medium' as const,
    url: 'https://cdn.example.com/piper/fr_FR-siwis-medium.onnx',
    configUrl: 'https://cdn.example.com/piper/fr_FR-siwis-medium.json',
    size: 5_000_000
  },
  {
    id: 'fr_FR-upmc-medium',
    name: 'UPMC',
    displayName: 'UPMC (Femme)',
    language: 'fr-FR',
    gender: 'female' as const,
    quality: 'medium' as const,
    url: 'https://cdn.example.com/piper/fr_FR-upmc-medium.onnx',
    configUrl: 'https://cdn.example.com/piper/fr_FR-upmc-medium.json',
    size: 6_000_000
  },
  
  // Voix Masculines (plusieurs pour diversité)
  {
    id: 'fr_FR-tom-medium',
    name: 'Tom',
    displayName: 'Tom (Homme)',
    language: 'fr-FR',
    gender: 'male' as const,
    quality: 'medium' as const,
    url: 'https://cdn.example.com/piper/fr_FR-tom-medium.onnx',
    configUrl: 'https://cdn.example.com/piper/fr_FR-tom-medium.json',
    size: 5_500_000
  },
  {
    id: 'fr_FR-gilles-medium',
    name: 'Gilles',
    displayName: 'Gilles (Homme)',
    language: 'fr-FR',
    gender: 'male' as const,
    quality: 'medium' as const,
    url: 'https://cdn.example.com/piper/fr_FR-gilles-medium.onnx',
    configUrl: 'https://cdn.example.com/piper/fr_FR-gilles-medium.json',
    size: 6_500_000
  }
] as const;

export class PiperWASMProvider implements TTSProvider {
  readonly type: TTSProviderType = 'piper-wasm';
  readonly name = 'Piper (Voix Hors-ligne)';
  
  private piperModule: any = null;
  private loadedModels: Map<string, any> = new Map();
  private currentAudio: HTMLAudioElement | null = null;
  
  // Cache d'assignation des voix par personnage pour cohérence
  private voiceAssignments: Map<string, string> = new Map(); // characterId -> voiceId
  
  // Compteur d'utilisation des voix pour rotation équitable
  private voiceUsageCount: Map<string, number> = new Map();
  
  async initialize(): Promise<void> {
    // Charger le module WASM
    try {
      // @ts-expect-error - Module externe
      this.piperModule = await import('piper-tts-wasm');
      await this.piperModule.initialize();
    } catch (error) {
      throw new Error(`Impossible de charger Piper-WASM: ${error}`);
    }
  }
  
  async checkAvailability(): Promise<TTSProviderAvailability> {
    // Vérifier support WASM
    if (typeof WebAssembly === 'undefined') {
      return {
        available: false,
        reason: 'WebAssembly non supporté par ce navigateur'
      };
    }
    
    return {
      available: true
    };
  }
  
  async getVoices(): Promise<VoiceDescriptor[]> {
    return PIPER_MODELS.map(model => ({
      id: model.id,
      name: model.displayName, // Inclut le genre dans le nom
      language: model.language,
      gender: model.gender, // IMPORTANT : Genre pour assignation
      provider: 'piper-wasm',
      quality: model.quality,
      isLocal: true,
      requiresDownload: !this.loadedModels.has(model.id),
      downloadSize: model.size
    }));
  }
  
  /**
   * Sélectionne une voix pour un personnage en fonction de son genre
   * Maximise la diversité en assignant des voix différentes
   * 
   * @param characterId - ID du personnage
   * @param gender - Genre du personnage ('male' | 'female')
   * @returns ID de la voix sélectionnée
   */
  selectVoiceForCharacter(characterId: string, gender: 'male' | 'female'): string {
    // Si déjà assigné, retourner la même voix (cohérence)
    if (this.voiceAssignments.has(characterId)) {
      return this.voiceAssignments.get(characterId)!;
    }
    
    // Filtrer les modèles du bon genre
    const modelsOfGender = PIPER_MODELS.filter(m => m.gender === gender);
    
    if (modelsOfGender.length === 0) {
      // Fallback : première voix disponible
      return PIPER_MODELS[0].id;
    }
    
    // Trouver la voix la moins utilisée du bon genre
    let selectedModel = modelsOfGender[0];
    let minUsage = this.voiceUsageCount.get(selectedModel.id) || 0;
    
    for (const model of modelsOfGender) {
      const usage = this.voiceUsageCount.get(model.id) || 0;
      if (usage < minUsage) {
        minUsage = usage;
        selectedModel = model;
      }
    }
    
    // Enregistrer l'assignation
    this.voiceAssignments.set(characterId, selectedModel.id);
    this.voiceUsageCount.set(selectedModel.id, minUsage + 1);
    
    return selectedModel.id;
  }
  
  /**
   * Réinitialise les assignations de voix
   * (utile lors du changement de pièce)
   */
  resetVoiceAssignments(): void {
    this.voiceAssignments.clear();
    this.voiceUsageCount.clear();
  }
  
  async synthesize(
    text: string,
    options: SynthesisOptions,
    events?: SynthesisEvents
  ): Promise<SynthesisResult> {
    const startTime = performance.now();
    
    try {
      events?.onStart?.();
      
      // Charger le modèle si nécessaire
      let model = this.loadedModels.get(options.voiceId);
      if (!model) {
        model = await this.downloadAndLoadModel(options.voiceId, events);
        this.loadedModels.set(options.voiceId, model);
      }
      
      // Générer l'audio
      const audioBuffer = await this.piperModule.synthesize(model, text, {
        speed: options.rate ?? 1.0
        // pitch non supporté par Piper (limitation connue)
      });
      
      // Convertir en Blob
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      
      // Créer élément audio
      const audio = new Audio(URL.createObjectURL(blob));
      
      // Configurer les événements
      audio.onended = () => events?.onEnd?.();
      audio.onerror = () => events?.onError?.(new Error('Erreur lecture audio'));
      
      // Jouer
      audio.volume = options.volume ?? 1.0;
      await audio.play();
      
      this.currentAudio = audio;
      
      const duration = performance.now() - startTime;
      
      return {
        audio,
        duration,
        fromCache: false
      };
      
    } catch (error) {
      events?.onError?.(error instanceof Error ? error : new Error('Erreur Piper'));
      throw error;
    }
  }
  
  private async downloadAndLoadModel(
    modelId: string,
    events?: SynthesisEvents
  ): Promise<any> {
    const modelConfig = PIPER_MODELS.find(m => m.id === modelId);
    if (!modelConfig) {
      throw new Error(`Modèle inconnu: ${modelId}`);
    }
    
    try {
      // Télécharger le modèle
      const response = await fetch(modelConfig.url);
      if (!response.ok) {
        throw new Error(`Échec téléchargement: ${response.statusText}`);
      }
      
      const total = modelConfig.size;
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Impossible de lire le modèle');
      }
      
      const chunks: Uint8Array[] = [];
      let received = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        received += value.length;
        
        // Progression
        const progress = received / total;
        events?.onProgress?.(progress);
      }
      
      // Combiner les chunks
      const modelData = new Uint8Array(received);
      let position = 0;
      for (const chunk of chunks) {
        modelData.set(chunk, position);
        position += chunk.length;
      }
      
      // Charger dans Piper
      const model = await this.piperModule.loadModel(modelData);
      
      return model;
      
    } catch (error) {
      throw new Error(`Erreur chargement modèle ${modelId}: ${error}`);
    }
  }
  
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }
  
  pause(): void {
    this.currentAudio?.pause();
  }
  
  resume(): void {
    this.currentAudio?.play();
  }
  
  async dispose(): Promise<void> {
    this.stop();
    
    // Libérer les modèles
    for (const model of this.loadedModels.values()) {
      // Libérer la mémoire si API disponible
      model?.dispose?.();
    }
    this.loadedModels.clear();
    
    // Nettoyer les assignations
    this.resetVoiceAssignments();
  }
}
```

**Validation** :
- [ ] PiperWASMProvider créé
- [ ] Implémente `TTSProvider`
- [ ] Téléchargement de modèle fonctionne
- [ ] Génération audio fonctionne
- [ ] Type check passe

---

**2.3 - Enregistrer Piper dans TTSProviderManager**

Fichier : `src/core/tts/provider/TTSProviderManager.ts` (modifier)

```typescript
private registerProviders(): void {
  // Web Speech
  const webSpeech = new WebSpeechProvider();
  this.providers.set('web-speech', webSpeech);
  
  // Piper WASM (NOUVEAU)
  const piper = new PiperWASMProvider();
  this.providers.set('piper-wasm', piper);
}
```

**Validation** :
- [ ] Piper enregistré
- [ ] `getAvailableProviders()` retourne les 2 providers
- [ ] `getVoices('piper-wasm')` retourne les voix Piper
- [ ] Les voix Piper ont bien la propriété `gender`
- [ ] Au moins 2 voix masculines et 2 voix féminines

---

**2.4 - Service de Cache Audio (IndexedDB)**

Fichier : `src/core/tts/provider/AudioCacheService.ts`

```typescript
interface CachedAudio {
  key: string;
  audioBlob: Blob;
  createdAt: number;
  accessCount: number;
  lastAccess: number;
}

export class AudioCacheService {
  private dbName = 'RepetAudioCache';
  private storeName = 'audioCache';
  private db: IDBDatabase | null = null;
  
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }
  
  async cacheAudio(key: string, audioBlob: Blob): Promise<void> {
    if (!this.db) throw new Error('Cache non initialisé');
    
    const cached: CachedAudio = {
      key,
      audioBlob,
      createdAt: Date.now(),
      accessCount: 1,
      lastAccess: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(cached);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async getAudio(key: string): Promise<Blob | null> {
    if (!this.db) throw new Error('Cache non initialisé');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const cached = request.result as CachedAudio | undefined;
        if (cached) {
          // Mettre à jour stats
          cached.accessCount++;
          cached.lastAccess = Date.now();
          store.put(cached);
          
          resolve(cached.audioBlob);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  async clearCache(): Promise<void> {
    if (!this.db) throw new Error('Cache non initialisé');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async getCacheSize(): Promise<number> {
    if (!this.db) throw new Error('Cache non initialisé');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const items = request.result as CachedAudio[];
        const totalSize = items.reduce((sum, item) => sum + item.audioBlob.size, 0);
        resolve(totalSize);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  generateCacheKey(text: string, options: SynthesisOptions): string {
    const data = `${text}|${options.voiceId}|${options.rate ?? 1.0}|${options.pitch ?? 1.0}`;
    
    // Hash simple (pour production, utiliser crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `audio_${hash.toString(36)}`;
  }
}

export const audioCacheService = new AudioCacheService();
```

**Validation** :
- [ ] AudioCacheService créé
- [ ] Méthodes CRUD fonctionnelles
- [ ] IndexedDB correctement utilisé
- [ ] Type check passe

---

**2.5 - Intégrer le Cache dans PiperWASMProvider**

Modifier `PiperWASMProvider.synthesize()` :

```typescript
async synthesize(
  text: string,
  options: SynthesisOptions,
  events?: SynthesisEvents
): Promise<SynthesisResult> {
  const startTime = performance.now();
  
  // Vérifier le cache
  const cacheKey = audioCacheService.generateCacheKey(text, options);
  const cachedBlob = await audioCacheService.getAudio(cacheKey);
  
  if (cachedBlob) {
    // Audio en cache
    const audio = new Audio(URL.createObjectURL(cachedBlob));
    audio.volume = options.volume ?? 1.0;
    
    audio.onended = () => events?.onEnd?.();
    audio.onerror = () => events?.onError?.(new Error('Erreur lecture audio'));
    
    events?.onStart?.();
    await audio.play();
    
    return {
      audio,
      duration: performance.now() - startTime,
      fromCache: true
    };
  }
  
  // Sinon, générer (code existant)
  try {
    events?.onStart?.();
    
    let model = this.loadedModels.get(options.voiceId);
    if (!model) {
      model = await this.downloadAndLoadModel(options.voiceId, events);
      this.loadedModels.set(options.voiceId, model);
    }
    
    const audioBuffer = await this.piperModule.synthesize(model, text, {
      speed: options.rate ?? 1.0
    });
    
    const blob = new Blob([audioBuffer], { type: 'audio/wav' });
    
    // Mettre en cache
    await audioCacheService.cacheAudio(cacheKey, blob);
    
    const audio = new Audio(URL.createObjectURL(blob));
    audio.onended = () => events?.onEnd?.();
    audio.onerror = () => events?.onError?.(new Error('Erreur lecture audio'));
    audio.volume = options.volume ?? 1.0;
    await audio.play();
    
    this.currentAudio = audio;
    
    return {
      audio,
      duration: performance.now() - startTime,
      fromCache: false
    };
    
  } catch (error) {
    events?.onError?.(error instanceof Error ? error : new Error('Erreur Piper'));
    throw error;
  }
}
```

**Validation** :
- [ ] Cache intégré
- [ ] Audio mis en cache après génération
- [ ] Audio récupéré du cache si disponible
- [ ] Tests manuels : génération audio + cache

---

**2.6 - Tests Manuels Phase 2**

**Checklist Technique** :
- [ ] Piper-WASM se charge sans erreur
- [ ] Téléchargement de modèle fonctionne
- [ ] Génération audio Piper fonctionne
- [ ] Cache audio fonctionne (2e lecture instantanée)
- [ ] Qualité audio acceptable
- [ ] Pas de ralentissement de l'application
- [ ] Console sans erreurs
- [ ] Thème clair/sombre OK

**Checklist Assignation de Voix** :
- [ ] Importer une pièce avec plusieurs personnages
- [ ] Dans "Voix des personnages", définir le genre de chaque personnage
  - [ ] Au moins 2 personnages féminins
  - [ ] Au moins 2 personnages masculins
- [ ] Lire la pièce en mode audio
- [ ] Vérifier que :
  - [ ] Les personnages féminins ont des voix féminines
  - [ ] Les personnages masculins ont des voix masculines
  - [ ] **Les personnages ont des voix DIFFÉRENTES** (diversité maximale)
  - [ ] La même voix est utilisée pour le même personnage (cohérence)
- [ ] Changer le genre d'un personnage → la voix change
- [ ] Recharger la page → les assignations persistent

---

### PHASE 3 : UI - Sélecteur de Moteur TTS (2-3 jours)

#### Objectifs
- Ajouter l'option "Moteur de génération des voix" dans les paramètres
- Permettre à l'utilisateur de choisir entre "Natif Device" et "Piper"
- Piper sélectionné par défaut

#### Tâches

**3.1 - Créer le Store de Configuration TTS**

Fichier : `src/state/ttsConfigStore.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TTSProviderType } from '../core/tts/provider/types';

interface TTSConfigState {
  // Moteur TTS sélectionné
  selectedProvider: TTSProviderType;
  
  // Actions
  setProvider: (provider: TTSProviderType) => void;
}

export const useTTSConfigStore = create<TTSConfigState>()(
  persist(
    (set) => ({
      // État initial : Piper par défaut
      selectedProvider: 'piper-wasm',
      
      setProvider: (provider) => set({ selectedProvider: provider })
    }),
    {
      name: 'repet-tts-config', // Clé localStorage
      version: 1
    }
  )
);
```

**Validation** :
- [ ] Store créé
- [ ] Persistance dans localStorage
- [ ] Valeur par défaut : `'piper-wasm'`
- [ ] Type check passe

---

**3.2 - Améliorer l'UI de Sélection des Voix**

**Important** : L'interface existante `VoiceAssignment` permet déjà de définir le genre des personnages. Il faut s'assurer que cette fonctionnalité est bien utilisée avec Piper.

**Vérifications** :
- [ ] Le composant `VoiceAssignment` fonctionne avec Piper
- [ ] L'utilisateur peut définir Homme/Femme pour chaque personnage
- [ ] Les changements sont bien persistés dans `settings.characterVoices`
- [ ] Le `TTSProviderManager` utilise ces informations pour sélectionner les voix

**Améliorations suggérées** :
```typescript
// Dans VoiceAssignment.tsx - Ajouter un aperçu de la voix sélectionnée

<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
  Voix : {getVoiceNameForCharacter(character.id)}
</div>
```

**3.3 - Créer le Composant Sélecteur de Moteur**

Fichier : `src/components/settings/TTSEngineSelector.tsx`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import React, { useEffect, useState } from 'react';
import { useTTSConfigStore } from '../../state/ttsConfigStore';
import { ttsProviderManager } from '../../core/tts';
import type { TTSProviderType } from '../../core/tts/provider/types';

interface ProviderOption {
  type: TTSProviderType;
  name: string;
  available: boolean;
  reason?: string;
}

export function TTSEngineSelector() {
  const { selectedProvider, setProvider } = useTTSConfigStore();
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadProviders();
  }, []);
  
  async function loadProviders() {
    try {
      const available = await ttsProviderManager.getAvailableProviders();
      setProviders(available);
    } catch (error) {
      console.error('Erreur chargement providers:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleProviderChange(providerType: TTSProviderType) {
    try {
      // Changer le provider
      await ttsProviderManager.switchProvider(providerType);
      
      // Sauvegarder dans le store
      setProvider(providerType);
      
    } catch (error) {
      console.error('Erreur changement provider:', error);
      alert(`Impossible d'activer ce moteur: ${error}`);
    }
  }
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Moteur de génération des voix
      </label>
      
      <div className="space-y-2">
        {providers.map((provider) => (
          <label
            key={provider.type}
            className={`
              flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors
              ${selectedProvider === provider.type
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
              ${!provider.available ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name="tts-engine"
              value={provider.type}
              checked={selectedProvider === provider.type}
              onChange={() => handleProviderChange(provider.type)}
              disabled={!provider.available}
              className="mr-3"
            />
            
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {provider.name}
              </div>
              
              {!provider.available && provider.reason && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {provider.reason}
                </div>
              )}
              
              {provider.available && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getProviderDescription(provider.type)}
                </div>
              )}
            </div>
            
            {provider.type === 'piper-wasm' && (
              <span className="ml-2 px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                Recommandé
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

function getProviderDescription(type: TTSProviderType): string {
  const descriptions: Record<TTSProviderType, string> = {
    'web-speech': 'Utilise les voix système de votre appareil (limité)',
    'piper-wasm': 'Plusieurs voix homme/femme, haute qualité, hors-ligne (recommandé)'
  };
  return descriptions[type] || '';
}

function getProviderFeatures(type: TTSProviderType): string[] {
  const features: Record<TTSProviderType, string[]> = {
    'web-speech': [
      'Voix système',
      'Nombre limité',
      'Qualité variable'
    ],
    'piper-wasm': [
      'Multiple voix par genre',
      'Haute qualité',
      'Distribution intelligente',
      'Fonctionne hors-ligne'
    ]
  };
  return features[type] || [];
}
```

**Validation** :
- [ ] Composant créé
- [ ] Affiche les 2 moteurs
- [ ] Sélection fonctionne
- [ ] Piper a badge "Recommandé"
- [ ] Description mentionne "plusieurs voix par genre"
- [ ] UI responsive
- [ ] Thème clair/sombre

---

**3.3 - Intégrer dans les Paramètres**

Fichier à modifier : `src/screens/SettingsScreen.tsx` (ou équivalent)

Ajouter le composant `TTSEngineSelector` dans la section des paramètres audio/TTS.

**Position recommandée** : Avant le sélecteur de voix

```typescript
// Dans SettingsScreen.tsx

import { TTSEngineSelector } from '../components/settings/TTSEngineSelector';

// ...

return (
  <div className="space-y-6">
    {/* Autres paramètres */}
    
    {/* NOUVEAU : Sélecteur de moteur TTS */}
    <section>
      <h2 className="text-xl font-semibold mb-4">Synthèse Vocale</h2>
      <TTSEngineSelector />
    </section>
    
    {/* Sélecteur de voix existant */}
    <section>
      {/* ... */}
    </section>
  </div>
);
```

**Validation** :
- [ ] Sélecteur visible dans les paramètres
- [ ] Changement de moteur fonctionne
- [ ] Sélection persiste (localStorage)
- [ ] UI cohérente avec le reste de l'app

---

**3.4 - Adapter le Chargement Initial**

Fichier : `src/App.tsx` (ou `main.tsx`)

S'assurer que le provider sélectionné est chargé au démarrage.

```typescript
import { useTTSConfigStore } from './state/ttsConfigStore';
import { ttsProviderManager } from './core/tts';

function App() {
  const { selectedProvider } = useTTSConfigStore();
  const [ttsReady, setTtsReady] = useState(false);
  
  useEffect(() => {
    async function initTTS() {
      try {
        await ttsProviderManager.initialize(selectedProvider);
        setTtsReady(true);
      } catch (error) {
        console.error('Erreur initialisation TTS:', error);
        // Fallback sur web-speech si Piper échoue
        if (selectedProvider === 'piper-wasm') {
          try {
            await ttsProviderManager.initialize('web-speech');
            setTtsReady(true);
          } catch (fallbackError) {
            console.error('Erreur fallback TTS:', fallbackError);
          }
        }
      }
    }
    
    initTTS();
  }, [selectedProvider]);
  
  if (!ttsReady) {
    return <LoadingScreen />;
  }
  
  return (
    // ... reste de l'app
  );
}
```

**Validation** :
- [ ] Provider chargé au démarrage
- [ ] Fallback sur web-speech si Piper échoue
- [ ] Changement de provider rechargé dynamiquement
- [ ] Pas de régression

---

**3.5 - Composant de Gestion des Modèles Piper (optionnel)**

Fichier : `src/components/settings/PiperModelManager.tsx`

Afficher les modèles téléchargés, permettre de supprimer pour libérer l'espace.

```typescript
export function PiperModelManager() {
  const [voices, setVoices] = useState<VoiceDescriptor[]>([]);
  const [cacheSize, setCacheSize] = useState(0);
  
  useEffect(() => {
    loadPiperVoices();
  }, []);
  
  async function loadPiperVoices() {
    const piperVoices = await ttsProviderManager.getVoices('piper-wasm');
    setVoices(piperVoices);
    
    const size = await audioCacheService.getCacheSize();
    setCacheSize(size);
  }
  
  async function clearCache() {
    if (confirm('Supprimer tous les modèles téléchargés ?')) {
      await audioCacheService.clearCache();
      await loadPiperVoices();
    }
  }
  
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Modèles Piper</h3>
      
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Espace utilisé : {formatBytes(cacheSize)}
      </div>
      
      <div className="space-y-2">
        {voices.map((voice) => (
          <div key={voice.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <div>
              <div className="font-medium">{voice.name}</div>
              <div className="text-xs text-gray-500">
                {voice.requiresDownload ? 'Non téléchargé' : 'Téléchargé'}
                {voice.downloadSize && ` - ${formatBytes(voice.downloadSize)}`}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button
        onClick={clearCache}
        className="px-4 py-2 text-sm bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
      >
        Vider le cache
      </button>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
```

**Validation** :
- [ ] Composant créé
- [ ] Affiche les modèles disponibles
- [ ] Affiche l'espace utilisé
- [ ] Bouton "Vider le cache" fonctionne
- [ ] UI cohérente

---

**3.6 - Tests Manuels Phase 3**

**Checklist** :
- [ ] Sélecteur de moteur visible dans paramètres
- [ ] Sélection "Piper" par défaut au premier lancement
- [ ] Changement de moteur fonctionne
- [ ] Sélection persiste après rechargement
- [ ] Lecture audio fonctionne avec les 2 moteurs
- [ ] UI responsive mobile/desktop
- [ ] Thème clair/sombre OK
- [ ] Console sans erreurs

---

### PHASE 4 : Documentation et Finalisation (1 jour)

#### Objectifs
- Documenter la nouvelle fonctionnalité
- Mettre à jour le guide utilisateur
- Créer un changelog
- Tests finaux

#### Tâches

**4.1 - Documentation Technique**

Fichier : `docs/TTS_PIPER_INTEGRATION.md`

Documenter :
- Architecture multi-provider
- Comment ajouter un nouveau provider
- Configuration des modèles Piper
- API du TTSProviderManager
- Troubleshooting

**4.2 - Guide Utilisateur**

Fichier : `docs/USER_GUIDE.md` (modifier)

Ajouter une section :
- Qu'est-ce que Piper ?
- Différences entre "Natif Device" et "Piper"
- Comment changer de moteur
- Gestion de l'espace de stockage
- FAQ

**4.3 - Changelog**

Fichier : `CHANGELOG.md`

```markdown
## [0.2.0] - 2025-XX-XX

### Ajouté
- **Moteur TTS Piper-WASM** : Voix françaises de haute qualité hors-ligne
- **Sélecteur de moteur TTS** : Choix entre voix système et Piper (Piper par défaut)
- **Cache audio intelligent** : Les répliques sont mises en cache pour lecture instantanée
- **Gestion des modèles vocaux** : Téléchargement et gestion de l'espace de stockage

### Modifié
- Refactorisation de l'architecture TTS avec système de providers
- Amélioration des performances de lecture audio

### Technique
- Nouveau module `src/core/tts/provider/`
- Store Zustand `ttsConfigStore` pour la configuration TTS
- Service de cache audio avec IndexedDB
```

**4.4 - README**

Fichier : `README.md` (modifier)

Mettre à jour la section "Stack Technique" :

```markdown
## 🚀 Stack Technique

- **React 18** + **TypeScript**
- **Vite**
- **Tailwind CSS**
- **React Router**
- **Zustand**
- **Dexie.js**
- **Web Speech API** + **Piper-WASM** - Synthèse vocale multi-provider
- **PWA**
```

**4.5 - Tests Finaux Complets**

**Checklist complète** :

**Fonctionnel** :
**Checklist Fonctionnel** :
- [ ] Sélection moteur "Natif Device" fonctionne
- [ ] Sélection moteur "Piper" fonctionne
- [ ] Changement de moteur en cours de session fonctionne
- [ ] Lecture audio avec Web Speech fonctionne
- [ ] Lecture audio avec Piper fonctionne
- [ ] Cache audio fonctionne (2e lecture instantanée)
- [ ] Téléchargement de modèle avec progression fonctionne
- [ ] Gestion de l'espace de stockage fonctionne
- [ ] Mode Italiennes fonctionne avec les 2 moteurs
- [ ] Pause/Resume fonctionnent avec les 2 moteurs
- [ ] Stop fonctionne avec les 2 moteurs

**Checklist Assignation de Voix** (CRITIQUE) :
- [ ] Importer une pièce avec 4+ personnages
- [ ] Définir le genre dans "Voix des personnages" :
  - [ ] 2 personnages féminins (ex: JULIETTE, CLAIRE)
  - [ ] 2 personnages masculins (ex: ROMÉO, MARC)
- [ ] Lire la pièce avec Piper
- [ ] **Vérifier que chaque personnage a une voix unique** :
  - [ ] JULIETTE → Voix féminine 1 (ex: Siwis)
  - [ ] CLAIRE → Voix féminine 2 (ex: UPMC) - DIFFÉRENTE de Juliette
  - [ ] ROMÉO → Voix masculine 1 (ex: Tom)
  - [ ] MARC → Voix masculine 2 (ex: Gilles) - DIFFÉRENTE de Roméo
- [ ] Relire plusieurs fois → même assignation (cohérence)
- [ ] Changer le genre de JULIETTE en "Homme" → voix masculine
- [ ] Recharger la page → assignations conservées
- [ ] Tester avec plus de personnages que de voix disponibles
  - [ ] Les voix sont réutilisées équitablement (rotation)

**UI/UX** :
- [ ] Sélecteur de moteur bien intégré dans les paramètres
- [ ] Badge "Recommandé" sur Piper
- [ ] Messages d'erreur clairs si provider indisponible
- [ ] Indicateur de téléchargement de modèle
- [ ] UI responsive mobile/tablet/desktop
- [ ] Thème clair fonctionnel
- [ ] Thème sombre fonctionnel
- [ ] Navigation cohérente
- [ ] Pas de flickering ou lag

**Technique** :
- [ ] Aucune erreur console
- [ ] Aucun warning console
- [ ] `npm run type-check` passe
- [ ] `npm run lint` passe (0 erreur)
- [ ] Build production réussit (`npm run build`)
- [ ] Build PWA fonctionne
- [ ] Service Worker fonctionne
- [ ] Application installable
- [ ] Fonctionne hors-ligne

**Performance** :
- [ ] Temps de chargement initial acceptable (<3s)
- [ ] Changement de moteur fluide (<1s)
- [ ] Génération audio Piper acceptable (<2s pour 1 phrase)
- [ ] Lecture depuis cache instantanée (<100ms)
- [ ] Pas de fuite mémoire (tester longue session)
- [ ] Pas de ralentissement progressif

**Navigateurs** :
- [ ] Chrome Desktop
- [ ] Firefox Desktop
- [ ] Safari Desktop (si disponible)
- [ ] Edge Desktop
- [ ] Chrome Mobile Android
- [ ] Safari Mobile iOS (si disponible)

**Cas limites** :
- [ ] Texte vide
- [ ] Texte très long (>1000 caractères)
- [ ] Caractères spéciaux (émojis, accents)
- [ ] Basculement rapide entre moteurs
- [ ] Arrêt pendant téléchargement de modèle
- [ ] Quota de stockage dépassé
- [ ] Perte de connexion pendant téléchargement
- [ ] WebAssembly non supporté (vieux navigateur)

---

**4.6 - Commit et Push**

```bash
# Vérifier les modifications
git status

# Ajouter tous les fichiers
git add .

# Commit avec message conventionnel
git commit -m "feat(tts): Intégration Piper-WASM avec sélecteur de moteur

- Ajoute architecture multi-provider pour TTS
- Intègre Piper-WASM comme moteur alternatif
- Ajoute sélecteur de moteur dans les paramètres (Piper par défaut)
- Implémente cache audio avec IndexedDB
- Ajoute gestion des modèles vocaux
- Améliore la documentation (guides utilisateur et technique)

BREAKING CHANGE: Architecture TTS refactorisée avec système de providers"

# Push sur la branche
git push -u origin piper-wasm
```

---

## 📊 Métriques de Succès

### Critères d'Acceptation

✅ **Fonctionnel** :
- [ ] L'utilisateur peut choisir entre "Natif Device" et "Piper"
- [ ] "Piper" est sélectionné par défaut
- [ ] La lecture audio fonctionne avec les 2 moteurs
- [ ] Le changement de moteur est fluide et immédiat
- [ ] **Les personnages de genres différents ont des voix différenciées**
- [ ] **Maximum de voix différentes assignées aux personnages** (diversité)
- [ ] Les assignations de voix sont cohérentes durant la session
- [ ] L'interface "Voix des personnages" fonctionne avec Piper

✅ **Technique** :
- [ ] Code respecte les standards du projet (`common.md`)
- [ ] Aucun hardcoding
- [ ] Types TypeScript stricts (pas de `any`)
- [ ] Architecture modulaire et extensible
- [ ] Performance acceptable (voir checklist Phase 4)

✅ **Documentation** :
- [ ] Guide utilisateur mis à jour
- [ ] Documentation technique complète
- [ ] Changelog à jour
- [ ] README mis à jour

✅ **Qualité** :
- [ ] Tous les tests manuels passent
- [ ] Aucune régression fonctionnelle
- [ ] Build production réussit
- [ ] PWA fonctionne correctement

---

## 🚧 Risques et Mitigations

### Risques Identifiés

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Piper-WASM non compatible navigateur | Moyenne | Élevé | Fallback automatique sur Web Speech |
| Modèles Piper trop lourds (>50MB) | Moyenne | Moyen | Proposer modèles "légers" et "qualité" |
| Latence génération audio trop élevée | Faible | Moyen | Cache agressif + indicateur de chargement |
| Quota IndexedDB dépassé | Moyenne | Faible | Gestion proactive + nettoyage auto |
| Performance dégradée sur mobile | Faible | Moyen | Tests sur appareils réels + optimisations |

### Points d'Attention

⚠️ **WASM Support** : Vérifier support WebAssembly dans les navigateurs cibles
⚠️ **Taille des Modèles** : Optimiser pour mobile (connexion lente)
⚠️ **UX Téléchargement** : Indicateurs de progression clairs
⚠️ **Cache Management** : Éviter de remplir tout le stockage
⚠️ **Fallback** : Toujours avoir Web Speech comme solution de secours

---

## 🔄 Plan de Rollback

En cas de problème critique :

### Option 1 : Désactivation Temporaire de Piper

1. Dans `ttsConfigStore.ts`, changer le défaut :
   ```typescript
   selectedProvider: 'web-speech', // Au lieu de 'piper-wasm'
   ```

2. Cacher le sélecteur Piper dans l'UI (commentaire)

3. Commit hotfix et push

### Option 2 : Retour Complet à `main`

```bash
# Abandonner la branche
git checkout main

# Supprimer la branche locale
git branch -D piper-wasm

# Supprimer la branche distante (si déjà pushée)
git push origin --delete piper-wasm
```

---

## 📝 Checklist Finale de Livraison

Avant de créer la Pull Request :

- [ ] Toutes les phases complétées
- [ ] Tous les tests manuels passent
- [ ] Documentation complète et à jour
- [ ] Changelog mis à jour
- [ ] README mis à jour
- [ ] Aucune erreur console
- [ ] `npm run type-check` passe
- [ ] `npm run lint` passe (0 erreur)
- [ ] `npm run build` réussit
- [ ] Build testé en local (`npm run preview`)
- [ ] PWA installable
- [ ] Fonctionne hors-ligne
- [ ] Code respecte `common.md`
- [ ] Pas de code mort
- [