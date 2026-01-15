# Système de Profils Vocaux

## 📋 Vue d'ensemble

Le système de profils vocaux permet de créer **plusieurs variantes perceptuellement différentes** d'une même voix TTS en modifiant des paramètres audio. Cela résout le problème du manque de diversité vocale, notamment pour les voix masculines.

### Pourquoi ?

- ✅ **Plus de diversité** sans télécharger de nouveaux modèles
- ✅ **Personnalisation** des voix selon les personnages
- ✅ **Léger** - Aucun fichier supplémentaire
- ✅ **Temps réel** - Modifications appliquées instantanément

## 🎯 Cas d'Usage

### Problème : Manque de diversité vocale masculine

Avec la désactivation de Gilles et MLS, **Tom** et **Pierre** sont les deux voix masculines fiables. Pour une pièce avec plusieurs personnages masculins, nous avons besoin de variété.

### Solution : 3 profils distincts par voix masculine (Tom et Pierre)

```
Tom Normal          → Roméo (voix naturelle)
Tom Autoritaire     → Le Père (voix grave et puissante)
Pierre Autoritaire  → Le Prince (voix autoritaire)
Pierre Jeune        → Mercutio (voix vive et énergique)
Tom Jeune           → Benvolio (voix juvénile)
Pierre Normal       → Narrateur (voix neutre)
```

Chaque voix a **3 variantes maximalement différentes** : Normal (neutre), Autoritaire (très grave), Jeune (très aigu).

## 🔧 Paramètres Modifiables

### 1. Vitesse de lecture (`playbackRate`)

- **Plage** : 0.5 à 2.0
- **Défaut** : 1.0
- **Effet** : 
  - < 1.0 : Plus lent (voix perçue comme plus grave)
  - > 1.0 : Plus rapide (voix perçue comme plus aiguë)

**Exemple** :
```typescript
playbackRate: 0.9  // 10% plus lent → voix plus posée
playbackRate: 1.1  // 10% plus rapide → voix plus dynamique
```

### 2. Décalage de pitch (`pitchShift`)

- **Plage** : -12 à +12 demi-tons
- **Défaut** : 0 (pas de décalage)
- **Effet** :
  - Négatif : Voix plus grave
  - Positif : Voix plus aiguë
- **Note** : Nécessite Web Audio API

**Exemple** :
```typescript
pitchShift: -3  // 3 demi-tons plus grave → voix masculine profonde
pitchShift: +2  // 2 demi-tons plus aigu → voix plus jeune
```

### 3. Volume (`volume`)

- **Plage** : 0.0 à 1.0
- **Défaut** : 1.0
- **Effet** : Contrôle le volume de sortie

**Exemple** :
```typescript
volume: 0.9  // Légèrement plus bas pour voix douce
volume: 1.0  // Volume normal
```

### 4. Boost des aigus (`trebleBoost`)

- **Plage** : 0.0 à 1.0
- **Défaut** : 0 (pas de boost)
- **Effet** : Rend la voix plus claire, brillante
- **Note** : Nécessite Web Audio API

**Exemple** :
```typescript
trebleBoost: 0.2  // Voix plus claire et articulée
trebleBoost: 0.3  // Voix très claire, presque métallique
```

### 5. Boost des graves (`bassBoost`)

- **Plage** : 0.0 à 1.0
- **Défaut** : 0 (pas de boost)
- **Effet** : Rend la voix plus chaleureuse, profonde
- **Note** : Nécessite Web Audio API

**Exemple** :
```typescript
bassBoost: 0.3  // Voix chaleureuse
bassBoost: 0.4  // Voix très profonde et autoritaire
```

## 📦 Profils Prédéfinis

### Tom (3 profils)

#### Tom Normal
```typescript
{
  playbackRate: 1.0,
  volume: 1.0,
}
```
Voix naturelle, neutre.

#### Tom Autoritaire
```typescript
{
  playbackRate: 0.92,
  pitchShift: -3,
  volume: 1.0,
  bassBoost: 0.4,
}
```
Voix très grave, affirmée, puissante. Idéal pour personnages d'autorité, leaders, pères.

#### Tom Jeune
```typescript
{
  playbackRate: 1.08,
  pitchShift: 3,
  volume: 1.0,
  trebleBoost: 0.25,
}
```
Voix très aiguë, jeune, enjouée, dynamique. Idéal pour personnages adolescents, juvéniles.

### Siwis (3 profils)

#### Siwis Normal
Voix naturelle.

#### Siwis Douce
```typescript
{
  playbackRate: 0.95,
  pitchShift: -1,
  volume: 0.9,
}
```
Voix douce, apaisante, délicate.

#### Siwis Enjouée
```typescript
{
  playbackRate: 1.05,
  pitchShift: 1,
  volume: 1.0,
  trebleBoost: 0.15,
}
```
Voix vive, joyeuse, énergique.

### UPMC Jessica (3 profils)

#### Jessica Normal
Voix naturelle.

#### Jessica Professionnelle
```typescript
{
  playbackRate: 0.98,
  pitchShift: -1,
  volume: 1.0,
}
```
Voix assurée, professionnelle, claire.

#### Jessica Chaleureuse
```typescript
{
  playbackRate: 0.96,
  pitchShift: -2,
  volume: 0.95,
  bassBoost: 0.2,
}
```
Voix chaleureuse, bienveillante, douce.

### Pierre (3 profils)

#### Pierre Normal
```typescript
{
  playbackRate: 1.0,
  volume: 1.0,
}
```
Voix naturelle, neutre.

#### Pierre Autoritaire
```typescript
{
  playbackRate: 0.92,
  pitchShift: -3,
  volume: 1.0,
  bassBoost: 0.4,
}
```
Voix très grave, affirmée, puissante. Idéal pour personnages d'autorité, leaders, pères.

#### Pierre Jeune
```typescript
{
  playbackRate: 1.08,
  pitchShift: 3,
  volume: 1.0,
  trebleBoost: 0.25,
}
```
Voix très aiguë, jeune, enjouée, dynamique. Idéal pour personnages adolescents, juvéniles.

## 💻 Utilisation dans le Code

### Obtenir un profil

```typescript
import { getVoiceProfile } from '../core/tts/voiceProfiles'

const profile = getVoiceProfile('fr_FR-tom-medium-grave')
console.log(profile.displayName) // "Tom Grave"
console.log(profile.modifiers.pitchShift) // -2
```

### Obtenir tous les profils d'une voix

```typescript
import { getProfilesForBaseVoice } from '../core/tts/voiceProfiles'

const tomProfiles = getProfilesForBaseVoice('fr_FR-tom-medium')
// Retourne les 6 profils de Tom
```

### Obtenir les profils par genre

```typescript
import { getProfilesByGender } from '../core/tts/voiceProfiles'

const maleProfiles = getProfilesByGender('male')
// Retourne tous les profils masculins (Tom x6)

const femaleProfiles = getProfilesByGender('female')
// Retourne tous les profils féminins (Siwis x3 + Jessica x3)
```

### Créer un profil personnalisé

```typescript
import { createCustomVoiceProfile } from '../core/tts/voiceProfiles'

const customProfile = createCustomVoiceProfile(
  'fr_FR-tom-medium',
  'Tom Mystérieux',
  {
    playbackRate: 0.85,
    pitchShift: -4,
    volume: 0.8,
    bassBoost: 0.5,
  },
  {
    description: 'Voix grave et mystérieuse',
    perceivedGender: 'male',
    characteristics: ['mystérieux', 'sombre', 'profond'],
  }
)
```

### Valider les modificateurs

```typescript
import { validateVoiceModifiers } from '../core/tts/voiceProfiles'

const result = validateVoiceModifiers({
  playbackRate: 2.5, // Invalide (> 2.0)
  pitchShift: -15,   // Invalide (< -12)
  volume: 1.0,
})

console.log(result.valid) // false
console.log(result.errors)
// [
//   "playbackRate doit être entre 0.5 et 2.0",
//   "pitchShift doit être entre -12 et +12 demi-tons"
// ]
```

### Appliquer les modificateurs (basique)

```typescript
import { applyBasicModifiers } from '../core/tts/voiceProfiles'

const audio = new Audio('path/to/audio.wav')
const modifiers = {
  playbackRate: 0.9,
  volume: 0.95,
}

applyBasicModifiers(audio, modifiers)
audio.play()
```

### Appliquer les modificateurs (avancé avec Web Audio API)

```typescript
import { createAudioNodeWithModifiers } from '../core/tts/voiceProfiles'

const audio = new Audio('path/to/audio.wav')
const modifiers = {
  playbackRate: 0.9,
  pitchShift: -2,
  volume: 1.0,
  bassBoost: 0.3,
  trebleBoost: 0.0,
}

// Créer les nœuds Web Audio
const { context, source, gainNode, filterNodes } = 
  createAudioNodeWithModifiers(audio, modifiers)

// L'audio est maintenant routé via Web Audio API
audio.play()

// Nettoyer après utilisation
audio.addEventListener('ended', () => {
  source.disconnect()
  filterNodes.forEach(f => f.disconnect())
  gainNode.disconnect()
})
```

## 🎨 Guide de Sélection

### Par Type de Personnage

| Type de Personnage | Profil Recommandé |
|-------------------|-------------------|
| Roi, Prince, Autorité | Tom Autoritaire |
| Père, Sage, Mentor | Tom Grave |
| Héros, Protagoniste | Tom Normal |
| Confident, Ami | Tom Calme |
| Jeune homme, Adolescent | Tom Jeune |
| Comique, Énergique | Tom Vif |
| Mère, Confidente | Siwis Douce |
| Jeune femme vive | Siwis Enjouée |
| Professeure, Médecin | Jessica Professionnelle |
| Nourrice, Grand-mère | Jessica Chaleureuse |

### Par Émotion Dominante

| Émotion | Profil Recommandé |
|---------|-------------------|
| Colère, Force | Tom Autoritaire |
| Tristesse, Mélancolie | Tom Grave |
| Joie, Enthousiasme | Tom Vif / Siwis Enjouée |
| Calme, Sérénité | Tom Calme / Siwis Douce |
| Sagesse, Réflexion | Tom Grave / Jessica Professionnelle |
| Tendresse, Bienveillance | Jessica Chaleureuse / Siwis Douce |

## ⚙️ Intégration avec le Système Existant

### Étape 1 : Étendre les Types de Voix

Modifier `src/core/tts/types.ts` pour inclure les profils :

```typescript
export interface VoiceDescriptor {
  id: string
  name: string
  displayName: string
  language: string
  gender: VoiceGender
  provider: TTSProviderType
  quality?: string
  isLocal?: boolean
  requiresDownload?: boolean
  
  // NOUVEAU : Support des profils
  isProfile?: boolean
  baseVoiceId?: string
  profileId?: string
}
```

### Étape 2 : Ajouter les Profils à PiperWASMProvider

```typescript
import { ALL_VOICE_PROFILES, getVoiceProfile } from '../voiceProfiles'

// Dans getVoices()
getVoices(): VoiceDescriptor[] {
  // Voix de base
  const baseVoices = PIPER_MODELS.map(model => ({ ... }))
  
  // Profils vocaux
  const profileVoices = ALL_VOICE_PROFILES.map(profile => ({
    id: profile.id,
    name: profile.id,
    displayName: profile.displayName,
    language: 'fr-FR',
    gender: profile.perceivedGender || 'male',
    provider: 'piper-wasm',
    quality: 'medium',
    isLocal: true,
    requiresDownload: false,
    isProfile: true,
    baseVoiceId: profile.baseVoiceId,
    profileId: profile.id,
  }))
  
  return [...baseVoices, ...profileVoices]
}
```

### Étape 3 : Appliquer les Modificateurs lors de la Synthèse

```typescript
// Dans synthesize()
async synthesize(text: string, options: SynthesisOptions): Promise<SynthesisResult> {
  // Vérifier si c'est un profil
  const profile = getVoiceProfile(options.voiceId)
  
  let actualVoiceId = options.voiceId
  let modifiers = null
  
  if (profile) {
    // C'est un profil, utiliser la voix de base pour la synthèse
    actualVoiceId = profile.baseVoiceId
    modifiers = profile.modifiers
  }
  
  // ... synthétiser avec actualVoiceId ...
  
  // Appliquer les modificateurs si présents
  if (modifiers) {
    applyBasicModifiers(audio, modifiers)
  }
  
  return { audio, duration, fromCache }
}
```

## 🧪 Tests Recommandés

### Test 1 : Différenciation Perceptuelle

Tester les 6 profils de Tom sur la même phrase :

```
"Bonjour, je suis ravi de vous rencontrer."
```

**Résultat attendu** : Les 6 versions doivent être clairement différenciables.

### Test 2 : Cohérence

Tester le même profil sur plusieurs phrases :

```
"Bonjour."
"Comment allez-vous ?"
"Je suis très content de vous voir."
```

**Résultat attendu** : Le profil doit conserver ses caractéristiques.

### Test 3 : Extrêmes

Tester les valeurs limites :

```typescript
playbackRate: 0.5  // Très lent
playbackRate: 2.0  // Très rapide
pitchShift: -12    // Très grave
pitchShift: +12    // Très aigu
```

**Résultat attendu** : Pas de distorsion excessive, reste intelligible.

## 📊 Comparaison : Avant / Après

### Avant (Sans Profils)

```
Pièce avec 5 personnages masculins :
- Roméo    → Tom
- Mercutio → Tom
- Benvolio → Tom
- Le Père  → Tom
- Le Prince → Tom

❌ Tous identiques, confusion possible
```

### Après (Avec Profils)

```
Pièce avec 5 personnages masculins :
- Roméo    → Tom Normal
- Mercutio → Tom Vif
- Benvolio → Tom Jeune
- Le Père  → Tom Grave
- Le Prince → Tom Autoritaire

✅ Chacun a sa personnalité vocale unique
```

## 🚀 Prochaines Étapes

1. **Implémenter Web Audio API** pour pitchShift et filtres
2. **Tester les profils** avec des utilisateurs
3. **Ajuster les valeurs** selon les retours
4. **Ajouter plus de profils** si nécessaire
5. **Interface utilisateur** pour sélectionner les profils
6. **Prévisualisation** des profils avant assignation

## 💡 Conseils d'Utilisation

### ✅ Bonnes Pratiques

- Utiliser des profils **contrastés** pour des personnages qui dialoguent
- **Tom Grave** et **Tom Vif** sont très différents → bon pour duo
- **Tom Normal** comme référence neutre
- Tester avec des **textes réels** de votre pièce

### ❌ À Éviter

- N'utilisez pas **Tom Grave** et **Tom Calme** ensemble (trop similaires)
- Évitez les valeurs extrêmes (playbackRate < 0.7 ou > 1.3)
- Ne pas abuser du `bassBoost` et `trebleBoost` simultanément

## 🔗 Références

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [HTMLAudioElement.playbackRate](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate)
- [BiquadFilterNode](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode) (pour filtres)

---

**Date** : 2025-01-XX  
**Auteur** : Répét Contributors  
**Statut** : ✅ Spécification complète - Prêt pour implémentation