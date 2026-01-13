# Test du Volume en Mode Italienne

## 🎯 Objectif

Vérifier que les répliques du personnage choisi en mode italienne sont **complètement muettes** (volume = 0).

## 📋 Prérequis

1. L'application doit être relancée (pour charger les nouvelles corrections)
2. Vider le cache du navigateur (F12 → Application → Storage → Clear site data)
3. Ouvrir la console développeur (F12 → Console)

## 🧪 Procédure de Test

### Étape 1 : Configuration

1. Ouvrir une pièce de théâtre
2. Aller dans les paramètres de lecture
3. Sélectionner **Mode italiennes**
4. Choisir **votre personnage** (ex: HAMLET, ROMÉO, etc.)
5. Configurer une voix Piper WASM (ex: Tom, Siwis)
6. Vérifier le personnage sélectionné dans le badge violet en haut

### Étape 2 : Lancer la Lecture

1. Revenir à l'écran de lecture
2. **Ouvrir la console développeur** (F12)
3. Cliquer sur une réplique d'un **autre personnage** (pas le vôtre)
4. Observer les logs console

### Étape 3 : Vérifier les Logs pour Autre Personnage

Vous devriez voir dans la console :

```
[PlayScreen] 🔍 DEBUG - Vérification ligne:
  - line.characterId: "CLAUDIUS"
  - userCharacter: {"id":"HAMLET","name":"Hamlet"}
  - playSettings.readingMode: "italian"
  - isUserLine: false
  - volume calculé: 1
  - rate calculé: 1
[PlayScreen] 🎭 Mode italiennes - Ligne autre personnage: volume=1, rate=1
[PlayScreen] ▶️ LECTURE ligne X (CLAUDIUS): voiceId="...", volume=1, rate=1
[PiperWASM] 🔊 Audio depuis cache - volume appliqué: 1, rate: 1, options.volume: 1
[TTSEngine] 🎵 PLAY audio - volume: 1, muted: false
```

✅ **Résultat attendu** : L'audio est **AUDIBLE** (volume=1)

### Étape 4 : Tester Votre Personnage

1. Cliquer sur une réplique de **VOTRE personnage**
2. Observer les logs console

### Étape 5 : Vérifier les Logs pour Votre Personnage

Vous devriez voir dans la console :

```
[PlayScreen] 🔍 DEBUG - Vérification ligne:
  - line.characterId: "HAMLET"
  - userCharacter: {"id":"HAMLET","name":"Hamlet"}
  - playSettings.readingMode: "italian"
  - isUserLine: true
  - volume calculé: 0
  - rate calculé: <vitesse utilisateur>
[PlayScreen] 🎭 Mode italiennes - Ligne utilisateur détectée: volume=0, rate=<vitesse>
[PlayScreen] ▶️ LECTURE ligne X (HAMLET): voiceId="...", volume=0, rate=<vitesse>
[PiperWASM] 🔊 Audio depuis cache - volume appliqué: 0, rate: <vitesse>, options.volume: 0
[TTSEngine] 🎵 PLAY audio - volume: 0, muted: false
```

✅ **Résultat attendu** : L'audio est **COMPLÈTEMENT MUET** (volume=0)

### Étape 6 : Vérification Audio

- **Écoutez attentivement** : Vous ne devez **RIEN entendre** pour vos répliques
- **Timing** : Une pause doit se produire (le temps de votre réplique)
- **Autres personnages** : Doivent rester audibles normalement

## ❌ Si le Volume N'est PAS à 0

Si vous voyez dans les logs `volume: 1` au lieu de `volume: 0` pour votre personnage :

### Diagnostic

1. **Vérifier `isUserLine`** :
   - Si `isUserLine: false` alors que c'est votre personnage → problème de comparaison des IDs
   - Vérifier que `line.characterId` === `userCharacter.id`

2. **Vérifier `readingMode`** :
   - Si `readingMode` n'est pas `"italian"` → problème de configuration
   - Vérifier dans les settings de la pièce

3. **Vérifier les profils vocaux** :
   - Si un profil vocal est utilisé (ex: `tom-grave`, `tom-autoritaire`)
   - Chercher dans les logs : `[PiperWASM] 🎭 Profil vocal détecté`
   - Chercher aussi : `[PiperWASM] 🔊 Volume des options appliqué (priorité sur profil): 0`

4. **Vérifier le cache** :
   - Vider complètement le cache : F12 → Application → Clear site data
   - Relancer l'application
   - Retester

## 🔧 Cas Spéciaux

### Profils Vocaux

Si vous utilisez un profil vocal (ex: "Tom - Grave", "Tom - Autoritaire"), vous devriez voir :

```
[PiperWASM] 🎭 Profil vocal détecté: "Tom - Grave" (base: fr_FR-tom-medium)
[PiperWASM] 🎨 Application des modificateurs du profil: playbackRate=0.9, volume=1
[PiperWASM] 🔊 Volume des options appliqué (priorité sur profil): 0
```

Le volume du profil est **écrasé** par le volume des options (0).

### Première Lecture vs Cache

- **Première fois** (audio synthétisé) : Logs commencent par `[PiperWASM] 🔊 Audio nouvellement synthétisé`
- **Depuis cache** : Logs commencent par `[PiperWASM] 🔊 Audio depuis cache`

Dans les deux cas, le volume doit être à **0** pour votre personnage.

## 📊 Checklist Finale

- [ ] Console ouverte avec logs visibles
- [ ] Mode italienne activé
- [ ] Personnage utilisateur sélectionné
- [ ] Logs montrent `volume=0` pour votre personnage
- [ ] Logs montrent `volume=1` pour les autres personnages
- [ ] Audio effectivement muet pour vos répliques
- [ ] Audio audible pour les autres répliques
- [ ] Timing respecté (pause pour vos répliques)

## 🐛 Rapport de Bug

Si le problème persiste, copier-coller dans un rapport :

1. **Les logs complets** de la console pour UNE réplique de votre personnage
2. **Capture d'écran** des paramètres (mode italienne + personnage sélectionné)
3. **Nom de votre personnage** et son ID (visible dans les logs)
4. **Voix utilisée** (Tom, Siwis, etc.)
5. **Profil vocal utilisé** (si applicable)

---

**Date** : 2025-01-XX  
**Version** : Correction Volume Italienne v2