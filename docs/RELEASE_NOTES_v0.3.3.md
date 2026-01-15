# Notes de Release - Version 0.3.3

**Date** : 15 janvier 2025  
**Type** : Optimisation des profils vocaux

## 📊 Optimisation des Profils Vocaux

### Résumé

Réduction des profils vocaux de 6 à 3 variantes par voix masculine (Tom) pour maximiser la diversité perceptuelle et éviter les redondances.

### Profils Vocaux Optimisés

Tom dispose maintenant de **3 profils maximalement différents** :

1. **Tom Normal** (`fr_FR-tom-medium-normal`)
   - Voix naturelle, neutre (référence)
   - Caractéristiques : naturel, neutre
   - Modificateurs : playbackRate 1.0, volume 1.0

2. **Tom Autoritaire** (`fr_FR-tom-medium-autoritaire`)
   - Voix très grave, affirmée, puissante
   - Caractéristiques : autoritaire, puissant, grave
   - Modificateurs : playbackRate 0.92, pitchShift -3, bassBoost 0.4

3. **Tom Jeune** (`fr_FR-tom-medium-jeune`)
   - Voix très aiguë, jeune, enjouée, dynamique
   - Caractéristiques : jeune, enjoué, dynamique
   - Modificateurs : playbackRate 1.08, pitchShift +3, trebleBoost 0.25

### Profils Supprimés

Les profils suivants ont été retirés car trop similaires aux profils conservés :
- **Tom Grave** (similaire à Tom Autoritaire, mais moins extrême)
- **Tom Vif** (similaire à Tom Jeune, mais moins extrême)
- **Tom Calme** (trop proche de Tom Normal)

### Avantages

✅ **Diversité maximale** : 3 variantes maximalement différentes (Normal, Autoritaire très grave, Jeune très aigu)  
✅ **Pas de redondance** : Suppression des profils trop similaires  
✅ **Meilleure expérience** : Choix plus clairs et distincts  
✅ **Interface simplifiée** : Moins de choix, mais plus pertinents  

## ⚠️ Tentative d'Ajout de Pierre - Limitation Technique

### Contexte

Une tentative a été faite pour ajouter **Pierre** comme deuxième voix masculine en utilisant le speaker #1 du modèle UPMC (`fr_FR-upmc-medium`).

### Limitation Découverte

La bibliothèque `@mintplex-labs/piper-tts-web` (version actuelle) **ne supporte pas la sélection du speaker** pour les modèles multi-speaker :

- Le modèle UPMC contient 2 speakers : `jessica` (speaker 0) et `pierre` (speaker 1)
- Le `speakerId` est **hardcodé à 0** dans le code de la bibliothèque
- Impossible d'accéder au speaker `pierre` (speaker 1)

### Erreur Rencontrée

```
SyntaxError: Unexpected token 'E', "Entry not found" is not valid JSON
```

Cette erreur apparaît lors de la tentative de chargement de `fr_FR-upmc-medium#1` car la notation `#1` n'est pas supportée par la bibliothèque.

### Décision

Pierre a été **désactivé** en attendant :
- Une mise à jour de la bibliothèque `@mintplex-labs/piper-tts-web` supportant les multi-speakers
- OU une solution alternative (fork de la bibliothèque, autre provider TTS)

### Code Commenté

Le code pour Pierre reste présent mais commenté dans :
- `src/core/tts/providers/PiperWASMProvider.ts` (configuration du modèle)
- `src/core/tts/voiceProfiles.ts` (profils vocaux)

## 📊 Impact

- **Voix masculines disponibles** : 1 voix de base (Tom) + 3 profils = 4 voix masculines distinctes
- **Voix féminines disponibles** : 2 voix de base (Siwis, Jessica) + 6 profils
- **Total voix disponibles** : 13 voix distinctes (3 de base + 10 profils)

## 🔧 Modifications Techniques

### Fichiers Modifiés

1. **`src/core/tts/voiceProfiles.ts`**
   - Réduction de `TOM_VOICE_PROFILES` de 6 à 3 profils (Normal, Autoritaire, Jeune)
   - Suppression des profils Grave, Vif, Calme (trop similaires)
   - `PIERRE_VOICE_PROFILES` désactivé (tableau vide avec commentaire explicatif)

2. **`src/core/tts/providers/PiperWASMProvider.ts`**
   - Configuration de Pierre commentée avec explication de la limitation
   - Commentaires détaillés sur le problème multi-speaker

3. **`docs/VOICE_PROFILES.md`**
   - Documentation mise à jour avec profils optimisés
   - Suppression des sections pour les profils retirés

### Tests

- ✅ Type-check : OK
- ✅ Tests unitaires : 96/96 passés
- ✅ Lint : OK

## 🔮 Évolutions Futures

### Option 1 : Attendre une mise à jour de la bibliothèque

Surveiller les mises à jour de `@mintplex-labs/piper-tts-web` pour le support multi-speaker.

### Option 2 : Fork de la bibliothèque

Modifier la bibliothèque pour exposer un paramètre `speakerId` dans `TtsSession.create()` et `predict()`.

### Option 3 : Utiliser un autre modèle

Chercher un autre modèle Piper masculin single-speaker de qualité équivalente.

### Option 4 : Provider TTS alternatif

Explorer d'autres solutions TTS supportant mieux les multi-speakers (ex: utiliser directement Piper CLI en WASM).

## 📚 Documentation

- Voir `docs/VOICE_PROFILES.md` pour la documentation complète des profils optimisés
- Les profils ont été optimisés pour maximiser la différence perceptuelle

## 🙏 Contexte

Cette version optimise les profils vocaux en ne conservant que les variantes les plus distinctes. La tentative d'ajouter Pierre a révélé une limitation technique de la bibliothèque TTS utilisée. Cette limitation sera résolue dans une version future.

---

**Version précédente** : v0.3.2  
**Version suivante** : TBD