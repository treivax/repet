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

Étendre le système d'assignation de voix pour **Piper-WASM** avec les exigences suivantes :

1. **Différenciation par genre** - Voix masculines vs féminines clairement identifiées
2. **Maximisation de la diversité** - Assigner des voix différentes à chaque personnage
3. **Cohérence** - Même personnage = même voix durant toute la session
4. **Respect du genre** - Personnage féminin → voix féminine obligatoirement

---

## 📐 Spécifications Fonctionnelles

### 1. Modèles Vocaux Piper

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

### 2. Algorithme d'Assignation

#### Principe

**Objectif** : Maximiser la diversité vocale tout en respectant les genres.

**Stratégie** : Rotation équitable (Round-Robin) des voix disponibles par genre.

#### Pseudo-code

```
FONCTION selectVoiceForCharacter(characterId, gender):
  
  // 1. Vérifier le cache (cohérence)
  SI voiceAssignments.has(characterId):
    RETOURNER voiceAssignments.get(characterId)
  
  // 2. Filtrer les voix du bon genre
  voicesOfGender = FILTRER(PIPER_MODELS, model => model.gender == gender)
  
  SI voicesOfGender est vide:
    RETOURNER première voix disponible (fallback)
  
  // 3. Trouver la voix la moins utilisée
  selectedVoice = voicesOfGender[0]
  minUsage = voiceUsageCount.get(selectedVoice.id) OU 0
  
  POUR CHAQUE voice DANS voicesOfGender:
    usage = voiceUsageCount.get(voice.id) OU 0
    SI usage < minUsage:
      minUsage = usage
      selectedVoice = voice
  
  // 4. Enregistrer l'assignation
  voiceAssignments.set(characterId, selectedVoice.id)
  voiceUsageCount.set(selectedVoice.id, minUsage + 1)
  
  RETOURNER selectedVoice.id

FIN FONCTION
```

#### Structures de Données

```typescript
class PiperWASMProvider {
  // Cache d'assignation (persistant durant la session)
  private voiceAssignments: Map<string, string> = new Map();
  // characterId -> voiceId
  
  // Compteur d'utilisation (pour rotation équitable)
  private voiceUsageCount: Map<string, number> = new Map();
  // voiceId -> count
}
```

---

### 3. Scénarios d'Usage

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

#### Scénario 3 : Cohérence de Session

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

#### Scénario 4 : Changement de Genre

**Contexte** :
- JULIETTE assignée à Siwis (voix féminine)

**Action** :
1. Utilisateur change JULIETTE de "Femme" à "Homme" dans "Voix des personnages"

**Résultat Attendu** :
- JULIETTE → Voix masculine (ex: Tom) ✅
- Cache invalidé pour ce personnage
- Nouvelle assignation selon algorithme

---

### 4. Cas Limites

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
```typescript
// Réinitialiser les assignations
resetVoiceAssignments(): void {
  this.voiceAssignments.clear();
  this.voiceUsageCount.clear();
}
```

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

#### 1. PiperWASMProvider

**Fichier** : `src/core/tts/provider/PiperWASMProvider.ts`

**Nouvelles propriétés** :
```typescript
private voiceAssignments: Map<string, string> = new Map();
private voiceUsageCount: Map<string, number> = new Map();
```

**Nouvelles méthodes** :
```typescript
selectVoiceForCharacter(characterId: string, gender: Gender): string
resetVoiceAssignments(): void
```

#### 2. TTSProviderManager

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

#### 3. PlayScreen / ReaderScreen

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
- [ ] Définir les genres dans "Voix des personnages"
- [ ] Lire la pièce avec Piper
- [ ] **Vérifier** : 4 voix différentes (si 2+ voix par genre)

#### Test 2 : Cohérence
- [ ] Lire plusieurs fois la même réplique
- [ ] **Vérifier** : Même voix à chaque fois

#### Test 3 : Changement de Genre
- [ ] Changer le genre d'un personnage
- [ ] Relire une réplique de ce personnage
- [ ] **Vérifier** : Nouvelle voix du bon genre

#### Test 4 : Rotation Équitable
- [ ] Pièce avec 6 personnages du même genre
- [ ] Seulement 2 voix de ce genre disponibles
- [ ] **Vérifier** : Voix distribuées équitablement (3-3 ou 4-2)

#### Test 5 : Persistance Session
- [ ] Lire une pièce (assignations effectuées)
- [ ] Naviguer vers autre écran
- [ ] Revenir à la lecture
- [ ] **Vérifier** : Assignations conservées

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

### Phase 2.2 - Implémentation (Dans PIPER_WASM_ACTION_PLAN.md)

- [x] Spécification validée (ce document)
- [ ] Créer `selectVoiceForCharacter()` dans `PiperWASMProvider`
- [ ] Ajouter structures `voiceAssignments` et `voiceUsageCount`
- [ ] Modifier `TTSProviderManager.speak()` pour passer `characterId` et `gender`
- [ ] Modifier `PlayScreen.speakLine()` pour utiliser le nouveau système
- [ ] Ajouter `resetVoiceAssignments()` lors du changement de pièce

### Phase 2.6 - Tests (Dans PIPER_WASM_ACTION_PLAN.md)

- [ ] Test : 4 personnages → 4 voix différentes
- [ ] Test : Cohérence sur multiple lectures
- [ ] Test : Changement de genre
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

**Pourquoi ne pas laisser l'utilisateur choisir manuellement la voix pour chaque personnage ?**

Réponse : Simplicité UX. L'assignation automatique avec diversité maximale offre une meilleure expérience sans surcharger l'interface. L'utilisateur contrôle le genre (M/F), le système optimise la distribution.

**Pourquoi stocker les assignations en mémoire et non en base de données ?**

Réponse : Les assignations sont spécifiques à la session et dépendent des voix disponibles (qui peuvent changer selon le provider). Les stocker serait source de bugs si les voix changent. Le genre est persisté, c'est suffisant.

**Que se passe-t-il si l'utilisateur change de provider en cours de session ?**

Réponse : Les assignations sont spécifiques au provider (Map dans `PiperWASMProvider`). Au changement de provider, les assignations sont réinitialisées, et le nouveau provider réassigne selon son propre algorithme.

---

**Version** : 1.0  
**Auteur** : Équipe Répét  
**Dernière mise à jour** : 2025-01-12  
**Statut** : ✅ Validé - Prêt pour implémentation