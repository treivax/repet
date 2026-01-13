# Guide de Validation - Correction Bug Mode Italienne

## ✅ Correction Appliquée

Le bug où **le personnage choisi était toujours lu à voix haute** en mode italienne a été corrigé.

---

## 🚀 Comment Valider la Correction (3 minutes)

### 1️⃣ Recharger l'Application

1. **Vider le cache du navigateur** :
   - Appuyer sur `F12` pour ouvrir les outils développeur
   - Aller dans l'onglet **Application** (ou **Storage**)
   - Cliquer sur **Clear site data** (ou **Effacer les données du site**)
   - Fermer les outils développeur

2. **Recharger la page** :
   - Appuyer sur `Ctrl+Shift+R` (ou `Cmd+Shift+R` sur Mac)
   - Ou fermer et rouvrir l'application

### 2️⃣ Configurer le Mode Italienne

1. Ouvrir une **pièce de théâtre** (ex: Hamlet, Roméo et Juliette)
2. Cliquer sur l'icône **Paramètres** (⚙️ en haut à droite)
3. Dans la section **Mode de Lecture** :
   - Sélectionner **"Mode Italiennes"**
4. Dans la section **Personnage** :
   - Choisir **votre personnage** (ex: HAMLET, ROMÉO, JULIETTE)
5. **Enregistrer** et retourner à l'écran de lecture

### 3️⃣ Tester l'Audio

#### Test 1 : Votre Personnage (DOIT ÊTRE MUET)

1. Cliquer sur une **réplique de votre personnage**
2. 🎧 **Écouter attentivement**
3. ✅ **Résultat attendu** : **AUCUN SON** (silence complet)
4. ⏱️ Une pause se produit (temps de votre réplique)
5. Puis la lecture continue avec le personnage suivant

#### Test 2 : Autres Personnages (DOIVENT ÊTRE AUDIBLES)

1. Cliquer sur une **réplique d'un autre personnage**
2. 🎧 **Écouter**
3. ✅ **Résultat attendu** : **AUDIO NORMAL** (audible)

---

## ✅ Checklist de Validation

Cocher si le comportement est correct :

- [ ] Cache vidé et page rechargée
- [ ] Mode italiennes activé
- [ ] Personnage utilisateur sélectionné
- [ ] ✅ **Vos répliques = MUETTES** (aucun son)
- [ ] ✅ **Autres répliques = AUDIBLES** (son normal)
- [ ] ✅ Pause appropriée pour vos répliques
- [ ] ✅ Timing respecté entre les répliques

---

## 🐛 Si Ça Ne Marche Pas

### Le personnage est toujours audible ?

1. **Vérifier le personnage sélectionné** :
   - Regarder le **badge violet** en haut de l'écran
   - Il doit afficher : `ITALIENNES (VOTRE_PERSONNAGE)`
   - Si ce n'est pas le bon personnage, retourner dans les paramètres

2. **Vérifier le mode de lecture** :
   - Le badge doit indiquer **"ITALIENNES"**
   - Si c'est "LECTURE AUDIO", changer dans les paramètres

3. **Vider à nouveau le cache** :
   - F12 → Application → Clear site data
   - Recharger avec Ctrl+Shift+R

4. **Vérifier la console (pour debug)** :
   - Appuyer sur `F12`
   - Aller dans l'onglet **Console**
   - Cliquer sur une réplique de votre personnage
   - Chercher la ligne :
     ```
     [PlayScreen] 🎭 Mode italiennes - Ligne utilisateur détectée: volume=0
     ```
   - Si vous voyez `volume=1` au lieu de `volume=0`, copier tous les logs et me les envoyer

---

## 🎯 Ce Qui a Été Corrigé

### Avant (Bug)
- Volume calculé : `0` ✓
- Volume appliqué : `1.0` ❌ (bug dans le code)
- **Résultat** : Audio audible (incorrect)

### Après (Corrigé)
- Volume calculé : `0` ✓
- Volume appliqué : `0` ✓
- **Résultat** : Audio muet (correct)

### Fichier Modifié
- `src/core/tts/providers/WebSpeechProvider.ts`
- Changement : `||` → `??` (opérateur JavaScript)
- **Impact** : Le volume `0` n'est plus remplacé par `1.0`

---

## 📊 Tableau de Validation

| Élément | Attendu | Votre Résultat |
|---------|---------|----------------|
| Vos répliques | MUET | ⬜ OK / ⬜ AUDIBLE |
| Autres répliques | AUDIBLE | ⬜ OK / ⬜ MUET |
| Pause pour vos répliques | OUI | ⬜ OUI / ⬜ NON |
| Console montre `volume=0` | OUI | ⬜ OUI / ⬜ NON |

---

## 🎭 Exemple Concret

**Scène :** Hamlet discute avec Horatio

1. **HORATIO** : "Mon seigneur, je crois que je l'ai vu la nuit dernière."
   - 🔊 **Audio AUDIBLE** (ce n'est pas votre personnage)

2. **HAMLET** : "Vu ? Qui ça ?"
   - 🔇 **SILENCE TOTAL** (c'est votre personnage)
   - ⏱️ Pause de ~2 secondes (vous récitez mentalement)

3. **HORATIO** : "Mon seigneur, le roi votre père."
   - 🔊 **Audio AUDIBLE** (ce n'est pas votre personnage)

---

## ✅ Si Tout Fonctionne

Félicitations ! Le mode italiennes fonctionne correctement. Vous pouvez maintenant :

- ✅ Répéter vos répliques en silence
- ✅ Entendre les autres personnages
- ✅ Suivre le rythme de la pièce

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide :

1. **Capturer les logs console** :
   - F12 → Console
   - Cliquer sur une réplique de votre personnage
   - Copier TOUS les logs qui apparaissent
   
2. **Prendre une capture d'écran** :
   - Des paramètres (montrant mode + personnage)
   - De l'écran de lecture (avec le badge violet)

3. **Me fournir les informations** :
   - Navigateur utilisé (Chrome, Firefox, Safari, etc.)
   - Pièce testée
   - Personnage sélectionné
   - Les logs de la console
   - Les captures d'écran

---

**Date :** 2025-01-XX  
**Type :** Guide de validation  
**Durée :** 3 minutes  
**Difficulté :** Facile