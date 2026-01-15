# Export Texte (.txt)

## Vue d'ensemble

La fonctionnalité d'export texte permet de sauvegarder une pièce de théâtre au format `.txt`, dans le même format que celui utilisé pour l'import initial. Cela permet de :

- **Sauvegarder** une pièce modifiée
- **Partager** une pièce avec d'autres utilisateurs
- **Réimporter** la pièce ultérieurement
- **Archiver** différentes versions d'une pièce

## Utilisation

### Depuis l'interface

1. Ouvrez une pièce de théâtre (mode lecture ou mode audio)
2. Cliquez sur l'icône **💾 Enregistrer** dans le header (à côté de l'icône PDF)
3. Le fichier `.txt` sera téléchargé automatiquement

### Nom du fichier

Le nom du fichier est généré automatiquement à partir du titre de la pièce :
- Caractères spéciaux remplacés par des underscores
- Extension `.txt` ajoutée automatiquement
- Exemple : `Le_Bourgeois_Gentilhomme.txt`

## Format généré

Le fichier texte généré respecte exactement le format d'import :

```
Titre de la Pièce
Auteur: Nom de l'auteur
Année: 1673
Catégorie: Comédie

Personnages

PERSONNAGE 1, description du personnage
PERSONNAGE 2, description du personnage

Acte I - Titre de l'acte

Scène 1 - Titre de la scène

PERSONNAGE 1: Texte de la réplique.

PERSONNAGE 2: Autre réplique.

(Didascalie standalone)

Scène 2

PERSONNAGE 1: Nouvelle réplique.

Acte II

Scène 1

...
```

### Structure du fichier

#### 1. Métadonnées (en-tête)
- **Titre** : Première ligne, obligatoire
- **Auteur** : `Auteur: Nom` (optionnel)
- **Année** : `Année: YYYY` (optionnel)
- **Catégorie** : `Catégorie: Genre` (optionnel)

#### 2. Section Cast (optionnelle)
- **Titre de section** : `Personnages`, `Comédiens`, ou `Rôles`
- **Blocs de texte** : Didascalies ou descriptions générales
- **Présentations** : `NOM DU PERSONNAGE, description`

#### 3. Structure des actes et scènes
- **Actes** : `Acte I`, `Acte II`, etc. (chiffres romains)
  - Titre optionnel : `Acte I - Titre`
- **Scènes** : `Scène 1`, `Scène 2`, etc. (chiffres arabes)
  - Titre optionnel : `Scène 1 - Titre`

#### 4. Répliques
- **Format standard** : `PERSONNAGE: Texte de la réplique`
- **Répliques courtes** (≤ 60 caractères) : Sur une seule ligne
- **Répliques longues** : Personnage sur une ligne, texte sur la suivante

#### 5. Didascalies
- **Format** : `(Texte de la didascalie)`
- Peuvent être standalone ou intégrées dans une réplique

#### 6. Espacement
- Lignes vides entre les sections
- Lignes vides entre les répliques
- Lignes vides entre les scènes
- Lignes vides entre les actes

## Implémentation technique

### Service principal

Le service `textExportService.ts` fournit deux fonctions principales :

#### `exportPlayToText(play, options)`

Génère le contenu texte d'une pièce.

**Paramètres :**
- `play: PlayAST` - L'AST de la pièce à exporter
- `options?: TextExportOptions`
  - `includeSpacing?: boolean` - Inclure les lignes vides (défaut: `true`)
  - `maxLineWidth?: number` - Largeur max de ligne, 0 = pas de limite (défaut: `0`)

**Retour :**
- `string` - Le contenu texte complet de la pièce

**Exemple :**
```typescript
import { exportPlayToText } from '@/core/export/textExportService'

const textContent = exportPlayToText(play.ast, {
  includeSpacing: true,
  maxLineWidth: 0
})
```

#### `downloadPlayAsText(play, fileName?, options?)`

Télécharge directement le fichier texte.

**Paramètres :**
- `play: PlayAST` - L'AST de la pièce à exporter
- `fileName?: string` - Nom du fichier (sans extension, optionnel)
- `options?: TextExportOptions` - Options d'export (voir ci-dessus)

**Exemple :**
```typescript
import { downloadPlayAsText } from '@/core/export/textExportService'

downloadPlayAsText(
  play.ast,
  'Ma Pièce Modifiée',
  { includeSpacing: true }
)
```

### Intégration UI

Le bouton d'export texte est intégré dans le `ReadingHeader` :

```typescript
<ReadingHeader
  title={playTitle}
  author={playAuthor}
  onBack={handleClose}
  onExportPDF={handleExportPDF}
  onExportText={handleExportText}  // ← Nouveau
/>
```

**Handler d'export :**
```typescript
const handleExportText = useCallback(() => {
  if (!currentPlay) return

  try {
    const fileName = getPlayTitle(currentPlay)
    downloadPlayAsText(currentPlay.ast, fileName, {
      includeSpacing: true,
      maxLineWidth: 0
    })
  } catch (error) {
    console.error("Erreur lors de l'export TXT:", error)
    addError("Erreur lors de l'export TXT")
  }
}, [currentPlay, addError])
```

## Différences avec l'export PDF

| Aspect | Export TXT | Export PDF |
|--------|-----------|-----------|
| **Format** | Texte brut | Document formaté |
| **Taille** | Très léger (~10-50 KB) | Plus lourd (~200-500 KB) |
| **Éditable** | Oui (éditeur de texte) | Non (lecture seule) |
| **Réimportable** | ✅ Oui | ❌ Non |
| **Impression** | Basique | Optimisé |
| **Mise en forme** | Minimale | Riche (couleurs, polices, etc.) |
| **Compatibilité** | Universelle | Nécessite lecteur PDF |

## Options d'export

### `includeSpacing` (défaut: `true`)

Active ou désactive les lignes vides entre les sections.

**Avec espacement :**
```
HAMLET: Être ou ne pas être.

OPHÉLIE: Mon seigneur...

(Il sort)
```

**Sans espacement :**
```
HAMLET: Être ou ne pas être.
OPHÉLIE: Mon seigneur...
(Il sort)
```

### `maxLineWidth` (défaut: `0`)

Limite la largeur des lignes (en caractères). `0` = pas de limite.

**Exemple avec `maxLineWidth: 60` :**
```
HAMLET: Être ou ne pas être, telle est la question.
Qu'y a-t-il de plus noble pour l'âme : supporter
les flèches et les coups de la Fortune injurieuse,
ou prendre les armes contre une mer de troubles...
```

## Cas d'usage

### 1. Sauvegarde régulière
Exportez régulièrement vos pièces pour créer des sauvegardes :
```
Ma_Piece_v1.txt
Ma_Piece_v2.txt
Ma_Piece_finale.txt
```

### 2. Partage et collaboration
Partagez le fichier `.txt` avec d'autres utilisateurs qui pourront le réimporter.

### 3. Édition externe
Exportez, éditez dans un éditeur de texte externe, puis réimportez.

### 4. Archive
Conservez des versions historiques de vos pièces.

### 5. Migration
Transférez vos pièces vers d'autres outils ou plateformes.

## Compatibilité

### Réimport
Les fichiers exportés peuvent être **réimportés** directement dans l'application :

1. Cliquez sur **Importer une pièce**
2. Sélectionnez le fichier `.txt` exporté
3. La pièce sera analysée et chargée

### Édition manuelle
Vous pouvez éditer manuellement le fichier `.txt` avant de le réimporter, tant que vous respectez le format.

## Limitations

### Informations non exportées
Les éléments suivants ne sont **pas** inclus dans l'export texte :

- ❌ **Assignations de voix** (mapping personnages → voix TTS)
- ❌ **Paramètres de lecture** (vitesse, volume, etc.)
- ❌ **Historique de lecture** (progression, lignes lues, etc.)
- ❌ **Annotations** ou commentaires (si ajoutés à l'avenir)
- ❌ **Métadonnées internes** (dates de création, modification, etc.)

Ces informations sont spécifiques à l'application et ne font pas partie du format texte standard.

### Lors du réimport
Après avoir exporté et réimporté un fichier `.txt` :

- Les **assignations de voix** devront être reconfigurées
- Les **paramètres de lecture** seront réinitialisés aux valeurs par défaut
- L'**historique de lecture** sera perdu

## Tests

### Tests manuels recommandés

1. **Export basique**
   - Charger une pièce
   - Exporter en `.txt`
   - Vérifier le format généré

2. **Réimport**
   - Exporter une pièce
   - Réimporter le fichier exporté
   - Vérifier que la structure est identique

3. **Métadonnées**
   - Pièce avec auteur, année, catégorie
   - Vérifier que tout est présent dans l'export

4. **Section Cast**
   - Pièce avec section Personnages
   - Vérifier le format de la section Cast

5. **Structures complexes**
   - Multiple actes et scènes
   - Didascalies variées
   - Répliques multi-personnages

6. **Caractères spéciaux**
   - Accents, ponctuation
   - Guillemets, apostrophes
   - Vérifier l'encodage UTF-8

## Dépannage

### Le fichier ne se télécharge pas

**Vérifiez :**
- Les autorisations du navigateur pour les téléchargements
- L'espace disque disponible
- La console pour des erreurs JavaScript

### Le format est incorrect

**Vérifiez :**
- Que la pièce est bien chargée (`currentPlay !== null`)
- La structure de l'AST dans la console
- Les logs d'erreur

### Problèmes de réimport

**Vérifiez :**
- L'encodage du fichier (doit être UTF-8)
- La structure du fichier (ACTE, Scène, PERSONNAGE:)
- Les lignes vides et l'espacement
- Que le fichier n'a pas été modifié par un logiciel qui change l'encodage

### Caractères mal encodés

**Solution :**
- Le fichier est généré en UTF-8
- Utilisez un éditeur compatible UTF-8 (VS Code, Sublime Text, Notepad++, etc.)
- Évitez Notepad Windows (peut modifier l'encodage)

## Évolutions futures possibles

### Options supplémentaires
- [ ] Format d'export alternatifs (Markdown, HTML)
- [ ] Exportation sélective (actes/scènes spécifiques)
- [ ] Prévisualisation avant téléchargement
- [ ] Export avec annotations (commentaires)

### Métadonnées étendues
- [ ] Date de création/modification
- [ ] Numéro de version
- [ ] Historique des modifications
- [ ] Commentaires de mise en scène

### Intégration
- [ ] Export vers services cloud (Google Drive, Dropbox)
- [ ] Partage direct par email
- [ ] Export batch (plusieurs pièces)

## Références

- **Parser de texte** : `src/core/parser/textParser.ts`
- **Service d'export** : `src/core/export/textExportService.ts`
- **Tests du parser** : `src/core/parser/__tests__/parser.test.ts`
- **Spécification du format** : `spec/appli.txt`

---

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2025