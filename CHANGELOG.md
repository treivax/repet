# Changelog

All notable changes to Répét will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.1] - 2025-01-15

### 🎉 Added

- **Voix Pierre (UPMC) activée** - Support multi-speaker via fork local de `@mintplex-labs/piper-tts-web`
  - Fork minimal exposant le paramètre `speakerId` qui était hardcodé à 0 dans la bibliothèque originale
  - Pierre (voix masculine, speaker #1 du modèle UPMC) désormais disponible
  - 4 voix françaises au total : Siwis (F), Tom (H), Jessica (F), Pierre (H)
  - Même modèle ONNX partagé entre Jessica et Pierre (16 MB)

### 🔧 Technical Changes

- **Fork local** : `src/lib/piper-tts-web-patched/` (~500 KB)
  - Modifications minimales (~10 lignes dans `dist/piper-tts-web.js`)
  - Ajout du paramètre `speakerId` au constructeur `TtsSession`
  - Utilisation dynamique du `speakerId` dans l'inférence ONNX
  - Compatibilité ascendante préservée (défaut: 0)
  
- **Intégration** : `PiperWASMProvider.ts`
  - Import du fork : `@/lib/piper-tts-web-patched`
  - Passage du `speakerId` lors de la création de sessions

- **Provider par défaut** : Basculement vers `PiperWASMProvider`
  - `TTSProviderManager` utilise désormais `PiperWASMProvider` au lieu de `PiperNativeProvider`
  - Phonemization gérée automatiquement par le fork (pas besoin de `piper_phonemize.wasm`)
  - Support multi-speaker immédiat via le paramètre `speakerId`
  - Compatible avec tous les modèles Piper (mono et multi-speaker)
  - Configuration Pierre : `{ speakerId: 1, piperVoiceId: 'fr_FR-upmc-medium' }`
  
- **Configuration Vite/TypeScript**
  - Alias de chemin `@` configuré dans `vite.config.ts`, `.offline.ts`, `.online.ts`
  - `tsconfig.json` : `paths` mappé pour résolution TypeScript
  - ESLint : Fork exclu de la vérification (`eslint.config.js`)
  - Types : `speakerId?: number` ajouté à `TtsSessionOptions`

### 📝 Documentation

- `src/lib/piper-tts-web-patched/FORK_NOTES.md` - Documentation complète du fork
- `PLAN_ACTION_FORK.md` - Plan d'action détaillé de l'implémentation
- Commentaires dans `PiperWASMProvider.ts` expliquant le fork

### 🎯 Impact

| Métrique | Avant | Après |
|----------|-------|-------|
| Voix françaises | 3 | 4 (+33%) |
| Voix masculines | 1 (Tom) | 2 (Tom, Pierre) (+100%) |
| Modèles multi-speaker | 0 | 1 (UPMC) |
| Taille du fork | - | ~500 KB |
| Breaking changes | - | 0 |

## [0.3.3] - 2025-01-15

### ✨ Added

- **Optimisation des profils vocaux masculins** - Tom réduit à 3 profils maximalement différents
  - Normal (référence neutre), Autoritaire (pitchShift -3, très grave), Jeune (pitchShift +3, très aigu)
  - Évite les redondances entre profils trop similaires (Grave/Calme/Vif supprimés)
  - Diversité vocale maximisée avec moins de choix mais plus distincts
- **Documentation mise à jour** - Profils optimisés documentés dans `docs/VOICE_PROFILES.md`

### ⚠️ Known Issues

- **Pierre (voix masculine) désactivé** - Limitation technique (RÉSOLU en v0.4.1)
  - La bibliothèque `@mintplex-labs/piper-tts-web` ne supportait pas la sélection du speaker
  - ✅ Solution implémentée : fork local avec exposition du paramètre `speakerId`
  - ✅ Pierre réactivé en v0.4.1

### ✨ Features

#### Modes de Voix Off - Implémentation Complète (2025-01-XX)

- **Trois modes de lecture en voix off** - Contrôle granulaire de ce qui est lu par le narrateur
  - **Mode "Rien"** (`nothing`) : Aucun texte en voix off, dialogues uniquement
  - **Mode "Didascalies"** (`stage-directions`) : Didascalies + annonces de structure (actes/scènes)
  - **Mode "Tout"** (`everything`) : Didascalies + structure + section Cast (présentations personnages)
  
- **Annonce automatique de la structure** ✅
  - Détection des changements d'acte/scène via `useEffect` sur `currentActIndex` et `currentSceneIndex`
  - Annonce du titre complet si disponible (ex: "ACTE PREMIER. SCÈNE 3")
  - Génération automatique sinon (ex: "Acte 2. Scène 1")
  - Lecture avec la voix narrateur à vitesse réduite (90% de la vitesse normale)
  - Actif en modes "Didascalies" et "Tout"

- **Lecture de la section Cast** ✅
  - Lecture complète de la section de présentation des personnages au début
  - Blocs de texte libre lus intégralement
  - Présentations de personnages : nom + description (ex: "MARC. Un jeune homme de 25 ans")
  - Lecture séquentielle avec la voix narrateur
  - Actif uniquement en mode "Tout"
  - Déclenchement automatique au clic sur la première ligne

- **Interface utilisateur améliorée**
  - Sélecteur dans PlayDetailScreen avec 3 options : "Rien" / "Didascalies" / "Tout"
  - Texte descriptif expliquant le comportement de chaque mode
  - Valeur par défaut : "Didascalies" (comportement standard)

- **Migration automatique des données**
  - Conversion de l'ancien booléen `voiceOffEnabled` vers `voiceOffMode`
  - `true` → `'stage-directions'`, `false` → `'nothing'`
  - Migration transparente au chargement des paramètres

- **Implémentation technique**
  - Type `VoiceOffMode` : `'nothing' | 'stage-directions' | 'everything'`
  - Fonction `getNarratorVoiceId()` : Sélection automatique de la voix narrateur (neutre ou fallback)
  - Fonction `speakCastSection()` : Lecture séquentielle de la section Cast
  - Logique inline dans `useEffect` pour annonces de structure (évite problème de dépendances)
  - Utilisation de `ttsEngine.speak()` avec `voiceURI` et `setEvents()` pour callbacks

- **Documentation complète**
  - `docs/features/voice-off-modes.md` : Spécification détaillée des modes
  - Exemples de code et cas d'usage
  - Description de l'implémentation et des tests

### 🐛 Bug Fixes

#### Corrections Audio - Superposition et Volume en Mode Italienne (2025-01-XX)

- **CORRECTIF MAJEUR** - Les répliques en mode italiennes sont maintenant complètement muettes pour le personnage choisi
  - **Problème** : En mode italiennes, les répliques du personnage choisi étaient audibles alors qu'elles devraient être muettes (volume=0)
  - **Cause racine #1** : Utilisation de `||` au lieu de `??` pour le volume → `0 || 1` retournait `1`
  - **Cause racine #2** : Volume inclus dans la clé de cache (erreur conceptuelle - le volume est une propriété de lecture, pas de synthèse)
  - **Correction** : Remplacement de tous les `||` par `??` (nullish coalescing) pour permettre explicitement `volume=0`
  - **Correction** : Suppression du volume de la clé de cache dans `AudioCacheService.generateCacheKey()`
  - **Impact** : Une seule entrée en cache par audio (au lieu de multiples avec différents volumes), économie d'espace
  - **Fichiers modifiés** :
    - `src/core/tts/providers/PiperWASMProvider.ts` : Correction volume pour audio depuis cache ET nouvellement synthétisé
    - `src/core/tts/services/AudioCacheService.ts` : Exclusion du volume de la clé de cache
    - `src/screens/PlayScreen.tsx` : Ajout de logs de débogage pour mode italiennes

- **CORRECTIF** - Correction de la superposition audio lors de clics rapides sur différentes répliques
  - **Problème** : Cliquer sur une réplique pendant qu'une autre était en lecture créait une superposition audio
  - **Cause racine** : L'ancien élément `HTMLAudioElement` n'était pas complètement arrêté avant le démarrage d'un nouveau
  - **Conséquences** : Événements non nettoyés, URLs blob non libérées (fuite mémoire)
  - **Correction** : Amélioration de `PiperWASMProvider.stop()` avec nettoyage complet :
    - Suppression de tous les événements (onplay, onended, onerror, ontimeupdate)
    - Arrêt complet de la lecture (pause + reset currentTime)
    - Libération de l'URL blob avec `URL.revokeObjectURL()`
  - **Correction** : Appel proactif de `stop()` avant de créer un nouvel audio
  - **Impact** : Pas de superposition audio, pas de fuite mémoire

- **Amélioration** - Logs de débogage ajoutés pour faciliter le diagnostic
  - `[PlayScreen] 🎭 Mode italiennes - Ligne utilisateur détectée: volume=X, rate=Y`
  - `[PiperWASM] 🔊 Audio depuis cache - volume appliqué: X, rate: Y`
  - `[PiperWASM] 🔊 Audio nouvellement synthétisé - volume appliqué: X, rate: Y`

- **Documentation** - Ajout de `AUDIO_FIXES_TEST.md` et `VOLUME_FIX_SUMMARY.md` avec tests détaillés

#### Désactivation de la voix Gilles et migration automatique (2025-01-XX)

- **Voix Gilles désactivée** - La voix `fr_FR-gilles-low` a été retirée de la liste des voix disponibles
  - Raison : Erreurs ONNX Runtime récurrentes (Gather node index out of bounds)
  - Les erreurs se produisaient sur des lignes contenant didascalies, onomatopées ou ponctuation inhabituelle
  - Le modèle produit des indices hors limites (ex: idx=141 pour range [-130,129])
- **Migration automatique des assignations**
  - Les personnages utilisant Gilles sont automatiquement réassignés à Tom (`fr_FR-tom-medium`)
  - La migration s'applique automatiquement au chargement des paramètres depuis localStorage
  - Un système de mapping gère les voix obsolètes : `fr_FR-gilles-low` → `fr_FR-tom-medium`
- **Utilitaires de diagnostic ajoutés**
  - `voiceMigration.ts` : Gestion des migrations de voix obsolètes
  - `voiceDiagnostics.ts` : Détection des voix problématiques et analyse de texte
  - Détection automatique des patterns problématiques (???, !!!, onomatopées, didascalies)
- **Voix masculines recommandées** - Tom (`fr_FR-tom-medium`) et Pierre (`fr_FR-upmc-pierre-medium`) sont les deux voix masculines fiables
- **Note historique** - La voix MLS (`fr_FR-mls-medium`) avait été retirée précédemment pour audio distordu

### ✨ Features

#### Support Format de Répliques Sans Deux-Points (2025-01-XX)

- **Nouveau format de répliques accepté** - Le parser accepte maintenant deux formats :
  - Format classique : `PERSONNAGE:` (avec deux-points)
  - Format nouveau : `PERSONNAGE` (sans deux-points, précédé d'une ligne vierge)
- **Règles pour format sans deux-points** :
  - Le nom doit être **précédé d'une ligne vierge**
  - Le nom doit commencer au **premier caractère** (pas d'indentation)
  - Le nom doit être en **MAJUSCULES**
  - Support des noms composés : `JEAN-PIERRE`, `MARIE LOUISE LEGRANCHU`
- **Compatibilité** - Les deux formats peuvent être mélangés dans le même fichier
- **Tests** - Ajout de 5 nouveaux tests pour valider le format sans deux-points
- **Documentation** - Mise à jour de PARSER.md et USER_GUIDE.md

## [0.2.0] - 2025-01-XX

### 🚀 Major Update - Conformité avec la spécification

Cette version majeure réécrit les composants clés pour respecter strictement la spécification `spec/appli.txt`.

### ✨ Features

#### Tag de Méthode de Lecture (2025-01-XX)

- **Affichage du mode de lecture actif** - Tag visible dans le header pour tous les modes
  - Mode silencieux : tag `LECTURE` (bleu)
  - Mode audio : tag `LECTURE AUDIO` (vert)
  - Mode italiennes : tag `ITALIENNES (PERSONNAGE)` (violet) avec le nom du personnage sélectionné
- **Navigation rapide** - Clic sur le tag pour changer de méthode de lecture
  - Redirection directe vers l'écran de sélection de méthode (`/reader/:id`)
  - Pas de retour à l'écran d'accueil
  - Conservation du contexte de la pièce en cours
- **Design cohérent** - Couleurs distinctes par mode avec effet hover

### 🐛 Bug Fixes

#### 🔴 CRITIQUE - Bug de Closure dans FullPlayDisplay (2025-01-XX)

- **PROBLÈME MAJEUR RÉSOLU** - Les cartes n'étaient pas cliquables en mode audio et italiennes
  - **Cause racine** : Bug de closure JavaScript - `globalLineIndex` capturé par référence au lieu de par valeur
  - **Symptôme** : Toutes les cartes appelaient `onLineClick(59)` au lieu de leur index réel (0-58)
  - **Conséquence** : `getLineCoordinates(59)` retournait `null` → lecture audio jamais démarrée
  - **Solution** : Capture de l'index dans une constante locale `currentGlobalIndex` pour chaque ligne
  - **Impact** : Restauration totale de la fonctionnalité de lecture
- **Corrections appliquées** :
  - ✅ Mode audio : Lecture audio fonctionne correctement
  - ✅ Mode italiennes : Synthèse vocale déclenchée pour les bonnes répliques
  - ✅ Chaque carte passe maintenant le bon index global
  - ✅ Enchaînement automatique des lignes fonctionne
  - ✅ Mode silencieux préservé (non affecté par le bug)

#### Navigation et Interface (2025-01-XX)

- **Suppression de handleBackgroundClick** qui bloquait initialement les clics
- **Navigation corrigée** vers `/play/:playId/detail` (PlayDetailScreen) au lieu de `/reader/:playId`
- **Tag de méthode** s'affiche correctement pour tous les modes

#### Tag de Méthode de Lecture

- **Correction route de navigation** - Utilisation de `/play/:playId/detail` pour aller vers l'écran de sélection
- **Première tentative (échec)** - Passage conditionnel de `onLineClick` n'a pas résolu le problème
  - Le vrai problème était `handleBackgroundClick` qui bloquait tous les clics

#### Parser Conforme à la Spec

- **Nouveau parser textParser.ts** - Réécriture complète du parser
  - Détection correcte du titre (premier bloc isolé)
  - Extraction `Auteur:` et `Annee:` juste après le titre
  - Détection des actes : `ACTE N` ou `ACTE N - Titre`
  - Détection des scènes : `Scene N` ou `Scène N - Titre`
  - Reconnaissance répliques : `PERSONNAGE:` ou `PERSONNAGE` (deux formats supportés)
  - Support répliques multi-lignes avec lignes vides
  - Détection didascalies : blocs hors répliques + segments `(texte)` inline
  - Génération AST hiérarchique : metadata → acts → scenes → lines
  - Tableau `flatLines` pour navigation rapide
  - Validation avec `examples/ALEGRIA.txt`

#### Nouvelle Structure de Données

- **PlayAST** - Structure AST complète
  - `PlayMetadata` : title, author, year, category
  - `Act[]` : actNumber, title, scenes
  - `Scene[]` : sceneNumber, title, lines
  - `Line[]` : type, actIndex, sceneIndex, characterId, text, isStageDirection
  - `flatLines` : tableau aplati avec métadonnées complètes
- **Play** - Modèle de stockage
  - `id`, `fileName`, `ast`, `createdAt`, `updatedAt`
  - Stockage de l'AST complet dans IndexedDB

#### Moteur TTS Conforme

- **readingModes.ts** - Logique de lecture par mode
  - `SilentMode` : pas de lecture
  - `AudioMode` : lecture avec voix off optionnelle
  - `ItalianMode` : volume 0 pour utilisateur, masquage configurable
  - Règle : **nom du personnage jamais lu**
  - Didascalies lues par voix off si activée, sinon ignorées
  - Support vitesse utilisateur distincte (italiennes)

#### Paramètres par Pièce

- **PlaySettings** - Configuration spécifique à chaque pièce
  - `readingMode` : 'silent' | 'audio' | 'italian'
  - `userCharacterId` : personnage de l'utilisateur (italiennes)
  - `hideUserLines`, `showBefore`, `showAfter` : options masquage
  - `userSpeed` : vitesse utilisateur (italiennes)
  - `defaultSpeed` : vitesse par défaut (audio)
  - `voiceOffMode` : mode voix off ('nothing' | 'stage-directions' | 'everything')
  - `characterVoices` : assignation sexe par personnage (male/female/neutral)
  - Persistance dans `playSettingsStore`

#### Assignation Voix Simplifiée

- **Mapping sexe → voix système**
  - Utilisateur choisit le sexe du personnage (homme/femme/neutre)
  - `voiceManager.selectVoiceForGender()` choisit automatiquement la voix
  - Heuristiques basées sur les noms de voix système
  - Fallback automatique si pas de voix du sexe demandé

### 🔧 Technical Changes

#### Helpers de Compatibilité

- **playHelpers.ts** - Fonctions d'accès aux propriétés Play
  - `getPlayTitle(play)` : accède à `play.ast.metadata.title`
  - `getPlayAuthor(play)` : accède à `play.ast.metadata.author`
  - `getPlayYear(play)` : accède à `play.ast.metadata.year`
  - `getPlayCategory(play)` : accède à `play.ast.metadata.category`
  - `getPlayCharacters(play)` : accède à `play.ast.characters`
  - `getPlayLines(play)` : accède à `play.ast.flatLines`
  - `getPlayActs(play)` : accède à `play.ast.acts`
  - Migration progressive du code existant

#### Refactoring Store

- **playSettingsStore** - Nouveau store pour paramètres pièces
  - Stockage par `playId` dans localStorage
  - Actions : `setReadingMode`, `setUserCharacter`, `setCharacterGender`
  - Toggles : `toggleHideUserLines`, `toggleShowBefore`, `toggleShowAfter`
  - Vitesses : `setUserSpeed`, `setDefaultSpeed`
  - Gestion complète du cycle de vie (create, update, delete, reset)

#### Migration Code Base

- Migration automatique via script sed
  - Remplacement `play.title` → `getPlayTitle(play)`
  - Remplacement `play.lines` → `getPlayLines(play)`
  - Remplacement `play.characters` → `getPlayCharacters(play)`
  - Ajout imports `playHelpers` dans tous les fichiers concernés
  - Fichiers migrés : PlayCard, SceneNavigator, PlayScreen, ReaderScreen, playStore, selectors

#### Tests Unitaires

- **parser.test.ts** - 24 tests pour le parser
  - Extraction titre, auteur, année
  - Détection actes et scènes
  - Reconnaissance répliques (simples, multi-lignes, avec lignes vides)
  - Noms avec espaces et tirets
  - Didascalies (blocs et inline)
  - Construction flatLines
  - Parsing échantillon ALEGRIA
  - Infrastructure Vitest configurée

### 🐛 Bug Fixes

- Correction de l'import parser dans `HomeScreen.tsx` (utilise `textParser`)
- Conversion AST → Play lors de l'import de fichier
  - Génération UUID, dates createdAt/updatedAt
  - Stockage correct dans IndexedDB
- Fix types TypeScript dans parser legacy (assertions de type)
- Fix conflits exports `Line` (suppression duplicate dans Play.ts)
- Fix warnings TypeScript (paramètres inutilisés avec underscore)

### 📚 Documentation

- **plans/plan-mise-en-conformite-spec.md** - Plan détaillé en 8 phases
  - Phase 1 : Parser (✅ TERMINÉE)
  - Phase 2 : Storage (✅ TERMINÉE)
  - Phase 3 : TTS (✅ TERMINÉE)
  - Phase 4 : Réglages (✅ TERMINÉE)
  - Phase 5-8 : UI (en attente)
- Critères de succès et validation pour chaque phase
- Checklist tests manuels et automatiques

### ⚠️ Breaking Changes

- **Structure Play modifiée** : `Play` contient maintenant `ast: PlayAST`
  - Code legacy doit utiliser les helpers `getPlay*()` pour compatibilité
  - Migration automatique effectuée pour la base de code existante
- **Parser API changée** : `parsePlayText()` retourne `PlayAST` (pas `Play`)
  - Conversion manuelle en `Play` nécessaire avec dates et UUID
- **Settings globaux vs Play-specific** : Settings sont maintenant par pièce
  - `playSettingsStore` pour paramètres spécifiques
  - `settingsStore` reste pour paramètres globaux (thème, etc.)

### ✨ Features (Suite)

#### Interface de Configuration (Phase 5 - ✅ TERMINÉE)

- **PlayConfigScreen** - Écran de configuration par pièce
  - Route `/play/:playId/config` ajoutée au router
  - Section informations pièce (titre, auteur, année, stats)
  - Sélection méthode de lecture (3 modes)
  - Assignation voix par personnage (sexe)
  - Réglages audio (voix off, vitesses)
  - Réglages italiennes (masquage, affichage)
  - Zone de danger (suppression pièce)
  - Bouton "Commencer la lecture" sticky

- **Composants de Configuration**
  - `ReadingModeSelector` - 3 boutons (Silencieux, Audio, Italiennes)
    - Cartes cliquables avec descriptions
    - Indicateur visuel de sélection
    - Support thème clair/sombre
  - `VoiceAssignment` - Assignation sexe aux personnages
    - Liste personnages avec sélecteurs ♂/♀/◯
    - Boutons toggle avec highlight sélection
    - Message si aucun personnage
  - `AudioSettings` - Réglages audio
    - Toggle voix off (switch animé)
    - Slider vitesse de lecture (0.5x - 2.0x)
    - Slider vitesse utilisateur (mode italiennes)
    - Affichage conditionnel selon mode
  - `ItalianSettings` - Configuration mode italiennes
    - Dropdown sélection personnage utilisateur
    - Toggle masquage répliques
    - Options affichage avant/après lecture
    - Message info si pas de personnage

- **Intégration PlayCard**
  - Bouton configuration (icône engrenage)
  - Navigation vers `/play/:playId/config`
  - Event propagation correcte
  - Support thème clair/sombre

#### Composants de Lecture (Phase 6 - ✅ TERMINÉE)

- **SceneSummary** - Sommaire actes/scènes navigable
  - Panel latéral avec overlay
  - Liste hiérarchique actes → scènes
  - Highlight acte/scène actuelle
  - Navigation par clic
  - Compteur de lignes par scène
  - Fermeture automatique après sélection

- **LineRenderer** - Rendu ligne selon mode
  - Support `dialogue` et `stage-direction`
  - Récupération nom personnage via charactersMap
  - Masquage répliques utilisateur (italiennes)
  - Coloration selon contexte (playing, révélée, utilisateur)
  - Indicateur visuel ligne en cours
  - Message "[Réplique masquée]" si hideUserLines
  - Badge "✓ Révélée" si showAfter

- **SceneNavigation** - Navigation entre scènes
  - Boutons Précédent/Suivant avec icônes
  - Indicateur position (Acte X/Y, Scène A/B)
  - Désactivation si limites atteintes
  - Responsive (texte masqué sur mobile)
  - Support thème clair/sombre

- **PlaybackControls** - Contrôles TTS
  - Boutons Play/Pause/Stop
  - Boutons Précédent/Suivant
  - Mode silencieux simplifié (navigation uniquement)
  - Icônes SVG pour tous les contrôles
  - États disabled gérés
  - Bouton Play principal mis en évidence

- **TextDisplay** - Affichage texte scène
  - Scroll automatique vers ligne courante
  - Opacité différenciée (courante/lue/non-lue)
  - Ref management pour auto-scroll
  - Container scrollable avec max-width
  - Intégration LineRenderer pour chaque ligne
  - Passage charactersMap aux enfants

### ✅ Phase 6 Complétée - Refonte ReaderScreen

- **ReaderScreen refactorisé** - Utilisation des nouveaux composants
  - Intégration `TextDisplay` pour affichage scène
  - Intégration `SceneNavigation` pour navigation actes/scènes
  - Intégration `PlaybackControls` pour contrôles TTS
  - Intégration `SceneSummary` en modal overlay
  - Utilisation `playSettingsStore` pour settings par pièce
  - Navigation par scène (fini ligne par ligne)
  - Support complet mode italiennes avec masquage
  - Assignation voix par sexe via `voiceManager`
  - Sélection personnage depuis settings
  - Gestion état lecture (playing, readLinesSet)

### ✅ Phase 8 Complétée - Documentation

- **Documentation technique complète** (~1600+ lignes)
  - `docs/PARSER.md` (397 lignes) - Format fichier théâtral détaillé avec exemples
  - `docs/ARCHITECTURE.md` (780 lignes) - AST, flux, stores, composants
  - `docs/USER_GUIDE.md` - Guide utilisateur avec mode italiennes détaillé (existant)
  - `README.md` - Mise à jour liens documentation

### 🔜 Phase 7 - Tests et Validation

Phase restante à compléter :

- **Tests automatisés**
  - Optimiser configuration Vitest (résoudre timeout)
  - Ajouter tests composants settings/reader
  - Tests E2E workflow complet

- **Tests manuels**
  - Import ALEGRIA.txt → vérifier AST
  - Tester 3 modes lecture (silent/audio/italian)
  - Configuration par pièce (persistance)
  - Navigation scènes
  - Cross-browser (Chrome, Firefox, Safari, Edge)
  - Mobile (iOS Safari, Android Chrome)

### 🏗️ Architecture Updates

```
src/core/
├── models/
│   ├── Play.ts (nouvelles interfaces PlayAST, Act, Scene)
│   ├── playHelpers.ts (helpers d'accès)
│   └── Settings.ts (+ PlaySettings)
├── parser/
│   ├── textParser.ts (NOUVEAU - conforme spec)
│   └── parser.ts (legacy - @deprecated)
└── tts/
    └── readingModes.ts (NOUVEAU - logique modes)
src/state/
└── playSettingsStore.ts (NOUVEAU - settings par pièce)
src/screens/
└── PlayConfigScreen.tsx (NOUVEAU - configuration pièce)
src/components/
├── settings/
│   ├── ReadingModeSelector.tsx (NOUVEAU)
│   ├── VoiceAssignment.tsx (NOUVEAU)
│   ├── AudioSettings.tsx (NOUVEAU)
│   └── ItalianSettings.tsx (NOUVEAU)
└── reader/
    ├── SceneSummary.tsx (NOUVEAU)
    ├── LineRenderer.tsx (NOUVEAU)
    ├── SceneNavigation.tsx (NOUVEAU)
    ├── PlaybackControls.tsx (NOUVEAU)
    ├── TextDisplay.tsx (NOUVEAU)
    └── index.ts (mis à jour)
```

### 📊 Statistics

- **Fichiers modifiés** : 25+
- **Fichiers créés** : 14 nouveaux fichiers
  - Phase 1-4 : 5 fichiers (parser, stores, helpers)
  - Phase 5 : 5 fichiers (PlayConfigScreen + 4 composants settings)
  - Phase 6 : 5 fichiers (composants reader)
- **Lignes de code** : +3500
  - Parser, models, stores : ~2000 lignes
  - UI Configuration : ~700 lignes
  - UI Reader : ~800 lignes
- **Tests** : 24 tests unitaires ajoutés
- **Erreurs TypeScript corrigées** : 46 → 0
- **Build** : ✅ Succès (tsc + vite)

### 🎯 Validation

- ✅ Type-check : 0 erreur
- ✅ Build production : réussi
- ✅ Taille bundle : ~383KB (gzipped: ~120KB)
- ✅ PWA : fonctionnel (manifest + SW)
- ✅ Compatibilité helpers : code legacy fonctionne
- ✅ Composants UI : compilent sans erreur
- ✅ Router : route `/play/:playId/config` ajoutée
- ✅ Thème clair/sombre : tous les nouveaux composants

---

## [0.1.0] - 2025-01-XX

### 🎉 Initial Release

First functional version of Répét - Theatre Rehearsal PWA application.

### ✨ Features

#### Core Functionality

- **Play Parser** - Parse theatre plays from plain text files
  - Support for French theatre format (Actes, Scènes, Personnages)
  - Metadata extraction (title, author, genre, year)
  - Character detection and role assignment
  - Stage direction recognition
  - Hierarchical AST generation
  - Flattened line sequence for navigation

- **Text-to-Speech (TTS)** - Natural voice synthesis
  - Web Speech API integration
  - Multi-voice support (system voices)
  - Configurable speed (0.5x - 2.0x)
  - Configurable volume (0% - 100%)
  - Voice queue management
  - Character-specific voice assignment (planned)
  - Stage direction voice (distinct from character voices)

- **Italian Mode (Répétition à l'italienne)** - Memory practice
  - Hide user's own lines for memorization
  - Visual masking with blur effect
  - Reveal button for checking lines
  - Purple highlight for masked lines
  - Mode indicator in header
  - Toggle setting to enable/disable line hiding

- **Storage** - Local data persistence
  - IndexedDB integration via Dexie.js
  - Play library management (CRUD operations)
  - Settings persistence
  - Reading progress tracking
  - Offline-first architecture

#### User Interface

- **Home Screen** - Import and quick access
  - Drag & drop file upload
  - File validation
  - Recent plays display
  - Quick import workflow

- **Library Screen** - Play management
  - Grid view with metadata cards
  - Real-time search/filter
  - Sort by date/title/author
  - Delete with confirmation modal
  - Empty state handling

- **Play Screen** - Main reading interface
  - Character selection modal
  - Scene navigation dropdown
  - Current line highlight
  - Context display (previous/next lines)
  - Play/Stop TTS controls
  - Progress indicator
  - Navigation controls (Previous/Next)
  - Italian mode support with line masking
  - Reveal button for masked lines

- **Reader Screen** - Focused rehearsal mode
  - Filter by character
  - Show/hide all lines toggle
  - User line highlighting
  - Scene-based line list
  - Quick line navigation
  - TTS per line
  - Italian mode support with line masking
  - Reveal button for masked lines

- **Settings Screen** - Configuration
  - Voice selection (from system)
  - Speed slider
  - Volume slider
  - Auto-play toggle
  - Highlight user lines toggle
  - Reading mode selection (Silent / Audio / Italian)
  - Italian mode line hiding toggle
  - Reset to defaults

#### Components

**Common Components**
- `Button` - Multiple variants (primary, secondary, danger, ghost)
- `Input` - Text input with icons and validation
- `Modal` - Accessible modal with focus trap
- `Spinner` - Loading indicator (sm, md, lg)
- `Toast` - Auto-dismissing notifications
- `Layout` - Page wrapper with header/footer

**Play Components**
- `PlayCard` - Play metadata display card
- `CharacterBadge` - Character tag with color
- `CharacterSelector` - Character selection UI

**Reader Components**
- `LineCue` - Line display with character info
- `NavigationControls` - Play/Pause/Next/Previous
- `SceneNavigator` - Act/Scene dropdown

#### State Management

- **Play Store** (Zustand)
  - Current play state
  - User character selection
  - Line navigation (index-based)
  - Scene navigation
  - Reading progress persistence

- **Settings Store** (Zustand)
  - TTS configuration
  - Voice preferences
  - Reading mode
  - UI preferences
  - Persistence to localStorage

- **UI Store** (Zustand)
  - Loading states
  - Error messages with auto-dismiss
  - Modal states
  - Toast notifications

#### Utilities

- **Colors** - Character color generation (deterministic hashing)
- **Validation** - File, text, and parameter validation
- **Formatting** - Date, duration, text formatting
- **Constants** - App-wide constants and defaults

#### PWA Features

- **Offline Support** - Service Worker with Workbox
- **Installable** - Add to home screen (iOS/Android/Desktop)
- **App Manifest** - Name, icons, theme color
- **Caching Strategy** - Precache app shell, runtime cache for assets
- **Responsive** - Mobile-first design (320px - 1920px+)

#### Developer Experience

- **TypeScript** - Strict mode, full type coverage
- **ESLint** - Code quality enforcement
- **Prettier** - Code formatting
- **Vite** - Fast build tool with HMR
- **React Router** - Client-side navigation
- **Tailwind CSS** - Utility-first styling

### 🏗️ Architecture

- **Parser Layer** - AST generation from plain text
- **Storage Layer** - IndexedDB abstraction (Dexie)
- **TTS Layer** - Web Speech API wrapper
- **State Layer** - Zustand stores with persistence
- **UI Layer** - React components with TypeScript
- **Routing Layer** - React Router v6

### 📁 Project Structure

```
repet/
├── public/
│   ├── icons/              # PWA icons
│   └── test-play.txt       # Sample file
├── src/
│   ├── core/
│   │   ├── models/         # TypeScript interfaces
│   │   ├── parser/         # Play text parser
│   │   ├── storage/        # IndexedDB layer
│   │   └── tts/            # Text-to-Speech
│   ├── state/              # Zustand stores
│   ├── screens/            # Page components
│   ├── components/         # Reusable components
│   ├── utils/              # Helper functions
│   └── router.tsx          # Route configuration
├── docs/                   # Documentation
│   ├── TESTING.md         # Manual testing guide
│   └── DEPLOYMENT.md      # Deployment guide
└── plans/                  # Development plans
```

### 🎯 Routes

- `/` - Home (import)
- `/library` - Play library
- `/settings` - Settings
- `/play/:playId` - Play reading screen
- `/reader/:playId` - Focused reader mode

### 🧪 Testing

- Manual testing checklist (444 test items)
- Type checking with TypeScript
- Linting with ESLint
- Browser compatibility testing

### 📦 Dependencies

**Production**
- `react` ^18.3.1
- `react-dom` ^18.3.1
- `react-router-dom` ^7.1.3
- `zustand` ^5.0.2
- `dexie` ^4.0.10

**Development**
- `typescript` ^5.6.2
- `vite` ^6.4.1
- `@vitejs/plugin-react` ^4.3.4
- `vite-plugin-pwa` ^0.21.2
- `tailwindcss` ^4.0.0
- `eslint` ^9.18.0
- `prettier` ^3.4.2

### 🌐 Browser Support

- Chrome 90+ (Desktop/Android)
- Safari 15+ (Desktop/iOS)
- Firefox 88+ (Desktop)
- Edge 90+ (Desktop)

### 📝 Known Limitations

- TTS voices depend on system availability
- iOS requires user interaction before first TTS playback
- Large files (>5MB) may impact performance
- No cloud sync (local-only storage)
- No collaborative features

### 🔜 Planned Features

See `plans/` directory for detailed roadmaps:
- Voice-to-character association
- Italian mode (hide user lines)
- Keyboard shortcuts
- Export annotations
- Statistics and analytics
- Multi-user rehearsal mode

### 📄 License

MIT License - See LICENSE file for details

### 👥 Contributors

- Initial implementation by Répét Contributors

---

**Full Changelog**: Initial release v0.1.0