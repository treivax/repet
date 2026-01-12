# 📊 Tracker de Progression : Implémentation Piper-WASM

**Date de début** : [À remplir]  
**Date de fin estimée** : [À remplir]  
**Statut global** : 🔴 NON DÉMARRÉ

---

## 🎯 Vue d'Ensemble

| Phase | Statut | Progression | Durée estimée | Durée réelle |
|-------|--------|-------------|---------------|--------------|
| Phase 1 : Fondations | 🟢 | 100% | 1-2 jours | 20 min |
| Phase 2 : Providers | 🟡 | 0% | 2-3 jours | - |
| Phase 3 : Store | 🔴 | 0% | 1-2 jours | - |
| Phase 4 : UI | 🔴 | 0% | 2-3 jours | - |
| Phase 5 : TTS Engine | 🔴 | 0% | 1 jour | - |
| Phase 6 : Tests | 🔴 | 0% | 2 jours | - |
| **TOTAL** | 🔴 | **0%** | **9-13 jours** | **-** |

**Légende** :
- 🔴 Non démarré
- 🟡 En cours
- 🟢 Terminé
- ⚠️ Bloqué
- ⏸️ En pause

---

## 📋 PHASE 1 : Fondations (Data Model & Types)

**Statut** : 🟢 TERMINÉ  
**Progression** : 3/3 tâches  
**Date début** : 2025-01-12  
**Date fin** : 2025-01-12

### Tâches

#### 1.1 - Types Providers ✏️ `src/core/tts/types.ts`

- [x] Créer fichier `types.ts` (existant, étendu)
- [x] Définir `TTSProviderType`
- [x] Définir `VoiceDescriptor` (avec `gender`)
- [x] Définir `SynthesisOptions`
- [x] Définir `SynthesisResult`
- [x] Définir interface `TTSProvider`
- [x] Exports corrects
- [x] Type-check passe

**Statut** : 🟢 TERMINÉ | **Durée** : 10 min | **Bloqueurs** : Aucun

---

#### 1.2 - Modèle PlaySettings ✏️ `src/core/models/Settings.ts`

- [x] Ajouter `ttsProvider: TTSProviderType`
- [x] Ajouter `characterVoicesPiper: Record<string, string>`
- [x] Ajouter `characterVoicesGoogle: Record<string, string>`
- [x] Mettre à jour `createDefaultPlaySettings()`
- [x] Type-check passe

**Statut** : 🟢 TERMINÉ | **Durée** : 5 min | **Bloqueurs** : Aucun

---

#### 1.3 - Migration Dexie ✏️ `src/core/db/`

- [x] Localiser fichier de schema Dexie
- [x] Vérifier stockage PlaySettings (→ Zustand localStorage, pas Dexie)
- [x] Confirmer migration automatique via Zustand persist
- [x] Pas de migration Dexie nécessaire pour PlaySettings

**Statut** : 🟢 TERMINÉ (N/A) | **Durée** : 5 min | **Bloqueurs** : Aucun

**Note** : PlaySettings sont stockés dans localStorage via Zustand persist, pas dans IndexedDB/Dexie. La fusion des nouveaux champs se fait automatiquement via `createDefaultPlaySettings()`.

---

### ✅ Checkpoint Phase 1

- [x] Types TypeScript compilent sans erreur ✅
- [x] Migration DB testée et fonctionne ✅ (auto via Zustand)
- [x] Valeurs par défaut correctes ✅
- [x] Pas de régression sur code existant ✅

---

## 📋 PHASE 2 : Provider Architecture

**Statut** : 🟡 EN COURS  
**Progression** : 0/3 tâches  
**Date début** : 2025-01-12  
**Date fin** : -

### Tâches

#### 2.1 - Adapter WebSpeechProvider ✏️ `src/core/tts/providers/WebSpeechProvider.ts`

- [ ] Implémenter interface `TTSProvider`
- [ ] Ajouter méthode `getVoices(): VoiceDescriptor[]`
- [ ] Implémenter détection de genre dans `getVoices()`
- [ ] Ajouter méthode `generateVoiceAssignments()`
- [ ] Implémenter algorithme round-robin
- [ ] Tester avec console.log (4 chars → 4 voices)
- [ ] Type-check passe

**Statut** : 🔴 | **Durée** : - | **Bloqueurs** : Dépend de Phase 1

---

#### 2.2 - Créer PiperWASMProvider ✏️ `src/core/tts/providers/PiperWASMProvider.ts`

- [ ] Créer fichier
- [ ] Définir `PIPER_MODELS` (config 4 modèles min : 2M, 2F)
- [ ] Implémenter interface `TTSProvider`
- [ ] Implémenter `initialize()` (placeholder WASM)
- [ ] Implémenter `checkAvailability()`
- [ ] Implémenter `getVoices()`
- [ ] Implémenter `generateVoiceAssignments()` (même algo que WebSpeech)
- [ ] Implémenter `synthesize()` (placeholder pour POC)
- [ ] Implémenter `stop()`, `dispose()`
- [ ] Type-check passe

**Statut** : 🔴 | **Durée** : - | **Bloqueurs** : Dépend de Phase 1

**Notes** : Pour l'instant, `synthesize()` peut être un placeholder. L'intégration WASM réelle sera faite plus tard.

---

#### 2.3 - TTSProviderManager ✏️ `src/core/tts/TTSProviderManager.ts`

- [ ] Créer fichier
- [ ] Classe `TTSProviderManager`
- [ ] `registerProviders()` (Web Speech + Piper)
- [ ] `initialize(providerType)`
- [ ] `switchProvider(providerType)`
- [ ] `getVoices()`
- [ ] `speak(text, options)`
- [ ] `stop()`
- [ ] Export singleton `ttsProviderManager`
- [ ] Type-check passe
- [ ] Test manuel : switch entre providers

**Statut** : 🔴 | **Durée** : - | **Bloqueurs** : Dépend de 2.1 et 2.2

---

### ✅ Checkpoint Phase 2

- [ ] `WebSpeechProvider.getVoices()` retourne liste avec genres
- [ ] `PiperWASMProvider.getVoices()` retourne config modèles
- [ ] `generateVoiceAssignments()` implémenté dans les 2 providers
- [ ] Algorithme testé manuellement (4 chars → 4 voices distinctes)
- [ ] TTSProviderManager switch correctement entre providers

---

## 📋 PHASE 3 : Store & State Management

**Statut** : 🔴 NON DÉMARRÉ  
**Progression** : 0/1 tâches  
**Date début** : -  
**Date fin** : -

### Tâches

#### 3.1 - playSettingsStore - Nouvelles Actions ✏️ `src/stores/playSettingsStore.ts`

- [ ] Ajouter action `setTTSProvider(playId, provider)`
- [ ] Ajouter action `setCharacterVoiceAssignment(playId, provider, characterId, voiceId)`
- [ ] Ajouter action `reassignAllVoices(playId, provider)`
- [ ] Implémenter logique de persistance DB
- [ ] Implémenter mise à jour state réactif
- [ ] Tester actions en isolation (console)
- [ ] Type-check passe

**Statut** : 🔴 | **Durée** : - | **Bloqueurs** : Dépend de Phase 1 et 2

---

### ✅ Checkpoint Phase 3

- [ ] Actions store testées en isolation
- [ ] Persistance DB vérifiée (avant/après refresh)
- [ ] State réactif mis à jour correctement
- [ ] Pas de memory leaks (DevTools)

---

## 📋 PHASE 4 : UI Components

**Statut** : 🔴 NON DÉMARRÉ  
**Progression** : 0/3 tâches  
**Date début** : -  
**Date fin** : -

### Tâches

#### 4.1 - TTSProviderSelector ✏️ `src/components/play/TTSProviderSelector.tsx`

- [ ] Créer fichier composant
- [ ] Définir interface `Props`
- [ ] Implémenter UI (radios + bouton Reassign)
- [ ] Connecter événements (onChange, onClick)
- [ ] Ajouter confirmation dialog pour Reassign
- [ ] Styling CSS
- [ ] Test visuel (Storybook ou page démo)

**Statut** : 🔴 | **Durée** : - | **Bloqueurs** : Dépend de Phase 3

---

#### 4.2 - CharacterVoiceEditor ✏️ `src/components/play/CharacterVoiceEditor.tsx`

- [ ] Créer fichier composant
- [ ] Définir interface `Props`
- [ ] Implémenter UI (genre buttons + voice info + Edit button)
- [ ] Implémenter dropdown voix (filtré par genre)
- [ ] Connecter événements (onGenderChange, onVoiceChange)
- [ ] État local pour dropdown (show/hide)
- [ ] Styling CSS
- [ ] Test visuel

**Statut** : 🔴 | **Durée** : - | **Bloqueurs** : Dépend de Phase 3

---

#### 4.3 - Intégration PlayDetailScreen ✏️ `src/screens/PlayDetailScreen.tsx`

- [ ] Importer `TTSProviderSelector`
- [ ] Importer `CharacterVoiceEditor`
- [ ] Connecter au store (`usePlaySettingsStore`)
- [ ] Ajouter état local `availableVoices`
- [ ] Implémenter `handleProviderChange`
- [ ] Implémenter `handleReassign`
- [ ] Implémenter `handleVoiceChange`
- [ ] Placer `TTSProviderSelector` en haut du bloc "Voix"
- [ ] Remplacer UI existante par `CharacterVoiceEditor` (loop)
- [ ] Tester flow complet dans l'app

**Statut** : 🔴 | **Durée** : - | **Bloqueurs** : Dépend de 4.1 et 4.2

---

### ✅ Checkpoint Phase 4

- [ ] Composants rendus sans erreur
- [ ] Interactions UI fonctionnent (click, select, etc.)
- [ ] Provider selector + reassign + edit intégrés
- [ ] UI réactive aux changements de state
- [ ] Pas de console errors

---

## 📋 PHASE 5 : Intégration TTS Engine

**Statut** : 🔴 NON DÉMARRÉ  
**Progression** : 0/1 tâches  
**Date début** : -  
**Date fin** : -

### Tâches

#### 5.1 - Adapter ttsEngine ✏️ `src/core/tts/index.ts` (ou équivalent)

- [ ] Localiser fichier TTS engine existant
- [ ] Importer `ttsProviderManager`
- [ ] Modifier `speak()` pour utiliser provider manager
- [ ] Gérer résultat `SynthesisResult`
- [ ] Connecter événements (onStart, onEnd, onError)
- [ ] Modifier `stop()` pour déléguer au provider manager
- [ ] Tester lecture audio avec Web Speech
- [ ] Tester switch provider pendant lecture
- [ ] Type-check passe

**Statut** : 🔴 | **Durée** : - | **Bloqueurs** : Dépend de Phase 2 et 4

---

### ✅ Checkpoint Phase 5

- [ ] Audio joue avec la bonne voix
- [ ] Switch provider fonctionne pendant lecture
- [ ] Contrôles (pause, stop, resume) OK
- [ ] Événements correctement déclenchés

---

## 📋 PHASE 6 : Tests & Validation

**Statut** : 🔴 NON DÉMARRÉ  
**Progression** : 0/7 tests fonctionnels + 0/4 tests techniques  
**Date début** : -  
**Date fin** : -

### Tests Fonctionnels (Manuels)

- [ ] **Test 1 : Assignation initiale**
  - Créer nouvelle pièce avec 4 personnages (2M, 2F)
  - Vérifier 4 voix différentes assignées
  - Vérifier genres correspondent

- [ ] **Test 2 : Persistance**
  - Assigner voix
  - Fermer/rouvrir app
  - Vérifier assignations préservées

- [ ] **Test 3 : Switch provider**
  - Assigner avec Piper
  - Switch vers Web Speech
  - Vérifier nouvelles assignations
  - Switch retour vers Piper
  - Vérifier anciennes assignations restaurées

- [ ] **Test 4 : Réassignation**
  - Cliquer "🔄 Réassigner"
  - Confirmer dialog
  - Vérifier nouvelles assignations

- [ ] **Test 5 : Édition manuelle**
  - Cliquer "✏️ Modifier"
  - Choisir voix spécifique
  - Vérifier sauvegarde
  - Relancer app, vérifier persistance

- [ ] **Test 6 : Rotation**
  - Créer pièce avec 6 personnages (3M, 3F)
  - Vérifier rotation équitable si < 3 voix/genre

- [ ] **Test 7 : Lecture audio**
  - Lancer lecture réplique
  - Vérifier audio joue avec bonne voix
  - Vérifier contrôles (pause, stop)

### Tests Techniques

- [ ] **Type checking** : `npm run type-check` ✅
- [ ] **Linting** : `npm run lint` ✅
- [ ] **Build production** : `npm run build` ✅
- [ ] **Preview production** : `npm run preview` ✅

### Tests de Performance

- [ ] Load voices < 2s
- [ ] Synthesize audio < 1s (Web Speech)
- [ ] Switch provider < 1s
- [ ] Build size augmentation < +500KB

---

### ✅ Checkpoint Phase 6 (Final)

- [ ] Tous les tests fonctionnels passent (7/7)
- [ ] Tous les tests techniques passent (4/4)
- [ ] Performance acceptable
- [ ] Pas de régression sur fonctionnalités existantes
- [ ] Documentation à jour

---

## 🚨 Problèmes & Bloqueurs

### Problèmes Actifs

_Aucun pour le moment_

### Problèmes Résolus

_Historique des problèmes résolus ici_

---

## 📝 Notes d'Implémentation

### Session 1 : 2025-01-12

**Phase 1 - Fondations (Démarrage)**

- ✅ Tâche 1.1 : Étendre `src/core/tts/types.ts`
  - Ajout de tous les nouveaux types (TTSProviderType, VoiceDescriptor, SynthesisOptions, etc.)
  - Interface TTSProvider complète définie
  - Type-check passe sans erreur

- ✅ Tâche 1.2 : Modifier `src/core/models/Settings.ts`
  - Ajout des 3 nouveaux champs à PlaySettings (ttsProvider, characterVoicesPiper, characterVoicesGoogle)
  - Valeurs par défaut définies dans createDefaultPlaySettings()
  - Type-check passe sans erreur

- ✅ Tâche 1.3 : Migration Dexie (N/A)
  - Vérifié que PlaySettings sont dans localStorage (Zustand persist)
  - Pas de migration Dexie nécessaire
  - Merge automatique des nouveaux champs

**Résultat Phase 1** : ✅ TERMINÉ (20 min)

**Notes** :
- Le store Zustand utilise `persist` avec localStorage (pas IndexedDB/Dexie)
- Les nouveaux champs seront automatiquement ajoutés grâce à `createDefaultPlaySettings()`
- Pas besoin de migration explicite pour Zustand persist (merge automatique)
- Type-check passe sans erreur (npm run type-check)

**Prochaine étape** : Phase 2 - Commencer par adapter WebSpeechProvider

### Session 2 : [Date]
_Notes de la session ici_

---

## 📊 Métriques

| Métrique | Objectif | Résultat Actuel | Statut |
|----------|----------|-----------------|--------|
| Diversité voix | 100% si ≤ nb voix/genre | - | - |
| Persistance | 100% | - | - |
| Performance synthèse | < 1s | - | - |
| Build size | < +500KB | - | - |
| Type errors | 0 | - | - |
| Lint warnings | 0 | - | - |

---

## ✅ Checklist Finale de Livraison

- [ ] Toutes les phases (1-6) complétées
- [ ] Tous les checkpoints validés
- [ ] Tests fonctionnels passent (7/7)
- [ ] Tests techniques passent (4/4)
- [ ] Documentation à jour (README, CHANGELOG)
- [ ] Pas de régression sur fonctionnalités existantes
- [ ] Performance acceptable
- [ ] Code reviewé (si équipe)
- [ ] Commit & push sur branche `piper-wasm`
- [ ] PR créée vers `main`
- [ ] PR reviewée et approuvée
- [ ] Merge dans `main`
- [ ] Tag version (ex: `v0.2.0`)

---

## 🔗 Liens Rapides

- 📘 [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Guide détaillé
- 📋 [PIPER_WASM_ACTION_PLAN.md](./PIPER_WASM_ACTION_PLAN.md) - Plan d'action
- 🎭 [VOICE_ASSIGNMENT_SPECIFICATION.md](./VOICE_ASSIGNMENT_SPECIFICATION.md) - Spec assignation
- 🎨 [PIPER_WASM_ARCHITECTURE_DIAGRAMS.md](./PIPER_WASM_ARCHITECTURE_DIAGRAMS.md) - Diagrammes

---

**Dernière mise à jour** : [Date]  
**Mis à jour par** : [Nom]