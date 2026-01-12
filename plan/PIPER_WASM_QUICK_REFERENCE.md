# 🚀 Référence Rapide : Intégration Piper-WASM

**Branche** : `piper-wasm`  
**Objectif** : Ajouter Piper-WASM comme moteur TTS avec sélecteur utilisateur

---

## 📋 Avant de Commencer

### Fichiers de Contexte OBLIGATOIRES

Charger dans chaque session de développement :

1. ✅ `.github/prompts/common.md` - Standards du projet
2. ✅ `docs/ARCHITECTURE.md` - Architecture complète
3. ✅ `docs/TTS_ARCHITECTURE_PROPOSAL.md` - Architecture TTS
4. ✅ `PROJECT_STATUS.md` - État du projet
5. ✅ `plan/PIPER_WASM_ACTION_PLAN.md` - Plan détaillé (ce document)

### Vérifications Initiales

```bash
# Branche active
git branch --show-current  # Doit afficher : piper-wasm

# Node modules
npm install

# Type check
npm run type-check

# Lint
npm run lint
```

---

## 🎯 Objectif en Une Phrase

Permettre aux utilisateurs de choisir entre **"Natif Device"** (Web Speech API) et **"Piper"** (Piper-WASM) avec **Piper sélectionné par défaut**, en assurant une **assignation intelligente des voix par genre** pour maximiser la diversité vocale entre personnages.

---

## 🏗️ Architecture en 5 Points

1. **TTSProvider Interface** - Abstraction commune pour tous les moteurs TTS
2. **WebSpeechProvider** - Wrapper autour du code existant
3. **PiperWASMProvider** - Nouveau moteur Piper-WASM avec assignation intelligente par genre
4. **TTSProviderManager** - Orchestrateur central
5. **Voice Assignment System** - Distribution intelligente des voix par genre
6. **UI Selector** - Sélecteur de moteur dans les paramètres

---

## 📁 Structure des Fichiers

```
src/core/tts/
├── provider/                    # NOUVEAU
│   ├── types.ts                # Interfaces communes
│   ├── TTSProviderManager.ts   # Manager central
│   ├── WebSpeechProvider.ts    # Wrapper Web Speech
│   ├── PiperWASMProvider.ts    # Provider Piper
│   └── AudioCacheService.ts    # Cache IndexedDB
├── engine.ts                    # EXISTANT (inchangé)
├── voice-manager.ts            # EXISTANT (inchangé)
├── types.ts                    # EXISTANT (inchangé)
└── index.ts                    # MODIFIÉ (exports)

src/state/
└── ttsConfigStore.ts           # NOUVEAU (config utilisateur)

src/components/settings/
├── TTSEngineSelector.tsx       # NOUVEAU (sélecteur UI)
└── PiperModelManager.tsx       # NOUVEAU (optionnel)

plan/
├── PIPER_WASM_ACTION_PLAN.md   # Ce document
└── PIPER_WASM_POC_RESULTS.md   # À créer (Phase 0)
```

---

## 🎙️ Assignation de Voix par Genre (Fonctionnalité Clé)

### Principe
L'application possède déjà un système "Voix des personnages" où l'utilisateur définit le genre (Homme/Femme) de chaque personnage. Le système doit :

1. **Différencier** - Voix clairement identifiées comme masculines ou féminines
2. **Maximiser la diversité** - Assigner des voix différentes à chaque personnage
3. **Respecter le genre** - Personnage féminin → voix féminine, etc.
4. **Assurer la cohérence** - Même personnage = même voix durant toute la session

### Algorithme
```
Pour chaque personnage :
  1. Lire le genre défini dans settings.characterVoices[characterId]
  2. Filtrer les voix du même genre
  3. Sélectionner la voix la moins utilisée (rotation équitable)
  4. Mémoriser l'assignation pour cohérence
```

### Configuration Piper Requise
- **Minimum 2 voix féminines** (ex: Siwis, UPMC)
- **Minimum 2 voix masculines** (ex: Tom, Gilles)
- Propriété `gender: 'male' | 'female'` obligatoire sur chaque modèle

### Tests Critiques
- [ ] 4 personnages (2F, 2M) → 4 voix différentes
- [ ] Relecture → même assignation (cohérence)
- [ ] Changement genre → changement voix
- [ ] Plus de personnages que de voix → rotation équitable

---

## 🗓️ Phases (Résumé)

| Phase | Durée | Objectif | Livrable Clé |
|-------|-------|----------|--------------|
| **0. POC** | 1j | Valider faisabilité Piper-WASM | POC fonctionnel |
| **1. Architecture** | 2-3j | Créer système multi-provider | WebSpeechProvider + Manager |
| **2. Piper** | 3-5j | Intégrer Piper-WASM | PiperWASMProvider + Cache |
| **3. UI** | 2-3j | Sélecteur utilisateur | TTSEngineSelector |
| **4. Finalisation** | 1j | Documentation + Tests | Docs + Changelog |

**Total estimé** : 9-13 jours

---

## 🔑 Code Snippets Clés

### 1. Interface Provider

```typescript
// src/core/tts/provider/types.ts

export type TTSProviderType = 'web-speech' | 'piper-wasm';

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

### 2. Store de Configuration

```typescript
// src/state/ttsConfigStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTTSConfigStore = create(
  persist(
    (set) => ({
      selectedProvider: 'piper-wasm', // DÉFAUT = PIPER
      setProvider: (provider) => set({ selectedProvider: provider })
    }),
    { name: 'repet-tts-config' }
  )
);
```

### 3. Initialisation App

```typescript
// src/App.tsx

import { useTTSConfigStore } from './state/ttsConfigStore';
import { ttsProviderManager } from './core/tts';

function App() {
  const { selectedProvider } = useTTSConfigStore();
  
  useEffect(() => {
    async function initTTS() {
      try {
        await ttsProviderManager.initialize(selectedProvider);
      } catch (error) {
        // Fallback sur web-speech si Piper échoue
        await ttsProviderManager.initialize('web-speech');
      }
    }
    initTTS();
  }, [selectedProvider]);
  
  // ...
}
```

---

## ✅ Checklist de Validation (Chaque Phase)

### Phase 1 - Architecture
- [ ] WebSpeechProvider créé et fonctionnel
- [ ] TTSProviderManager créé
- [ ] Pas de régression (audio fonctionne toujours)
- [ ] Type check passe
- [ ] Console sans erreurs

### Phase 2 - Piper
- [ ] PiperWASMProvider créé
- [ ] Génération audio Piper fonctionne
- [ ] Cache audio fonctionne
- [ ] Téléchargement de modèle fonctionne
- [ ] Qualité audio acceptable
- [ ] **Assignation voix par genre fonctionnelle**
- [ ] **Au moins 2 voix par genre disponibles**
- [ ] **Tests avec plusieurs personnages (diversité OK)**

### Phase 3 - UI
- [ ] Sélecteur de moteur visible
- [ ] Piper sélectionné par défaut (premier lancement)
- [ ] Changement de moteur fonctionne
- [ ] Sélection persiste (localStorage)
- [ ] UI responsive + thème clair/sombre

### Phase 4 - Finalisation
- [ ] Documentation complète
- [ ] Changelog mis à jour
- [ ] Tous les tests manuels passent
- [ ] Build production réussit
- [ ] PWA fonctionne

---

## 🚨 Règles STRICTES (common.md)

### ❌ INTERDIT

- **Hardcoding** - Pas de valeurs en dur
- **`any`** - Types stricts uniquement
- **Code temporaire** - Solution définitive directement
- **Breaking changes non documentés**
- **Oublier les tests manuels**

### ✅ OBLIGATOIRE

- **Copyright header** sur tous les nouveaux fichiers :
  ```typescript
  /**
   * Copyright (c) 2025 Répét Contributors
   * Licensed under the MIT License
   */
  ```
- **JSDoc** pour fonctions complexes
- **Types explicites** TypeScript
- **Tests manuels** systématiques
- **Named exports** (pas de default)

---

## 🐛 Troubleshooting Commun

| Problème | Solution |
|----------|----------|
| Type check échoue | Vérifier imports, pas de `any` |
| Audio ne fonctionne pas | Vérifier initialisation provider |
| Piper ne charge pas | Vérifier support WASM navigateur |
| Cache ne fonctionne pas | Vérifier IndexedDB disponible |
| UI ne s'affiche pas | Vérifier imports composants |
| Sélection ne persiste pas | Vérifier Zustand persist config |

---

## 📞 Commandes Utiles

```bash
# Développement
npm run dev              # Serveur dev (http://localhost:5173)
npm run type-check       # Vérifier types
npm run lint             # Vérifier code style

# Build
npm run build            # Compiler production
npm run preview          # Tester build (http://localhost:4173)

# Git
git status               # Fichiers modifiés
git add .                # Ajouter tous les fichiers
git commit -m "..."      # Commit
git push -u origin piper-wasm  # Push branche

# Tests PWA (après build)
npm run build && npm run preview
# Puis : Chrome → F12 → Application → Manifest
```

---

## 📚 Ressources

### Documentation Projet
- `docs/ARCHITECTURE.md` - Architecture complète
- `docs/TTS_ARCHITECTURE_PROPOSAL.md` - Architecture TTS proposée
- `docs/USER_GUIDE.md` - Guide utilisateur
- `.github/prompts/common.md` - Standards de code

### Documentation Externe (à identifier en Phase 0)
- Piper-WASM GitHub
- Piper Models Repository
- Web Speech API MDN
- IndexedDB API MDN

---

## 🎯 Critères de Succès Final

### Fonctionnel
✅ Sélecteur de moteur dans paramètres  
✅ "Piper" sélectionné par défaut  
✅ Changement de moteur fluide  
✅ Lecture audio fonctionne avec les 2 moteurs  
✅ Cache audio accélère les lectures répétées  
✅ **Voix différenciées par genre (M/F)**  
✅ **Diversité maximale des voix entre personnages**  
✅ **Cohérence d'assignation durant la session**  

### Technique
✅ Code respecte `common.md`  
✅ Aucun hardcoding  
✅ Types TypeScript stricts  
✅ Build production réussit  
✅ PWA fonctionne hors-ligne  

### Documentation
✅ Guide utilisateur mis à jour  
✅ Documentation technique complète  
✅ Changelog à jour  
✅ README mis à jour  

---

## 🔄 Flux de Développement Type

```
1. Charger contexte (common.md, docs)
   ↓
2. Lire plan détaillé (PIPER_WASM_ACTION_PLAN.md)
   ↓
3. Implémenter une phase
   ↓
4. Tests manuels (checklist)
   ↓
5. Type check + Lint
   ↓
6. Commit (message conventionnel)
   ↓
7. Passer à la phase suivante
```

---

## 📝 Template de Commit

```bash
git commit -m "feat(tts): [Description courte]

- Point 1
- Point 2
- Point 3

Refs: Phase X du plan Piper-WASM"
```

**Exemples** :
- `feat(tts): Ajoute interface TTSProvider`
- `feat(tts): Implémente PiperWASMProvider`
- `feat(tts): Ajoute sélecteur de moteur TTS`
- `docs(tts): Documente intégration Piper-WASM`

---

## ⏭️ Prochaine Étape

**Commencer par Phase 0 : POC Piper-WASM**

1. Rechercher la librairie Piper-WASM officielle
2. Créer `poc-piper.html` pour tester
3. Tester génération audio basique
4. Documenter résultats dans `plan/PIPER_WASM_POC_RESULTS.md`
5. Valider faisabilité technique

**Go/No-Go** : Si POC réussit → Phase 1, sinon → réévaluer approche

---

**Dernière mise à jour** : 2025-01-XX  
**Statut** : 🟡 En attente de démarrage  
**Prochaine action** : Phase 0 - POC

---

## 📌 Rappel Important : Assignation de Voix

**À CHAQUE PHASE** - Garder en tête :
- Les voix doivent être **différenciées par genre**
- Objectif : **Maximum de voix différentes** par personnage
- Utiliser `settings.characterVoices[characterId]` (déjà existant)
- Algorithme de distribution équitable requis