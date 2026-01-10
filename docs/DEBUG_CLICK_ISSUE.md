# Guide de Débogage - Problème de Clic

## 🎯 Objectif

Collecter des informations de débogage pour identifier pourquoi les cartes ne sont pas cliquables en mode audio.

## 📋 Instructions

### 1. Ouvrir la Console du Navigateur

**Chrome/Edge** : `F12` ou `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
**Firefox** : `F12` ou `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)

### 2. Aller dans l'onglet "Console"

Vous devriez voir une zone de texte avec des messages.

### 3. Tester Chaque Mode

#### Mode Lecture Audio

1. Sélectionner une pièce
2. Choisir "Lecture audio"
3. Une fois sur l'écran de lecture, **noter les messages** qui apparaissent dans la console
4. Essayer de **cliquer sur une carte** de réplique
5. **Noter ce qui se passe** :
   - Le curseur change-t-il en main (pointeur) au survol ?
   - Y a-t-il un changement visuel au clic ?
   - Y a-t-il de nouveaux messages dans la console ?
   - La lecture audio démarre-t-elle ?

#### Mode Italiennes

1. Sélectionner une pièce
2. Choisir "Italiennes"
3. Choisir un personnage (ex: ARLEQUIN)
4. Une fois sur l'écran de lecture, **noter les messages** dans la console
5. Essayer de **cliquer sur une carte d'un AUTRE personnage** (pas le vôtre)
6. **Noter ce qui se passe** :
   - Le curseur change-t-il ?
   - Changement visuel au clic ?
   - Messages console ?
   - Lecture audio ?

#### Mode Lecture Silencieuse

1. Sélectionner une pièce
2. Choisir "Lecture silencieuse"
3. **Vérifier si le tag s'affiche** dans le header à côté du titre
   - Si OUI : Quelle est l'étiquette affichée ?
   - Si NON : Noter qu'il est manquant
4. Cliquer sur une carte et noter le comportement

## 🔍 Messages de Débogage à Chercher

### Message 1 : PlayScreen
```
🔍 DEBUG PlayScreen: {
  readingMode: 'audio',
  shouldHaveClick: true,
  handleLineClickDefined: true
}
```

**À vérifier** :
- `readingMode` : Doit être `'audio'` en mode audio, `'italian'` en mode italiennes, `'silent'` en mode silencieux
- `shouldHaveClick` : Doit être `true` en mode audio et italiennes, `false` en mode silencieux
- `handleLineClickDefined` : Doit toujours être `true`

### Message 2 : LineRenderer (répété pour chaque ligne)
```
🔍 DEBUG LineRenderer: {
  lineType: 'dialogue',
  characterId: 'char_123',
  readingMode: 'audio',
  onClickDefined: true
}
```

**À vérifier** :
- `readingMode` : Doit correspondre au mode choisi
- `onClickDefined` : 
  - Doit être `true` en mode audio et italiennes
  - Doit être `false` en mode silencieux

## 📝 Informations à Collecter

Veuillez copier et remplir ce template :

```
### MODE AUDIO

1. Messages PlayScreen :
   - readingMode: [valeur]
   - shouldHaveClick: [true/false]
   - handleLineClickDefined: [true/false]

2. Messages LineRenderer (première carte) :
   - lineType: [valeur]
   - readingMode: [valeur]
   - onClickDefined: [true/false]

3. Comportement au clic :
   - Curseur change : [OUI/NON]
   - Changement visuel : [OUI/NON]
   - Audio démarre : [OUI/NON]
   - Autres messages console : [copier ici]

---

### MODE ITALIENNES

1. Personnage sélectionné : [nom]

2. Messages PlayScreen :
   - readingMode: [valeur]
   - shouldHaveClick: [true/false]
   - handleLineClickDefined: [true/false]

3. Messages LineRenderer (carte AUTRE personnage) :
   - lineType: [valeur]
   - characterId: [valeur]
   - readingMode: [valeur]
   - onClickDefined: [true/false]

4. Comportement au clic :
   - Curseur change : [OUI/NON]
   - Changement visuel : [OUI/NON]
   - Audio démarre : [OUI/NON]
   - Autres messages console : [copier ici]

---

### MODE SILENCIEUX

1. Tag affiché dans le header : [OUI/NON]
   - Si OUI, texte affiché : [texte]

2. Messages PlayScreen :
   - readingMode: [valeur]
   - shouldHaveClick: [true/false]

3. Messages LineRenderer (première carte) :
   - onClickDefined: [true/false]

4. Comportement au clic :
   - Curseur change : [OUI/NON]
   - Changement visuel : [OUI/NON]
```

## 🚨 Erreurs Potentielles à Chercher

Dans la console, cherchez aussi des messages d'erreur en **rouge**, par exemple :
- `Uncaught TypeError: ...`
- `Cannot read property ... of undefined`
- `... is not a function`

Si vous voyez des erreurs, **copiez le message complet**.

## 📸 Captures d'Écran Utiles

Si possible, faire des captures d'écran :
1. Console avec les messages de débogage
2. Écran de lecture en mode audio (pour voir le style des cartes)
3. Écran de lecture en mode italiennes
4. Header avec ou sans le tag de méthode

## 🔄 Après le Débogage

Une fois les informations collectées, je pourrai :
1. Identifier exactement où le problème se situe
2. Appliquer la correction ciblée
3. Retirer les logs de débogage
4. Valider que tout fonctionne

---

*Merci pour votre aide dans le débogage !*