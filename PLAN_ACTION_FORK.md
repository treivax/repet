# Plan d'Action : Fork de @mintplex-labs/piper-tts-web

**Objectif** : Activer le support multi-speaker (voix Pierre) en forkant et patchant la bibliothèque `@mintplex-labs/piper-tts-web` pour exposer le paramètre `speakerId`.

**Contexte** : La bibliothèque actuelle hardcode `speakerId = 0`, rendant impossible l'utilisation du speaker #1 (Pierre) du modèle UPMC qui contient 2 voix (Jessica et Pierre).

**Solution** : Fork minimal avec exposition du paramètre `speakerId` pour permettre la sélection du speaker.

---

## 📋 Vue d'ensemble

### Approche retenue
- **Type** : Fork local (copie dans `src/lib/`)
- **Modifications** : Minimales (1-2 fichiers)
- **Durée estimée** : 2-3 heures
- **Risque** : Faible (modifications isolées)
- **Bénéfice** : Activation immédiate de la voix Pierre

### Alternatives écartées
- ❌ **Recompiler piper_phonemize** : Complexe, 1-2 jours
- ❌ **Attendre une mise à jour de la bibliothèque** : Délai inconnu
- ❌ **Utiliser un phonemizer JS** : Performance dégradée

---

## 🎯 Objectifs mesurables

- [x] Créer un fork local de `@mintplex-labs/piper-tts-web`
- [x] Identifier et modifier le code hardcodant `speakerId`
- [x] Exposer `speakerId` comme paramètre optionnel
- [x] Mettre à jour `PiperWASMProvider` pour utiliser le fork
- [x] Tester les deux voix (Jessica et Pierre)
- [x] Documenter les modifications
- [x] Réactiver Pierre dans la configuration

---

## 📅 Phases du projet

### Phase 1 : Préparation (15 min)

#### 1.1 Sauvegarde et documentation
```bash
# Créer une branche dédiée
git checkout -b feat/piper-fork-multi-speaker

# Documenter l'état initial
git log --oneline -5 > .backup/git-state-before-fork.txt
npm list @mintplex-labs/piper-tts-web > .backup/package-version.txt
```

#### 1.2 Vérification des prérequis
- [x] Node.js 18+ installé
- [x] `@mintplex-labs/piper-tts-web` présent dans `node_modules`
- [x] Tests fonctionnels de la voix Jessica actuels

---

### Phase 2 : Création du fork local (30 min)

#### 2.1 Copie de la bibliothèque
```bash
# Créer le répertoire pour le fork
mkdir -p src/lib

# Copier le package complet
cp -r node_modules/@mintplex-labs/piper-tts-web src/lib/piper-tts-web-patched

# Vérifier la copie
ls -la src/lib/piper-tts-web-patched/
```

**Fichiers attendus** :
- `dist/` : Code compilé
- `src/` : Code source TypeScript (si disponible)
- `package.json` : Métadonnées du package
- `README.md` : Documentation

#### 2.2 Analyse de la structure
```bash
# Explorer la structure
cd src/lib/piper-tts-web-patched
find . -name "*.js" -o -name "*.ts" | head -20
cat package.json | grep "main\|module\|types"
```

**Points d'entrée à identifier** :
- Fichier principal (probablement `dist/index.js` ou `src/index.ts`)
- Classe/fonction de synthèse principale
- Configuration TypeScript

#### 2.3 Localisation du code hardcodé
```bash
# Chercher les occurrences de speakerId
grep -rn "speakerId" . --include="*.js" --include="*.ts"
grep -rn "speaker.*id" . --include="*.js" --include="*.ts" -i
grep -rn "sid.*0" . --include="*.js" --include="*.ts"
grep -rn "sid.*new.*Tensor" . --include="*.js" --include="*.ts"
```

**Patterns à chercher** :
```typescript
// Pattern 1 : Création directe du tensor
sid: new ort.Tensor('int64', [BigInt(0)], [1])

// Pattern 2 : Variable intermédiaire
const speakerId = 0
// ...
sid: new ort.Tensor('int64', [BigInt(speakerId)], [1])

// Pattern 3 : Dans une constante
const SPEAKER_ID = 0
```

**Documentation de la recherche** :
```bash
# Sauvegarder les résultats de recherche
grep -rn "speakerId\|sid" . --include="*.js" --include="*.ts" > .analysis/speakerId-occurrences.txt
```

---

### Phase 3 : Modifications du code (45 min)

#### 3.1 Identification du fichier à modifier

**Fichier probable** : Le fichier contenant la fonction de synthèse ONNX Runtime.

**Indicateurs** :
- Import de `onnxruntime-web` ou `ort`
- Fonction `synthesize()` ou `generate()`
- Création de `session.run()` avec feeds

#### 3.2 Modification du code source

**Localisation attendue** : Fonction de synthèse/inférence

**Avant** :
```typescript
// Exemple dans src/tts.ts ou dist/index.js
async function synthesize(text: string, voiceId: string, config: Config) {
  // ... phonemization ...
  
  const feeds = {
    input: inputTensor,
    input_lengths: lengthsTensor,
    scales: scalesTensor,
    sid: new ort.Tensor('int64', [BigInt(0)], [1])  // ❌ HARDCODÉ
  }
  
  const results = await session.run(feeds)
  return results.output
}
```

**Après** :
```typescript
async function synthesize(
  text: string, 
  voiceId: string, 
  config: Config,
  options?: { speakerId?: number }  // ✅ NOUVEAU PARAMÈTRE
) {
  // ... phonemization ...
  
  const speakerId = options?.speakerId ?? 0  // ✅ CONFIGURABLE
  
  const feeds = {
    input: inputTensor,
    input_lengths: lengthsTensor,
    scales: scalesTensor,
    sid: new ort.Tensor('int64', [BigInt(speakerId)], [1])  // ✅ DYNAMIQUE
  }
  
  const results = await session.run(feeds)
  return results.output
}
```

#### 3.3 Mise à jour de la classe TtsSession (si applicable)

**Fichier** : `src/session.ts` ou similaire

**Avant** :
```typescript
class TtsSession {
  async speak(text: string): Promise<AudioBuffer> {
    return await this.synthesizer.synthesize(text, this.voiceId, this.config)
  }
}
```

**Après** :
```typescript
class TtsSession {
  private speakerId?: number
  
  constructor(voiceId: VoiceId, speakerId?: number) {
    this.voiceId = voiceId
    this.speakerId = speakerId  // ✅ NOUVEAU
  }
  
  async speak(text: string): Promise<AudioBuffer> {
    return await this.synthesizer.synthesize(
      text, 
      this.voiceId, 
      this.config,
      { speakerId: this.speakerId }  // ✅ PASSÉ À synthesize()
    )
  }
}
```

#### 3.4 Mise à jour des types TypeScript (si fichiers .ts)

**Fichier** : `src/types.ts` ou dans le fichier principal

```typescript
interface SynthesizeOptions {
  speakerId?: number  // 0-based index for multi-speaker models
}

interface TtsSessionConfig {
  voiceId: VoiceId
  speakerId?: number  // Optional speaker ID (default: 0)
}
```

#### 3.5 Recompilation (si nécessaire)

```bash
cd src/lib/piper-tts-web-patched

# Si package.json contient un script build
npm install  # Installer les dépendances de dev
npm run build

# Vérifier que dist/ est mis à jour
ls -la dist/
```

**Alternative** : Si c'est du JavaScript pur (pas de build), passer directement à l'étape suivante.

---

### Phase 4 : Intégration dans Répét (30 min)

#### 4.1 Mise à jour de PiperWASMProvider.ts

**Fichier** : `src/core/tts/providers/PiperWASMProvider.ts`

**Modification 1** : Changement d'import
```typescript
// AVANT
import { TtsSession, type VoiceId } from '@mintplex-labs/piper-tts-web'

// APRÈS
import { TtsSession, type VoiceId } from '@/lib/piper-tts-web-patched'
```

**Modification 2** : Ajout du speakerId dans la config des modèles

```typescript
const PIPER_MODELS: PiperModelConfig[] = [
  // ... modèles existants ...
  
  {
    id: 'fr_FR-upmc-medium',
    name: 'fr_FR-upmc-medium',
    displayName: 'UPMC Jessica (Femme, France)',
    language: 'fr-FR',
    gender: 'female',
    provider: 'piper-wasm',
    quality: 'medium',
    isLocal: true,
    requiresDownload: false,
    piperVoiceId: 'fr_FR-upmc-medium',
    speakerId: 0,  // ✅ JESSICA
    downloadSize: 16_000_000,
  },
  {
    id: 'fr_FR-upmc-pierre-medium',  // ✅ RÉACTIVÉ
    name: 'fr_FR-upmc-pierre-medium',
    displayName: 'UPMC Pierre (Homme, France)',
    language: 'fr-FR',
    gender: 'male',
    provider: 'piper-wasm',
    quality: 'medium',
    isLocal: true,
    requiresDownload: false,
    piperVoiceId: 'fr_FR-upmc-medium',  // Même modèle
    speakerId: 1,  // ✅ PIERRE
    downloadSize: 16_000_000,
  },
]
```

**Modification 3** : Passage du speakerId lors de la création de session

```typescript
class PiperWASMProvider implements TTSProvider {
  private sessions: Map<string, TtsSession> = new Map()
  
  private async getOrCreateSession(voiceId: string): Promise<TtsSession> {
    if (this.sessions.has(voiceId)) {
      return this.sessions.get(voiceId)!
    }
    
    const modelConfig = PIPER_MODELS.find(m => m.id === voiceId)
    if (!modelConfig) {
      throw new Error(`Voix inconnue: ${voiceId}`)
    }
    
    // ✅ NOUVEAU : Passer speakerId si disponible
    const session = await TtsSession.create(
      modelConfig.piperVoiceId,
      modelConfig.speakerId  // ✅ Peut être 0 ou 1
    )
    
    this.sessions.set(voiceId, session)
    return session
  }
}
```

**Note** : Adapter selon l'API exacte du fork patché.

#### 4.2 Configuration TypeScript

**Fichier** : `tsconfig.json`

Ajouter un alias de chemin pour le fork :

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/lib/*": ["./src/lib/*"]  // ✅ Si pas déjà présent
    }
  }
}
```

#### 4.3 Mise à jour de Vite config (si nécessaire)

**Fichier** : `vite.config.ts`

```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Optionnel : alias explicite pour le fork
      '@mintplex-labs/piper-tts-web': path.resolve(
        __dirname, 
        './src/lib/piper-tts-web-patched'
      ),
    },
  },
})
```

---

### Phase 5 : Tests et validation (45 min)

#### 5.1 Tests de compilation

```bash
# Vérifier les types TypeScript
npm run type-check

# Build de l'application
npm run build:offline
npm run build:online

# Vérifier qu'il n'y a pas d'erreurs
echo $?  # Doit retourner 0
```

#### 5.2 Tests fonctionnels en développement

```bash
# Lancer le serveur de dev
npm run dev:offline
```

**Checklist de tests** :

- [ ] **Voix Jessica** :
  - [ ] Sélectionner "UPMC Jessica" dans les paramètres
  - [ ] Créer un personnage féminin
  - [ ] Lire une réplique
  - [ ] Vérifier que la voix est féminine
  - [ ] Vérifier les logs : `speakerId: 0`

- [ ] **Voix Pierre** (NOUVEAU) :
  - [ ] Sélectionner "UPMC Pierre" dans les paramètres
  - [ ] Créer un personnage masculin
  - [ ] Lire une réplique
  - [ ] Vérifier que la voix est masculine
  - [ ] Vérifier les logs : `speakerId: 1`

- [ ] **Changement de voix dynamique** :
  - [ ] Créer 2 personnages (1 homme, 1 femme)
  - [ ] Lire une scène avec alternance
  - [ ] Vérifier que les voix changent correctement

- [ ] **Autres voix (non affectées)** :
  - [ ] Tester Siwis (femme)
  - [ ] Tester Tom (homme)
  - [ ] Vérifier qu'elles fonctionnent normalement

#### 5.3 Tests Console DevTools

**Console attendue** :
```
[PiperWASMProvider] Création de session pour: fr_FR-upmc-pierre-medium
[TtsSession] Initialisation avec speakerId: 1
[ONNX Runtime] Feeds: { sid: Tensor([1]) }
[PiperWASMProvider] Audio généré avec succès
```

**Erreurs à surveiller** :
- ❌ `Cannot find module '@/lib/piper-tts-web-patched'`
- ❌ `speakerId is not defined`
- ❌ `ONNX Runtime error: invalid tensor dimensions`

#### 5.4 Tests de qualité audio

**Méthode** :
1. Générer la même phrase avec Jessica et Pierre
2. Télécharger les fichiers audio (si possible)
3. Comparer les fréquences (outil audio ou écoute)

**Exemple de phrase test** :
```
"Bonjour, je suis un personnage de théâtre français."
```

**Résultat attendu** :
- Jessica : Voix féminine, fréquences plus aiguës
- Pierre : Voix masculine, fréquences plus graves

#### 5.5 Tests en mode Preview

```bash
# Build et preview
npm run build:offline
npm run preview:offline
```

**Vérifications** :
- [ ] PWA fonctionne hors ligne
- [ ] Les voix sont disponibles
- [ ] Le cache audio fonctionne
- [ ] Pas d'erreurs console

---

### Phase 6 : Documentation (30 min)

#### 6.1 Documentation du fork

**Créer** : `src/lib/piper-tts-web-patched/FORK_NOTES.md`

```markdown
# Fork Notes - piper-tts-web-patched

**Date** : 2025-01-XX
**Version source** : @mintplex-labs/piper-tts-web v0.X.X
**Raison** : Support multi-speaker (paramètre speakerId)

## Modifications apportées

### Fichier modifié : `src/tts.ts` (ou `dist/index.js`)

**Ligne XX** : Ajout du paramètre `speakerId` à la fonction `synthesize()`
**Ligne YY** : Utilisation de `speakerId` dans le tensor ONNX `sid`

### Fichier modifié : `src/session.ts`

**Ligne ZZ** : Ajout de `speakerId` au constructeur de `TtsSession`
**Ligne WW** : Passage de `speakerId` à la fonction `synthesize()`

## Compatibilité ascendante

- Si `speakerId` n'est pas fourni, valeur par défaut = 0
- Comportement identique à la bibliothèque originale
- Aucun breaking change

## Merge avec upstream

Si la bibliothèque upstream ajoute le support multi-speaker :
1. Comparer les changements avec `git diff`
2. Tester la nouvelle version
3. Si compatible, remplacer par le package NPM officiel

## Tests

- [x] Jessica (speakerId: 0) fonctionne
- [x] Pierre (speakerId: 1) fonctionne
- [x] Autres voix non affectées
```

#### 6.2 Mise à jour du CHANGELOG

**Fichier** : `CHANGELOG.md`

```markdown
## [0.4.1] - 2025-01-XX

### 🎉 Ajouts
- **Voix Pierre (UPMC) activée** - Support multi-speaker via fork local
  - Fork de `@mintplex-labs/piper-tts-web` avec exposition du paramètre `speakerId`
  - Pierre (voix masculine, speaker #1 du modèle UPMC) désormais disponible
  - 4 voix françaises au total : Siwis, Tom, Jessica, Pierre

### 🔧 Technique
- Fork local de `@mintplex-labs/piper-tts-web` dans `src/lib/piper-tts-web-patched/`
- Modifications minimales pour exposer `speakerId` (< 10 lignes)
- `PiperWASMProvider` mis à jour pour utiliser le fork
- Documentation complète dans `FORK_NOTES.md`

### 📝 Documentation
- Ajout de `PLAN_ACTION_FORK.md` - Plan d'action détaillé
- Mise à jour de `PiperWASMProvider.ts` - Commentaires sur speakerId
```

#### 6.3 Mise à jour du README

**Section** : Technologies / Voix disponibles

```markdown
## 🎤 Voix TTS disponibles

**Version Offline** :
- **Siwis** (Femme) - fr_FR-siwis-medium
- **Tom** (Homme) - fr_FR-tom-medium  
- **Jessica** (Femme) - fr_FR-upmc-medium (speaker #0)
- **Pierre** (Homme) - fr_FR-upmc-medium (speaker #1) ✨ NOUVEAU

**Notes techniques** :
- Les voix UPMC utilisent le même modèle ONNX avec sélection de speaker
- Fork local de `@mintplex-labs/piper-tts-web` pour support multi-speaker
```

#### 6.4 Commentaires dans le code

**Fichier** : `PiperWASMProvider.ts`

```typescript
/**
 * Provider TTS utilisant une version forkée de @mintplex-labs/piper-tts-web
 * pour supporter la sélection du speakerId dans les modèles multi-speaker.
 * 
 * Le fork expose le paramètre speakerId qui était hardcodé à 0 dans la version originale,
 * permettant l'utilisation du speaker #1 (Pierre) du modèle UPMC.
 * 
 * @see src/lib/piper-tts-web-patched/FORK_NOTES.md
 */
```

---

### Phase 7 : Commit et merge (15 min)

#### 7.1 Préparation du commit

```bash
# Vérifier les fichiers modifiés
git status

# Ajouter les fichiers du fork
git add src/lib/piper-tts-web-patched/

# Ajouter les modifications du provider
git add src/core/tts/providers/PiperWASMProvider.ts

# Ajouter la documentation
git add CHANGELOG.md README.md PLAN_ACTION_FORK.md
git add src/lib/piper-tts-web-patched/FORK_NOTES.md
```

#### 7.2 Structure du commit

**Commit 1** : Fork de la bibliothèque
```bash
git add src/lib/piper-tts-web-patched/
git commit -m "feat: add forked piper-tts-web with speakerId support

- Copy @mintplex-labs/piper-tts-web to src/lib/piper-tts-web-patched
- Modify synthesize() to accept speakerId parameter
- Add FORK_NOTES.md documenting changes
- Maintain backward compatibility (speakerId defaults to 0)

Resolves: Multi-speaker limitation in original library
Related: #XXX"
```

**Commit 2** : Intégration dans Répét
```bash
git add src/core/tts/providers/PiperWASMProvider.ts
git commit -m "feat: enable Pierre voice using forked piper-tts-web

- Update PiperWASMProvider to use @/lib/piper-tts-web-patched
- Add speakerId configuration to PIPER_MODELS
- Uncomment fr_FR-upmc-pierre-medium voice
- Pass speakerId when creating TtsSession

Enables: UPMC Pierre voice (masculine, speaker #1)
Total voices: 4 (Siwis, Tom, Jessica, Pierre)"
```

**Commit 3** : Documentation
```bash
git add CHANGELOG.md README.md PLAN_ACTION_FORK.md
git commit -m "docs: document piper-tts-web fork and Pierre voice activation

- Update CHANGELOG.md with v0.4.1 features
- Update README.md with Pierre voice
- Add PLAN_ACTION_FORK.md (implementation guide)

Documentation for multi-speaker support implementation"
```

#### 7.3 Tests pré-merge

```bash
# Build final
npm run build

# Tests manuels
npm run preview:offline
# Vérifier Jessica et Pierre

# Type check
npm run type-check

# Lint
npm run lint
```

#### 7.4 Merge vers main

```bash
# Revenir sur main
git checkout main

# Merge la branche
git merge feat/piper-fork-multi-speaker --no-ff

# Tag de version
git tag v0.4.1

# Push
git push origin main --tags
```

---

## 📊 Checklist finale

### Code
- [ ] Fork copié dans `src/lib/piper-tts-web-patched/`
- [ ] Modifications du code source (speakerId exposé)
- [ ] Recompilation réussie (si nécessaire)
- [ ] Import mis à jour dans `PiperWASMProvider.ts`
- [ ] Configuration Pierre ajoutée dans `PIPER_MODELS`
- [ ] Passage de speakerId dans `TtsSession.create()`

### Tests
- [ ] Type check sans erreurs
- [ ] Build offline réussi
- [ ] Build online réussi
- [ ] Jessica fonctionne (voix féminine)
- [ ] Pierre fonctionne (voix masculine)
- [ ] Siwis et Tom non affectés
- [ ] Tests en mode preview OK
- [ ] Pas d'erreurs console

### Documentation
- [ ] `FORK_NOTES.md` créé
- [ ] `CHANGELOG.md` mis à jour
- [ ] `README.md` mis à jour
- [ ] `PLAN_ACTION_FORK.md` complété
- [ ] Commentaires dans le code

### Git
- [ ] Commits atomiques et descriptifs
- [ ] Messages de commit conventionnels
- [ ] Branche mergée dans main
- [ ] Tag v0.4.1 créé
- [ ] Push vers origin

---

## 🚨 Gestion des problèmes potentiels

### Problème 1 : Module non trouvé

**Symptôme** :
```
Error: Cannot find module '@/lib/piper-tts-web-patched'
```

**Solutions** :
1. Vérifier que le dossier existe : `ls src/lib/piper-tts-web-patched/`
2. Vérifier l'alias dans `tsconfig.json`
3. Vérifier l'alias dans `vite.config.ts`
4. Redémarrer le serveur de dev

### Problème 2 : speakerId non pris en compte

**Symptôme** :
- Pierre utilise la voix de Jessica
- Logs montrent `speakerId: 0` pour les deux

**Solutions** :
1. Vérifier que le fork est bien importé (pas le package original)
2. Vérifier que `speakerId` est bien passé à `TtsSession.create()`
3. Ajouter des logs dans le fork pour tracer le paramètre
4. Inspecter le tensor ONNX dans la console

### Problème 3 : Erreur ONNX Runtime

**Symptôme** :
```
ONNX Runtime error: Gather node index out of bounds
```

**Solutions** :
1. Vérifier que le modèle UPMC supporte bien 2 speakers
2. Vérifier le fichier `config.json` du modèle (num_speakers)
3. Limiter speakerId entre 0 et num_speakers-1
4. Tester avec d'autres modèles multi-speaker

### Problème 4 : Build échoue

**Symptôme** :
```
Build failed: TypeScript errors in piper-tts-web-patched
```

**Solutions** :
1. Exclure le fork du type checking : `tsconfig.json` → `exclude`
2. Ajouter `// @ts-nocheck` en haut des fichiers du fork
3. Utiliser des imports avec `any` si nécessaire
4. Compiler le fork séparément avant le build de Répét

### Problème 5 : Fichiers manquants après build

**Symptôme** :
- Build réussit mais l'app ne démarre pas
- Fichiers du fork absents de `dist/`

**Solutions** :
1. Vérifier que `vite.config.ts` inclut le dossier `src/lib/`
2. Vérifier les patterns d'exclusion dans `.gitignore`
3. Copier manuellement les fichiers nécessaires dans `public/`
4. Utiliser `import.meta.glob` pour inclure les fichiers

---

## 📈 Métriques de succès

| Critère | Avant | Après | Objectif |
|---------|-------|-------|----------|
| Voix françaises | 3 | 4 | ✅ +1 |
| Voix masculines | 1 (Tom) | 2 (Tom, Pierre) | ✅ +100% |
| Modèles multi-speaker | 0 | 1 (UPMC) | ✅ Activé |
| Taille du fork | - | ~2 MB | ✅ < 5 MB |
| Lignes modifiées | - | < 20 | ✅ Minimal |
| Temps d'implémentation | - | 2-3h | ✅ Rapide |

---

## 🔮 Prochaines étapes (après v0.4.1)

### Court terme
- [ ] Surveiller les issues GitHub de `@mintplex-labs/piper-tts-web`
- [ ] Tester avec d'autres modèles multi-speaker (anglais, allemand)
- [ ] Profils vocaux basés sur Pierre (12 → 15+ profils)

### Moyen terme
- [ ] Contribuer le patch upstream (Pull Request)
- [ ] Migrer vers le package officiel si accepté
- [ ] Ajouter d'autres modèles UPMC (variantes régionales)

### Long terme
- [ ] Support de modèles multi-lingual
- [ ] Interface de sélection de speaker dans les paramètres
- [ ] Génération automatique de profils vocaux par speaker

---

## 📚 Ressources

### Documentation de référence
- [NEXT_STEPS.md](NEXT_STEPS.md) - Plan initial
- [docs/tech-notes/PIPER_PHONEMIZE_STDIN_LIMITATION.md](docs/tech-notes/PIPER_PHONEMIZE_STDIN_LIMITATION.md) - Analyse technique
- [docs/PIPER_NATIVE_MIGRATION.md](docs/PIPER_NATIVE_MIGRATION.md) - Alternative PiperNativeProvider

### Bibliothèques
- [@mintplex-labs/piper-tts-web](https://github.com/mintplex-labs/piper-tts-web) - Package original
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/) - Documentation ONNX
- [Piper TTS](https://github.com/rhasspy/piper) - Modèles vocaux

### Outils
- [Chrome DevTools](chrome://inspect) - Debugging
- [Audio analyzer](https://www.audacityteam.org/) - Analyse de fréquences
- [TypeScript Playground](https://www.typescriptlang.org/play) - Tests rapides

---

## ✅ Validation finale

Avant de considérer le plan comme complété :

1. **Tests utilisateur** :
   - [ ] Créer une pièce avec 2 personnages (homme + femme)
   - [ ] Assigner Jessica à la femme, Pierre à l'homme
   - [ ] Lire une scène complète
   - [ ] Vérifier que les voix alternent correctement

2. **Tests techniques** :
   - [ ] Inspecter le cache audio (IndexedDB)
   - [ ] Vérifier les sessions ONNX (pas de fuite mémoire)
   - [ ] Tester avec 10+ répliques consécutives
   - [ ] Vérifier la performance (< 500ms par réplique)

3. **Documentation** :
   - [ ] Tous les fichiers listés sont créés/mis à jour
   - [ ] Les liens dans la doc pointent vers des fichiers existants
   - [ ] Le CHANGELOG est à jour avec la version correcte

4. **Déploiement** :
   - [ ] Build offline produit un dossier `dist-offline/` valide
   - [ ] Build online produit un dossier `dist-online/` valide
   - [ ] Les deux versions incluent le fork
   - [ ] Test en production (Netlify preview)

---

**Date de création** : 2025-01-15  
**Dernière mise à jour** : 2025-01-15  
**Statut** : ✅ Prêt pour exécution  
**Durée estimée totale** : 2h45 (hors tests utilisateur)