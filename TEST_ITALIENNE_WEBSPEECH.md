# Test Rapide - Correction Volume Italienne (WebSpeechProvider)

## 🎯 Objectif

Valider que la correction du bug de volume en mode italienne fonctionne correctement avec **Google TTS** (Web Speech API).

## ⚡ Test Rapide (5 minutes)

### Étape 1 : Configuration
1. Ouvrir une pièce de théâtre
2. Aller dans **Paramètres** (icône engrenage)
3. Sélectionner **Provider TTS : Google TTS**
4. Activer **Mode Italiennes**
5. Choisir **Votre Personnage** (ex: HAMLET)
6. Retourner à l'écran de lecture

### Étape 2 : Test Audio
1. Cliquer sur une réplique d'un **autre personnage**
   - ✅ **Attendu** : Audio **AUDIBLE**
2. Cliquer sur une réplique de **VOTRE personnage**
   - ✅ **Attendu** : Audio **MUET** (silence total)

### Étape 3 : Vérification Console
1. Ouvrir la console (F12)
2. Cliquer sur une réplique de votre personnage
3. Chercher dans les logs :
   ```
   [PlayScreen] 🎭 Mode italiennes - Ligne utilisateur détectée: volume=0
   ```
   - ✅ **Attendu** : `volume=0` (pas `volume=1`)

## 📋 Checklist de Validation

- [ ] Google TTS sélectionné comme provider
- [ ] Mode italiennes activé
- [ ] Personnage utilisateur choisi
- [ ] Répliques autres personnages : **AUDIBLES**
- [ ] Répliques votre personnage : **MUETTES**
- [ ] Console montre `volume=0` pour vos répliques
- [ ] Console montre `volume=1` pour autres répliques

## 🐛 Si Ça Ne Marche Pas

### Le personnage est toujours audible ?

1. **Vérifier le provider TTS** :
   - Paramètres → Voix et Audio
   - S'assurer que "Google TTS" est sélectionné (pas "Piper WASM")

2. **Vider le cache** :
   - F12 → Application → Storage → Clear site data
   - Recharger la page (F5)

3. **Vérifier le personnage** :
   - Le personnage sélectionné correspond-il aux répliques testées ?
   - Voir le badge violet en haut de l'écran

4. **Vérifier la console** :
   - Chercher `isUserLine: false` → le personnage n'est pas reconnu
   - Chercher `volume=1` → le volume n'est pas appliqué

### Logs à fournir en cas de problème

```
[PlayScreen] 🔍 DEBUG - Vérification ligne:
  - line.characterId: "..."
  - userCharacter: {...}
  - playSettings.readingMode: "..."
  - isUserLine: ...
  - volume calculé: ...
```

## 🔄 Comparaison Avant/Après

| Aspect | Avant (Bug) | Après (Corrigé) |
|--------|-------------|-----------------|
| Volume calculé | `0` | `0` |
| Volume appliqué (WebSpeech) | `1.0` ❌ | `0` ✅ |
| Audio utilisateur | Audible | Muet |
| Code | `\|\|` | `??` |

## 📝 Détails Techniques

### Code Corrigé

**Fichier :** `src/core/tts/providers/WebSpeechProvider.ts`

```typescript
// AVANT (Bug)
utterance.volume = options.volume || 1.0  // 0 || 1.0 → 1.0 ❌

// APRÈS (Corrigé)
utterance.volume = options.volume ?? 1.0  // 0 ?? 1.0 → 0 ✅
```

### Différence || vs ??

```javascript
// Opérateur || (OR logique)
0 || 1.0        // → 1.0 (0 est falsy)
"" || "default" // → "default" ("" est falsy)
false || true   // → true (false est falsy)

// Opérateur ?? (Nullish Coalescing)
0 ?? 1.0        // → 0 (0 n'est ni null ni undefined)
"" ?? "default" // → "" ("" n'est ni null ni undefined)
false ?? true   // → false (false n'est ni null ni undefined)
null ?? 1.0     // → 1.0 (null est nullish)
undefined ?? 1.0 // → 1.0 (undefined est nullish)
```

## ✅ Critères de Succès

La correction est validée si :
1. ✓ Répliques utilisateur **complètement muettes** en mode italienne
2. ✓ Répliques autres personnages **audibles** normalement
3. ✓ Console montre `volume=0` pour utilisateur
4. ✓ Timing respecté (pause pour répliques muettes)
5. ✓ Fonctionne avec **Google TTS** (WebSpeechProvider)

## 🔗 Voir Aussi

- `BUGFIX_ITALIENNE_WEBSPEECH.md` - Documentation complète de la correction
- `VOLUME_FIX_SUMMARY.md` - Correction initiale pour PiperWASMProvider
- `AUDIO_FIXES_TEST.md` - Guide de test complet
- `TEST_ITALIENNE_VOLUME.md` - Tests détaillés mode italienne

---

**Date :** 2025-01-XX  
**Type :** Test de validation  
**Durée estimée :** 5 minutes  
**Priorité :** Haute