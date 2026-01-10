# Plan d'Action : Mise en Conformité avec la Spécification

**Date** : 2025-01-XX  
**Objectif** : Rendre l'application Répét conforme à la spécification `spec/appli.txt` et valider avec `examples/ALEGRIA.txt`

---

## 🎯 Objectif Global

Corriger l'implémentation actuelle pour qu'elle respecte strictement la spécification fonctionnelle définie dans `spec/appli.txt`, notamment :
- Format de fichier et parsing
- Modes de lecture (silencieux, audio, italiennes)
- Navigation par actes/scènes
- Réglages et options
- Assignation des voix

---

## 📊 État des Lieux

### ✅ Ce qui fonctionne
- Base technique solide (React 18 + TypeScript + Vite)
- Storage IndexedDB (Dexie) opérationnel
- Moteur TTS de base fonctionnel
- PWA configurée
- Documentation structurée
- Validations CI (tsc, eslint, build) passantes

### ❌ Non-conformités identifiées

1. **Parser** : Ne respecte pas le format spécifié
   - Titre non détecté correctement
   - Actes/Scènes non parsés selon la spec
   - Répliques `NOM:` non reconnues
   - Didascalies mal gérées

2. **Modes de lecture** : Logique incorrecte
   - Italiennes : masquage utilisateur incorrect (flou au lieu de gris)
   - Audio : noms de personnages lus (ne devrait pas)
   - Didascalies : logique voix off non conforme

3. **Navigation** : Inadaptée
   - Navigation ligne par ligne au lieu de scène par scène
   - Pas de sommaire actes/scènes cliquable

4. **Réglages manquants**
   - Voix off on/off manquante
   - Vitesse utilisateur distincte (italiennes) absente
   - Options "afficher avant/après" non implémentées
   - Assignation voix trop complexe (devrait être juste sexe)

---

## 📋 Plan d'Exécution Détaillé

### PHASE 1 : Réécriture du Parser (PRIORITÉ ABSOLUE)

**Objectif** : Parser conforme à `spec/appli.txt` validé par `examples/ALEGRIA.txt`

#### Étape 1.1 : Créer tests unitaires du parser
- [ ] Créer `src/core/parser/__tests__/parser.test.ts`
- [ ] Test 1 : Extraction du titre (premier bloc isolé)
- [ ] Test 2 : Extraction auteur/année (optionnels)
- [ ] Test 3 : Détection ACTE/Scène
- [ ] Test 4 : Reconnaissance répliques `PERSONNAGE:`
- [ ] Test 5 : Didascalies (blocs et parenthèses)
- [ ] Test 6 : Parsing complet de `ALEGRIA.txt`

#### Étape 1.2 : Redéfinir les types AST
**Fichier** : `src/core/models/Play.ts`

```typescript
interface PlayMetadata {
  title: string;
  author?: string;
  year?: string;
  category?: string;
}

interface Act {
  actNumber: number;
  title?: string;
  scenes: Scene[];
}

interface Scene {
  sceneNumber: number;
  title?: string;
  lines: Line[];
}

interface Line {
  id: string;
  type: 'dialogue' | 'stage-direction';
  actIndex: number;
  sceneIndex: number;
  characterId?: string;  // null pour didascalies
  text: string;
  isStageDirection: boolean;
}

interface PlayAST {
  metadata: PlayMetadata;
  characters: Character[];
  acts: Act[];
  flatLines: Line[];  // Pour navigation rapide
}
```

#### Étape 1.3 : Réécrire le parser
**Fichier** : `src/core/parser/textParser.ts`

Algorithme :
1. **Détecter titre** : Premier bloc de texte non vide isolé par lignes vides
2. **Détecter auteur/année** : Chercher `Auteur:` et `Annee:` juste après titre
3. **Détecter actes** : Ligne commençant par `ACTE` (majuscules)
   - Format : `ACTE` ou `ACTE N` ou `ACTE N - Titre`
4. **Détecter scènes** : Ligne commençant par `Scene` ou `Scène`
   - Format : `Scene N` ou `Scène N - Titre`
5. **Détecter répliques** :
   - Ligne `PERSONNAGE:` (MAJUSCULES + deux-points + saut de ligne)
   - Texte de la réplique suit jusqu'à prochaine réplique/didascalie/scène
   - Peut contenir lignes vides
6. **Détecter didascalies** :
   - Blocs de texte hors répliques
   - Segments `(texte)` dans les répliques (didascalies inline)
7. **Extraire personnages** : Liste unique des `PERSONNAGE:` rencontrés
8. **Construire AST** : Structure hiérarchique + tableau `flatLines`

#### Étape 1.4 : Valider le parser
- [ ] Exécuter tests unitaires → 100% passants
- [ ] Parser `examples/ALEGRIA.txt` manuellement
- [ ] Vérifier structure AST générée
- [ ] Afficher dans console pour inspection visuelle

---

### PHASE 2 : Adapter le Storage et Repository

**Objectif** : Stocker le nouvel AST dans IndexedDB

#### Étape 2.1 : Mettre à jour le schéma Dexie
**Fichier** : `src/core/storage/database.ts`

- [ ] Migrer vers version 2 du schéma
- [ ] Adapter l'interface `Play` stockée
- [ ] Créer migration v1→v2 pour pièces existantes

#### Étape 2.2 : Adapter le repository
**Fichier** : `src/core/storage/playRepository.ts`

- [ ] Méthode `savePlay(ast: PlayAST)` → convertir et sauver
- [ ] Méthode `getPlay(id)` → retourner AST complet
- [ ] Méthode `deletePlay(id)` inchangée
- [ ] Méthode `listPlays()` → retourner métadonnées

---

### PHASE 3 : Refonte du Moteur TTS

**Objectif** : Lecture conforme aux 3 modes (silencieux, audio, italiennes)

#### Étape 3.1 : Redéfinir les règles de lecture
**Fichier** : `src/core/tts/ttsEngine.ts`

**Règles universelles** :
- ❌ **Jamais lire** le nom du personnage
- ✅ **Toujours lire** le texte de la réplique avec la voix du personnage
- 🎭 **Didascalies** : lues par voix off SI activée, sinon ignorées

**Mode Audio** :
- Clic sur réplique → lit la réplique → enchaîne automatiquement les suivantes
- Clic pendant lecture → pause/reprise (toggle)
- Clic sur autre réplique → interrompt et lance nouvelle réplique

**Mode Italiennes** :
- Utilisateur sélectionne son personnage
- Répliques utilisateur : volume = 0 (muettes)
- Si option "cacher mes répliques" :
  - Afficher en gris clair sur fond gris selon `afficher avant`/`après`
- Vitesse utilisateur distincte (réglage séparé)

#### Étape 3.2 : Implémenter voiceManager amélioré
**Fichier** : `src/core/tts/voiceManager.ts`

- [ ] Fonction `getVoiceForGender(gender: 'male'|'female'|'neutral'): SpeechSynthesisVoice`
- [ ] Mapping automatique sexe → voix système disponible
- [ ] Fallback si pas de voix du sexe demandé
- [ ] Cache des voix pour performance

#### Étape 3.3 : Implémenter le lecteur par mode
**Nouveau fichier** : `src/core/tts/readingModes.ts`

```typescript
interface ReadingMode {
  name: 'silent' | 'audio' | 'italian';
  shouldRead(line: Line, userCharacterId?: string): boolean;
  getVolume(line: Line, userCharacterId?: string): number;
  shouldHighlight(line: Line, userCharacterId?: string): boolean;
}
```

---

### PHASE 4 : Refonte des Réglages

**Objectif** : Settings conformes à la spec

#### Étape 4.1 : Redéfinir PlaySettings
**Fichier** : `src/core/models/Settings.ts`

```typescript
interface PlaySettings {
  playId: string;
  
  // Mode de lecture
  readingMode: 'silent' | 'audio' | 'italian';
  
  // Mode italiennes
  userCharacterId?: string;  // Personnage de l'utilisateur
  hideUserLines: boolean;    // Cacher répliques utilisateur
  showBefore: boolean;       // Afficher avant
  showAfter: boolean;        // Afficher après
  userSpeed: number;         // Vitesse utilisateur (0.5 - 2.0)
  
  // Audio général
  voiceOffEnabled: boolean;  // Lire didascalies avec voix off
  defaultSpeed: number;      // Vitesse par défaut (0.5 - 2.0)
  
  // Assignation voix
  characterVoices: Record<string, 'male' | 'female' | 'neutral'>;
  
  // UI
  theme: 'light' | 'dark' | 'system';
}
```

#### Étape 4.2 : Mettre à jour settingsStore
**Fichier** : `src/state/settingsStore.ts`

- [ ] Adapter le store Zustand avec nouveau `PlaySettings`
- [ ] Actions : `setReadingMode`, `setUserCharacter`, `setVoiceGender`, etc.
- [ ] Persistance dans IndexedDB

---

### PHASE 5 : Refonte de l'Interface de Configuration

**Objectif** : Écran configuration conforme à la spec

#### Étape 5.1 : Écran de configuration de pièce
**Fichier à modifier** : `src/screens/PlayScreen.tsx` (ou créer nouveau)

**Layout attendu** :
```
┌─────────────────────────────────────┐
│ [Retour] Titre de la pièce          │
├─────────────────────────────────────┤
│ Informations                         │
│ Auteur: [____] Année: [____]        │
│ Catégorie: [____]                   │
├─────────────────────────────────────┤
│ Méthode de lecture                  │
│ ○ Silencieux  ○ Audio  ○ Italiennes│
├─────────────────────────────────────┤
│ Voix (1 ligne par personnage)       │
│ HAMLET:     ○ Homme ○ Femme         │
│ OPHÉLIE:    ○ Homme ○ Femme         │
├─────────────────────────────────────┤
│ Réglages Audio                      │
│ ☑ Voix off pour didascalies        │
│ Vitesse: [========|===] 1.0x        │
├─────────────────────────────────────┤
│ Réglages Italiennes (si mode actif) │
│ Mon personnage: [Dropdown]          │
│ ☑ Cacher mes répliques             │
│ ☑ Afficher avant                   │
│ ☑ Afficher après                   │
│ Ma vitesse: [========|===] 0.8x     │
├─────────────────────────────────────┤
│ [Lire la pièce]   [Supprimer]      │
└─────────────────────────────────────┘
```

#### Étape 5.2 : Créer composants dédiés

**Fichiers à créer** :
- `src/components/settings/ReadingModeSelector.tsx` → 3 boutons radio
- `src/components/settings/VoiceAssignment.tsx` → Liste personnages + sexe
- `src/components/settings/AudioSettings.tsx` → Toggle voix off + slider vitesse
- `src/components/settings/ItalianSettings.tsx` → Dropdown personnage + options

---

### PHASE 6 : Refonte de l'Écran de Lecture

**Objectif** : Interface de lecture unique, adaptée au mode

#### Étape 6.1 : Structure de l'écran
**Fichier** : `src/screens/ReaderScreen.tsx`

**Layout** :
```
┌─────────────────────────────────────┐
│ [←] TITRE - Auteur           [⚙]   │
├─────────────────────────────────────┤
│ ┌─ Sommaire (coulissant) ────────┐ │
│ │ ACTE I                          │ │
│ │   Scène 1 - Le palais      ←──┼─┼─ Cliquable, jump au début scène
│ │   Scène 2 - Le jardin          │ │
│ │ ACTE II                         │ │
│ │   Scène 1 - La nuit            │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─ Zone de texte (scrollable) ───┐ │
│ │ ACTE I - LE PALAIS              │ │
│ │ Scène 1 - L'aube                │ │
│ │                                 │ │
│ │ (Didascalie: Le roi entre)     │ │ ← Gris, italique
│ │                                 │ │
│ │ HAMLET                          │ │ ← Nom en gras
│ │ Être ou ne pas être...          │ │ ← Texte normal, cliquable
│ │                                 │ │
│ │ OPHÉLIE                         │ │
│ │ Mon seigneur...                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                      │
│ [◀ Scène préc] [▶ Scène suiv]      │ ← Navigation discrète
└─────────────────────────────────────┘
```

#### Étape 6.2 : Comportements selon mode

**Mode Silencieux** :
- Affichage texte complet
- Scroll libre
- Pas de TTS
- Navigation scènes

**Mode Audio** :
- Affichage texte complet
- Réplique cliquable → lit + enchaîne
- Réplique en cours = highlight
- Clic pendant lecture = pause/reprise
- Navigation scènes

**Mode Italiennes** :
- Répliques utilisateur :
  - Si "cacher" activé → gris clair/fond gris
  - Visibilité selon "avant/après"
  - Volume 0 (muettes)
- Autres répliques normales
- Auto-play comme audio
- Navigation scènes

#### Étape 6.3 : Composants à créer/modifier

**Fichiers** :
- `src/components/reader/SceneSummary.tsx` → Sommaire cliquable
- `src/components/reader/TextDisplay.tsx` → Affichage du texte
- `src/components/reader/LineRenderer.tsx` → Rendu d'une ligne selon mode
- `src/components/reader/SceneNavigation.tsx` → Boutons scène préc/suiv
- `src/components/reader/PlaybackControls.tsx` → Contrôles TTS (play/pause/stop)

---

### PHASE 7 : Tests et Validation

**Objectif** : Garantir la conformité complète

#### Étape 7.1 : Tests Parser
- [ ] Tous les tests unitaires passent
- [ ] `ALEGRIA.txt` parsé sans erreur
- [ ] Structure AST vérifiée manuellement
- [ ] Tous les personnages extraits
- [ ] Actes/Scènes correctement hiérarchisés

#### Étape 7.2 : Tests Fonctionnels Manuels

**Import et configuration** :
- [ ] Import `ALEGRIA.txt` → succès
- [ ] Titre/auteur/année affichés correctement
- [ ] Liste personnages complète
- [ ] Assignation voix (homme/femme) fonctionne
- [ ] Changement mode lecture → UI s'adapte
- [ ] Sauvegarde settings → persisté après reload

**Mode Silencieux** :
- [ ] Texte complet affiché
- [ ] Navigation scènes fonctionne
- [ ] Sommaire cliquable → jump correct
- [ ] Pas de TTS déclenché

**Mode Audio** :
- [ ] Clic réplique → lecture démarre
- [ ] Noms personnages PAS lus
- [ ] Voix correcte selon sexe assigné
- [ ] Enchaînement automatique des répliques
- [ ] Clic pendant lecture → pause/reprise
- [ ] Didascalies lues/ignorées selon voix off
- [ ] Vitesse respectée

**Mode Italiennes** :
- [ ] Sélection personnage utilisateur fonctionne
- [ ] Répliques utilisateur :
  - [ ] Volume = 0 (muettes)
  - [ ] Si "cacher" → gris clair/fond gris
  - [ ] "Afficher avant" fonctionne
  - [ ] "Afficher après" fonctionne
- [ ] Vitesse utilisateur distincte appliquée
- [ ] Autres répliques normales
- [ ] Auto-play fonctionne

**Navigation** :
- [ ] Sommaire affiche tous actes/scènes
- [ ] Clic scène → jump au bon endroit
- [ ] Boutons scène préc/suiv fonctionnent
- [ ] Scroll libre du texte
- [ ] Pas de navigation ligne-par-ligne forcée

**Réglages** :
- [ ] Voix off toggle fonctionne
- [ ] Sliders vitesse fonctionnent
- [ ] Thème clair/sombre fonctionne
- [ ] Suppression pièce fonctionne
- [ ] Persistance après reload

#### Étape 7.3 : Tests Technique
- [ ] `npm run type-check` → 0 erreur
- [ ] `npm run lint` → 0 erreur
- [ ] `npm run build` → succès
- [ ] Console navigateur → 0 erreur, 0 warning
- [ ] PWA installable
- [ ] Fonctionne hors ligne

#### Étape 7.4 : Tests Cross-Browser
- [ ] Chrome/Edge (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (macOS/iOS)
- [ ] Chrome (Android)

---

### PHASE 8 : Documentation

**Objectif** : Documenter les changements

#### Étape 8.1 : Mettre à jour documentation technique
**Fichiers à modifier** :
- [ ] `docs/PARSER.md` → Format de fichier détaillé
- [ ] `docs/ARCHITECTURE.md` → Nouveau AST et flux
- [ ] `README.md` → Fonctionnalités conformes
- [ ] `CHANGELOG.md` → Version 2.0.0 - Conformité spec

#### Étape 8.2 : Mettre à jour guide utilisateur
**Fichier** : `docs/USER_GUIDE.md`
- [ ] Section "Format de fichier" avec exemples
- [ ] Section "Mode Italiennes" détaillée
- [ ] Section "Assignation des voix"
- [ ] Captures d'écran (si possible)

#### Étape 8.3 : Exemples
- [ ] Vérifier `examples/ALEGRIA.txt` documenté
- [ ] Ajouter exemple minimal dans docs
- [ ] Template de fichier vide

---

## 📅 Timeline Suggérée

| Phase | Durée estimée | Priorité |
|-------|---------------|----------|
| Phase 1 - Parser | 2-3h | CRITIQUE |
| Phase 2 - Storage | 1h | HAUTE |
| Phase 3 - TTS | 2h | HAUTE |
| Phase 4 - Réglages | 1h | MOYENNE |
| Phase 5 - UI Config | 2h | MOYENNE |
| Phase 6 - UI Lecture | 2-3h | HAUTE |
| Phase 7 - Tests | 2h | CRITIQUE |
| Phase 8 - Docs | 1h | BASSE |

**Total estimé** : 13-16 heures

---

## 🎯 Critères de Succès

### Critères Fonctionnels
- [ ] `examples/ALEGRIA.txt` se parse correctement
- [ ] Les 3 modes de lecture fonctionnent selon la spec
- [ ] Navigation par scènes opérationnelle
- [ ] Tous les réglages spec implémentés
- [ ] Assignation voix simplifiée (sexe uniquement)

### Critères Techniques
- [ ] 0 erreur TypeScript
- [ ] 0 erreur ESLint
- [ ] Build production réussit
- [ ] 0 erreur console navigateur
- [ ] PWA installable et fonctionne offline

### Critères UX
- [ ] Interface intuitive et épurée
- [ ] Responsive (mobile/tablet/desktop)
- [ ] Thème clair/sombre fonctionnel
- [ ] Pas de régression sur fonctionnalités existantes

---

## 🚀 Démarrage de l'Implémentation

### Commande d'Exécution

Une fois ce plan validé, l'implémentation suivra l'ordre strict :

1. **Phase 1** d'abord (parser + tests) → validation obligatoire avant suite
2. **Phase 2** (storage) → validation
3. **Phase 3** (TTS) → validation
4. **Phases 4-6** (UI) → validation manuelle continue
5. **Phase 7** (tests complets) → checklist complète
6. **Phase 8** (docs) → finalisation

### Points de Validation

Après chaque phase :
- ✅ Commit Git avec message descriptif
- ✅ `npm run type-check` → OK
- ✅ `npm run lint` → OK
- ✅ Tests manuels de la phase → OK
- ✅ Validation utilisateur avant phase suivante

---

## 📝 Notes Importantes

### Respect des Standards `common.md`
- ✅ Copyright header sur tous nouveaux fichiers
- ✅ Pas de `any`, types stricts
- ✅ Pas de hardcoding, constantes nommées
- ✅ Tests manuels systématiques
- ✅ Code simple et maintenable (KISS)
- ✅ Composition plutôt qu'héritage
- ✅ Documentation JSDoc en anglais
- ✅ Commentaires internes en français

### Principe KISS
- Ne pas sur-engineer
- Solution la plus simple qui fonctionne
- Pas de code "au cas où"
- Refactoring propre (pas de code mort)

### Gestion des Erreurs
- Toujours gérer les cas null/undefined
- Messages d'erreur explicites en français
- Fallbacks pour APIs natives (TTS, File API)

---

## ✅ Validation Finale

Ce plan sera considéré comme réussi quand :

1. ✅ Tous les critères de succès sont cochés
2. ✅ L'application respecte 100% de `spec/appli.txt`
3. ✅ `examples/ALEGRIA.txt` fonctionne parfaitement
4. ✅ Les 3 modes de lecture sont conformes
5. ✅ Navigation et réglages conformes
6. ✅ Documentation à jour
7. ✅ Aucune régression sur features existantes

---

**Prêt à démarrer la Phase 1 (Parser) ?**