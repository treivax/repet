# Phase 7 - Tests et Validation - Checklist

**Objectif** : Valider la conformité complète de l'application Répét avec la spécification

**Statut** : 🔄 EN COURS (70% complété)

---

## 🧪 Tests Automatisés

### Tests Unitaires Parser

- [ ] **Résoudre timeout Vitest**
  - [ ] Augmenter timeout à 30000ms dans `vitest.config.ts`
  - [ ] Essayer `--no-threads` flag
  - [ ] Essayer `--single-thread` flag
  - [ ] Vérifier mémoire disponible système
  - [ ] Tester avec `--reporter=verbose`

- [ ] **Exécuter tests parser** (24 tests)
  ```bash
  npm run test -- src/core/parser/__tests__/parser.test.ts
  ```
  - [ ] Parsing métadonnées (titre, auteur, année)
  - [ ] Détection personnages
  - [ ] Structure actes/scènes
  - [ ] Répliques multi-lignes
  - [ ] Didascalies blocs
  - [ ] Didascalies inline
  - [ ] Cas limites (fichier vide, format invalide)
  - [ ] Performance (<50ms pour pièces moyennes)

### Tests Stores (À créer)

- [ ] **playStore**
  - [ ] loadPlay()
  - [ ] setUserCharacter()
  - [ ] nextLine() / previousLine()
  - [ ] goToScene()
  - [ ] closePlay()

- [ ] **playSettingsStore**
  - [ ] getPlaySettings()
  - [ ] updatePlaySettings()
  - [ ] setReadingMode()
  - [ ] Persistance LocalStorage

- [ ] **settingsStore**
  - [ ] updateSettings()
  - [ ] resetSettings()
  - [ ] Persistance

### Tests Composants (À créer)

- [ ] **Settings Components**
  - [ ] ReadingModeSelector
  - [ ] VoiceAssignment
  - [ ] AudioSettings
  - [ ] ItalianSettings

- [ ] **Reader Components**
  - [ ] TextDisplay
  - [ ] LineRenderer
  - [ ] SceneNavigation
  - [ ] PlaybackControls
  - [ ] SceneSummary

---

## ✋ Tests Manuels

### Import et Parsing

- [ ] **Fichier ALEGRIA.txt**
  ```
  Actions :
  1. Ouvrir application (localhost:5173)
  2. Aller sur Accueil
  3. Sélectionner examples/ALEGRIA.txt
  4. Cliquer "Analyser la pièce"
  
  Vérifications :
  - [ ] Titre extrait correctement
  - [ ] Auteur détecté
  - [ ] Année détectée
  - [ ] Personnages listés (6+ personnages)
  - [ ] Actes détectés (3+ actes)
  - [ ] Scènes détectées (10+ scènes)
  - [ ] Répliques parsées (100+ lignes)
  - [ ] Didascalies présentes
  - [ ] Navigation vers Bibliothèque automatique
  ```

- [ ] **Fichier minimal custom**
  ```
  Créer fichier test-minimal.txt :
  
  MA PIÈCE
  
  Auteur: Test Auteur
  Annee: 2025
  
  ACTE I
  
  SCÈNE 1
  
  ALICE: Bonjour Bob.
  
  BOB: Bonjour Alice.
  
  (Ils se serrent la main)
  
  Vérifications :
  - [ ] Parse sans erreur
  - [ ] 2 personnages (ALICE, BOB)
  - [ ] 1 acte, 1 scène
  - [ ] 2 répliques + 1 didascalie
  ```

### Configuration par Pièce

- [ ] **Écran PlayConfigScreen**
  ```
  Actions :
  1. Ouvrir une pièce importée
  2. Cliquer bouton "⚙️ Configurer"
  
  Vérifications :
  - [ ] Page /play/:playId/config s'ouvre
  - [ ] Titre pièce affiché
  - [ ] Tous composants settings visibles :
    - [ ] ReadingModeSelector
    - [ ] VoiceAssignment
    - [ ] AudioSettings
    - [ ] ItalianSettings (si mode italien)
  ```

- [ ] **Modification settings**
  ```
  Actions :
  1. Changer mode lecture : Silent → Audio → Italian
  2. Modifier vitesse : 1.0 → 1.5
  3. Activer "Masquer mes répliques"
  4. Sélectionner personnage utilisateur
  5. Fermer et rouvrir configuration
  
  Vérifications :
  - [ ] Tous changements persistés (LocalStorage)
  - [ ] Réouverture affiche bons paramètres
  - [ ] Changement personnage met à jour playStore
  ```

### Mode Silencieux

- [ ] **Lecture basique**
  ```
  Actions :
  1. Ouvrir pièce
  2. Mode "Silencieux" dans config
  3. Naviguer lignes avec boutons ← →
  
  Vérifications :
  - [ ] Texte affiché correctement
  - [ ] Nom personnage visible
  - [ ] Didascalies différenciées (italique)
  - [ ] Navigation fluide
  - [ ] Pas de son TTS
  - [ ] Pas de bouton Play/Pause
  ```

### Mode Audio

- [ ] **Lecture TTS**
  ```
  Actions :
  1. Ouvrir pièce
  2. Mode "Audio" dans config
  3. Cliquer bouton Play
  
  Vérifications :
  - [ ] TTS démarre
  - [ ] Nom personnage JAMAIS lu ⚠️
  - [ ] Texte réplique lu
  - [ ] Boutons Play/Pause/Stop visibles
  - [ ] Auto-avance ligne (si activé)
  - [ ] Contrôles désactivés pendant lecture
  ```

- [ ] **Vitesse et volume**
  ```
  Actions :
  1. Changer vitesse : 0.5x, 1.0x, 1.5x, 2.0x
  2. Changer volume : 0%, 50%, 100%
  3. Relancer lecture
  
  Vérifications :
  - [ ] Vitesse appliquée immédiatement
  - [ ] Volume appliqué
  - [ ] Pas de coupures/glitches
  ```

- [ ] **Didascalies**
  ```
  Actions :
  1. Activer "Voix off pour didascalies"
  2. Lire scène avec didascalies
  
  Vérifications :
  - [ ] Didascalies lues par voix différente (neutre)
  - [ ] Vitesse légèrement plus lente (0.9x)
  - [ ] Distinction claire avec répliques
  ```

### Mode Italiennes ⭐

- [ ] **Masquage répliques utilisateur**
  ```
  Actions :
  1. Ouvrir pièce
  2. Mode "Italiennes" dans config
  3. Activer "Masquer mes répliques"
  4. Sélectionner personnage utilisateur (ex: ALICE)
  5. Ouvrir en mode lecteur (/reader/:playId)
  
  Vérifications :
  - [ ] Badge "MODE ITALIENNES" affiché (violet)
  - [ ] Répliques ALICE masquées (blur + ●●●●●●)
  - [ ] Répliques BOB visibles
  - [ ] Icône 🔒 sur lignes masquées
  - [ ] Message "Récitez de mémoire" visible
  ```

- [ ] **TTS en mode italien**
  ```
  Actions :
  1. Lire scène en mode italiennes
  2. Observer comportement TTS
  
  Vérifications :
  - [ ] Répliques ALICE : volume 0 (muet)
  - [ ] Répliques BOB : volume normal
  - [ ] Vitesse utilisateur appliquée (ALICE)
  - [ ] Vitesse par défaut appliquée (BOB)
  - [ ] Nom personnage JAMAIS lu ⚠️
  ```

- [ ] **Bouton révélation**
  ```
  Actions :
  1. Sur ligne ALICE masquée
  2. Cliquer "👁️ Révéler ma réplique"
  3. Observer texte
  4. Cliquer "🔒 Masquer à nouveau"
  5. Passer à ligne suivante
  
  Vérifications :
  - [ ] Texte s'affiche au clic révéler
  - [ ] Texte se cache au clic masquer
  - [ ] Révélation se réinitialise ligne suivante
  - [ ] Pas de lecture TTS si masqué
  ```

- [ ] **Paramètres avancés**
  ```
  Actions :
  1. Modifier "Vitesse utilisateur" : 0.8
  2. Modifier "Vitesse par défaut" : 1.2
  3. Tester lecture
  
  Vérifications :
  - [ ] ALICE lue à 0.8x (si volume > 0)
  - [ ] BOB lu à 1.2x
  - [ ] Distinction claire vitesses
  ```

### Navigation

- [ ] **Navigation par scène (ReaderScreen)**
  ```
  Actions :
  1. Ouvrir mode lecteur
  2. Cliquer "Scène suivante"
  3. Cliquer "Scène précédente"
  4. Observer changements
  
  Vérifications :
  - [ ] Acte/Scène affichés correctement
  - [ ] Navigation entre scènes fluide
  - [ ] Première ligne scène affichée
  - [ ] Indicateur position (Acte X / Y)
  - [ ] Boutons désactivés si limite (première/dernière scène)
  ```

- [ ] **Sommaire cliquable**
  ```
  Actions :
  1. Cliquer bouton "Sommaire"
  2. Observer modal
  3. Cliquer sur une scène
  
  Vérifications :
  - [ ] Modal s'ouvre (SceneSummary)
  - [ ] Tous actes listés
  - [ ] Toutes scènes listées
  - [ ] Scène actuelle surlignée
  - [ ] Clic scène → jump to scene
  - [ ] Modal se ferme après sélection
  ```

### Assignation Voix

- [ ] **Par sexe**
  ```
  Actions :
  1. Ouvrir configuration pièce
  2. Section "Voix par personnage"
  3. Assigner sexes :
     - ALICE → Féminin
     - BOB → Masculin
  4. Lire scène
  
  Vérifications :
  - [ ] ALICE lue par voix féminine (Amélie, etc.)
  - [ ] BOB lu par voix masculine (Thomas, etc.)
  - [ ] Voix distinctes
  - [ ] Pas d'erreur console
  ```

### Persistance

- [ ] **Settings globaux**
  ```
  Actions :
  1. Modifier paramètres globaux (Paramètres screen)
  2. Fermer application (Ctrl+W)
  3. Rouvrir application
  
  Vérifications :
  - [ ] Thème conservé
  - [ ] Vitesse/volume conservés
  - [ ] Voix sélectionnée conservée
  ```

- [ ] **Settings par pièce**
  ```
  Actions :
  1. Configurer pièce A (mode italiennes)
  2. Configurer pièce B (mode audio)
  3. Fermer/Rouvrir application
  4. Ouvrir pièce A, puis B
  
  Vérifications :
  - [ ] Pièce A : mode italiennes actif
  - [ ] Pièce B : mode audio actif
  - [ ] Personnages utilisateur conservés
  - [ ] Vitesses conservées
  ```

- [ ] **Bibliothèque**
  ```
  Actions :
  1. Importer 3 pièces
  2. Supprimer pièce 2
  3. Fermer/Rouvrir application
  
  Vérifications :
  - [ ] Pièces 1 et 3 présentes
  - [ ] Pièce 2 absente
  - [ ] Métadonnées affichées
  - [ ] Boutons configuration visibles
  ```

---

## 🌐 Tests Cross-Browser

### Desktop

- [ ] **Chrome (dernière version)**
  - [ ] Import pièce OK
  - [ ] TTS fonctionne
  - [ ] Navigation fluide
  - [ ] PWA installable
  - [ ] Aucune erreur console

- [ ] **Firefox (dernière version)**
  - [ ] Import pièce OK
  - [ ] TTS fonctionne
  - [ ] Navigation fluide
  - [ ] Aucune erreur console

- [ ] **Safari (macOS)**
  - [ ] Import pièce OK
  - [ ] TTS fonctionne
  - [ ] Navigation fluide
  - [ ] PWA installable
  - [ ] Aucune erreur console

- [ ] **Edge (dernière version)**
  - [ ] Import pièce OK
  - [ ] TTS fonctionne
  - [ ] Navigation fluide
  - [ ] PWA installable
  - [ ] Aucune erreur console

### Mobile

- [ ] **iOS Safari (iPhone)**
  - [ ] Import pièce OK
  - [ ] TTS fonctionne (après interaction utilisateur)
  - [ ] Navigation tactile fluide
  - [ ] PWA installable (Add to Home Screen)
  - [ ] Mode portrait/paysage OK
  - [ ] Responsive design OK

- [ ] **Android Chrome**
  - [ ] Import pièce OK
  - [ ] TTS fonctionne
  - [ ] Navigation tactile fluide
  - [ ] PWA installable
  - [ ] Mode portrait/paysage OK
  - [ ] Responsive design OK

---

## ✅ Validation Conformité Spec 100%

### Format Fichier
- [ ] Titre en bloc isolé détecté
- [ ] `Auteur:` optionnel extrait
- [ ] `Annee:` optionnel extrait
- [ ] `ACTE N` détecté (I, II, 1, 2, premier, etc.)
- [ ] `SCÈNE N` détecté (1, 2, I, II, première, etc.)
- [ ] `PERSONNAGE:` en MAJUSCULES reconnu
- [ ] Répliques multi-lignes supportées
- [ ] Didascalies `(...)` blocs détectées
- [ ] Didascalies inline dans répliques OK

### Règles TTS
- [ ] **Nom personnage JAMAIS lu** ⚠️ (règle critique)
- [ ] Didascalies lues si voix off activée
- [ ] Didascalies ignorées si voix off désactivée
- [ ] Mode italiennes : volume 0 utilisateur
- [ ] Mode italiennes : vitesses distinctes
- [ ] Mode audio : toutes répliques lues

### Navigation
- [ ] Navigation par scène (pas ligne par ligne)
- [ ] Sommaire actes/scènes cliquable
- [ ] Jump to scene fonctionnel
- [ ] Indicateur progression visible

### Settings
- [ ] Paramètres par pièce indépendants
- [ ] Persistance LocalStorage
- [ ] Réinitialisation possible
- [ ] Migration settings OK

---

## 🐛 Problèmes Connus à Vérifier

- [ ] Tests Vitest timeout → résolu ?
- [ ] Parser legacy marqué @deprecated → OK
- [ ] Performance grandes pièces (>2000 lignes) → acceptable ?
- [ ] Initialisation TTS iOS (interaction requise) → documenté ?
- [ ] Cache voix système lent → contourné ?

---

## 📊 Métriques Finales

### Code Quality
- [ ] Type-check : 0 erreur
- [ ] ESLint : 0 warning
- [ ] Build production : succès
- [ ] Bundle size : < 400KB (gzipped < 130KB)
- [ ] PWA Lighthouse score : > 90

### Performance
- [ ] Parser < 50ms (pièces moyennes)
- [ ] Parser < 200ms (grandes pièces)
- [ ] Navigation < 16ms (60fps)
- [ ] TTS init < 1s (hors cache système)

### Accessibility
- [ ] Contraste couleurs AA
- [ ] Navigation clavier
- [ ] ARIA labels présents
- [ ] Screen reader compatible

---

## 🎯 Checklist Finale Déploiement

- [ ] Tous tests manuels passés
- [ ] Tous tests automatisés passés
- [ ] Cross-browser validé
- [ ] Documentation complète
- [ ] Captures d'écran ajoutées
- [ ] README.md à jour
- [ ] CHANGELOG.md v0.2.0 finalisé
- [ ] Licence MIT présente
- [ ] Build production OK
- [ ] PWA manifest correct
- [ ] Service worker généré

---

## 📝 Notes

**Problèmes rencontrés** :
- 

**Solutions appliquées** :
- 

**Améliorations futures** :
- 

---

**Phase 7 - Validation Complète**  
**Objectif** : Garantir conformité 100% avec spec  
**Statut** : 🔄 EN COURS → ✅ À COMPLÉTER