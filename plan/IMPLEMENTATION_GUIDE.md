# 🚀 Guide d'Implémentation : Piper-WASM Integration

## 📌 Vue d'Ensemble

Ce document est le guide pratique pour l'implémentation de l'intégration Piper-WASM dans le projet Répét.
Il complète les autres documents du plan avec des flux détaillés et une roadmap d'exécution.

**Date de création** : 2025-01-XX  
**Version** : 1.0  
**Statut** : 🟢 PRÊT POUR IMPLÉMENTATION

---

## 🎯 Objectif Final

Intégrer Piper-WASM comme provider TTS par défaut avec :
- ✅ Architecture multi-provider (Piper + Web Speech API)
- ✅ Assignation intelligente des voix par genre avec diversité maximale
- ✅ Persistance des assignations par provider (IndexedDB)
- ✅ UI complète : sélecteur provider, réassignation, édition manuelle
- ✅ Cache audio optimisé
- ✅ Performance et UX optimales

---

## 📋 Ordre d'Implémentation (Bottom-Up)

### 🔵 PHASE 1 : Fondations (Data Model & Types)
**Durée estimée** : 1-2 jours  
**Objectif** : Préparer les structures de données et types TypeScript

#### 1.1 - Types Providers (`src/core/tts/types.ts`)
```typescript
// Créer nouveau fichier avec tous les types partagés
- TTSProviderType
- VoiceDescriptor (avec gender)
- SynthesisOptions
- SynthesisResult
- TTSProvider (interface)
```

**Fichiers à créer/modifier** :
- ✏️ `src/core/tts/types.ts` (nouveau)

**Validation** : Type-check passe (`npm run type-check`)

---

#### 1.2 - Modèle PlaySettings (`src/core/models/Settings.ts`)
```typescript
interface PlaySettings {
  // ... existant ...
  
  // NOUVEAU
  ttsProvider: TTSProviderType;  // 'piper-wasm' | 'web-speech'
  characterVoicesPiper: Record<string, string>;    // characterId -> voiceId
  characterVoicesGoogle: Record<string, string>;   // characterId -> voiceId
}
```

**Fichiers à modifier** :
- ✏️ `src/core/models/Settings.ts`
- ✏️ `src/core/db/schema.ts` (migration Dexie)

**Validation** : 
- Type-check passe
- Migration DB testée (créer test ou vérifier console)

---

#### 1.3 - Migration Base de Données (Dexie)

**Fichier** : `src/core/db/index.ts` ou équivalent

```typescript
// Incrémenter version schema
version(X).stores({
  playSettings: '++id, playId, ...' // schema existant
}).upgrade(tx => {
  // Migration : ajouter champs avec valeurs par défaut
  return tx.table('playSettings').toCollection().modify(settings => {
    settings.ttsProvider = 'piper-wasm';  // défaut
    settings.characterVoicesPiper = {};
    settings.characterVoicesGoogle = {};
  });
});
```

**Validation** :
- Tester migration sur DB existante (backup d'abord!)
- Vérifier IndexedDB dans DevTools

---

### 🟢 PHASE 2 : Provider Architecture

**Durée estimée** : 2-3 jours  
**Objectif** : Implémenter l'architecture multi-provider et les providers

#### 2.1 - Adapter WebSpeechProvider

**Fichier** : `src/core/tts/providers/WebSpeechProvider.ts`

**Modifications** :
1. Implémenter l'interface `TTSProvider`
2. Ajouter méthode `getVoices()` → retourne `VoiceDescriptor[]` avec gender détecté
3. Ajouter méthode `generateVoiceAssignments(characters, existingAssignments)`

**Détection de genre** :
```typescript
function detectGender(voiceName: string): 'male' | 'female' | 'neutral' {
  const nameLower = voiceName.toLowerCase();
  
  // Patterns féminins
  if (nameLower.match(/female|femme|woman|amelie|alice|anna|claire|marie/)) {
    return 'female';
  }
  
  // Patterns masculins
  if (nameLower.match(/male|homme|man|thomas|daniel|antoine|nicolas/)) {
    return 'male';
  }
  
  return 'neutral';  // Par défaut
}
```

**Algorithme generateVoiceAssignments** :
```typescript
generateVoiceAssignments(
  characters: Array<{ id: string; gender: 'male' | 'female' }>,
  existingAssignments: Record<string, string> = {}
): Record<string, string> {
  const assignments: Record<string, string> = { ...existingAssignments };
  const voices = this.getVoices();
  const usageCount: Record<string, number> = {};

  // Compter l'utilisation actuelle
  Object.values(assignments).forEach(voiceId => {
    usageCount[voiceId] = (usageCount[voiceId] || 0) + 1;
  });

  // Pour chaque personnage sans assignation
  characters.forEach(char => {
    if (assignments[char.id]) return;  // Déjà assigné

    // Filtrer voix du bon genre
    const voicesOfGender = voices.filter(v => v.gender === char.gender);
    
    // Fallback : toutes les voix si aucune du bon genre
    const candidateVoices = voicesOfGender.length > 0 
      ? voicesOfGender 
      : voices;

    // Sélectionner la voix la moins utilisée (round-robin)
    let selectedVoice = candidateVoices[0];
    let minUsage = Infinity;

    candidateVoices.forEach(voice => {
      const usage = usageCount[voice.id] || 0;
      if (usage < minUsage) {
        minUsage = usage;
        selectedVoice = voice;
      }
    });

    // Assigner
    assignments[char.id] = selectedVoice.id;
    usageCount[selectedVoice.id] = minUsage + 1;
  });

  return assignments;
}
```

---

#### 2.2 - Créer PiperWASMProvider

**Fichier** : `src/core/tts/providers/PiperWASMProvider.ts` (nouveau)

**Structure** :
```typescript
import { TTSProvider, VoiceDescriptor, SynthesisOptions, SynthesisResult } from '../types';

// Configuration des modèles Piper
const PIPER_MODELS: VoiceDescriptor[] = [
  {
    id: 'fr_FR-siwis-medium',
    name: 'fr_FR-siwis-medium',
    displayName: 'Siwis (Femme, France)',
    language: 'fr-FR',
    gender: 'female',
    quality: 'medium',
    provider: 'piper-wasm',
    isLocal: true,
    requiresDownload: true,
    downloadSize: 15_000_000,  // ~15MB
    url: 'https://example.com/models/fr_FR-siwis-medium.onnx',
    configUrl: 'https://example.com/models/fr_FR-siwis-medium.onnx.json',
  },
  {
    id: 'fr_FR-tom-medium',
    name: 'fr_FR-tom-medium',
    displayName: 'Tom (Homme, France)',
    language: 'fr-FR',
    gender: 'male',
    quality: 'medium',
    provider: 'piper-wasm',
    isLocal: true,
    requiresDownload: true,
    downloadSize: 15_000_000,
    url: 'https://example.com/models/fr_FR-tom-medium.onnx',
    configUrl: 'https://example.com/models/fr_FR-tom-medium.onnx.json',
  },
  // ... 2 autres modèles (1M + 1F au minimum)
];

export class PiperWASMProvider implements TTSProvider {
  readonly type = 'piper-wasm';
  readonly name = 'Piper WASM';
  
  private piperModule: any = null;
  private loadedModels: Map<string, any> = new Map();
  
  async initialize(): Promise<void> {
    // Charger le module WASM Piper
    // @ts-ignore
    this.piperModule = await import('piper-wasm');
    await this.piperModule.init();
  }
  
  async checkAvailability(): Promise<{ available: boolean; reason?: string }> {
    // Vérifier support WebAssembly
    if (typeof WebAssembly === 'undefined') {
      return { available: false, reason: 'WebAssembly non supporté' };
    }
    return { available: true };
  }
  
  getVoices(): VoiceDescriptor[] {
    return PIPER_MODELS;
  }
  
  generateVoiceAssignments(
    characters: Array<{ id: string; gender: 'male' | 'female' }>,
    existingAssignments: Record<string, string> = {}
  ): Record<string, string> {
    // MÊME ALGORITHME que WebSpeechProvider (voir 2.1)
    // ... code identique ...
  }
  
  async synthesize(
    text: string,
    options: SynthesisOptions
  ): Promise<SynthesisResult> {
    const startTime = Date.now();
    
    // 1. Charger le modèle si nécessaire
    let model = this.loadedModels.get(options.voiceId);
    if (!model) {
      model = await this.downloadAndLoadModel(options.voiceId);
      this.loadedModels.set(options.voiceId, model);
    }
    
    // 2. Synthétiser
    const audioBuffer = await this.piperModule.synthesize(model, text, {
      speed: options.rate || 1.0,
    });
    
    // 3. Convertir en Blob
    const blob = new Blob([audioBuffer], { type: 'audio/wav' });
    
    // 4. Créer Audio element
    const audio = new Audio(URL.createObjectURL(blob));
    
    // 5. Retourner résultat
    return {
      audio,
      duration: audio.duration,
      fromCache: false,
    };
  }
  
  private async downloadAndLoadModel(voiceId: string): Promise<any> {
    const modelConfig = PIPER_MODELS.find(m => m.id === voiceId);
    if (!modelConfig) throw new Error(`Model ${voiceId} not found`);
    
    // Download avec progress
    // ... code de téléchargement ...
    
    // Load dans Piper
    const model = await this.piperModule.loadModel(modelData);
    return model;
  }
  
  stop(): void {
    // Stopper audio en cours
  }
  
  async dispose(): Promise<void> {
    this.loadedModels.clear();
  }
}
```

**Validation** :
- Type-check passe
- Provider instanciable
- `getVoices()` retourne liste correcte

---

#### 2.3 - TTSProviderManager

**Fichier** : `src/core/tts/TTSProviderManager.ts` (nouveau)

**Rôle** : Gérer les providers, switch entre eux, déléguer les opérations

```typescript
import { TTSProvider, TTSProviderType } from './types';
import { WebSpeechProvider } from './providers/WebSpeechProvider';
import { PiperWASMProvider } from './providers/PiperWASMProvider';

class TTSProviderManager {
  private providers: Map<TTSProviderType, TTSProvider> = new Map();
  private activeProvider: TTSProvider | null = null;

  constructor() {
    this.registerProviders();
  }

  private registerProviders(): void {
    this.providers.set('web-speech', new WebSpeechProvider());
    this.providers.set('piper-wasm', new PiperWASMProvider());
  }

  async initialize(providerType: TTSProviderType = 'piper-wasm'): Promise<void> {
    const provider = this.providers.get(providerType);
    if (!provider) throw new Error(`Provider ${providerType} not found`);
    
    await provider.initialize();
    this.activeProvider = provider;
  }

  async switchProvider(providerType: TTSProviderType): Promise<void> {
    await this.initialize(providerType);
  }

  getVoices(): VoiceDescriptor[] {
    if (!this.activeProvider) return [];
    return this.activeProvider.getVoices();
  }

  async speak(text: string, options: SynthesisOptions): Promise<SynthesisResult> {
    if (!this.activeProvider) throw new Error('No active provider');
    return this.activeProvider.synthesize(text, options);
  }

  stop(): void {
    this.activeProvider?.stop();
  }
}

export const ttsProviderManager = new TTSProviderManager();
```

**Validation** :
- Instanciation OK
- Switch provider fonctionne
- Délégation vers provider actif OK

---

### 🟡 PHASE 3 : Store & State Management

**Durée estimée** : 1-2 jours  
**Objectif** : Intégrer les providers dans le store Zustand

#### 3.1 - playSettingsStore - Nouvelles Actions

**Fichier** : `src/stores/playSettingsStore.ts`

**Actions à ajouter** :
```typescript
interface PlaySettingsStore {
  // ... existant ...
  
  // NOUVEAU
  setTTSProvider: (playId: string, provider: TTSProviderType) => Promise<void>;
  setCharacterVoiceAssignment: (
    playId: string, 
    provider: TTSProviderType,
    characterId: string, 
    voiceId: string
  ) => Promise<void>;
  reassignAllVoices: (playId: string, provider: TTSProviderType) => Promise<void>;
}

// Implémentation
const usePlaySettingsStore = create<PlaySettingsStore>((set, get) => ({
  // ... existant ...
  
  setTTSProvider: async (playId, provider) => {
    const settings = await db.playSettings.get({ playId });
    if (!settings) return;
    
    settings.ttsProvider = provider;
    await db.playSettings.put(settings);
    
    set(state => ({
      settings: state.settings.map(s => 
        s.playId === playId ? { ...s, ttsProvider: provider } : s
      )
    }));
  },
  
  setCharacterVoiceAssignment: async (playId, provider, characterId, voiceId) => {
    const settings = await db.playSettings.get({ playId });
    if (!settings) return;
    
    // Choisir la bonne map selon provider
    const assignmentMap = provider === 'piper-wasm' 
      ? settings.characterVoicesPiper 
      : settings.characterVoicesGoogle;
    
    assignmentMap[characterId] = voiceId;
    await db.playSettings.put(settings);
    
    // Update store state
    set(state => ({
      settings: state.settings.map(s => 
        s.playId === playId ? { ...s } : s
      )
    }));
  },
  
  reassignAllVoices: async (playId, provider) => {
    const settings = await db.playSettings.get({ playId });
    if (!settings) return;
    
    // Récupérer personnages de la pièce
    const play = await db.plays.get(playId);
    if (!play) return;
    
    const characters = play.characters.map(c => ({
      id: c.id,
      gender: settings.characterVoices[c.id] || 'neutral'  // gender stocké ici
    }));
    
    // Générer nouvelles assignations via provider
    const providerInstance = provider === 'piper-wasm'
      ? ttsProviderManager.providers.get('piper-wasm')
      : ttsProviderManager.providers.get('web-speech');
    
    const newAssignments = providerInstance.generateVoiceAssignments(characters, {});
    
    // Sauvegarder
    if (provider === 'piper-wasm') {
      settings.characterVoicesPiper = newAssignments;
    } else {
      settings.characterVoicesGoogle = newAssignments;
    }
    
    await db.playSettings.put(settings);
    
    // Update store
    set(state => ({
      settings: state.settings.map(s => 
        s.playId === playId ? { ...s } : s
      )
    }));
  },
}));
```

**Validation** :
- Actions appelables depuis composants
- Persistance DB fonctionne
- State réactif mis à jour

---

### 🟠 PHASE 4 : UI Components

**Durée estimée** : 2-3 jours  
**Objectif** : Créer/adapter les composants UI

#### 4.1 - TTSProviderSelector

**Fichier** : `src/components/play/TTSProviderSelector.tsx` (nouveau)

**Props** :
```typescript
interface Props {
  playId: string;
  currentProvider: TTSProviderType;
  onProviderChange: (provider: TTSProviderType) => void;
  onReassignVoices: () => void;
}
```

**UI** :
```
┌─────────────────────────────────────────────┐
│ 🔊 Moteur de synthèse vocale                │
│                                             │
│ ○ Piper (Voix naturelles, hors-ligne)      │
│ ● Google / Web Speech API (Système)        │
│                                             │
│ [ 🔄 Réassigner les voix ]                 │
└─────────────────────────────────────────────┘
```

**Code** :
```tsx
export function TTSProviderSelector({ 
  playId, 
  currentProvider, 
  onProviderChange,
  onReassignVoices 
}: Props) {
  const handleProviderChange = (provider: TTSProviderType) => {
    onProviderChange(provider);
  };
  
  const handleReassign = () => {
    if (confirm('Réassigner toutes les voix ? Les assignations manuelles seront perdues.')) {
      onReassignVoices();
    }
  };
  
  return (
    <div className="tts-provider-selector">
      <h3>🔊 Moteur de synthèse vocale</h3>
      
      <div className="provider-options">
        <label>
          <input 
            type="radio" 
            name="provider"
            value="piper-wasm"
            checked={currentProvider === 'piper-wasm'}
            onChange={() => handleProviderChange('piper-wasm')}
          />
          Piper (Voix naturelles, hors-ligne)
        </label>
        
        <label>
          <input 
            type="radio" 
            name="provider"
            value="web-speech"
            checked={currentProvider === 'web-speech'}
            onChange={() => handleProviderChange('web-speech')}
          />
          Google / Web Speech API (Système)
        </label>
      </div>
      
      <button onClick={handleReassign} className="btn-reassign">
        🔄 Réassigner les voix
      </button>
    </div>
  );
}
```

---

#### 4.2 - CharacterVoiceEditor

**Fichier** : `src/components/play/CharacterVoiceEditor.tsx` (nouveau)

**Props** :
```typescript
interface Props {
  characterId: string;
  characterName: string;
  currentGender: 'male' | 'female';
  currentVoice: VoiceDescriptor | null;
  availableVoices: VoiceDescriptor[];
  onGenderChange: (gender: 'male' | 'female') => void;
  onVoiceChange: (voiceId: string) => void;
}
```

**UI** :
```
┌─────────────────────────────────────────────┐
│ Hamlet                                      │
│ Genre: [🚹 Homme] [🚺 Femme]                │
│ Voix: Tom (Homme, France) [✏️ Modifier]    │
└─────────────────────────────────────────────┘
```

**Code** :
```tsx
export function CharacterVoiceEditor({ 
  characterName,
  currentGender,
  currentVoice,
  availableVoices,
  onGenderChange,
  onVoiceChange 
}: Props) {
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  
  // Filtrer voix par genre
  const voicesOfGender = availableVoices.filter(v => v.gender === currentGender);
  
  return (
    <div className="character-voice-editor">
      <div className="character-name">{characterName}</div>
      
      <div className="gender-selector">
        <span>Genre:</span>
        <button 
          className={currentGender === 'male' ? 'active' : ''}
          onClick={() => onGenderChange('male')}
        >
          🚹 Homme
        </button>
        <button 
          className={currentGender === 'female' ? 'active' : ''}
          onClick={() => onGenderChange('female')}
        >
          🚺 Femme
        </button>
      </div>
      
      <div className="voice-info">
        <span>Voix: {currentVoice?.displayName || 'Non assignée'}</span>
        <button onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}>
          ✏️ Modifier
        </button>
      </div>
      
      {showVoiceDropdown && (
        <select 
          value={currentVoice?.id}
          onChange={(e) => {
            onVoiceChange(e.target.value);
            setShowVoiceDropdown(false);
          }}
        >
          {voicesOfGender.map(voice => (
            <option key={voice.id} value={voice.id}>
              {voice.displayName}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
```

---

#### 4.3 - Intégration dans PlayDetailScreen

**Fichier** : `src/screens/PlayDetailScreen.tsx`

**Modifications** :
1. Ajouter `TTSProviderSelector` en haut du bloc "Voix des personnages"
2. Remplacer l'UI existante par `CharacterVoiceEditor` pour chaque personnage
3. Connecter au store

**Code** :
```tsx
export function PlayDetailScreen({ playId }: Props) {
  const settings = usePlaySettingsStore(s => s.getSettings(playId));
  const setTTSProvider = usePlaySettingsStore(s => s.setTTSProvider);
  const reassignAllVoices = usePlaySettingsStore(s => s.reassignAllVoices);
  const setCharacterVoiceAssignment = usePlaySettingsStore(s => s.setCharacterVoiceAssignment);
  
  const [availableVoices, setAvailableVoices] = useState<VoiceDescriptor[]>([]);
  
  useEffect(() => {
    // Charger voix du provider actif
    const voices = ttsProviderManager.getVoices();
    setAvailableVoices(voices);
  }, [settings?.ttsProvider]);
  
  const handleProviderChange = async (provider: TTSProviderType) => {
    await ttsProviderManager.switchProvider(provider);
    await setTTSProvider(playId, provider);
  };
  
  const handleReassign = async () => {
    await reassignAllVoices(playId, settings.ttsProvider);
  };
  
  const handleVoiceChange = async (characterId: string, voiceId: string) => {
    await setCharacterVoiceAssignment(playId, settings.ttsProvider, characterId, voiceId);
  };
  
  return (
    <div className="play-detail-screen">
      {/* ... autres sections ... */}
      
      <section className="voice-settings">
        <h2>🎭 Voix des personnages</h2>
        
        {/* NOUVEAU : Provider selector */}
        <TTSProviderSelector
          playId={playId}
          currentProvider={settings.ttsProvider}
          onProviderChange={handleProviderChange}
          onReassignVoices={handleReassign}
        />
        
        {/* Liste des personnages */}
        {play.characters.map(character => {
          const gender = settings.characterVoices[character.id] || 'male';
          const assignmentMap = settings.ttsProvider === 'piper-wasm'
            ? settings.characterVoicesPiper
            : settings.characterVoicesGoogle;
          const voiceId = assignmentMap[character.id];
          const voice = availableVoices.find(v => v.id === voiceId);
          
          return (
            <CharacterVoiceEditor
              key={character.id}
              characterId={character.id}
              characterName={character.name}
              currentGender={gender}
              currentVoice={voice}
              availableVoices={availableVoices}
              onGenderChange={(gender) => {
                // Update gender + re-assign voice
                // ... code ...
              }}
              onVoiceChange={(voiceId) => handleVoiceChange(character.id, voiceId)}
            />
          );
        })}
      </section>
    </div>
  );
}
```

---

### 🔴 PHASE 5 : Intégration TTS Engine

**Durée estimée** : 1 jour  
**Objectif** : Adapter le moteur TTS existant pour utiliser le provider manager

#### 5.1 - Adapter ttsEngine

**Fichier** : `src/core/tts/index.ts` ou équivalent

**Modifications** :
```typescript
import { ttsProviderManager } from './TTSProviderManager';

class TTSEngine {
  // ... existant ...
  
  async speak(text: string, options: { 
    voiceId?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
  }): Promise<void> {
    // Utiliser le provider manager au lieu de Web Speech directement
    const result = await ttsProviderManager.speak(text, {
      voiceId: options.voiceId || 'default',
      rate: options.rate || 1.0,
      pitch: options.pitch || 1.0,
      volume: options.volume || 1.0,
    });
    
    // Gérer la lecture audio
    result.audio.play();
    
    // Events
    this.events.onStart?.();
    result.audio.onended = () => this.events.onEnd?.();
    result.audio.onerror = (err) => this.events.onError?.(err);
  }
  
  stop(): void {
    ttsProviderManager.stop();
  }
}
```

---

### 🟣 PHASE 6 : Tests & Validation

**Durée estimée** : 2 jours  
**Objectif** : Tester tous les scénarios et valider l'implémentation

#### 6.1 - Tests Fonctionnels Manuels

**Checklist** :
- [ ] **Test 1 : Assignation initiale**
  - Créer nouvelle pièce avec 4 personnages (2M, 2F)
  - Vérifier que 4 voix différentes sont assignées
  - Vérifier que genres correspondent

- [ ] **Test 2 : Persistance**
  - Assigner voix à personnages
  - Fermer/rouvrir app
  - Vérifier assignations préservées

- [ ] **Test 3 : Switch provider**
  - Assigner voix avec Piper
  - Switch vers Web Speech
  - Vérifier nouvelles assignations
  - Switch retour vers Piper
  - Vérifier anciennes assignations restaurées

- [ ] **Test 4 : Réassignation**
  - Cliquer "🔄 Réassigner"
  - Confirmer dialog
  - Vérifier nouvelles assignations générées

- [ ] **Test 5 : Édition manuelle**
  - Cliquer "✏️ Modifier"
  - Choisir voix spécifique
  - Vérifier assignation sauvegardée
  - Relancer app, vérifier persistance

- [ ] **Test 6 : Rotation (plus de personnages que de voix)**
  - Créer pièce avec 6 personnages (3M, 3F)
  - Si seulement 2 voix/genre, vérifier rotation équitable

- [ ] **Test 7 : Lecture audio**
  - Lancer lecture d'une réplique
  - Vérifier audio joue avec bonne voix
  - Vérifier contrôles (pause, stop)

---

#### 6.2 - Tests Techniques

**Type checking** :
```bash
npm run type-check
```

**Linting** :
```bash
npm run lint
```

**Build production** :
```bash
npm run build
```

**Preview production** :
```bash
npm run preview
```

---

## 📊 Diagrammes de Flux

### Flux 1 : Initialisation de l'App

```
┌─────────────────┐
│   App Start     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Load PlaySettings│
│  from IndexedDB  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ttsProvider =   │
│ settings.ttsProvider
│ (default: piper-wasm)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Initialize      │
│ TTSProviderManager
│ .initialize(provider)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Load Provider   │
│ (Piper or WebSpeech)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Load Voices     │
│ .getVoices()    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check existing  │
│ assignments in  │
│ characterVoicesPiper
│ or characterVoicesGoogle
└────────┬────────┘
         │
         ▼
    ┌───┴───┐
    │ Empty?│
    └───┬───┘
        │
    Yes │         No
        ▼          ▼
┌──────────┐  ┌──────────┐
│ Generate │  │   Use    │
│ Assignments  │ existing │
│ .generateVoice  │ assignments
│ Assignments()│
└──────┬───┘  └────┬─────┘
       │           │
       └─────┬─────┘
             │
             ▼
      ┌──────────┐
      │ Persist  │
      │ to DB    │
      └──────────┘
```

---

### Flux 2 : Changement de Provider

```
User clicks Provider Radio
         │
         ▼
┌─────────────────┐
│ onProviderChange│
│ (newProvider)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ttsProviderManager
│ .switchProvider(newProvider)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Initialize new  │
│ provider        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Load voices from│
│ new provider    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Load assignments│
│ from DB         │
│ (characterVoices{Provider})
└────────┬────────┘
         │
         ▼
    ┌───┴───┐
    │ Empty?│
    └───┬───┘
        │
    Yes │         No
        ▼          ▼
┌──────────┐  ┌──────────┐
│ Generate │  │   Use    │
│ new      │  │ existing │
│ assignments  │ assignments
└──────┬───┘  └────┬─────┘
       │           │
       └─────┬─────┘
             │
             ▼
      ┌──────────┐
      │ Update   │
      │ PlaySettings
      │ .ttsProvider
      └─────┬────┘
            │
            ▼
      ┌──────────┐
      │ Persist  │
      │ to DB    │
      └─────┬────┘
            │
            ▼
      ┌──────────┐
      │ Update UI│
      └──────────┘
```

---

### Flux 3 : Réassignation des Voix

```
User clicks "🔄 Réassigner"
         │
         ▼
┌─────────────────┐
│ Show confirm    │
│ dialog          │
└────────┬────────┘
         │
    Confirm?
         │
    Yes  │
         ▼
┌─────────────────┐
│ Get characters  │
│ from play       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Get genders from│
│ characterVoices │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Call provider   │
│ .generateVoiceAssignments
│ (characters, {})│  ← empty = reset
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save to DB      │
│ characterVoices{Provider}
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update store    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Re-render UI    │
└─────────────────┘
```

---

### Flux 4 : Édition Manuelle d'une Voix

```
User clicks "✏️ Modifier"
         │
         ▼
┌─────────────────┐
│ Show voice      │
│ dropdown        │
│ (filtered by gender)
└────────┬────────┘
         │
         ▼
User selects voice
         │
         ▼
┌─────────────────┐
│ onVoiceChange   │
│ (characterId, voiceId)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update          │
│ characterVoices{Provider}
│ [characterId] = voiceId
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Persist to DB   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update store    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Re-render UI    │
│ (show new voice)│
└─────────────────┘
```

---

### Flux 5 : Synthèse Audio (Lecture)

```
User clicks Play on dialogue line
         │
         ▼
┌─────────────────┐
│ Get characterId │
│ from line       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Get voiceId from│
│ characterVoices{Provider}
│ [characterId]   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ttsEngine.speak │
│ (text, { voiceId })
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ttsProviderManager
│ .speak(text, options)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Delegate to     │
│ active provider │
│ (Piper or WebSpeech)
└────────┬────────┘
         │
         ▼
  ┌─────┴─────┐
  │  Piper?   │
  └─────┬─────┘
        │
   Yes  │       No (WebSpeech)
        ▼          ▼
┌──────────┐  ┌──────────┐
│ Load     │  │ Use      │
│ model    │  │ browser  │
│ if needed│  │ API      │
└─────┬────┘  └────┬─────┘
      │            │
      ▼            ▼
┌──────────┐  ┌──────────┐
│ Synthesize  │ speechSynthesis
│ via WASM │  │ .speak() │
└─────┬────┘  └────┬─────┘
      │            │
      └─────┬──────┘
            │
            ▼
      ┌──────────┐
      │ Return   │
      │ Audio    │
      └─────┬────┘
            │
            ▼
      ┌──────────┐
      │ Play     │
      │ audio    │
      └─────┬────┘
            │
            ▼
      ┌──────────┐
      │ Fire     │
      │ events   │
      │ (onStart, onEnd)
      └──────────┘
```

---

## 🎯 Points de Validation Critiques

### ✅ Checkpoint 1 : Après Phase 1 (Data Model)
- [ ] Types TypeScript compilent sans erreur
- [ ] Migration DB testée et fonctionne
- [ ] Valeurs par défaut correctes dans `createDefaultPlaySettings()`

### ✅ Checkpoint 2 : Après Phase 2 (Providers)
- [ ] `WebSpeechProvider.getVoices()` retourne liste avec genres
- [ ] `PiperWASMProvider.getVoices()` retourne config modèles
- [ ] `generateVoiceAssignments()` implémenté dans les 2 providers
- [ ] Algorithme testé manuellement (4 chars → 4 voices distinctes)

### ✅ Checkpoint 3 : Après Phase 3 (Store)
- [ ] Actions store testées en isolation
- [ ] Persistance DB vérifiée (avant/après refresh)
- [ ] State réactif mis à jour correctement

### ✅ Checkpoint 4 : Après Phase 4 (UI)
- [ ] Composants rendus sans erreur
- [ ] Interactions UI fonctionnent (click, select, etc.)
- [ ] Provider selector + reassign + edit intégrés dans PlayDetailScreen

### ✅ Checkpoint 5 : Après Phase 5 (TTS Engine)
- [ ] Audio joue avec la bonne voix
- [ ] Switch provider fonctionne pendant lecture
- [ ] Contrôles (pause, stop, resume) OK

### ✅ Checkpoint 6 : Tests Finaux (Phase 6)
- [ ] Tous les tests fonctionnels passent
- [ ] Build production OK
- [ ] Performance acceptable (< 2s pour load voice, < 1s pour synthesize)
- [ ] Pas de régression sur fonctionnalités existantes

---

## 🚨 Risques et Mitigations

### Risque 1 : Piper-WASM indisponible/instable
**Mitigation** : 
- Garder Web Speech API comme fallback fonctionnel
- Permettre switch facile entre providers
- Tester availability avec `checkAvailability()`

### Risque 2 : Taille des modèles trop grande
**Mitigation** :
- Commencer avec modèles "medium" (~15MB)
- Implémenter lazy loading (télécharger seulement si utilisé)
- Afficher progress bar pendant download
- Cache modèles en IndexedDB

### Risque 3 : Performance de synthèse lente
**Mitigation** :
- Mesurer temps de synthèse (target < 1s)
- Implémenter cache audio agressif
- Pré-charger modèles les plus utilisés
- Utiliser Web Workers si nécessaire

### Risque 4 : Migration DB casse données existantes
**Mitigation** :
- **BACKUP DB avant migration** (export JSON)
- Tester migration sur copie locale d'abord
- Valeurs par défaut sûres (`ttsProvider: 'web-speech'` en fallback)
- Version de schema incrémentale

---

## 📚 Références Rapides

### Fichiers Clés à Modifier/Créer

**Phase 1** :
- ✏️ `src/core/tts/types.ts` (nouveau)
- ✏️ `src/core/models/Settings.ts` (modifier)
- ✏️ `src/core/db/schema.ts` (migration)

**Phase 2** :
- ✏️ `src/core/tts/providers/WebSpeechProvider.ts` (adapter)
- ✏️ `src/core/tts/providers/PiperWASMProvider.ts` (nouveau)
- ✏️ `src/core/tts/TTSProviderManager.ts` (nouveau)

**Phase 3** :
- ✏️ `src/stores/playSettingsStore.ts` (ajouter actions)

**Phase 4** :
- ✏️ `src/components/play/TTSProviderSelector.tsx` (nouveau)
- ✏️ `src/components/play/CharacterVoiceEditor.tsx` (nouveau)
- ✏️ `src/screens/PlayDetailScreen.tsx` (modifier)

**Phase 5** :
- ✏️ `src/core/tts/index.ts` (adapter)

---

## 🎬 Commandes Utiles

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Dev server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview

# Open IndexedDB DevTools
# Chrome DevTools → Application → IndexedDB → repet-db
```

---

## 📊 Métriques de Succès

| Métrique | Objectif | Mesure |
|----------|----------|--------|
| Diversité voix | 100% si ≤ nb voix/genre | Test 4 chars → 4 voices |
| Persistance | 100% | Reload app → assignments identiques |
| Performance synthèse | < 1s | Time from speak() to audio.play() |
| Taille modèles | < 20MB/modèle | Check download size |
| Build size | < +500KB | Compare build avant/après |
| Type errors | 0 | `npm run type-check` |

---

## ✅ Checklist Finale

Avant de considérer l'implémentation terminée :

- [ ] Toutes les phases (1-6) complétées
- [ ] Tous les checkpoints validés
- [ ] Tests fonctionnels passent (7/7)
- [ ] Tests techniques passent (type-check, lint, build)
- [ ] Documentation à jour (README, CHANGELOG)
- [ ] Pas de régression sur fonctionnalités existantes
- [ ] Performance acceptable
- [ ] Code reviewé (si équipe)
- [ ] Branch mergée dans `main` (après validation)

---

**Document créé le** : 2025-01-XX  
**Dernière mise à jour** : 2025-01-XX  
**Auteur** : Claude (Assistant IA)  
**Statut** : ✅ PRÊT POUR IMPLÉMENTATION

---

## 🔗 Liens vers Autres Documents

- 📋 [PIPER_WASM_ACTION_PLAN.md](./PIPER_WASM_ACTION_PLAN.md) - Plan d'action détaillé
- 🎭 [VOICE_ASSIGNMENT_SPECIFICATION.md](./VOICE_ASSIGNMENT_SPECIFICATION.md) - Spec assignation voix
- 🎨 [PIPER_WASM_ARCHITECTURE_DIAGRAMS.md](./PIPER_WASM_ARCHITECTURE_DIAGRAMS.md) - Diagrammes archi
- 📝 [TODO_PHASE_0.md](./TODO_PHASE_0.md) - Checklist POC (optionnel)
- 📖 [PIPER_WASM_QUICK_REFERENCE.md](./PIPER_WASM_QUICK_REFERENCE.md) - Référence rapide

---

**Note** : Ce document est un guide d'implémentation pratique. Suivez les phases dans l'ordre pour une intégration progressive et validée à chaque étape. 🚀