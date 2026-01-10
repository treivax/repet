# 🚀 Prompt 05 : Text-to-Speech Engine
# 🚀 Prompt 05 : Moteur TTS (Text-to-Speech)

**Durée estimée** : ~2h | **Dépend de** : Prompts 01-02

---

## ⚠️ PRÉREQUIS OBLIGATOIRE

**AVANT D'EXÉCUTER CE PROMPT**, charge le fichier `.github/prompts/common.md` dans ton contexte.

Ce fichier contient TOUS les standards du projet (TypeScript, React, architecture, conventions).
Sans lui, tu ne pourras pas respecter les exigences du projet.

---

## 📋 Contexte

Tu vas créer le **moteur de synthèse vocale** (TTS) qui utilise la Web Speech API pour lire les répliques à voix haute.

Le TTS Engine doit gérer :
- La lecture séquentielle des répliques
- La sélection des voix (homme/femme)
- Le contrôle de vitesse et volume
- La file d'attente des répliques
- Les événements pour synchroniser l'UI

**Standards** : Respecte `.github/prompts/common.md` (déjà chargé en prérequis)

### Principes clés à respecter

- ✅ Code simple et lisible (pas de sur-ingénierie)
- ✅ TypeScript strict (pas de `any`, typage complet)
- ✅ Gestion d'erreurs explicite (try-catch + messages clairs)
- ✅ Documentation inline (JSDoc pour fonctions publiques)
- ✅ API événementielle (callbacks pour UI)
- ❌ PAS de dépendances externes (Web Speech API natif uniquement)
- ❌ PAS de logique UI dans le TTS (séparation stricte)

---

## 🎯 Objectifs

1. Créer un wrapper autour de Web Speech API
2. Implémenter une file d'attente pour les répliques
3. Gérer la sélection automatique des voix (homme/femme)
4. Contrôler vitesse, volume et pitch
5. Fournir des événements pour synchroniser l'UI
6. Supporter le mode italiennes (volume = 0 pour utilisateur)

---

## 📦 Tâches

### 1. Types TTS

#### Fichier : `src/core/tts/types.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

/**
 * État du moteur TTS
 */
export type TTSState = 'idle' | 'speaking' | 'paused';

/**
 * Configuration de lecture d'une réplique
 */
export interface SpeechConfig {
  /** Texte à lire */
  text: string;
  
  /** URI de la voix à utiliser */
  voiceURI?: string;
  
  /** Vitesse de lecture (0.5 - 2.0) */
  rate?: number;
  
  /** Volume (0.0 - 1.0) */
  volume?: number;
  
  /** Pitch (0.0 - 2.0) */
  pitch?: number;
  
  /** ID de la réplique (pour tracking) */
  lineId?: string;
}

/**
 * Événements du moteur TTS
 */
export interface TTSEvents {
  /** Appelé quand une réplique commence */
  onStart?: (lineId?: string) => void;
  
  /** Appelé quand une réplique se termine */
  onEnd?: (lineId?: string) => void;
  
  /** Appelé en cas d'erreur */
  onError?: (error: Error) => void;
  
  /** Appelé lors de la progression (pour animation) */
  onProgress?: (charIndex: number, lineId?: string) => void;
}

/**
 * Informations sur une voix système
 */
export interface VoiceInfo {
  /** URI unique de la voix */
  uri: string;
  
  /** Nom de la voix */
  name: string;
  
  /** Langue (ex: "fr-FR") */
  lang: string;
  
  /** Est une voix locale (vs réseau) */
  localService: boolean;
}
```

---

### 2. Voice Manager

#### Fichier : `src/core/tts/voice-manager.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { Gender } from '../models/types';
import { VoiceInfo } from './types';

/**
 * Gestionnaire de voix pour le TTS
 */
export class VoiceManager {
  private voices: SpeechSynthesisVoice[] = [];
  private initialized = false;

  /**
   * Initialise le gestionnaire de voix
   * À appeler au démarrage de l'application
   */
  async initialize(): Promise<void> {
    return new Promise((resolve) => {
      if (this.initialized) {
        resolve();
        return;
      }

      // Charger les voix
      const loadVoices = () => {
        this.voices = speechSynthesis.getVoices();
        
        if (this.voices.length > 0) {
          this.initialized = true;
          console.log(`${this.voices.length} voix disponibles`);
          resolve();
        }
      };

      // Les voix peuvent être chargées de façon asynchrone
      loadVoices();
      
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }

      // Timeout de sécurité
      setTimeout(() => {
        if (!this.initialized) {
          loadVoices();
          resolve();
        }
      }, 1000);
    });
  }

  /**
   * Récupère toutes les voix disponibles
   * 
   * @returns Liste des voix
   */
  getVoices(): VoiceInfo[] {
    return this.voices.map((voice) => ({
      uri: voice.voiceURI,
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService,
    }));
  }

  /**
   * Récupère les voix françaises uniquement
   * 
   * @returns Liste des voix françaises
   */
  getFrenchVoices(): VoiceInfo[] {
    return this.getVoices().filter((voice) => voice.lang.startsWith('fr'));
  }

  /**
   * Sélectionne automatiquement une voix selon le genre
   * 
   * @param gender - Genre du personnage
   * @returns URI de la voix sélectionnée
   */
  selectVoiceForGender(gender: Gender): string | undefined {
    const frenchVoices = this.voices.filter((v) => v.lang.startsWith('fr'));

    if (frenchVoices.length === 0) {
      console.warn('Aucune voix française disponible');
      return undefined;
    }

    // Heuristiques pour détecter les voix homme/femme
    // (basées sur les noms courants des voix système)
    const femalePattterns = /female|femme|woman|féminin|amélie|audrey|céline/i;
    const malePatterns = /male|homme|man|masculin|thomas|daniel|nicolas/i;

    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (gender === 'female') {
      selectedVoice = frenchVoices.find((v) => femalePattterns.test(v.name));
    } else if (gender === 'male') {
      selectedVoice = frenchVoices.find((v) => malePatterns.test(v.name));
    }

    // Fallback : première voix française disponible
    if (!selectedVoice) {
      selectedVoice = frenchVoices[0];
    }

    return selectedVoice?.voiceURI;
  }

  /**
   * Récupère une voix par son URI
   * 
   * @param uri - URI de la voix
   * @returns Voix correspondante ou undefined
   */
  getVoiceByURI(uri: string): SpeechSynthesisVoice | undefined {
    return this.voices.find((v) => v.voiceURI === uri);
  }

  /**
   * Vérifie si le TTS est disponible dans le navigateur
   * 
   * @returns true si disponible
   */
  static isAvailable(): boolean {
    return 'speechSynthesis' in window;
  }
}

/**
 * Instance singleton du gestionnaire de voix
 */
export const voiceManager = new VoiceManager();
```

---

### 3. Queue de Répliques

#### Fichier : `src/core/tts/queue.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { SpeechConfig } from './types';

/**
 * Item dans la file d'attente
 */
interface QueueItem {
  config: SpeechConfig;
  utterance: SpeechSynthesisUtterance;
}

/**
 * File d'attente pour la lecture séquentielle des répliques
 */
export class SpeechQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  /**
   * Ajoute une réplique à la file d'attente
   * 
   * @param config - Configuration de lecture
   * @param utterance - Utterance SpeechSynthesis
   */
  enqueue(config: SpeechConfig, utterance: SpeechSynthesisUtterance): void {
    this.queue.push({ config, utterance });
    
    if (!this.isProcessing) {
      this.processNext();
    }
  }

  /**
   * Traite le prochain item de la file
   */
  private processNext(): void {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      this.currentUtterance = null;
      return;
    }

    this.isProcessing = true;
    const item = this.queue.shift()!;
    this.currentUtterance = item.utterance;

    // Quand la lecture se termine, passer au suivant
    item.utterance.onend = () => {
      this.processNext();
    };

    speechSynthesis.speak(item.utterance);
  }

  /**
   * Vide la file d'attente et arrête la lecture
   */
  clear(): void {
    this.queue = [];
    this.isProcessing = false;
    this.currentUtterance = null;
    speechSynthesis.cancel();
  }

  /**
   * Pause la lecture en cours
   */
  pause(): void {
    if (this.currentUtterance && this.isProcessing) {
      speechSynthesis.pause();
    }
  }

  /**
   * Reprend la lecture
   */
  resume(): void {
    if (this.currentUtterance && this.isProcessing) {
      speechSynthesis.resume();
    }
  }

  /**
   * Vérifie si la file est vide
   * 
   * @returns true si vide
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Nombre d'items en attente
   * 
   * @returns Taille de la file
   */
  size(): number {
    return this.queue.length;
  }
}
```

---

### 4. Moteur TTS Principal

#### Fichier : `src/core/tts/engine.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { SpeechConfig, TTSEvents, TTSState } from './types';
import { voiceManager } from './voice-manager';
import { SpeechQueue } from './queue';

/**
 * Moteur de synthèse vocale
 */
export class TTSEngine {
  private state: TTSState = 'idle';
  private queue = new SpeechQueue();
  private events: TTSEvents = {};

  /**
   * Initialise le moteur TTS
   */
  async initialize(): Promise<void> {
    if (!voiceManager.isAvailable()) {
      throw new Error('La synthèse vocale n\'est pas disponible dans ce navigateur');
    }

    await voiceManager.initialize();
    console.log('Moteur TTS initialisé');
  }

  /**
   * Configure les événements
   * 
   * @param events - Callbacks d'événements
   */
  setEvents(events: TTSEvents): void {
    this.events = events;
  }

  /**
   * Lit un texte avec la configuration spécifiée
   * 
   * @param config - Configuration de lecture
   */
  speak(config: SpeechConfig): void {
    try {
      const utterance = new SpeechSynthesisUtterance(config.text);

      // Configuration de la voix
      if (config.voiceURI) {
        const voice = voiceManager.getVoiceByURI(config.voiceURI);
        if (voice) {
          utterance.voice = voice;
        }
      }

      // Configuration des paramètres
      utterance.rate = config.rate ?? 1.0;
      utterance.volume = config.volume ?? 1.0;
      utterance.pitch = config.pitch ?? 1.0;
      utterance.lang = 'fr-FR';

      // Événements
      utterance.onstart = () => {
        this.state = 'speaking';
        this.events.onStart?.(config.lineId);
      };

      utterance.onend = () => {
        if (this.queue.isEmpty()) {
          this.state = 'idle';
        }
        this.events.onEnd?.(config.lineId);
      };

      utterance.onerror = (event) => {
        console.error('Erreur TTS:', event.error);
        this.events.onError?.(new Error(`Erreur TTS: ${event.error}`));
        this.state = 'idle';
      };

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          this.events.onProgress?.(event.charIndex, config.lineId);
        }
      };

      // Ajouter à la file d'attente
      this.queue.enqueue(config, utterance);
    } catch (error) {
      console.error('Erreur lors de la création de l\'utterance:', error);
      this.events.onError?.(
        error instanceof Error ? error : new Error('Erreur inconnue')
      );
    }
  }

  /**
   * Pause la lecture
   */
  pause(): void {
    if (this.state === 'speaking') {
      this.queue.pause();
      this.state = 'paused';
    }
  }

  /**
   * Reprend la lecture
   */
  resume(): void {
    if (this.state === 'paused') {
      this.queue.resume();
      this.state = 'speaking';
    }
  }

  /**
   * Arrête la lecture et vide la file
   */
  stop(): void {
    this.queue.clear();
    this.state = 'idle';
  }

  /**
   * Récupère l'état actuel du moteur
   * 
   * @returns État du moteur
   */
  getState(): TTSState {
    return this.state;
  }

  /**
   * Vérifie si le moteur est en train de lire
   * 
   * @returns true si en lecture
   */
  isSpeaking(): boolean {
    return this.state === 'speaking';
  }

  /**
   * Vérifie si le moteur est en pause
   * 
   * @returns true si en pause
   */
  isPaused(): boolean {
    return this.state === 'paused';
  }
}

/**
 * Instance singleton du moteur TTS
 */
export const ttsEngine = new TTSEngine();
```

---

### 5. Index du TTS

#### Fichier : `src/core/tts/index.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

export { ttsEngine, TTSEngine } from './engine';
export { voiceManager, VoiceManager } from './voice-manager';
export { SpeechQueue } from './queue';
export type {
  TTSState,
  SpeechConfig,
  TTSEvents,
  VoiceInfo,
} from './types';
```

---

### 6. Initialisation dans main.tsx

#### Modifier : `src/main.tsx`

Ajouter l'initialisation du TTS :

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/globals.css';
import { initializeDatabase } from './core/storage';
import { ttsEngine } from './core/tts';

// Initialiser la base de données et le TTS
Promise.all([
  initializeDatabase(),
  ttsEngine.initialize(),
])
  .then(() => {
    console.log('Application initialisée avec succès');
  })
  .catch((error) => {
    console.error('Erreur fatale lors de l\'initialisation:', error);
  });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## ✅ Critères de Validation

**Avant de passer au prompt suivant, valider :**

```bash
npm run type-check  # DOIT retourner 0 erreur
npm run dev         # DOIT démarrer sans erreur
```

### Tests manuels dans la console navigateur

Ouvrir la console (F12) et tester :

```javascript
import { ttsEngine, voiceManager } from './core/tts';

// Test 1 : Vérifier les voix disponibles
const voices = voiceManager.getFrenchVoices();
console.log('Voix françaises:', voices);

// Test 2 : Lecture simple
ttsEngine.setEvents({
  onStart: (lineId) => console.log('Début lecture:', lineId),
  onEnd: (lineId) => console.log('Fin lecture:', lineId),
  onError: (error) => console.error('Erreur:', error),
});

ttsEngine.speak({
  text: 'Bonjour, ceci est un test de synthèse vocale.',
  rate: 1.0,
  volume: 1.0,
  lineId: 'test-1',
});

// Test 3 : File d'attente
ttsEngine.speak({
  text: 'Première réplique.',
  lineId: 'line-1',
});

ttsEngine.speak({
  text: 'Deuxième réplique.',
  lineId: 'line-2',
});

ttsEngine.speak({
  text: 'Troisième réplique.',
  lineId: 'line-3',
});

// Test 4 : Pause / Resume
setTimeout(() => {
  console.log('Pause');
  ttsEngine.pause();
}, 2000);

setTimeout(() => {
  console.log('Resume');
  ttsEngine.resume();
}, 4000);

// Test 5 : Stop
setTimeout(() => {
  console.log('Stop');
  ttsEngine.stop();
}, 6000);

// Test 6 : Vitesse différente
ttsEngine.speak({
  text: 'Cette phrase est lue rapidement.',
  rate: 1.5,
  lineId: 'fast',
});

ttsEngine.speak({
  text: 'Cette phrase est lue lentement.',
  rate: 0.7,
  lineId: 'slow',
});

// Test 7 : Volume 0 (mode italiennes)
ttsEngine.speak({
  text: 'Réplique de l\'utilisateur (silencieuse).',
  volume: 0,
  lineId: 'user-line',
});

// Test 8 : Sélection voix par genre
const femaleVoice = voiceManager.selectVoiceForGender('female');
const maleVoice = voiceManager.selectVoiceForGender('male');
console.log('Voix femme:', femaleVoice);
console.log('Voix homme:', maleVoice);
```

### Checklist de validation

- [ ] Fichiers créés sans erreurs TypeScript
- [ ] Aucun type `any` utilisé
- [ ] JSDoc présent sur toutes les fonctions publiques
- [ ] Imports/exports fonctionnent correctement
- [ ] TTS initialisé sans erreur au démarrage
- [ ] Voix françaises détectées (au moins 1)
- [ ] Lecture simple fonctionne
- [ ] File d'attente fonctionne (répliques séquentielles)
- [ ] Pause/Resume fonctionnent
- [ ] Stop fonctionne (vide la file)
- [ ] Contrôle de vitesse fonctionne
- [ ] Volume 0 fonctionne (lecture silencieuse)
- [ ] Événements onStart/onEnd appelés correctement
- [ ] Sélection automatique voix homme/femme fonctionne
- [ ] Pas d'erreur dans la console navigateur

---

## 📝 Livrables

- [x] `src/core/tts/types.ts`
- [x] `src/core/tts/voice-manager.ts`
- [x] `src/core/tts/queue.ts`
- [x] `src/core/tts/engine.ts`
- [x] `src/core/tts/index.ts`
- [x] `src/main.tsx` modifié (initialisation TTS)
- [x] Tests manuels passés
- [x] Commit avec message : "feat: add TTS engine (Prompt 05)"

---

## 🔗 Liens utiles

- Standards : `.github/prompts/common.md`
- Architecture : `plans/PROJECT_STRUCTURE.md`
- Modèles de données : `src/core/models/`
- Web Speech API : https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

---

## 📌 Notes importantes

- **Web Speech API** : Natif dans Chrome, Edge, Safari (iOS 7+)
- **Voix** : Dépendent du système d'exploitation
- **Limitations iOS** : Sur iOS, le TTS ne fonctionne que si déclenché par une action utilisateur
- **File d'attente** : Automatique, pas besoin d'attendre la fin d'une réplique
- **Volume 0** : Lecture silencieuse pour mode italiennes (répliques utilisateur)
- **Singleton** : Une seule instance de `ttsEngine` pour toute l'application
- **Événements** : Permettent de synchroniser l'UI (highlight, scroll, etc.)

---

## ➡️ Prompt suivant

Après validation complète : **Prompt 06 - Utilitaires**