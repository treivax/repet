# Problèmes de Voix TTS et Solutions

## Résumé

Ce document décrit les problèmes rencontrés avec certaines voix TTS Piper et les solutions mises en place pour garantir un fonctionnement fiable du système de synthèse vocale.

## 📋 Historique des Problèmes

### 1. Deadlock au Démarrage (Résolu ✅)

**Symptôme** : L'application se bloquait sur l'écran "Initialisation de l'application" au démarrage.

**Cause** : Boucle de réinitialisation dans `AudioCacheService.initialize()`
- Le processus de vérification/invalidation du cache déclenchait une réinitialisation
- Cette réinitialisation créait une boucle infinie (re-entrée dans `initialize()`)

**Solution** :
- Suppression de la boucle de versionnage automatique
- Ajout d'un nettoyage du cache audio au démarrage
- Implémentation de `deleteByVoiceId()` pour vider le cache par voix

### 2. Voix MLS - Audio Distordu (Résolu ✅)

**Voix concernée** : `fr_FR-mls-medium`

**Symptôme** : Audio distordu ou inintelligible sur certaines lignes

**Tentatives de correction** :
- Nettoyage heuristique du texte avant phonémisation → Pire qualité
- Filtrage des caractères spéciaux → Pas d'amélioration

**Solution finale** :
- ❌ Voix MLS retirée de la liste des voix disponibles
- ✅ Remplacement par d'autres voix françaises fiables

### 3. Voix Gilles - Erreurs ONNX Runtime (Résolu ✅)

**Voix concernée** : `fr_FR-gilles-low`

**Symptôme** : Erreurs ONNX Runtime lors de la synthèse vocale

```
Uncaught Error: indices element out of data bounds, 
idx=141 must be within the inclusive range [-130,129]
```

**Patterns déclencheurs** :
- Didascalies entre crochets : `[rire]`, `[à voix basse]`
- Onomatopées : `ahah`, `héhé`, `hihi`
- Ponctuation multiple : `???`, `!!!`
- Points de suspension multiples : `……`

**Cause racine** :
Le modèle ONNX `fr_FR-gilles-low` produit des indices de tokens qui dépassent la plage acceptée par l'embedding du modèle. Cela indique soit :
- Une incompatibilité entre le phonémiseur et le modèle
- Un modèle corrompu ou incomplet
- Un problème de tokenisation pour certains caractères

**Solution finale** :
- ❌ Voix Gilles désactivée (commentée dans `PiperWASMProvider.ts`)
- ✅ Migration automatique vers Tom (`fr_FR-tom-medium`)
- ✅ Système de diagnostic pour détecter les voix problématiques

## 🎯 Voix Recommandées

### Voix Fiables (Testées ✅)

| Voix ID | Nom | Genre | Qualité | Statut |
|---------|-----|-------|---------|--------|
| `fr_FR-tom-medium` | Tom | Homme | Moyenne | ✅ Fiable |
| `fr_FR-siwis-medium` | Siwis | Femme | Moyenne | ✅ Fiable |
| `fr_FR-upmc-medium` | UPMC Jessica | Femme | Moyenne | ✅ Fiable |

### Voix Retirées (❌ Ne Pas Utiliser)

| Voix ID | Raison |
|---------|--------|
| `fr_FR-gilles-low` | Erreurs ONNX Runtime (index out of bounds) |
| `fr_FR-mls-medium` | Audio distordu/inintelligible |

## 🔧 Système de Migration Automatique

### Fonctionnement

Un système de migration automatique a été mis en place pour réassigner les personnages utilisant des voix obsolètes vers des voix de remplacement fiables.

**Fichiers concernés** :
- `src/utils/voiceMigration.ts` - Logique de migration
- `src/utils/voiceDiagnostics.ts` - Détection et diagnostic
- `src/state/playSettingsStore.ts` - Application automatique

### Mapping des Migrations

```typescript
const VOICE_MIGRATIONS = {
  'fr_FR-gilles-low': 'fr_FR-tom-medium',
  'fr_FR-mls-medium': 'fr_FR-tom-medium',
}
```

### Déclenchement Automatique

La migration s'applique automatiquement dans deux cas :

1. **Au chargement de l'application** (hydratation du store)
   - Le middleware `onRehydrateStorage` détecte les voix obsolètes
   - Applique les migrations sur toutes les pièces
   - Sauvegarde les changements dans localStorage

2. **À la lecture des paramètres d'une pièce**
   - `getPlaySettings()` vérifie et migre si nécessaire
   - Garantit que les paramètres retournés sont toujours à jour

### Logs de Migration

Lorsqu'une migration est appliquée, des logs sont affichés dans la console :

```
[VoiceMigration] 🔄 Migration de voix: fr_FR-gilles-low → fr_FR-tom-medium
[VoiceMigration] ⚙️  Personnage "char_123": fr_FR-gilles-low → fr_FR-tom-medium
[VoiceMigration] ✅ Migration terminée: 2 pièce(s) mise(s) à jour
```

## 🔍 Outils de Diagnostic

### Vérifier les Voix Problématiques

```typescript
import { logDiagnosticReport } from '../utils/voiceDiagnostics'
import { usePlaySettingsStore } from '../state/playSettingsStore'

// Depuis la console du navigateur ou un composant
const store = usePlaySettingsStore.getState()
logDiagnosticReport(store.playSettings)
```

**Exemple de rapport** :

```
═══════════════════════════════════════════════════════════
    RAPPORT DE DIAGNOSTIC DES VOIX TTS
═══════════════════════════════════════════════════════════

⚠️  2 pièce(s) nécessite(nt) une migration de voix.

📄 Pièce: play_123
   Problèmes: 1

   🔴 Voix obsolète: fr_FR-gilles-low
      Raison: Erreurs ONNX Runtime (Gather node index out of bounds)
      Remplacement: fr_FR-tom-medium
      Utilisée par 2 personnage(s):
         - char_romeo_789
         - char_marc_012

───────────────────────────────────────────────────────────
💡 Recommandation:
   Les migrations seront appliquées automatiquement au
   prochain chargement de chaque pièce affectée.

═══════════════════════════════════════════════════════════
```

### Analyser un Texte pour Patterns Problématiques

```typescript
import { analyzeTextForProblems } from '../utils/voiceDiagnostics'

const text = "MARC : Ahah !!! Tu crois vraiment ???"
const warnings = analyzeTextForProblems(text)

// Retourne:
// [
//   "Onomatopées de rire détectées (ahah, héhé, hihi)",
//   "Points d'exclamation multiples détectés (!!!)",
//   "Points d'interrogation multiples détectés (???)"
// ]
```

### Vérifier si une Voix est Obsolète

```typescript
import { isObsoleteVoice, getReplacementVoice } from '../utils/voiceMigration'

if (isObsoleteVoice('fr_FR-gilles-low')) {
  const replacement = getReplacementVoice('fr_FR-gilles-low')
  console.log(`Utiliser ${replacement} à la place`)
  // → "Utiliser fr_FR-tom-medium à la place"
}
```

## 🧪 Tests de Régression Recommandés

Pour éviter de futurs problèmes avec les voix TTS, il est recommandé de tester :

### Cas de Test 1 : Didascalies

```
MARC : [à voix basse] Je ne sais pas quoi dire.
JULIETTE : [rire] C'est trop drôle !
```

### Cas de Test 2 : Onomatopées

```
ROMÉO : Ahah ! Héhé, hihi !
CLAIRE : Hmmm... Euh...
```

### Cas de Test 3 : Ponctuation Multiple

```
MARC : Quoi ??? Tu es sérieux ???
JULIETTE : Oui !!! Absolument !!!
```

### Cas de Test 4 : Points de Suspension

```
ROMÉO : Je me demandais… si peut-être……
CLAIRE : Oui…… continue……
```

### Cas de Test 5 : Texte Normal

```
MARC : Bonjour, comment allez-vous ?
JULIETTE : Très bien, merci. Et vous ?
```

## 📊 Statistiques de Fiabilité

Après les corrections :

| Métrique | Valeur |
|----------|--------|
| Voix fiables | 3 (Tom, Siwis, UPMC) |
| Voix retirées | 2 (Gilles, MLS) |
| Taux de succès Tom | ~100% |
| Migrations automatiques | Oui |
| Cache invalidation | Par voix |

## 🚀 Prochaines Étapes (Optionnel)

Si vous souhaitez réintroduire Gilles ou MLS :

1. **Vérifier l'intégrité du modèle ONNX**
   - Checksum du fichier `.onnx`
   - Comparaison avec une copie de référence

2. **Analyser la compatibilité phonémiseur/modèle**
   - Vérifier les plages d'indices attendues par le modèle
   - Comparer avec les indices générés par le phonémiseur

3. **Capturer les entrées ONNX problématiques**
   - Logger les tensors d'entrée avant l'exécution
   - Identifier les indices qui dépassent

4. **Tester un autre build du modèle**
   - Essayer une version différente (medium au lieu de low)
   - Contacter les mainteneurs de Piper TTS

## 📚 Références

- [Piper TTS GitHub](https://github.com/rhasspy/piper)
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/)
- [@mintplex-labs/piper-tts-web](https://www.npmjs.com/package/@mintplex-labs/piper-tts-web)

---

**Date de dernière mise à jour** : 2025-01-XX  
**Auteur** : Répét Contributors