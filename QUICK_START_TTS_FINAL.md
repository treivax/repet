# Guide Rapide - Système TTS Final

## 🚀 Démarrage Rapide

### Pour les Utilisateurs

#### 1. Vérifier que tout fonctionne

Ouvrez la console du navigateur (F12) et tapez :

```javascript
// Vérifier le système
import { quickHealthCheck } from './src/utils/ttsSystemDiagnostics'
quickHealthCheck().then(health => console.log('Système TTS:', health))
```

**Résultat attendu** :
```javascript
{
  healthy: true,
  status: 'ok',
  criticalIssues: 0
}
```

#### 2. Utiliser les profils vocaux

Dans l'éditeur de voix d'un personnage :

1. Cliquez sur **"Modifier"** à côté de la voix assignée
2. Vous verrez maintenant **12 profils** au lieu de 3 voix
3. Sélectionnez un profil (ex: "Tom Grave" pour un père, "Tom Vif" pour un jeune)
4. Cliquez sur **"Écouter un exemple"** pour prévisualiser
5. Validez votre choix

#### 3. Diversifier les voix dans une pièce

**Avant** : 5 personnages masculins → tous avec la même voix Tom

**Maintenant** :
- Roméo → Tom Normal (voix naturelle)
- Mercutio → Tom Vif (énergique)
- Le Père → Tom Grave (posé, autoritaire)
- Benvolio → Tom Jeune (dynamique)
- Le Frère → Tom Calme (apaisant)

**Résultat** : Chaque personnage a sa propre personnalité vocale !

---

### Pour les Développeurs

#### Installation

Aucune installation supplémentaire nécessaire. Tout est déjà inclus.

#### Vérifier l'intégration

```bash
# 1. Tests
npm test

# 2. Build
npm run build

# 3. Lancer en dev
npm run dev
```

#### Diagnostic complet

```javascript
// Dans la console du navigateur
import { logSystemDiagnostics } from './src/utils/ttsSystemDiagnostics'
import { usePlaySettingsStore } from './src/state/playSettingsStore'

const store = usePlaySettingsStore.getState()
await logSystemDiagnostics(store.playSettings)
```

#### Utiliser les profils dans votre code

```typescript
import { getVoiceProfile, applyBasicModifiers } from './src/core/tts/voiceProfiles'

// Obtenir un profil
const profile = getVoiceProfile('fr_FR-tom-medium-grave')

// Synthétiser avec un profil
const result = await provider.synthesize('Bonjour', {
  voiceId: profile.id,  // Utiliser l'ID du profil
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
})

// Les modificateurs sont appliqués automatiquement !
```

#### Créer un profil personnalisé

```typescript
import { createCustomVoiceProfile } from './src/core/tts/voiceProfiles'

const monProfil = createCustomVoiceProfile(
  'fr_FR-tom-medium',           // Voix de base
  'Tom Mystérieux',              // Nom
  {
    playbackRate: 0.85,          // Plus lent
    pitchShift: -4,              // Plus grave
    volume: 0.8,                 // Plus bas
    bassBoost: 0.5,              // Graves accentués
  },
  {
    description: 'Voix grave et mystérieuse',
    perceivedGender: 'male',
    characteristics: ['mystérieux', 'sombre', 'profond'],
  }
)
```

---

## 📊 Voix et Profils Disponibles

### Voix de Base (3)

| ID | Nom | Genre | Qualité |
|----|-----|-------|---------|
| `fr_FR-tom-medium` | Tom | Homme | Moyenne |
| `fr_FR-siwis-medium` | Siwis | Femme | Moyenne |
| `fr_FR-upmc-medium` | UPMC Jessica | Femme | Moyenne |

### Profils Vocaux (12)

#### Tom (6 profils)

| ID | Nom | Description |
|----|-----|-------------|
| `fr_FR-tom-medium-normal` | Tom Normal | Voix naturelle |
| `fr_FR-tom-medium-grave` | Tom Grave | Voix grave, posée |
| `fr_FR-tom-medium-vif` | Tom Vif | Voix dynamique |
| `fr_FR-tom-medium-calme` | Tom Calme | Voix rassurante |
| `fr_FR-tom-medium-autoritaire` | Tom Autoritaire | Voix puissante |
| `fr_FR-tom-medium-jeune` | Tom Jeune | Voix enjouée |

#### Siwis (3 profils)

| ID | Nom | Description |
|----|-----|-------------|
| `fr_FR-siwis-medium-normal` | Siwis Normal | Voix naturelle |
| `fr_FR-siwis-medium-douce` | Siwis Douce | Voix apaisante |
| `fr_FR-siwis-medium-enjouee` | Siwis Enjouée | Voix joyeuse |

#### UPMC Jessica (3 profils)

| ID | Nom | Description |
|----|-----|-------------|
| `fr_FR-upmc-medium-normal` | Jessica Normal | Voix naturelle |
| `fr_FR-upmc-medium-professionnelle` | Jessica Professionnelle | Voix assurée |
| `fr_FR-upmc-medium-chaleureuse` | Jessica Chaleureuse | Voix bienveillante |

---

## 🔧 Dépannage Express

### L'app reste bloquée au splash screen

```javascript
// Console du navigateur
localStorage.clear()
location.reload()
```

### Une voix ne fonctionne pas

```javascript
// Tester la synthèse
const provider = window.ttsProviderManager?.getActiveProvider()
await provider?.synthesize('Test', {
  voiceId: 'fr_FR-tom-medium',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
}).then(r => r.audio.play())
```

### Vérifier les migrations

```javascript
import { logDiagnosticReport } from './src/utils/voiceDiagnostics'
import { usePlaySettingsStore } from './src/state/playSettingsStore'

const store = usePlaySettingsStore.getState()
logDiagnosticReport(store.playSettings)
```

### Forcer une migration

```javascript
import { migrateAllPlaySettings } from './src/utils/voiceMigration'
import { usePlaySettingsStore } from './src/state/playSettingsStore'

const store = usePlaySettingsStore.getState()
const migrated = migrateAllPlaySettings(store.playSettings)
store.playSettings = migrated

// Sauvegarder
localStorage.setItem('repet-play-settings-storage', JSON.stringify({
  state: { playSettings: migrated },
  version: 0
}))

location.reload()
```

### Nettoyer le cache

```javascript
import { audioCacheService } from './src/core/tts/services/AudioCacheService'

// Tout le cache
await audioCacheService.clearCache()

// Une voix spécifique
await audioCacheService.deleteByVoiceId('fr_FR-gilles-low')

// Stats du cache
const stats = await audioCacheService.getCacheStats()
console.log('Cache:', stats)
```

### Réparation automatique

```javascript
import { autoRepair } from './src/utils/ttsSystemDiagnostics'

const result = await autoRepair()
console.log('Réparation:', result)
```

---

## ❓ FAQ

### Pourquoi Gilles et MLS ne sont plus disponibles ?

- **Gilles** : Cause des erreurs ONNX Runtime (indices hors limites)
- **MLS** : Audio distordu et inintelligible sur certaines lignes

Les personnages utilisant ces voix sont **automatiquement migrés vers Tom**.

### Quelle est la différence entre une voix et un profil ?

- **Voix de base** : Modèle ONNX complet (~15MB chacun)
- **Profil** : Variante d'une voix de base (0MB, juste des paramètres)

Les profils permettent d'avoir **12 voix perceptuellement différentes** pour seulement **3 modèles téléchargés** !

### Puis-je créer mes propres profils ?

Oui ! Utilisez `createCustomVoiceProfile()` :

```typescript
import { createCustomVoiceProfile } from './src/core/tts/voiceProfiles'

const monProfil = createCustomVoiceProfile(
  'fr_FR-tom-medium',
  'Mon Profil Custom',
  {
    playbackRate: 1.2,  // Plus rapide
    pitchShift: 2,      // Plus aigu
    volume: 1.0,
  }
)

// Utiliser dans la synthèse
provider.synthesize(text, { voiceId: monProfil.id })
```

### Les profils fonctionnent-ils avec le cache ?

Oui ! Chaque profil a son propre cache. Un même texte synthétisé avec "Tom Normal" et "Tom Grave" sera mis en cache séparément.

### Comment savoir si mes pièces ont besoin d'une migration ?

```javascript
import { diagnoseAllPlaySettings } from './src/utils/voiceDiagnostics'
import { usePlaySettingsStore } from './src/state/playSettingsStore'

const store = usePlaySettingsStore.getState()
const diagnostics = diagnoseAllPlaySettings(store.playSettings)

const needMigration = diagnostics.filter(d => d.needsMigration)
console.log('Pièces à migrer:', needMigration.length)
```

### La migration se fait automatiquement ?

Oui, dans 2 cas :

1. **Au chargement de l'app** (réhydratation du store)
2. **À chaque lecture de paramètres** (`getPlaySettings()`)

Vous n'avez rien à faire !

---

## 📚 Documentation Complète

Pour aller plus loin :

- **Problèmes TTS** : `docs/TTS_VOICE_ISSUES.md`
- **Profils vocaux** : `docs/VOICE_PROFILES.md`
- **Guide complet** : `IMPLEMENTATION_FINALE_TTS.md`

---

## 🎯 Checklist Post-Déploiement

- [ ] L'app démarre sans bloquer
- [ ] Les pièces se chargent
- [ ] Tom, Siwis, UPMC sont présents
- [ ] 12 profils vocaux apparaissent
- [ ] Gilles et MLS n'apparaissent PAS
- [ ] La synthèse fonctionne avec Tom Normal
- [ ] La synthèse fonctionne avec Tom Grave
- [ ] La prévisualisation fonctionne
- [ ] Les migrations sont appliquées (console)
- [ ] Aucune erreur dans la console

---

**Besoin d'aide ?** Consultez la documentation complète ou ouvrez une issue.

**Date** : 2025-01-XX  
**Version** : 2.0.0  
**Statut** : ✅ Production Ready