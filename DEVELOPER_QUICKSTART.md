# 🚀 Developer Quickstart - Répét

Guide rapide pour démarrer le développement sur Répét après la mise en conformité v0.2.0.

---

## ⚡ Installation Rapide

```bash
cd repet
npm install
npm run dev
```

Ouvrir http://localhost:5173

---

## 🏗️ Architecture Post-v0.2.0

### Structure AST (NOUVEAU)

```typescript
Play {
  id: string
  fileName: string
  ast: PlayAST {              // ← Structure hiérarchique complète
    metadata: PlayMetadata    // titre, auteur, année
    characters: Character[]   // liste unique
    acts: Act[]              // actes → scènes → lignes
    flatLines: Line[]        // tableau aplati (navigation)
  }
  createdAt: Date
  updatedAt: Date
}
```

### Accès aux Données (IMPORTANT)

❌ **NE PAS FAIRE** :
```typescript
const title = play.title        // ❌ N'existe plus !
const lines = play.lines        // ❌ N'existe plus !
```

✅ **FAIRE** :
```typescript
import { getPlayTitle, getPlayLines } from '../core/models/playHelpers'

const title = getPlayTitle(play)     // ✅ Correct
const lines = getPlayLines(play)     // ✅ Correct
```

### Helpers Disponibles

```typescript
getPlayTitle(play)        // → play.ast.metadata.title
getPlayAuthor(play)       // → play.ast.metadata.author
getPlayYear(play)         // → play.ast.metadata.year
getPlayCategory(play)     // → play.ast.metadata.category
getPlayCharacters(play)   // → play.ast.characters
getPlayLines(play)        // → play.ast.flatLines
getPlayActs(play)         // → play.ast.acts
```

---

## 📝 Parser Conforme

### Utilisation

```typescript
import { parsePlayText } from './core/parser/textParser'
import { generateUUID } from './utils/uuid'

// Parser le texte
const ast = parsePlayText(fileContent, fileName)

// Convertir en Play pour storage
const play: Play = {
  id: generateUUID(),
  fileName,
  ast,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Sauvegarder
await playsRepository.add(play)
```

### Format de Fichier Attendu

```text
Titre de la Pièce

Auteur: Victor Hugo
Annee: 1850

ACTE I - Premier Acte

Scène 1 - La rencontre

Didascalie hors réplique (en italique gris).

HAMLET:
Texte de la réplique.
Peut contenir plusieurs lignes.

OPHÉLIE:
Autre réplique avec (didascalie inline).
```

---

## 🎭 Modes de Lecture

### Configuration

```typescript
import { usePlaySettingsStore } from './state/playSettingsStore'

const store = usePlaySettingsStore()

// Changer le mode
store.setReadingMode(playId, 'italian')

// Sélectionner personnage utilisateur
store.setUserCharacter(playId, 'HAMLET')

// Assigner sexe à un personnage
store.setCharacterGender(playId, 'OPHÉLIE', 'female')
```

### Logique de Lecture

```typescript
import { createReadingModeConfig } from './core/tts/readingModes'

const config = createReadingModeConfig('italian', {
  voiceOffEnabled: true,
  hideUserLines: true,
  showBefore: false,
  showAfter: true,
})

// Vérifier si ligne doit être lue
if (config.shouldRead(line, userCharacterId)) {
  const volume = config.getVolume(line, userCharacterId)  // 0 ou 1
  // Lire avec TTS
}
```

### Règles par Mode

**Silent** : Pas de lecture
**Audio** : Lecture normale, didascalies si voix off
**Italian** : Répliques utilisateur volume 0, masquage optionnel

---

## 🧪 Tests

### Lancer Tests

```bash
npm test                    # Tous les tests
npm test -- parser.test.ts  # Tests parser uniquement
npm run test:ui             # Interface Vitest
```

### Valider Build

```bash
npm run type-check    # TypeScript
npm run lint          # ESLint
npm run build         # Production
```

---

## 📂 Fichiers Clés

### Parser
- `src/core/parser/textParser.ts` - Parser conforme spec ✅
- `src/core/parser/parser.ts` - Legacy (@deprecated)
- `src/core/parser/__tests__/parser.test.ts` - Tests

### Modèles
- `src/core/models/Play.ts` - PlayAST, Act, Scene
- `src/core/models/playHelpers.ts` - Helpers d'accès
- `src/core/models/Settings.ts` - PlaySettings

### TTS
- `src/core/tts/readingModes.ts` - Logique modes
- `src/core/tts/voice-manager.ts` - Gestion voix

### Stores
- `src/state/playStore.ts` - État pièce courante
- `src/state/playSettingsStore.ts` - Settings par pièce
- `src/state/settingsStore.ts` - Settings globaux

---

## 🔧 Commandes Utiles

```bash
# Développement
npm run dev                 # Dev server (HMR)
npm run type-check          # Vérif TypeScript
npm run lint                # Vérif ESLint
npm run format              # Formatter Prettier

# Production
npm run build               # Build prod
npm run preview             # Prévisualiser build

# Tests
npm test                    # Tests unitaires
npm run test:ui             # UI Vitest
```

---

## 🎯 Phases Restantes (TODO)

### Phase 5 : Interface Configuration ⏸️
Créer `PlayConfigScreen.tsx` avec 5 blocs :
- Infos pièce
- Méthode de lecture (3 boutons)
- Voix (liste personnages + sexe)
- Réglages audio
- Réglages italiennes

### Phase 6 : Écran de Lecture ⏸️
Refondre `ReaderScreen.tsx` :
- Sommaire actes/scènes cliquable
- Navigation par scène (pas ligne)
- Affichage adapté au mode
- Masquage répliques utilisateur

### Phase 7 : Tests ⏸️
- Fixer timeout Vitest
- Tests exhaustifs 3 modes
- Tests cross-browser

### Phase 8 : Documentation ⏸️
- Guide format fichier
- Tutoriel mode italiennes
- Captures d'écran

---

## 📚 Documentation

- `plans/plan-mise-en-conformite-spec.md` - Plan 8 phases
- `PROJECT_STATUS.md` - État détaillé
- `WORK_SUMMARY.md` - Résumé travaux v0.2.0
- `spec/appli.txt` - Spécification fonctionnelle
- `.github/prompts/common.md` - Standards de code

---

## 🐛 Problèmes Connus

- ❌ Tests Vitest timeout (>60s) - À optimiser
- ⚠️ UI non conforme spec - Phases 5-6 à faire
- ⚠️ Navigation ligne-par-ligne - À remplacer par scènes

---

## ✅ Validation Avant Commit

```bash
npm run type-check   # ✅ 0 erreur
npm run lint         # ✅ 0 warning
npm run build        # ✅ Succès
```

---

## 🆘 Aide Rapide

**Parser un fichier** :
→ `parsePlayText(text, fileName)` retourne `PlayAST`

**Accéder aux données Play** :
→ Utiliser `getPlay*()` helpers

**Changer le mode de lecture** :
→ `usePlaySettingsStore().setReadingMode(playId, mode)`

**Assigner une voix** :
→ `usePlaySettingsStore().setCharacterGender(playId, charId, gender)`

**Fichier de test** :
→ `examples/ALEGRIA.txt`

---

**Prêt à coder !** 🚀

Pour plus de détails, voir `PROJECT_STATUS.md` et le plan complet dans `plans/`.