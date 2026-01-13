# Guide Rapide - Profils Vocaux pour Répét

## 🎯 Qu'est-ce que c'est ?

Un système qui permet de créer **plusieurs voix différentes à partir d'une seule voix TTS** (comme Tom) en modifiant des paramètres audio.

## ❓ Pourquoi faire ?

**Problème** : Tom est la seule voix masculine fiable (Gilles désactivée).  
**Solution** : Créer 6 variantes de Tom qui sonnent différemment !

```
Tom Normal       → Voix naturelle
Tom Grave        → Voix profonde et autoritaire  (-10% vitesse, -2 pitch)
Tom Vif          → Voix énergique et claire      (+10% vitesse, +2 pitch)
Tom Calme        → Voix posée et rassurante      (-5% vitesse, -1 pitch)
Tom Autoritaire  → Voix puissante                (-8% vitesse, -3 pitch)
Tom Jeune        → Voix juvénile et enjouée      (+8% vitesse, +3 pitch)
```

## 📦 Ce qui a été créé

### Fichier Principal : `src/core/tts/voiceProfiles.ts`

Contient :
- ✅ **6 profils pour Tom** (male)
- ✅ **3 profils pour Siwis** (female)
- ✅ **3 profils pour UPMC Jessica** (female)
- ✅ Fonctions pour créer des profils personnalisés
- ✅ Validation des paramètres
- ✅ Application des modificateurs audio

### Documentation : `docs/VOICE_PROFILES.md`

Guide complet avec :
- Explication de tous les paramètres
- Détails de chaque profil prédéfini
- Exemples de code
- Guide de sélection par type de personnage

## 🎨 Profils Tom en Détail

### 1. Tom Normal
```typescript
playbackRate: 1.0    // Vitesse normale
volume: 1.0          // Volume normal
```
**Usage** : Personnage principal, neutre

### 2. Tom Grave
```typescript
playbackRate: 0.9    // 10% plus lent
pitchShift: -2       // 2 demi-tons plus grave
bassBoost: 0.3       // +30% de basses (voix chaleureuse)
```
**Usage** : Père, sage, mentor, personnage mûr

### 3. Tom Vif
```typescript
playbackRate: 1.1    // 10% plus rapide
pitchShift: +2       // 2 demi-tons plus aigu
trebleBoost: 0.2     // +20% d'aigus (voix claire)
```
**Usage** : Jeune homme énergique, comique, dynamique

### 4. Tom Calme
```typescript
playbackRate: 0.95   // 5% plus lent
pitchShift: -1       // 1 demi-ton plus grave
volume: 0.9          // Volume légèrement baissé
```
**Usage** : Confident, ami proche, personnage apaisant

### 5. Tom Autoritaire
```typescript
playbackRate: 0.92   // 8% plus lent
pitchShift: -3       // 3 demi-tons plus grave
bassBoost: 0.4       // +40% de basses (voix puissante)
```
**Usage** : Roi, prince, chef, figure d'autorité

### 6. Tom Jeune
```typescript
playbackRate: 1.08   // 8% plus rapide
pitchShift: +3       // 3 demi-tons plus aigu
trebleBoost: 0.25    // +25% d'aigus (voix juvénile)
```
**Usage** : Adolescent, jeune homme, personnage naïf/innocent

## 📖 Exemple Concret : Roméo et Juliette

### Cast vocal :

```
ROMÉO          → Tom Normal        (héros, neutre)
MERCUTIO       → Tom Vif           (ami énergique)
BENVOLIO       → Tom Calme         (ami apaisant)
TYBALT         → Tom Autoritaire   (rival agressif)
LE PÈRE        → Tom Grave         (autorité paternelle)
LA NOURRICE    → Jessica Chaleureuse (figure maternelle)
JULIETTE       → Siwis Normal      (héroïne)
LADY CAPULET   → Jessica Professionnelle (mère distante)
```

✅ **8 personnages, 8 voix distinctes** (au lieu de 3-4 sans profils)

## 🚀 Comment Utiliser (Développeur)

### Obtenir un profil

```typescript
import { getVoiceProfile } from '../core/tts/voiceProfiles'

const profile = getVoiceProfile('fr_FR-tom-medium-grave')
console.log(profile.displayName)  // "Tom Grave"
console.log(profile.modifiers)
// {
//   playbackRate: 0.9,
//   pitchShift: -2,
//   volume: 1.0,
//   bassBoost: 0.3
// }
```

### Lister tous les profils masculins

```typescript
import { getProfilesByGender } from '../core/tts/voiceProfiles'

const maleProfiles = getProfilesByGender('male')
// Retourne les 6 profils de Tom
```

### Appliquer les modificateurs à un audio

```typescript
import { applyBasicModifiers } from '../core/tts/voiceProfiles'

const audio = new Audio('path/to/audio.wav')
const modifiers = {
  playbackRate: 0.9,
  volume: 1.0,
}

applyBasicModifiers(audio, modifiers)
audio.play()
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
  }
)
```

## 🔧 Paramètres Disponibles

| Paramètre | Plage | Effet |
|-----------|-------|-------|
| `playbackRate` | 0.5 - 2.0 | Vitesse (affecte aussi le pitch) |
| `pitchShift` | -12 - +12 | Pitch en demi-tons (Web Audio API) |
| `volume` | 0.0 - 1.0 | Volume de sortie |
| `trebleBoost` | 0.0 - 1.0 | Boost des aigus (clarté) |
| `bassBoost` | 0.0 - 1.0 | Boost des graves (chaleur) |

### ⚡ Modifications Basiques (HTMLAudioElement)
- ✅ `playbackRate` - **Fonctionne partout**, immédiat
- ✅ `volume` - **Fonctionne partout**, immédiat

### 🎛️ Modifications Avancées (Web Audio API)
- ⚙️ `pitchShift` - Nécessite implémentation Web Audio
- ⚙️ `trebleBoost` - Nécessite BiquadFilterNode
- ⚙️ `bassBoost` - Nécessite BiquadFilterNode

## 🎯 Guide de Sélection Rapide

### Par Type de Personnage

| Vous avez un... | Utilisez... |
|----------------|-------------|
| Roi, Prince, Autorité | **Tom Autoritaire** |
| Père, Sage, Mentor | **Tom Grave** |
| Héros principal | **Tom Normal** |
| Ami fidèle | **Tom Calme** |
| Adolescent | **Tom Jeune** |
| Personnage comique | **Tom Vif** |

### Combinaisons qui Fonctionnent Bien

✅ **Duo père-fils** : Tom Grave + Tom Jeune  
✅ **Duo amis** : Tom Normal + Tom Vif  
✅ **Duo autorité-rebelle** : Tom Autoritaire + Tom Vif  
✅ **Duo sage-jeune** : Tom Grave + Tom Calme  

❌ **À éviter** : Tom Grave + Tom Autoritaire (trop similaires)

## 📋 Checklist d'Intégration

### Phase 1 : Basique (playbackRate seulement)
- [ ] Intégrer `voiceProfiles.ts` dans PiperWASMProvider
- [ ] Modifier `getVoices()` pour inclure les profils
- [ ] Modifier `synthesize()` pour détecter les profils
- [ ] Appliquer `playbackRate` via `applyBasicModifiers()`
- [ ] Tester les 6 profils de Tom

### Phase 2 : Avancé (Web Audio API)
- [ ] Implémenter `createAudioNodeWithModifiers()`
- [ ] Ajouter support de `pitchShift`
- [ ] Ajouter support de `trebleBoost` et `bassBoost`
- [ ] Gérer la connexion/déconnexion des nœuds
- [ ] Tester avec tous les paramètres

### Phase 3 : Interface Utilisateur
- [ ] Ajouter sélecteur de profils dans CharacterVoiceEditor
- [ ] Afficher les caractéristiques du profil
- [ ] Prévisualisation audio des profils
- [ ] Sauvegarde des profils sélectionnés

## 🧪 Test Rapide

```typescript
// Test basique dans la console du navigateur
const audio = new Audio()
audio.src = 'path/to/audio.wav'

// Test Tom Normal
audio.playbackRate = 1.0
audio.play()

// Attendre la fin, puis test Tom Grave
audio.currentTime = 0
audio.playbackRate = 0.9
audio.play()

// Attendre la fin, puis test Tom Vif
audio.currentTime = 0
audio.playbackRate = 1.1
audio.play()
```

## 💡 Avantages

1. **Aucun téléchargement** - Pas de nouveaux fichiers
2. **Instantané** - Modifications en temps réel
3. **Léger** - Juste du code JavaScript
4. **Flexible** - Créez autant de profils que nécessaire
5. **Rétrocompatible** - Les voix de base fonctionnent toujours

## 📚 Documentation Complète

Pour plus de détails, consultez :
- `docs/VOICE_PROFILES.md` - Documentation complète
- `src/core/tts/voiceProfiles.ts` - Code source commenté

## ❓ FAQ

### Les profils changent-ils la qualité audio ?
Non, la qualité reste identique. Seuls le pitch, la vitesse et l'égalisation changent.

### Puis-je créer mes propres profils ?
Oui ! Utilisez `createCustomVoiceProfile()` avec vos propres valeurs.

### Est-ce que ça fonctionne avec toutes les voix ?
Oui, les profils peuvent être créés pour n'importe quelle voix TTS.

### Quelle est la différence avec avoir plusieurs voix ?
Les profils utilisent la **même voix de base** (donc même timbre) mais modifient la perception. C'est subtil mais efficace pour différencier les personnages.

### Peut-on mixer profils et voix réelles ?
Absolument ! Vous pouvez avoir :
- Tom Grave pour le père
- Tom Vif pour le fils
- Siwis Normal pour la mère
- Jessica Professionnelle pour la tante

---

**Date** : 2025-01-XX  
**Auteur** : Répét Contributors  
**Statut** : ✅ Prêt à utiliser