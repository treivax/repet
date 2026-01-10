# Guide de Débogage Simplifié - Problème de Clic

## 🎯 Ce qu'on cherche

Déterminer **où exactement** le flux de clic est interrompu.

## 📋 Test à Faire

### Mode Audio

1. Ouvrir l'application
2. Sélectionner une pièce
3. Choisir **"Lecture audio"**
4. Ouvrir la console du navigateur (F12)
5. **Cliquer sur UNE RÉPLIQUE** (carte avec nom de personnage en gras)
6. **Copier TOUS les messages** qui apparaissent dans la console après le clic

### Mode Italiennes

1. Sélectionner une pièce
2. Choisir **"Italiennes"**
3. Choisir un personnage
4. Ouvrir la console (F12)
5. **Cliquer sur une réplique d'un AUTRE personnage**
6. **Copier TOUS les messages** de la console

---

## 🔍 Messages Attendus

Si tout fonctionne, vous devriez voir **dans l'ordre** :

```
1. 🔥 onClick EVENT FIRED on card!
2. 🔥 CLICK DETECTED in handleClick!
3. 🔥 Calling onClick callback...
4. 🎯 handleLineClick CALLED!
5. 🎯 New line - calling speakLine
```

## ⚠️ Diagnostic

### Si vous voyez seulement les messages 🔍 DEBUG (au chargement)
→ **Aucun message 🔥 ou 🎯** après le clic
→ Le clic n'est PAS détecté du tout
→ Problème au niveau du DOM ou du CSS

### Si vous voyez 🔥 onClick EVENT FIRED mais rien après
→ Le clic est détecté mais `handleClick` n'est pas appelé
→ Problème dans le code JavaScript

### Si vous voyez jusqu'à 🔥 Calling onClick callback mais pas 🎯
→ Le callback n'est pas correctement passé
→ Problème de props entre composants

### Si vous voyez 🎯 handleLineClick CALLED!
→ Le clic fonctionne !
→ Le problème est dans `speakLine` ou `pausePlayback`

---

## 📝 Template de Réponse

```
### MODE AUDIO - Clic sur réplique

Messages console après clic :
[Copier-coller TOUS les messages ici]

---

### MODE ITALIENNES - Clic sur autre personnage

Messages console après clic :
[Copier-coller TOUS les messages ici]
```

---

## 💡 Astuce

Si vous ne voyez **AUCUN** message 🔥 ou 🎯 après avoir cliqué, cela signifie que :
- Soit l'événement onClick n'est pas attaché au DOM
- Soit un autre élément capture le clic avant qu'il n'atteigne la carte
- Soit le navigateur bloque les événements pour une raison quelconque

Dans ce cas, vérifiez aussi :
- Inspectez l'élément (clic droit → Inspecter) et regardez les event listeners
- Vérifiez qu'il n'y a pas d'overlay invisible par-dessus