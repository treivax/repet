# Guide de démarrage rapide - Piper Native Provider

**Version**: 0.4.0  
**Temps de lecture**: 5 minutes

## 🚀 Démarrage en 3 étapes

### 1. Installation

```bash
# Cloner le projet
git clone https://github.com/OWNER/repet.git
cd repet

# Installer les dépendances
npm install

# Télécharger les modèles vocaux
npm run download-models
```

### 2. Développement

```bash
# Lancer le serveur de développement
npm run dev

# Ouvrir http://localhost:5173
```

### 3. Test de Pierre (nouvelle voix)

1. Importer une pièce de théâtre
2. Aller dans **Paramètres** → **Voix**
3. Assigner **Pierre (Normal)**, **Pierre Autoritaire** ou **Pierre Jeune** à un personnage
4. Lancer la lecture

🎉 **Pierre parle enfin !**

## 🎙️ Voix disponibles

### Voix de base (4)

| Voix | Genre | Origine | Speaker ID |
|------|-------|---------|------------|
| **Siwis** | Femme | France | - |
| **Tom** | Homme | France | - |
| **Jessica** | Femme | UPMC | 0 |
| **Pierre** | Homme | UPMC | 1 ✨ NOUVEAU |

### Profils vocaux (12 total)

Chaque voix de base a 3 profils:
- **Normal**: Voix naturelle
- **Autoritaire/Professionnelle**: Voix grave et affirmée
- **Jeune/Enjouée**: Voix dynamique et aiguë

**Exemple pour Pierre**:
```typescript
'fr_FR-upmc-pierre-medium-normal'       // Voix naturelle
'fr_FR-upmc-pierre-medium-autoritaire'  // Grave, puissant
'fr_FR-upmc-pierre-medium-jeune'        // Dynamique, vif
```

## 💻 Utilisation programmatique

### Import et initialisation

```typescript
import { PiperNativeProvider } from '@/core/tts/providers'

const provider = new PiperNativeProvider()
await provider.initialize()
```

### Lister les voix

```typescript
const voices = provider.getVoices()

voices.forEach(voice => {
  console.log(`${voice.displayName} (${voice.gender})`)
})

// Sortie:
// Siwis (Normal) (female)
// Tom (Normal) (male)
// Jessica (Normal) (female)
// Pierre (Normal) (male)  ← NOUVEAU !
// Pierre Autoritaire (male)
// Pierre Jeune (male)
// ...
```

### Synthétiser avec Pierre

```typescript
const result = await provider.synthesize("Bonjour tout le monde !", {
  voiceId: 'fr_FR-upmc-pierre-medium-normal'
})

// Lire l'audio
result.audio.play()

console.log(`Durée: ${result.audio.duration}s`)
console.log(`Depuis cache: ${result.fromCache}`)
```

### Avec profil vocal

```typescript
// Pierre avec voix autoritaire (grave)
const result = await provider.synthesize("Je suis le roi !", {
  voiceId: 'fr_FR-upmc-pierre-medium-autoritaire'
})
result.audio.play()
```

## 🔧 Configuration avancée

### Via TTSProviderManager (recommandé)

```typescript
import { ttsProviderManager } from '@/core/tts/providers'

// Initialisation automatique du bon provider
await ttsProviderManager.initialize()

// Synthèse
await ttsProviderManager.speak("Texte à lire", {
  voiceId: 'fr_FR-upmc-pierre-medium'
})
```

### Assigner des voix aux personnages

```typescript
const characters = [
  { id: 'HAMLET', gender: 'male' as const },
  { id: 'OPHÉLIE', gender: 'female' as const },
  { id: 'CLAUDIUS', gender: 'male' as const },
]

const assignments = provider.generateVoiceAssignments(characters)

console.log(assignments)
// {
//   NARRATEUR: 'fr_FR-tom-medium-normal',
//   HAMLET: 'fr_FR-upmc-pierre-medium-normal',
//   OPHÉLIE: 'fr_FR-siwis-medium-normal',
//   CLAUDIUS: 'fr_FR-tom-medium-autoritaire',
// }
```

## 🎨 Créer un profil vocal personnalisé

```typescript
import { createCustomVoiceProfile } from '@/core/tts/voiceProfiles'

const monProfil = createCustomVoiceProfile(
  'fr_FR-upmc-pierre-medium',  // Voix de base
  'Pierre Très Grave',          // Nom affiché
  {
    playbackRate: 0.85,         // Plus lent
    pitchShift: -5,             // Très grave
    volume: 1.0,
    bassBoost: 0.6,             // Beaucoup de basses
  },
  {
    description: 'Voix très grave et lente pour rôles autoritaires',
    perceivedGender: 'male',
    characteristics: ['grave', 'lent', 'puissant', 'sombre']
  }
)

// Utiliser le profil
const result = await provider.synthesize("Je suis Darth Vader.", {
  voiceId: monProfil.id
})
```

## 🐛 Dépannage rapide

### Erreur: "ONNX Runtime non disponible"

**Solution**:
```bash
# Vérifier fichiers WASM
ls public/wasm/ort-wasm*.wasm

# Devrait afficher:
# ort-wasm-simd.wasm
```

### Erreur: "createPiperPhonemize non trouvé"

**Solution**:
```bash
# Vérifier phonemizer
ls public/wasm/piper_phonemize.*

# Devrait afficher:
# piper_phonemize.data
# piper_phonemize.js
# piper_phonemize.wasm
```

### Pierre ne parle pas / même voix que Jessica

**Vérification**:
```typescript
// Le speakerId doit être différent
const models = provider.getBaseModels()
const jessica = models.find(m => m.id.includes('jessica'))
const pierre = models.find(m => m.id.includes('pierre'))

console.log(jessica.speakerId)  // 0
console.log(pierre.speakerId)   // 1 ← Important !
```

### Audio ne se met pas en cache

**Vérification**:
```typescript
// Vérifier le cache
const stats = await provider.getCacheStats()
console.log(stats)
// { totalEntries: X, totalSize: Y, byVoice: {...} }

// Vider le cache si nécessaire
await provider.clearCache()
```

## 📊 Performance

### Temps de synthèse typiques

| Longueur texte | Première fois | Depuis cache |
|----------------|---------------|--------------|
| 10 mots | ~300ms | <10ms |
| 50 mots | ~800ms | <10ms |
| 100 mots | ~1500ms | <10ms |

### Optimisation

```typescript
// Précharger les modèles au démarrage
await provider.initialize()

// Les sessions ONNX sont automatiquement mises en cache
// Première utilisation: charge le modèle (~500ms)
// Utilisations suivantes: réutilise la session (<50ms)
```

## 🔗 Liens utiles

- **Documentation complète**: [`docs/PIPER_NATIVE_MIGRATION.md`](./PIPER_NATIVE_MIGRATION.md)
- **Notes de version**: [`docs/RELEASE_NOTES_v0.4.0.md`](./RELEASE_NOTES_v0.4.0.md)
- **Guide utilisateur**: [`docs/USER_GUIDE.md`](./USER_GUIDE.md)
- **Architecture TTS**: [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)

## ❓ FAQ

### Q: Puis-je utiliser l'ancien provider ?

**R**: Oui ! Il reste disponible:
```typescript
import { PiperWASMProvider } from '@/core/tts/providers'
const oldProvider = new PiperWASMProvider()
```

### Q: Combien de voix masculines sont disponibles ?

**R**: 6 au total (2 voix de base × 3 profils):
- Tom: Normal, Autoritaire, Jeune
- Pierre: Normal, Autoritaire, Jeune

### Q: Le cache audio est-il partagé entre providers ?

**R**: Oui, le cache IndexedDB est partagé. La clé inclut le texte, voiceId et settings.

### Q: Puis-je ajouter mes propres modèles Piper ?

**R**: Oui ! Ajoutez le modèle ONNX dans `public/voices/` et configurez-le dans `PIPER_MODELS`.

### Q: Support iOS/Safari ?

**R**: Oui, ONNX Runtime Web fonctionne sur tous les navigateurs modernes incluant Safari.

## 🎯 Prochaines étapes

1. **Tester Pierre** avec différents profils vocaux
2. **Assigner automatiquement** des voix aux personnages
3. **Créer des profils personnalisés** selon vos besoins
4. **Expérimenter** avec les modificateurs (pitch, rate, etc.)
5. **Partager vos retours** pour améliorer le système !

---

**Besoin d'aide ?** Consultez [`docs/PIPER_NATIVE_MIGRATION.md`](./PIPER_NATIVE_MIGRATION.md) pour plus de détails.