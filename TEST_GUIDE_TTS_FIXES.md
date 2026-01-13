# Guide de test rapide - Corrections TTS

## 🚀 Démarrage

1. **Arrêter le serveur de dev** (si en cours) : `Ctrl+C`
2. **Redémarrer** : `npm run dev`
3. **Ouvrir le navigateur** : http://localhost:5173
4. **Ouvrir DevTools** : `F12` (onglet Console)

## ✅ Test 1 : Voix différentes par personnage

### Préparation
- Ouvrir une pièce avec plusieurs personnages (hommes et femmes)
- Exemple : Le Cid, Cyrano, etc.

### Actions
1. Aller dans "Paramètres" → "Assignation des voix"
2. Vérifier que des voix sont assignées automatiquement
3. Revenir à l'écran de lecture
4. Cliquer sur une réplique d'un personnage masculin
5. Écouter la voix
6. Cliquer sur une réplique d'un personnage féminin
7. Écouter la voix

### ✅ Résultat attendu
- [ ] Dans la console : `"Assignations de voix générées: {...}"`
- [ ] Personnages masculins → voix masculine (grave)
- [ ] Personnages féminins → voix féminine (aiguë)
- [ ] Chaque personnage a une voix différente
- [ ] Les voix changent réellement (pas juste la vitesse)

### ❌ Si ça ne marche pas
- Vérifier dans DevTools → Application → Local Storage → rechercher `characterVoicesPiper`
- Il doit contenir des assignations : `{"personnage1": "fr_FR-tom-medium", "personnage2": "fr_FR-siwis-medium", ...}`
- Si vide : supprimer le localStorage et recharger la page

---

## ✅ Test 2 : Pause/Reprise fonctionnelle

### Actions
1. Cliquer sur une longue réplique pour démarrer la lecture
2. **Pendant la lecture**, cliquer à nouveau sur la même ligne
3. Observer l'indicateur
4. Attendre 2 secondes
5. Re-cliquer sur la ligne

### ✅ Résultat attendu
- [ ] Au 1er clic : lecture démarre
- [ ] Au 2e clic : audio se met EN PAUSE
- [ ] Indicateur affiche : "⏸ En pause · Xs"
- [ ] Le temps reste figé (ne descend pas)
- [ ] Au 3e clic : audio REPREND au même point (pas depuis le début)
- [ ] L'indicateur "⏸ En pause" disparaît

### ❌ Si ça ne marche pas
- Si l'audio continue de jouer → la pause n'est pas câblée
- Si l'audio redémarre depuis le début → `currentTime` est réinitialisé
- Regarder la console pour des erreurs

---

## ✅ Test 3 : Indicateur "Génération en cours..."

### Préparation
**IMPORTANT** : Vider le cache pour forcer la génération
```javascript
// Dans la console DevTools
indexedDB.deleteDatabase('piper-audio-cache')
location.reload()
```

### Actions
1. Cliquer sur une réplique jamais jouée
2. Observer l'indicateur **immédiatement** après le clic

### ✅ Résultat attendu
- [ ] Indicateur affiche : "⏳ Génération en cours..." (2-5 secondes)
- [ ] Puis passe automatiquement au compte à rebours : "3s", "2s", "1s"
- [ ] Audio démarre après la génération

### Actions (cache)
1. Re-cliquer sur la MÊME réplique (déjà en cache)
2. Observer l'indicateur

### ✅ Résultat attendu
- [ ] Audio démarre **instantanément** (pas de génération)
- [ ] Indicateur affiche directement le compte à rebours (pas de "Génération...")

### ❌ Si ça ne marche pas
- Si "Génération..." ne s'affiche jamais → `isGenerating` n'est pas câblé
- Si ça reste bloqué sur "Génération..." → erreur de synthèse (voir console)

---

## 🎯 Test complet : Scénario réel

1. **Ouvrir une pièce** avec au moins 3 personnages (2 hommes, 1 femme)
2. **Lire la 1ère réplique** d'un homme
   - [ ] Voir "Génération en cours..."
   - [ ] Puis entendre une voix masculine
3. **Lire la 1ère réplique** d'une femme
   - [ ] Voir "Génération en cours..."
   - [ ] Puis entendre une voix féminine (DIFFÉRENTE)
4. **Lire la 1ère réplique** d'un autre homme
   - [ ] Voir "Génération en cours..."
   - [ ] Puis entendre une voix masculine (DIFFÉRENTE du 1er homme)
5. **Re-lire** la réplique du 1er homme
   - [ ] Démarrage instantané (depuis cache)
   - [ ] MÊME voix qu'au point 2
6. **Pendant la lecture**, mettre en pause
   - [ ] Indicateur "⏸ En pause"
   - [ ] Audio s'arrête
7. **Reprendre**
   - [ ] Audio continue au même point

---

## 🐛 Debugging

### Console logs utiles à chercher

```
✅ "TTS Provider initialisé: piper-wasm"
✅ "Génération automatique des assignations de voix..."
✅ "Assignations de voix générées: {...}"
```

### Vérifier les assignations dans DevTools

1. Ouvrir DevTools → Application → Local Storage
2. Chercher la clé contenant votre `playId`
3. Développer l'objet JSON
4. Vérifier :
   ```json
   {
     "characterVoicesPiper": {
       "char1": "fr_FR-tom-medium",      // Homme
       "char2": "fr_FR-siwis-medium",    // Femme
       "char3": "fr_FR-mls-medium"       // Homme
     }
   }
   ```

### Vérifier le cache audio

1. DevTools → Application → IndexedDB → `piper-audio-cache`
2. Table `audio-cache`
3. Voir les entrées avec `voiceId`, `text`, `blob`

### Erreurs courantes

| Erreur | Cause probable |
|--------|----------------|
| `Modèle Piper XXX non trouvé` | VoiceId invalide dans les assignations |
| `no available backend found` | ONNX Runtime WASM non chargé |
| `Audio error` | Blob audio corrompu ou format invalide |
| Toujours la même voix | Assignations vides ou non générées |

---

## 📝 Rapport de test

Après avoir effectué tous les tests, remplir :

**Test 1 - Voix différentes :**
- [ ] ✅ OK
- [ ] ❌ NOK : _________________

**Test 2 - Pause/Reprise :**
- [ ] ✅ OK
- [ ] ❌ NOK : _________________

**Test 3 - Indicateur génération :**
- [ ] ✅ OK
- [ ] ❌ NOK : _________________

**Navigateur testé :** _______________
**OS :** _______________
**Notes :** 
