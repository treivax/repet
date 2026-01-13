# 🎭 Spécification : Assignation Intelligente des Voix par Genre

**Version** : 1.0  
**Date** : 2025-01-12  
**Statut** : Spécification validée  
**Priorité** : 🔴 CRITIQUE - Fonctionnalité clé de l'intégration Piper-WASM

---

## 📋 Contexte

### Fonctionnalité Existante

L'application Répét possède déjà un système d'assignation de voix dans l'écran **"Voix des personnages"** (`PlayDetailScreen`) :

- L'utilisateur peut définir le **genre** (Homme ♂ / Femme ♀) pour chaque personnage
- Ces informations sont stockées dans `settings.characterVoices` (Record<characterId, Gender>)
- Le système actuel utilise `voiceManager.selectVoiceForGender(gender)` pour Web Speech API
- Les assignations sont persistées dans le store Zustand

**Composants impliqués** :
- `src/components/play/VoiceAssignment.tsx` - Interface utilisateur
- `src/core/tts/voice-manager.ts` - Sélection de voix (Web Speech)
- `src/state/playSettingsStore.ts` - Stockage des préférences
- `src/screens/PlayDetailScreen.tsx` - Écran de configuration

---

## 🎯 Objectif

Étendre le système d'assignation de voix pour **Piper-WASM** et **Google/Web Speech** avec les exigences suivantes :

1. **Différenciation par genre** - Voix masculines vs féminines clairement identifiées
2. **Maximisation de la diversité** - Assigner des voix différentes à chaque personnage
3. **Cohérence** - Même personnage = même voix durant toute la session
4. **Respect du genre** - Personnage féminin → voix féminine obligatoirement
5. **Persistance en base de données** - Assignations sauvegardées entre les sessions
6. **Choix du provider par pièce** - Sélection Piper/Google dans PlayDetailScreen
7. **Réassignation manuelle** - Bouton pour régénérer les assignations
8. **Édition manuelle** - Possibilité de choisir une voix spécifique pour chaque personnage

---

## 📐 Spécifications Fonctionnelles

### 1. Choix du Provider TTS

#### Emplacement
- Le choix entre **Piper** et **Google/Web Speech** se fait dans **PlayDetailScreen**
- Dans le bloc "Voix des personnages" (en haut, avant la liste des personnages)
- **Pas dans les settings globaux** - chaque pièce peut utiliser un provider différent

#### Persistance
- Stocké dans `PlaySettings.ttsProvider: TTSProviderType`
- Valeur par défaut : `'piper-wasm'`
- Sauvegardé en base de données (IndexedDB via Dexie)

### 2. Modèles Vocaux Piper

#### Exigences Minimales

- **Au minimum 2 voix féminines françaises**
- **Au minimum 2 voix masculines françaises**
- Chaque modèle doit avoir la propriété `gender: 'male' | 'female'`

#### Configuration Type

```typescript
const PIPER_MODELS = [
  // Voix Féminines
  {
    id: 'fr_FR-siwis-medium',
    name: 'Siwis',
    displayName: 'Siwis (Femme)',
    language: 'fr-FR',
    gender: 'female' as const,
    quality: 'medium' as const,
    url: '...',
    size: 5_000_000
  },
  {
    id: 'fr_FR-upmc-medium',
    name: 'UPMC',
    displayName: 'UPMC (Femme)',
    language: 'fr-FR',
    gender: 'female' as const,
    quality: 'medium' as const,
    url: '...',
    size: 6_000_000
  },
  
  // Voix Masculines
  {
    id: 'fr_FR-tom-medium',
    name: 'Tom',
    displayName: 'Tom (Homme)',
    language: 'fr-FR',
    gender: 'male' as const,
    quality: 'medium' as const,
    url: '...',
    size: 5_500_000
  },
  {
    id: 'fr_FR-gilles-medium',
    name: 'Gilles',
    displayName: 'Gilles (Homme)',
    language: 'fr-FR',
    gender: 'male' as const,
    quality: 'medium' as const,
    url: '...',
    size: 6_500_000
  }
] as const;
```

---

### 3. Persistance en Base de Données

#### Structure de Données

Les assignations de voix sont stockées dans `PlaySettings` avec **deux configurations distinctes** :

```typescript
export interface PlaySettings {
  playId: string;
  readingMode: ReadingMode;
  // ... autres propriétés existantes
  
  // Genre des personnages (conservé)
  characterVoices: Record<string, Gender>; // characterId -> 'male' | 'female'
  
  // NOUVEAU : Provider TTS sélectionné pour cette pièce
  ttsProvider: TTSProviderType; // 'piper-wasm' | 'web-speech'
  
  // NOUVEAU : Assignations spécifiques par provider
  characterVoicesPiper: Record<string, string>;  // characterId -> voiceId (Piper)
  characterVoicesGoogle: Record<string, string>; // characterId -> voiceId (Google/Web Speech)
}
```

#### Raison de la Séparation

Chaque provider a ses propres voix disponibles :
- Piper : `fr_FR-siwis-medium`, `fr_FR-tom-medium`, etc.
- Google : URIs système spécifiques (`com.apple.ttsbundle...`, etc.)

En conservant deux configurations séparées, on permet :
- De passer d'un provider à l'autre sans perdre les assignations
- De personnaliser les voix pour chaque provider indépendamment
- De restaurer les assignations précédentes lors du retour à un provider

#### Flux de Persistance

```
1. Utilisateur change provider → Piper
   ↓
2. Système charge characterVoicesPiper (depuis DB)
   ↓
3. Si vide → génération automatique des assignations
   ↓
4. Assignations affichées dans l'UI
   ↓
5. Utilisateur modifie manuellement une voix
   ↓
6. Sauvegarde immédiate dans characterVoicesPiper
   ↓
7. Persistance en IndexedDB (Dexie)
```

---

### 4. Bouton de Réassignation

#### Fonctionnalité

Un bouton **"🔄 Réassigner les voix"** situé à côté du sélecteur de provider.

#### Comportement

1. Click → Dialog de confirmation :
   ```
   "Réassigner toutes les voix ?
   Les assignations actuelles seront perdues."
   [Annuler] [Confirmer]
   ```

2. Si confirmé :
   - Vider les assignations du provider actuel
   - Régénérer avec l'algorithme de distribution équitable
   - Sauvegarder en DB
   - Actualiser l'affichage

3. Cas d'usage :
   - L'utilisateur n'est pas satisfait de la distribution automatique
   - Après avoir changé plusieurs genres, il veut une nouvelle distribution
   - Pour "rafraîchir" les voix et entendre d'autres combinaisons

---

### 5. Édition Manuelle des Voix

#### Interface

À côté des boutons **♂ Homme** / **♀ Femme**, un bouton **"✏️ Édition"**.

#### Comportement

1. Click → Dropdown s'ouvre avec :
   - Liste des voix disponibles **du genre sélectionné uniquement**
   - Voix actuelle pré-sélectionnée (highlight)
   - Nom de chaque voix affiché clairement

2. Sélection d'une voix :
   - Dropdown se ferme
   - Voix sauvegardée immédiatement en DB
   - Affichage mis à jour ("Voix assignée : ...")
   - Assignation manuelle prioritaire (pas écrasée par réassignation auto)

3. Contraintes :
   - Dropdown filtrée par genre (cohérence)
   - Si changement de genre → réinitialisation assignation manuelle

#### Exemple UI

```
┌────────────────────────────────────────┐
│ JULIETTE                               │
│ [♀ Active] [♂] [✏️ Édition ▼]         │
│                                        │
│ ┌────────────────────────────────┐    │
│ │ ● Siwis (Femme)               │    │ ← Voix actuelle
│ │   UPMC (Femme)                │    │
│ │   ... autres voix féminines    │    │
│ └────────────────────────────────┘    │
│                                        │
│ Voix assignée : Siwis (Femme)         │
└────────────────────────────────────────┘
```

---

### 6. Algorithme d'Assignation

#### Principe

**Objectif** : Maximiser la diversité vocale tout en respectant les genres.

**Stratégie** : Rotation équitable (Round-Robin) des voix disponibles par genre.

**Note** : L'algorithme est maintenant une fonction utilitaire (pas en cache mémoire) car les assignations sont persistées en DB.

#### Pseudo-code

```
FONCTION generateVoiceAssignments(characters, existingAssignments = {}):
  
  // Résultat : Record<characterId, voiceId>
  assignments = {}
  usageCount = Map()
  
  // 1. Initialiser compteur avec assignations existantes
  POUR CHAQUE voiceId DANS existingAssignments.values():
    usageCount.set(voiceId, usageCount.get(voiceId) + 1)
  
  // 2. Pour chaque personnage
  POUR CHAQUE character DANS characters:
    
    // Filtrer les voix du bon genre
    voicesOfGender = FILTRER(availableVoices, v => v.gender == character.gender)
    
    SI voicesOfGender est vide:
      assignments[character.id] = firstAvailableVoice
      CONTINUER
    
    // Trouver la voix la moins utilisée
    selectedVoice = voicesOfGender[0]
    minUsage = usageCount.get(selectedVoice.id) OU 0
    
    POUR CHAQUE voice DANS voicesOfGender:
      usage = usageCount.get(voice.id) OU 0
      SI usage < minUsage:
        minUsage = usage
        selectedVoice = voice
    
    // Enregistrer
    assignments[character.id] = selectedVoice.id
    usageCount.set(selectedVoice.id, minUsage + 1)
  
  RETOURNER assignments

FIN FONCTION
```

#### Structures de Données

```typescript
// Les assignations sont maintenant en DB, pas en mémoire

interface PlaySettings {
  // ... autres propriétés
  
  characterVoicesPiper: Record<string, string>;  // characterId -> voiceId
  characterVoicesGoogle: Record<string, string>; // characterId -> voiceId
}

// Provider expose une méthode utilitaire
class PiperWASMProvider {
  generateVoiceAssignments(
    characters: Array<{id: string, gender: Gender}>,
    existingAssignments?: Record<string, string>
  ): Record<string, string> {
    // Implémentation de l'algorithme
  }
}
```

#### 5. VoiceAssignment (UI)

**Fichier** : `src/components/play/VoiceAssignment.tsx`

**Refactorisation complète** :
- Ajouter `TTSProviderSelector` (nouveau sous-composant)
- Ajouter `CharacterVoiceEditor` (nouveau sous-composant)
- Gérer `playSettings.ttsProvider`
- Gérer `characterVoicesPiper` et `characterVoicesGoogle`
- Bouton réassignation
- Dropdown édition manuelle

#### 6. PlaySettingsStore

**Fichier** : `src/state/playSettingsStore.ts`

**Nouvelles actions** :
```typescript
setTTSProvider(playId: string, provider: TTSProviderType): void
setCharacterVoiceAssignment(
  playId: string,
  provider: TTSProviderType,
  characterId: string,
  voiceId: string
): void
reassignAllVoices(playId: string, provider: TTSProviderType): void
```

---

### 7. Scénarios d'Usage

#### Scénario 1 : Diversité Maximale (Cas Nominal)

**Contexte** :
- Pièce avec 4 personnages : JULIETTE (F), CLAIRE (F), ROMÉO (M), MARC (M)
- 2 voix féminines disponibles : Siwis, UPMC
- 2 voix masculines disponibles : Tom, Gilles

**Déroulement** :
1. Utilisateur définit les genres dans "Voix des personnages"
2. Lecture de la pièce démarre

**Résultat Attendu** :

| Personnage | Genre | Voix Assignée | Raison |
|------------|-------|---------------|--------|
| JULIETTE   | F     | Siwis         | Première voix féminine (usage=0) |
| CLAIRE     | F     | UPMC          | Deuxième voix féminine (usage=0) ✅ DIFFÉRENTE |
| ROMÉO      | M     | Tom           | Première voix masculine (usage=0) |
| MARC       | M     | Gilles        | Deuxième voix masculine (usage=0) ✅ DIFFÉRENTE |

**Critères de Succès** :
- ✅ 4 voix différentes (diversité maximale)
- ✅ Respect des genres
- ✅ Aucune voix dupliquée

---

#### Scénario 2 : Rotation Équitable (Plus de Personnages que de Voix)

**Contexte** :
- Pièce avec 5 personnages féminins
- 2 voix féminines disponibles : Siwis, UPMC

**Déroulement** :

| Personnage | Voix Assignée | Usage Siwis | Usage UPMC |
|------------|---------------|-------------|------------|
| JULIETTE   | Siwis         | 1           | 0          |
| CLAIRE     | UPMC          | 1           | 1          |
| OPHÉLIE    | Siwis         | 2           | 1          |
| PORTIA     | UPMC          | 2           | 2          |
| DESDÉMONE  | Siwis         | 3           | 2          |

**Résultat** :
- Siwis utilisée 3 fois
- UPMC utilisée 2 fois
- Distribution équitable ✅

---

#### Scénario 3 : Persistance entre Sessions

**Contexte** :
- Pièce configurée avec Piper
- JULIETTE → Siwis, ROMÉO → Tom

**Actions** :
1. Lecture de la pièce (session 1)
2. Fermeture de l'application
3. Réouverture le lendemain (session 2)
4. Lecture de la même pièce

**Résultat Attendu** :
- JULIETTE → Siwis (même voix) ✅ PERSISTANCE DB
- ROMÉO → Tom (même voix) ✅ PERSISTANCE DB
- Pas de réassignation aléatoire

---

#### Scénario 4 : Cohérence de Session

**Contexte** :
- Personnage JULIETTE assigné à voix Siwis

**Actions** :
1. Lecture réplique JULIETTE → Siwis
2. Lecture autre personnage
3. Lecture réplique JULIETTE à nouveau → ?

**Résultat Attendu** :
- Réplique JULIETTE → Siwis (même voix) ✅ COHÉRENCE
- Pas de réassignation aléatoire

---

#### Scénario 5 : Changement de Provider

**Contexte** :
- Pièce avec JULIETTE (Siwis/Piper), ROMÉO (Tom/Piper)

**Action** :
1. Utilisateur change provider → Google/Web Speech
2. Nouvelles assignations générées automatiquement
   - JULIETTE → Google Voice 1
   - ROMÉO → Google Voice 2
3. Utilisateur revient à Piper

**Résultat Attendu** :
- JULIETTE → Siwis (restaurée) ✅
- ROMÉO → Tom (restauré) ✅
- Les deux configurations sont conservées indépendamment

---

#### Scénario 6 : Changement de Genre

**Contexte** :
- JULIETTE assignée à Siwis (voix féminine)

**Action** :
1. Utilisateur change JULIETTE de "Femme" à "Homme" dans "Voix des personnages"

**Résultat Attendu** :
- JULIETTE → Voix masculine (ex: Tom) ✅
- Cache invalidé pour ce personnage
- Nouvelle assignation selon algorithme

---

#### Scénario 7 : Réassignation Manuelle

**Contexte** :
- Assignations automatiques : JULIETTE → Siwis, CLAIRE → UPMC

**Action** :
1. Click sur bouton "🔄 Réassigner les voix"
2. Confirmation

**Résultat Attendu** :
- Nouvelles assignations générées (peut-être inversées)
- JULIETTE → UPMC, CLAIRE → Siwis ✅
- Toujours respecte diversité et genre

---

#### Scénario 8 : Édition Manuelle

**Contexte** :
- JULIETTE (Femme) assignée automatiquement à Siwis

**Actions** :
1. Click "✏️ Édition" sur JULIETTE
2. Dropdown s'ouvre (Siwis, UPMC)
3. Sélection de UPMC

**Résultat Attendu** :
- JULIETTE → UPMC ✅
- Affichage mis à jour
- Sauvegarde en DB immédiate
- Lecture utilise UPMC

---

### 8. Cas Limites

#### Cas 1 : Aucune Voix du Genre Demandé

**Situation** : Personnage masculin, mais aucune voix masculine disponible

**Comportement** :
```typescript
// Fallback : utiliser la première voix disponible (peu importe le genre)
if (voicesOfGender.length === 0) {
  console.warn(`Aucune voix ${gender} disponible, fallback sur première voix`);
  return PIPER_MODELS[0].id;
}
```

#### Cas 2 : Changement de Pièce

**Situation** : Utilisateur charge une nouvelle pièce

**Comportement** :
- Chaque pièce a son propre `PlaySettings` en DB
- Les assignations sont isolées par `playId`
- Pas de conflit entre pièces

#### Cas 3 : Personnage sans Genre Défini

**Situation** : `settings.characterVoices[characterId]` est undefined

**Comportement** :
```typescript
// Utiliser le genre par défaut du personnage (si disponible)
const gender = settings.characterVoices[characterId] 
  || character.gender  // Depuis le parsing (si disponible)
  || 'female';         // Fallback par défaut
```

---

## 🔧 Implémentation Technique

### Modifications Requises

#### 1. PlaySettings (Modèle de Données)

**Fichier** : `src/core/models/Settings.ts`

**Modifications** :
```typescript
export interface PlaySettings {
  playId: string;
  // ... propriétés existantes
  
  characterVoices: Record<string, Gender>; // Conservé
  
  // NOUVEAU
  ttsProvider: TTSProviderType;              // 'piper-wasm' | 'web-speech'
  characterVoicesPiper: Record<string, string>;
  characterVoicesGoogle: Record<string, string>;
}
```

#### 2. PiperWASMProvider

**Fichier** : `src/core/tts/provider/PiperWASMProvider.ts`

**Nouvelle méthode** :
```typescript
generateVoiceAssignments(
  characters: Array<{id: string, gender: Gender}>,
  existingAssignments?: Record<string, string>
): Record<string, string>
```

**Note** : Plus de cache mémoire, tout en DB

#### 3. TTSProviderManager

**Fichier** : `src/core/tts/provider/TTSProviderManager.ts`

**Méthode à modifier** :
```typescript
async speak(
  text: string,
  options: SynthesisOptions & { characterId?: string; gender?: Gender },
  events?: SynthesisEvents
): Promise<SynthesisResult>
```

**Logique** :
```typescript
// Si characterId et gender fournis
if (options.characterId && options.gender) {
  const voiceId = this.activeProvider.selectVoiceForCharacter?.(
    options.characterId,
    options.gender
  );
  if (voiceId) {
    options.voiceId = voiceId;
  }
}
```

#### 4. PlayScreen / ReaderScreen

**Fichier** : `src/screens/PlayScreen.tsx`

**Modification de la fonction `speakLine`** :
```typescript
const gender = playSettings.characterVoices[line.characterId];
const characterId = line.characterId;

await ttsProviderManager.speak(line.text, {
  characterId,   // NOUVEAU
  gender,        // NOUVEAU
  rate: playSettings.defaultSpeed,
  volume: 1.0
});
```

---

## ✅ Critères de Validation

### Tests Fonctionnels

#### Test 1 : Assignation de Base
- [ ] Importer une pièce avec 4 personnages (2F, 2M)
- [ ] Ouvrir "Voix des personnages"
- [ ] **Vérifier** : Sélecteur provider en haut (Piper par défaut)
- [ ] **Vérifier** : Bouton "🔄 Réassigner" présent
- [ ] Définir les genres (2F, 2M)
- [ ] **Vérifier** : Voix assignées automatiquement et affichées
- [ ] Lire la pièce avec Piper
- [ ] **Vérifier** : 4 voix différentes (si 2+ voix par genre)

#### Test 2 : Persistance DB
- [ ] Configurer pièce avec assignations
- [ ] Fermer l'application
- [ ] Réouvrir (nouvelle session)
- [ ] **Vérifier** : Provider conservé
- [ ] **Vérifier** : Assignations restaurées ✅

#### Test 3 : Changement de Provider
- [ ] Pièce configurée avec Piper (assignations A)
- [ ] Changer provider → Google/Web Speech
- [ ] **Vérifier** : Nouvelles assignations générées (B)
- [ ] Revenir à Piper
- [ ] **Vérifier** : Assignations A restaurées ✅

#### Test 4 : Bouton Réassignation
- [ ] Click "🔄 Réassigner les voix"
- [ ] **Vérifier** : Dialog de confirmation
- [ ] Confirmer
- [ ] **Vérifier** : Nouvelles assignations générées
- [ ] **Vérifier** : Toujours diverse et respecte genres

#### Test 5 : Édition Manuelle
- [ ] Click "✏️ Édition" sur un personnage féminin
- [ ] **Vérifier** : Dropdown affiche voix féminines uniquement
- [ ] Sélectionner une voix spécifique
- [ ] **Vérifier** : Voix changée dans l'affichage
- [ ] Lire réplique
- [ ] **Vérifier** : Voix choisie est utilisée

#### Test 6 : Édition + Changement Genre
- [ ] Assigner manuellement voix féminine à JULIETTE
- [ ] Changer genre JULIETTE → Homme
- [ ] **Vérifier** : Nouvelle voix masculine assignée
- [ ] Click "✏️ Édition"
- [ ] **Vérifier** : Dropdown affiche voix masculines

#### Test 7 : Rotation Équitable
- [ ] Pièce avec 6 personnages du même genre
- [ ] Seulement 2 voix de ce genre disponibles
- [ ] **Vérifier** : Voix distribuées équitablement (3-3 ou 4-2)

### Tests Techniques

#### Test 1 : Structure de Données
```typescript
// Vérifier que les modèles ont bien la propriété gender
PIPER_MODELS.forEach(model => {
  assert(model.gender === 'male' || model.gender === 'female');
});
```

#### Test 2 : Algorithme
```typescript
const provider = new PiperWASMProvider();

// Test diversité
const voice1 = provider.selectVoiceForCharacter('char1', 'female');
const voice2 = provider.selectVoiceForCharacter('char2', 'female');
assert(voice1 !== voice2, 'Voix doivent être différentes');

// Test cohérence
const voice1Again = provider.selectVoiceForCharacter('char1', 'female');
assert(voice1 === voice1Again, 'Voix doit être identique');
```

---

## 📊 Métriques de Succès

### Indicateurs Clés

1. **Taux de Diversité** : Nombre de voix uniques / Nombre de personnages
   - Objectif : 100% si suffisamment de voix
   - Minimum acceptable : 50%

2. **Respect du Genre** : Voix correcte pour le genre
   - Objectif : 100%

3. **Cohérence** : Même voix pour même personnage
   - Objectif : 100%

### Exemple de Mesure

```
Pièce : 4 personnages (2F, 2M)
Voix : 2F, 2M disponibles

Résultat :
- Personnages : 4
- Voix uniques : 4
- Taux de diversité : 100% ✅
- Respect genre : 100% ✅
- Cohérence : 100% ✅
```

---

## 🚀 Roadmap

### Phase 1 - Modèle de Données

- [x] Spécification validée (ce document)
- [ ] Modifier `PlaySettings` : ajouter `ttsProvider`, `characterVoicesPiper`, `characterVoicesGoogle`
- [ ] Mettre à jour `createDefaultPlaySettings()` avec nouvelles propriétés
- [ ] Mise à jour du schéma Dexie (migration si nécessaire)

### Phase 2 - Logique Provider

- [ ] Créer `generateVoiceAssignments()` dans `PiperWASMProvider`
- [ ] Créer `generateVoiceAssignments()` dans `WebSpeechProvider`
- [ ] Supprimer cache mémoire (tout en DB maintenant)

### Phase 3 - UI Composants

- [ ] Créer `TTSProviderSelector.tsx` (sélecteur + bouton réassignation)
- [ ] Créer `CharacterVoiceEditor.tsx` (genre + dropdown édition)
- [ ] Refactoriser `VoiceAssignment.tsx` (intégrer les 2 nouveaux composants)

### Phase 4 - Store & Actions

- [ ] Ajouter `setTTSProvider()` dans playSettingsStore
- [ ] Ajouter `setCharacterVoiceAssignment()` dans playSettingsStore
- [ ] Ajouter `reassignAllVoices()` dans playSettingsStore

### Phase 5 - Tests

- [ ] Test : Persistance DB entre sessions
- [ ] Test : Changement provider (conservation assignations)
- [ ] Test : Bouton réassignation
- [ ] Test : Dropdown édition manuelle
- [ ] Test : 4 personnages → 4 voix différentes
- [ ] Test : Rotation équitable (6 perso, 2 voix)

---

## 📚 Références

### Code Existant

- `src/components/play/VoiceAssignment.tsx` - UI de sélection genre
- `src/core/tts/voice-manager.ts` - Logique Web Speech existante
- `src/state/playSettingsStore.ts` - Store avec `characterVoices`
- `src/core/models/Settings.ts` - Interface `PlaySettings`

### Documentation

- `plan/PIPER_WASM_ACTION_PLAN.md` - Plan complet Phase 2
- `plan/PIPER_WASM_ARCHITECTURE_DIAGRAMS.md` - Diagrammes de flux

---

## 📝 Notes

### Décisions de Conception

**Pourquoi ne pas laisser l'utilisateur choisir manuellement la voix pour chaque personnage systématiquement ?**

Réponse : Compromis UX. L'assignation automatique avec diversité maximale offre une bonne expérience par défaut. Mais on ajoute le bouton "✏️ Édition" pour permettre la personnalisation si l'utilisateur le souhaite.

**Pourquoi stocker les assignations en base de données ?**

Réponse : Pour la persistance entre les sessions. L'utilisateur configure sa pièce une fois (genres + éventuelles voix manuelles) et retrouve la même configuration à chaque session. C'est une exigence utilisateur validée.

**Pourquoi deux configurations séparées (Piper vs Google) ?**

Réponse : Les voix disponibles sont différentes entre providers. Si on ne séparait pas, changer de provider perdrait les assignations de l'autre. Avec deux configurations, l'utilisateur peut basculer sans perdre ses choix.

**Que se passe-t-il si l'utilisateur change de provider en cours de session ?**

Réponse : Les assignations sont spécifiques au provider (Map dans `PiperWASMProvider`). Au changement de provider, les assignations sont réinitialisées, et le nouveau provider réassigne selon son propre algorithme.

---

**Version** : 1.0  
**Auteur** : Équipe Répét  
**Dernière mise à jour** : 2025-01-12  
**Statut** : ✅ Validé - Prêt pour implémentation