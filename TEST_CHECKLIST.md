# Checklist de tests - Validation de la lecture audio

**Date**: 2025-01-15  
**Branche**: `feat/piper-fork-multi-speaker`  
**Objectif**: Valider que la lecture audio fonctionne avec les 4 voix françaises

---

## ✅ Pré-requis

- [ ] Code compilé sans erreur : `npm run type-check`
- [ ] Build offline réussi : `npm run build:offline`
- [ ] Serveur de dev démarré : `npm run dev:offline`
- [ ] Console navigateur ouverte (F12)

---

## 🎯 Tests critiques (PRIORITAIRE)

### Test 1 : Vérification de base - Une voix fonctionne

**Objectif** : Confirmer que l'audio se lit

1. [ ] Ouvrir http://localhost:5174
2. [ ] Charger une pièce de théâtre (exemple : "Alegria")
3. [ ] Cliquer sur "Lecture audio"
4. [ ] **ATTENDU** : 
   - Console affiche : `[PiperWASMProvider] Synthèse pour voix: fr_FR-...`
   - Aucune erreur `piper_phonemize n'a rien retourné sur stdout`
   - Audio se joue (voix audible)
5. [ ] **RÉSULTAT** : ✅ PASS / ❌ FAIL

**En cas d'échec** : Copier les logs console et vérifier `TTSProviderManager.ts` utilise bien `PiperWASMProvider`

---

### Test 2 : Toutes les voix de base fonctionnent

**Objectif** : Vérifier les 4 voix (2 mono-speaker + 2 multi-speaker)

#### 2.1 Voix Siwis (Femme, mono-speaker)
1. [ ] Créer un personnage femme
2. [ ] Assigner la voix "Siwis (Femme, France)"
3. [ ] Lire une réplique
4. [ ] **ATTENDU** : Voix féminine claire
5. [ ] **RÉSULTAT** : ✅ PASS / ❌ FAIL

#### 2.2 Voix Tom (Homme, mono-speaker)
1. [ ] Créer un personnage homme
2. [ ] Assigner la voix "Tom (Homme, France)"
3. [ ] Lire une réplique
4. [ ] **ATTENDU** : Voix masculine claire
5. [ ] **RÉSULTAT** : ✅ PASS / ❌ FAIL

#### 2.3 Voix Jessica (Femme, multi-speaker #0)
1. [ ] Créer un personnage femme
2. [ ] Assigner la voix "Jessica (Femme, UPMC)"
3. [ ] Lire une réplique
4. [ ] **ATTENDU** : Voix féminine, différente de Siwis
5. [ ] **RÉSULTAT** : ✅ PASS / ❌ FAIL

#### 2.4 Voix Pierre (Homme, multi-speaker #1) ⭐
1. [ ] Créer un personnage homme
2. [ ] Assigner la voix "Pierre (Homme, UPMC)"
3. [ ] Lire une réplique
4. [ ] **ATTENDU** : Voix masculine, différente de Tom
5. [ ] **RÉSULTAT** : ✅ PASS / ❌ FAIL

**En cas d'échec** : Vérifier dans la console le `speakerId` utilisé (devrait être 0 pour Jessica, 1 pour Pierre)

---

### Test 3 : Multi-speaker (Jessica vs Pierre) - CRITIQUE

**Objectif** : Confirmer que le fork avec `speakerId` fonctionne

1. [ ] Créer 2 personnages : "Alice" (femme) et "Bob" (homme)
2. [ ] Assigner "UPMC Jessica" à Alice
3. [ ] Assigner "UPMC Pierre" à Bob
4. [ ] Charger une pièce avec dialogue alterné Alice/Bob
5. [ ] Lancer la lecture
6. [ ] **ATTENDU** :
   - Console affiche alternativement :
     ```
     [PiperWASMProvider] Synthèse pour voix: fr_FR-upmc-medium (speakerId: 0)
     [PiperWASMProvider] Synthèse pour voix: fr_FR-upmc-pierre-medium (speakerId: 1)
     ```
   - Voix clairement différentes (féminine puis masculine)
   - Même modèle ONNX partagé (chargement rapide)
7. [ ] **RÉSULTAT** : ✅ PASS / ❌ FAIL

**Test de validation sonore** :
- [ ] Faire lire la même phrase par Jessica puis Pierre
- [ ] Comparer auditivement : voix doivent être distinctes
- [ ] **RÉSULTAT** : ✅ Voix différentes / ❌ Voix identiques

---

## 🔧 Tests fonctionnels

### Test 4 : Cache audio

**Objectif** : Vérifier que le cache fonctionne

1. [ ] Lire une réplique
2. [ ] Observer la console : `[AudioCache] ❌ Clé ... NON trouvée dans le cache`
3. [ ] Attendre la fin de la synthèse
4. [ ] Relire la même réplique
5. [ ] **ATTENDU** : `[AudioCache] ✅ Clé ... trouvée dans le cache`
6. [ ] **RÉSULTAT** : ✅ PASS / ❌ FAIL

**Performance** :
- [ ] Première synthèse : ~1-3 secondes
- [ ] Deuxième synthèse (cache) : < 100ms
- [ ] **RÉSULTAT** : ✅ PASS / ❌ FAIL

---

### Test 5 : Profils vocaux (variantes)

**Objectif** : Vérifier que les profils vocaux utilisent le bon modèle de base

1. [ ] Créer un personnage
2. [ ] Assigner "Siwis Douce" (profil vocal)
3. [ ] Vérifier dans la console : `[PiperWASMProvider] Profil vocal détecté: Siwis Douce`
4. [ ] **ATTENDU** : Utilise le modèle `fr_FR-siwis-medium` (base) avec modifications audio
5. [ ] **RÉSULTAT** : ✅ PASS / ❌ FAIL

---

### Test 6 : Lecture complète d'une pièce

**Objectif** : Stabilité et performance

1. [ ] Charger "Alegria" (59 lignes)
2. [ ] Lancer la lecture complète
3. [ ] Observer pendant 2-3 minutes
4. [ ] **ATTENDU** :
   - Aucune erreur console
   - Audio continu sans coupure
   - Transitions fluides entre voix
   - Mémoire stable (pas de fuite)
5. [ ] **RÉSULTAT** : ✅ PASS / ❌ FAIL

**Mesures** :
- [ ] Latence moyenne par réplique : ______ ms
- [ ] Mémoire utilisée (DevTools > Memory) : ______ MB
- [ ] CPU (DevTools > Performance) : ______ %

---

## 🌐 Tests offline (PWA)

### Test 7 : Mode offline

**Objectif** : Vérifier que l'app fonctionne hors connexion

1. [ ] Build : `npm run build:offline`
2. [ ] Preview : `npm run preview`
3. [ ] Charger l'app dans le navigateur
4. [ ] Ouvrir DevTools > Application > Service Workers
5. [ ] Cocher "Offline"
6. [ ] Lire une pièce
7. [ ] **ATTENDU** : Audio fonctionne normalement
8. [ ] **RÉSULTAT** : ✅ PASS / ❌ FAIL

---

### Test 8 : Chargement des modèles (InitializationModal)

**Objectif** : Vérifier le préchargement des voix

1. [ ] Recharger l'app (Ctrl+R)
2. [ ] Observer le modal d'initialisation
3. [ ] **ATTENDU** :
   - Console affiche : `[InitializationModal] 🚀 Préchargement de 4 voix de base...`
   - Progression : 0% → 25% → 50% → 75% → 100%
   - Logs : "✅ Siwis chargée", "✅ Tom chargée", etc.
4. [ ] **RÉSULTAT** : ✅ PASS / ❌ FAIL

---

## 🐛 Tests de régression

### Test 9 : Didascalies (stage directions)

**Objectif** : Vérifier que le narrateur fonctionne

1. [ ] Charger une pièce avec didascalies
2. [ ] Activer la lecture des didascalies (toggle)
3. [ ] Lancer la lecture
4. [ ] **ATTENDU** :
   - Didascalies lues par la voix du narrateur (configurable)
   - Pas d'erreur de synthèse
5. [ ] **RÉSULTAT** : ✅ PASS / ❌ FAIL

---

### Test 10 : Paramètres de lecture

**Objectif** : Vérifier les modificateurs audio

1. [ ] Ouvrir les paramètres de lecture
2. [ ] Modifier :
   - [ ] Vitesse : 1.5x
   - [ ] Volume : 50%
3. [ ] Lire une réplique
4. [ ] **ATTENDU** : Audio respecte les paramètres
5. [ ] **RÉSULTAT** : ✅ PASS / ❌ FAIL

---

## 📊 Critères de validation

### Critères obligatoires (MUST HAVE)

- [ ] ✅ Test 1 : Audio de base fonctionne
- [ ] ✅ Test 2 : Les 4 voix sont audibles
- [ ] ✅ Test 3 : Jessica ≠ Pierre (multi-speaker OK)
- [ ] ✅ Aucune erreur `piper_phonemize` dans la console

**Si un critère obligatoire échoue** : BLOQUER le merge, investiguer

### Critères recommandés (SHOULD HAVE)

- [ ] ✅ Test 4 : Cache fonctionne
- [ ] ✅ Test 6 : Lecture complète stable
- [ ] ✅ Test 7 : Mode offline OK
- [ ] ✅ Test 8 : Préchargement OK

### Critères optionnels (NICE TO HAVE)

- [ ] ✅ Test 5 : Profils vocaux
- [ ] ✅ Test 9 : Didascalies
- [ ] ✅ Test 10 : Paramètres audio

---

## 📝 Rapport de test

**Testeur** : _______________  
**Date** : _______________  
**Navigateur** : _______________  
**OS** : _______________

### Résumé

- Tests critiques réussis : _____ / 3
- Tests fonctionnels réussis : _____ / 8
- Tests de régression réussis : _____ / 2

### Bugs trouvés

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Recommandation finale

- [ ] ✅ **APPROUVÉ** - Prêt pour merge
- [ ] ⚠️ **APPROUVÉ avec réserves** - Bugs mineurs à corriger
- [ ] ❌ **REJETÉ** - Bugs bloquants, nécessite corrections

**Commentaires** :
```
_______________________________________________
_______________________________________________
_______________________________________________
```

---

## 🆘 En cas de problème

### Erreur : "piper_phonemize n'a rien retourné sur stdout"

**Cause** : `PiperNativeProvider` est toujours utilisé au lieu de `PiperWASMProvider`

**Solution** :
```bash
# Vérifier TTSProviderManager.ts
grep "PiperWASMProvider" src/core/tts/providers/TTSProviderManager.ts

# Devrait afficher :
# import { PiperWASMProvider } from './PiperWASMProvider'
# this.provider = new PiperWASMProvider()
```

---

### Erreur : "Voix Pierre identique à Jessica"

**Cause** : `speakerId` non transmis ou fork non utilisé

**Solution** :
```bash
# Vérifier que le fork est importé
grep "piper-tts-web-patched" src/core/tts/providers/PiperWASMProvider.ts

# Vérifier speakerId dans la console :
# Devrait afficher : sid: Tensor(int64) [1] pour Pierre
```

---

### Erreur : Build échoue (ESLint warnings)

**Cause** : `PiperNativeProvider` a trop de `console.log`

**Solution temporaire** :
```bash
# Bypasser le lint pour tester
npm run type-check && npx vite build --config vite.config.offline.ts
```

---

**Ressources** :
- 📄 Documentation complète : `docs/AUDIO_PLAYBACK_FIX.md`
- 📄 Notes du fork : `src/lib/piper-tts-web-patched/FORK_NOTES.md`
- 📄 Plan d'action : `PLAN_ACTION_FORK.md`
