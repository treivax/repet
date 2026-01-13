# Changelog - Version 2.0.0

## 🎉 Version 2.0.0 - Implémentation Finale du Système TTS (2025-01-XX)

### ✨ Nouvelles Fonctionnalités

#### 🎭 Système de Profils Vocaux

- **12 profils vocaux prédéfinis** pour diversifier les voix sans télécharger de nouveaux modèles
  - 6 profils pour Tom (Normal, Grave, Vif, Calme, Autoritaire, Jeune)
  - 3 profils pour Siwis (Normal, Douce, Enjouée)
  - 3 profils pour UPMC Jessica (Normal, Professionnelle, Chaleureuse)
- **Modificateurs audio personnalisables** :
  - `playbackRate` : Vitesse de lecture (0.5 à 2.0)
  - `pitchShift` : Décalage de pitch en demi-tons (-12 à +12)
  - `volume` : Volume (0.0 à 1.0)
  - `trebleBoost` : Boost des aigus (0.0 à 1.0)
  - `bassBoost` : Boost des graves (0.0 à 1.0)
- **Création de profils personnalisés** via `createCustomVoiceProfile()`
- **Validation automatique** des modificateurs vocaux
- **Support Web Audio API** pour effets avancés (pitch shift, égalisation)

#### 🔄 Migration Automatique des Voix

- **Détection automatique** des voix obsolètes au démarrage
- **Migration silencieuse** vers des voix de remplacement fiables
- **Mapping de migration** :
  - `fr_FR-gilles-low` → `fr_FR-tom-medium`
  - `fr_FR-mls-medium` → `fr_FR-tom-medium`
- **Double déclenchement** :
  - À l'hydratation du store (chargement de l'app)
  - À chaque lecture de paramètres (`getPlaySettings`)
- **Logs informatifs** dans la console pour tracer les migrations

#### 🔍 Outils de Diagnostic

- **Diagnostic complet du système TTS** (`ttsSystemDiagnostics.ts`)
  - Vérification du provider TTS
  - Analyse du cache audio
  - Validation des profils vocaux
  - Détection des voix obsolètes
  - Statistiques d'utilisation
- **Diagnostic des voix par pièce** (`voiceDiagnostics.ts`)
  - Détection des assignations problématiques
  - Génération de rapports formatés
  - Analyse de patterns dans les textes
- **Quick health check** pour validation rapide
- **Auto-repair** pour corrections automatiques

#### 🎨 Composant de Prévisualisation

- **`VoiceProfilePreview`** : Carte de profil vocal avec bouton d'écoute
- **`VoiceProfileGrid`** : Grille responsive de profils
- **Fonctionnalités** :
  - Écoute d'un exemple avant assignation
  - Affichage des caractéristiques du profil
  - Affichage des paramètres audio
  - Sélection visuelle du profil actif
  - Gestion des erreurs de lecture

### 🔧 Corrections de Bugs

#### Deadlock au Démarrage (CRITIQUE)

- **Problème** : Application bloquée sur l'écran de splash au démarrage
- **Cause** : Boucle de réinitialisation dans `AudioCacheService.initialize()`
- **Solution** :
  - Suppression de la boucle de versionnage automatique
  - Clear du cache audio au démarrage
  - Protection contre la ré-entrée dans `initialize()`

#### Voix Gilles - Erreurs ONNX Runtime (CRITIQUE)

- **Problème** : `fr_FR-gilles-low` cause des erreurs ONNX Runtime
- **Erreur** : `indices element out of data bounds, idx=141 must be within range [-130,129]`
- **Patterns déclencheurs** :
  - Didascalies : `[rire]`, `[à voix basse]`
  - Onomatopées : `ahah`, `héhé`, `hihi`
  - Ponctuation multiple : `???`, `!!!`
  - Points de suspension multiples : `……`
- **Cause racine** : Incompatibilité phonémiseur/modèle ONNX
- **Solution** : Voix désactivée + migration automatique vers Tom

#### Voix MLS - Audio Distordu

- **Problème** : `fr_FR-mls-medium` produit un audio distordu/inintelligible
- **Tentatives** :
  - Nettoyage heuristique du texte → Pire qualité
  - Filtrage des caractères spéciaux → Pas d'amélioration
- **Solution** : Voix retirée + migration automatique vers Tom

#### Cache Audio Obsolète

- **Problème** : Cache audio contient des entrées obsolètes
- **Solution** :
  - Clear du cache au startup de l'application
  - `deleteByVoiceId()` pour supprimer cache d'une voix spécifique
  - Invalidation intelligente lors du changement de voix

### 🗑️ Suppressions et Désactivations

#### Voix Retirées

- **`fr_FR-gilles-low`** (Gilles)
  - Raison : Erreurs ONNX Runtime répétées
  - Statut : Désactivé (commenté dans le code)
  - Migration : Automatique vers Tom
  
- **`fr_FR-mls-medium`** (MLS)
  - Raison : Audio distordu et inintelligible
  - Statut : Retiré complètement
  - Migration : Automatique vers Tom

#### Code Retiré

- Boucle de versionnage automatique du cache (`AUDIO_CACHE_VERSION`)
- Tentatives de nettoyage heuristique pour MLS
- Sessions WASM non utilisées

### 🧪 Tests

#### Tests Unitaires Ajoutés

- **`voiceMigration.test.ts`** : 18 tests
  - Migration d'une voix unique
  - Migration des paramètres d'une pièce
  - Migration de toutes les pièces
  - Détection des voix obsolètes
  - Cas limites et edge cases

- **`voiceDiagnostics.test.ts`** : 26 tests
  - Diagnostic d'une voix
  - Diagnostic des paramètres
  - Génération de rapports
  - Détection de patterns problématiques
  - Analyse de texte
  - Cas limites

**Total : 44 tests unitaires ✅**

#### Commandes de Test

```bash
# Tous les tests
npm test

# Tests de migration
npm test voiceMigration.test.ts

# Tests de diagnostic
npm test voiceDiagnostics.test.ts
```

### 📚 Documentation

#### Nouveaux Documents

1. **`IMPLEMENTATION_FINALE_TTS.md`** (~900 lignes)
   - Guide complet de déploiement
   - Architecture détaillée des composants
   - Procédures de déploiement pas-à-pas
   - Vérifications post-déploiement
   - Monitoring et maintenance
   - Dépannage avancé
   - Améliorations futures

2. **`QUICK_START_TTS_FINAL.md`** (~340 lignes)
   - Guide rapide pour utilisateurs
   - Guide rapide pour développeurs
   - Voix et profils disponibles
   - Dépannage express
   - FAQ complète
   - Checklist post-déploiement

3. **`docs/TTS_VOICE_ISSUES.md`** (~380 lignes)
   - Historique des problèmes
   - Causes et solutions détaillées
   - Voix recommandées vs. retirées
   - Système de migration
   - Outils de diagnostic
   - Tests de régression
   - Statistiques de fiabilité

4. **`docs/VOICE_PROFILES.md`** (~530 lignes)
   - Vue d'ensemble du système
   - Paramètres modifiables
   - Description des 12 profils
   - Guide d'utilisation dans le code
   - Guide de sélection par personnage
   - Intégration système
   - Tests recommandés
   - Bonnes pratiques

5. **`CHANGELOG_V2.0.0.md`** (ce fichier)
   - Changelog complet de la version 2.0.0

#### Documents Mis à Jour

- **`DOCS_INDEX.md`** : Ajout section TTS v2.0.0
- **`README.md`** : Mise à jour de la section TTS (recommandé)

### 🏗️ Architecture

#### Nouveaux Modules

```
src/
├── core/tts/
│   └── voiceProfiles.ts              # 12 profils vocaux + utilitaires
│
├── components/play/
│   └── VoiceProfilePreview.tsx       # Composant de prévisualisation
│
└── utils/
    ├── voiceMigration.ts             # Système de migration automatique
    ├── voiceDiagnostics.ts           # Diagnostic des voix
    └── ttsSystemDiagnostics.ts       # Diagnostic système complet
```

#### Modules Modifiés

- **`src/core/tts/providers/PiperWASMProvider.ts`**
  - Intégration des profils vocaux dans `getVoices()`
  - Détection et application des profils dans `synthesize()`
  - Réutilisation des sessions pour les profils

- **`src/state/playSettingsStore.ts`**
  - Migration automatique dans `getPlaySettings()`
  - Migration à l'hydratation (`onRehydrateStorage`)
  - Clear du cache lors du changement de voix

- **`src/core/tts/services/AudioCacheService.ts`**
  - Clear du cache au démarrage
  - Ajout de `deleteByVoiceId()`
  - Suppression du versioning automatique

### 📊 Statistiques

#### Avant Version 2.0.0

- **Voix disponibles** : 5 (Tom, Siwis, UPMC, Gilles, MLS)
- **Voix fiables** : 3 (Tom, Siwis, UPMC)
- **Problèmes critiques** : 3 (deadlock, Gilles, MLS)
- **Migration automatique** : ❌ Non
- **Outils de diagnostic** : ❌ Non
- **Tests unitaires TTS** : 0

#### Après Version 2.0.0

- **Voix disponibles** : 3 (Tom, Siwis, UPMC)
- **Profils vocaux** : 12 (6 Tom + 3 Siwis + 3 Jessica)
- **Total options vocales** : 15 (3 voix + 12 profils)
- **Voix fiables** : 100% (3/3)
- **Problèmes critiques** : 0
- **Migration automatique** : ✅ Oui
- **Outils de diagnostic** : ✅ Oui (3 modules)
- **Tests unitaires TTS** : 44 (100% passés)
- **Documentation** : 5 documents (~2200 lignes)

#### Amélioration de la Diversité Vocale

| Critère | Avant | Après | Amélioration |
|---------|-------|-------|--------------|
| Voix masculines | 1 (Tom uniquement) | 6 profils de Tom | **+500%** |
| Voix féminines | 2 | 6 profils (3 Siwis + 3 Jessica) | **+200%** |
| Options totales | 3 voix de base | 15 (3 base + 12 profils) | **+400%** |
| Taille téléchargement | ~45 MB | ~45 MB (inchangé) | **0 MB** |

### 🎯 Impact Utilisateur

#### Pour les Utilisateurs Finaux

- ✅ **Plus de diversité** dans les voix de personnages
- ✅ **Personnalisation** selon le type de personnage
- ✅ **Stabilité** accrue (plus d'erreurs ONNX)
- ✅ **Migration automatique** des anciennes voix
- ✅ **Prévisualisation** avant assignation

#### Pour les Développeurs

- ✅ **API simple** pour utiliser les profils
- ✅ **Outils de diagnostic** complets
- ✅ **Tests unitaires** robustes
- ✅ **Documentation** exhaustive
- ✅ **Migration automatique** (zéro intervention)

### 🚀 Déploiement

#### Pré-requis

- Node.js 18+
- npm 9+
- Navigateur moderne (Chrome, Firefox, Safari, Edge)

#### Procédure

```bash
# 1. Tests
npm test

# 2. Build
npm run build

# 3. Déploiement
git push origin main  # Netlify auto-deploy
# OU
netlify deploy --prod
```

#### Vérification Post-Déploiement

```bash
# Santé du système
curl -I https://votre-app.netlify.app

# Diagnostic dans la console
import { quickHealthCheck } from './src/utils/ttsSystemDiagnostics'
await quickHealthCheck()
```

### ⚠️ Breaking Changes

#### Voix Retirées

- **`fr_FR-gilles-low`** n'est plus disponible
- **`fr_FR-mls-medium`** n'est plus disponible

**Impact** : Les personnages assignés à ces voix sont automatiquement migrés vers `fr_FR-tom-medium`.

**Action requise** : Aucune (migration automatique).

#### Cache Audio

Le cache audio est **automatiquement nettoyé au démarrage** de l'application.

**Impact** : Première synthèse plus lente après mise à jour (reconstruction du cache).

**Action requise** : Aucune.

### 🔜 Prochaines Étapes

#### Court Terme (1-3 mois)

- [ ] Interface utilisateur pour sélectionner les profils
- [ ] Prévisualisation avec texte personnalisable
- [ ] Web Audio API avancé (pitch shifting robuste)
- [ ] Analytics d'utilisation des profils

#### Moyen Terme (3-6 mois)

- [ ] Nouvelles voix Piper validées
- [ ] Compression du cache audio
- [ ] Tests E2E avec Playwright
- [ ] Profils pour les nouvelles voix

#### Long Terme (6-12 mois)

- [ ] Voix personnalisées (upload ONNX)
- [ ] Interface de fine-tuning des profils
- [ ] Support multi-langue (EN, ES, DE, IT)
- [ ] IA pour sélection automatique de profil

### 📝 Notes de Migration

#### Pour les Projets Existants

1. **Aucune action requise** : Les migrations sont automatiques
2. **Vérifier les logs** : Consulter la console pour voir les migrations
3. **Tester les personnages** : Vérifier que les voix assignées conviennent
4. **Ajuster si nécessaire** : Utiliser les nouveaux profils si souhaité

#### Pour les Nouveaux Projets

1. **Utiliser les profils** directement pour plus de diversité
2. **Éviter Gilles et MLS** (désactivés)
3. **Consulter** `docs/VOICE_PROFILES.md` pour les recommandations
4. **Prévisualiser** les profils avant assignation

### 🙏 Remerciements

- **Équipe Répét** - Implémentation et tests
- **Piper TTS** - Modèles de voix open source
- **ONNX Runtime** - Moteur d'inférence
- **@mintplex-labs** - Bibliothèque piper-tts-web

### 📄 Licence

MIT License - Copyright (c) 2025 Répét Contributors

---

## 📚 Ressources

- **Documentation complète** : `IMPLEMENTATION_FINALE_TTS.md`
- **Guide rapide** : `QUICK_START_TTS_FINAL.md`
- **Profils vocaux** : `docs/VOICE_PROFILES.md`
- **Problèmes résolus** : `docs/TTS_VOICE_ISSUES.md`
- **Index documentation** : `DOCS_INDEX.md`

---

## 🔗 Liens Utiles

- [Piper TTS GitHub](https://github.com/rhasspy/piper)
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/)
- [@mintplex-labs/piper-tts-web](https://www.npmjs.com/package/@mintplex-labs/piper-tts-web)

---

**Version** : 2.0.0  
**Date** : 2025-01-XX  
**Statut** : ✅ Production Ready  
**Auteur** : Répét Contributors