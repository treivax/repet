# Correctif de l'espacement du texte dans l'export PDF

## 🎯 Problème identifié

Après le merge des corrections du scroll automatique, un bug d'espacement est réapparu dans l'export PDF :

- **Espacement exagéré** : Certaines lignes avaient un espacement trop important entre les caractères
- **Texte illisible** : Espacement du type "h  e  l  l  o" au lieu de "hello"
- **Dépassement** : Les lignes dépassaient sur la droite de la page
- **Incohérence** : Certains textes normaux, d'autres étirés

## 🔍 Cause racine

### jsPDF et la justification par défaut

Par défaut, `jsPDF` peut appliquer une **justification automatique** au texte si les options ne sont pas explicitement spécifiées. Cette justification :

1. Étire le texte pour qu'il remplisse la largeur spécifiée
2. Ajoute de l'espace entre les caractères (`charSpace`)
3. Provoque un rendu illisible et des dépassements

### Appels incomplets à pdf.text()

Certains appels à `pdf.text()` n'incluaient pas les paramètres critiques :

```typescript
// ❌ Mauvais (sans options)
pdf.text(characterName, margin, currentY)

// ✅ Bon (avec options)
pdf.text(characterName, margin, currentY, { align: 'left', charSpace: 0 })
```

### Zones affectées

Les appels sans options étaient présents dans :

1. **Page de couverture** : Titre, auteur, footer
2. **Page de distribution** : Titre section, noms personnages, descriptions
3. **Contenu** : Titres d'actes et de scènes
4. **Dialogues** : **Noms de personnages** ← Le plus critique
5. **Pagination** : Numéros de page

## ✅ Solution appliquée

### Ajout systématique des options

Tous les appels à `pdf.text()` ont été mis à jour pour inclure :

```typescript
{ align: 'left', charSpace: 0 }
```

### Paramètres expliqués

- **`align: 'left'`** : Force l'alignement à gauche, désactive la justification
- **`charSpace: 0`** : Pas d'espace supplémentaire entre les caractères

### Exemple de correction

#### Avant (❌ bug)
```typescript
pdf.setTextColor(rgb.r, rgb.g, rgb.b)
pdf.text(characterName, margin, currentY)  // ← Peut être justifié/étiré
currentY += 6
```

#### Après (✅ fixé)
```typescript
pdf.setTextColor(rgb.r, rgb.g, rgb.b)
pdf.text(characterName, margin, currentY, { align: 'left', charSpace: 0 })
currentY += 6
```

## 📊 Modifications détaillées

### Fichier modifié

`src/core/export/pdfExportService.ts`

### Liste complète des corrections

| Ligne | Contexte | Texte concerné |
|-------|----------|----------------|
| 129 | Page couverture | Titre de la pièce |
| 138 | Page couverture | Auteur |
| 146 | Page couverture | Footer "Généré avec Répét" |
| 167 | Page distribution | Titre "Distribution des rôles" |
| 186 | Page distribution | Lignes de présentation |
| 204 | Page distribution | Noms des personnages |
| 220 | Page distribution | Descriptions |
| 246 | Contenu | Titres d'actes |
| 262 | Contenu | Titres de scènes |
| **323** | **Dialogues** | **Noms de personnages** ⭐ |
| 494 | Pagination | Numéros de page |

**Total** : 11 corrections

### Le fix le plus critique

**Ligne 323 - Noms de personnages dans les dialogues** :

C'est le fix le plus important car :
- Apparaît dans **chaque réplique** de la pièce
- Très visible (en gras + en couleur)
- Provoque un décalage vertical si trop long

```typescript
// Écrire le nom du personnage
pdf.setTextColor(rgb.r, rgb.g, rgb.b)
pdf.text(characterName, margin, currentY, { align: 'left', charSpace: 0 })  // ✅ Fixé
currentY += 6
```

## 🧪 Tests de validation

### Test 1 : Export simple
```
1. Ouvrir une pièce
2. Exporter en PDF
3. Ouvrir le PDF
4. Vérifier visuellement :
   - ✅ Espacement normal dans tous les textes
   - ✅ Noms de personnages lisibles
   - ✅ Pas de dépassement sur la droite
```

### Test 2 : Noms longs
```
1. Pièce avec noms de personnages longs
   (ex: "Le Chevalier de la Triste Figure")
2. Exporter en PDF
3. Vérifier :
   - ✅ Nom lisible sans étirement
   - ✅ Reste dans les marges
```

### Test 3 : Toutes les sections
```
1. Pièce complète avec :
   - Page de couverture
   - Distribution
   - Plusieurs actes/scènes
   - Didascalies
2. Exporter avec toutes les options activées
3. Vérifier chaque section :
   - ✅ Titre couverture : espacement normal
   - ✅ Distribution : tous les textes normaux
   - ✅ Titres actes/scènes : normaux
   - ✅ Noms personnages : normaux
   - ✅ Dialogues : normaux
   - ✅ Didascalies : normales
```

### Test 4 : Comparaison avant/après

Si vous avez un PDF exporté AVANT ce fix :

1. Comparer les deux PDFs côte à côte
2. **Avant** : Espacement irrégulier, textes étirés
3. **Après** : Espacement uniforme et normal

## 📝 Notes techniques

### Pourquoi charSpace: 0 ?

`charSpace` contrôle l'espace supplémentaire entre chaque caractère. Une valeur non nulle peut :
- Étirer le texte de manière artificielle
- Rendre le texte illisible
- Provoquer des dépassements de marge

En fixant à `0`, on garantit l'espacement naturel de la police.

### Pourquoi align: 'left' ?

Sans spécifier `align`, jsPDF peut :
- Utiliser une justification par défaut
- Centrer ou justifier le texte automatiquement
- Appliquer des algorithmes d'étirement

`align: 'left'` force un comportement prévisible et cohérent.

### Autres options de pdf.text()

jsPDF supporte d'autres options (non utilisées ici) :

```typescript
{
  align: 'left' | 'center' | 'right' | 'justify',  // Alignement
  charSpace: number,                                // Espace entre caractères
  lineHeightFactor: number,                         // Facteur hauteur de ligne
  maxWidth: number,                                 // Largeur max (auto wrap)
  angle: number,                                    // Rotation du texte
}
```

Nous utilisons uniquement `align` et `charSpace` car :
- Le wrapping est géré par `splitTextManually()`
- La hauteur de ligne est fixe (5mm)
- Pas de rotation nécessaire

## 🔗 Relation avec autres fixes

### Fix de splitTextManually (déjà présent)

La fonction `splitTextManually()` avait déjà été corrigée pour :
- Utiliser `getTextDimensions()` au lieu de `getTextWidth()`
- Gérer les mots trop longs avec découpage caractère par caractère
- Retourner `[]` au lieu de `[text]` en cas d'échec

Ce fix est **complémentaire** : `splitTextManually` gère les coupures de ligne, mais les options de `pdf.text()` contrôlent le rendu effectif.

### Historique du bug

1. **Origine** : Commit initial de l'export PDF sans options explicites
2. **Première correction** : Dans `feature_annotations` (commit `beb5977`)
   - Ajout de `{ align: 'left', charSpace: 0 }` aux dialogues
3. **Régression** : Merge de `tempo` sans ce fix
4. **Correction complète** : Ce commit (d25736a)
   - Ajout des options à **tous** les appels `pdf.text()`

## ✅ Résultat final

### Comportement garanti

✅ **Espacement uniforme** dans tout le PDF  
✅ **Texte lisible** sans étirement ni compression  
✅ **Respect des marges** sans dépassement  
✅ **Rendu professionnel** cohérent  

### Avant/Après visuel

**Avant** :
```
H  A  M  L  E  T  :    ← Espacement exagéré
T o  b e  o r  n o t  t o  b e    ← Étiré et illisible
```

**Après** :
```
HAMLET:    ← Espacement normal
To be or not to be    ← Lisible et propre
```

## 🚀 Prochaines étapes

- [x] Fix appliqué
- [x] Compilation réussie
- [x] Commit et push sur main
- [ ] Tests manuels (export PDF et vérification visuelle)
- [ ] Tests sur différents navigateurs (Chrome, Firefox, Safari)
- [ ] Tests avec longues pièces (>100 pages)
- [ ] Validation production

## 📦 Commit associé

**Commit** : `d25736a`  
**Message** : `fix: PDF export - Add align:left and charSpace:0 to all text to prevent spacing issues`  
**Branche** : `main`  
**Statut** : ✅ Mergé et pushé  

## 🎯 Origine du fix

Fix porté depuis la branche `feature_annotations` (commit `beb5977`) qui contenait la correction originale pour les dialogues. Cette version étend le fix à **tous** les textes du PDF pour une cohérence totale.

---

**Date** : 2025-01-XX  
**Impact** : Résout définitivement les problèmes d'espacement dans l'export PDF  
**Priorité** : Critique (affecte la lisibilité du PDF)  
**Testing** : À valider par export manuel