# ✅ Prompt 02 Complété : Modèles de Données & Types

**Date** : 2025-01-XX  
**Durée** : ~30 minutes  
**Status** : ✅ Validé

---

## 📦 Livrables

### Fichiers créés

```
src/core/models/
├── types.ts           # Types de base (Gender, ContentNodeType, etc.)
├── Character.ts       # Modèle Character + createCharacter()
├── ContentNode.ts     # Modèles AST + type guards
├── Play.ts            # Modèle Play complet
├── Settings.ts        # Modèle Settings + DEFAULT_SETTINGS
└── index.ts           # Exports centralisés
```

### Types créés

#### Types de base (types.ts)
- `Gender` : 'male' | 'female' | 'neutral'
- `ContentNodeType` : 'act' | 'scene' | 'line' | 'didascalie'
- `TextSegmentType` : 'text' | 'didascalie'
- `ReadingMode` : 'silent' | 'audio' | 'italian'
- `Theme` : 'light' | 'dark'

#### Modèles (interfaces)
- `Character` : Personnage avec id, name, gender, voiceURI, color
- `TextSegment` : Segment de texte avec type et contenu
- `BaseContentNode` : Nœud de base de l'AST
- `ActNode` : Acte avec numéro, titre, enfants
- `SceneNode` : Scène avec numéro, titre, enfants
- `LineNode` : Réplique avec id, characterId, segments
- `DidascalieNode` : Didascalie standalone avec contenu
- `ContentNode` : Union de tous les types de nœuds
- `Play` : Pièce complète avec métadonnées, personnages, contenu
- `Settings` : Paramètres globaux de l'application

#### Fonctions utilitaires
- `createCharacter(name: string): Character` - Crée un personnage avec valeurs par défaut
- `isActNode(node: ContentNode): node is ActNode` - Type guard
- `isSceneNode(node: ContentNode): node is SceneNode` - Type guard
- `isLineNode(node: ContentNode): node is LineNode` - Type guard
- `isDidascalieNode(node: ContentNode): node is DidascalieNode` - Type guard

#### Constantes
- `DEFAULT_SETTINGS` : Paramètres par défaut de l'application

---

## ✅ Validation

### Type-checking
```bash
npm run type-check
```
**Résultat** : ✅ 0 erreurs

### Linting
```bash
npm run lint
```
**Résultat** : ✅ 0 erreurs, 0 warnings

### Vérifications manuelles

- [x] Tous les types compilent sans erreur
- [x] Imports/exports fonctionnent correctement
- [x] Type guards fonctionnent (discrimination de types)
- [x] Pas de type `any` utilisé
- [x] En-têtes de copyright présents dans tous les fichiers
- [x] Documentation JSDoc présente pour interfaces et fonctions
- [x] Conventions de nommage respectées (PascalCase interfaces, camelCase fonctions)
- [x] Exports nommés (pas de default export)

---

## 📝 Points clés

### Architecture des modèles

L'architecture suit une approche AST (Abstract Syntax Tree) pour représenter le contenu théâtral :

1. **Types de base** : Énumérations et types littéraux pour les valeurs discrètes
2. **Character** : Modèle simple avec générateur d'ID unique
3. **ContentNode** : Hiérarchie de nœuds typés avec type guards pour la discrimination
4. **Play** : Agrégat principal contenant métadonnées et contenu structuré
5. **Settings** : Configuration globale avec valeurs par défaut

### Décisions techniques

- **Type guards** : Implémentés pour faciliter la discrimination de types dans l'AST
- **Dates** : Utilisation de `Date` natif (sera sérialisé en ISO string pour IndexedDB)
- **IDs** : Génération simple avec timestamp + random (sera remplacé par UUID dans le module storage)
- **Optionnels** : Champs optionnels marqués avec `?` (author, year, category, voiceURI, etc.)
- **Constantes** : DEFAULT_SETTINGS exporté pour réutilisation

### Compatibilité

- **TypeScript strict mode** : Tous les types passent les règles strictes
- **IndexedDB** : Structure compatible avec Dexie.js (sera implémenté dans Prompt 04)
- **Sérialisation** : Tous les types sont sérialisables en JSON (Date sera converti)

---

## 🔄 Prochaines étapes

**Prompt 03** : Parser de format théâtral
- Implémenter le parser `.txt` → AST (ContentNode[])
- Extraction des métadonnées (titre, auteur, etc.)
- Détection automatique des personnages
- Gestion des didascalies inline et standalone
- Tests de parsing sur fichiers réels

**Dépendances** :
- Les types créés ici seront utilisés par le parser
- Le parser produira des objets `Play` conformes au modèle

---

## 📚 Utilisation

### Import des types

```typescript
import { 
  Play, 
  Character, 
  ContentNode, 
  Settings,
  DEFAULT_SETTINGS,
  isLineNode,
  createCharacter 
} from '@/core/models';
```

### Exemple d'utilisation

```typescript
// Créer un personnage
const hamlet = createCharacter('HAMLET');
hamlet.gender = 'male';
hamlet.voiceURI = 'en-US-Male-1';

// Type guard
function processNode(node: ContentNode) {
  if (isLineNode(node)) {
    console.log(`Line by character ${node.characterId}`);
  } else if (isActNode(node)) {
    console.log(`Act: ${node.title}`);
  }
}

// Settings par défaut
const settings: Settings = { ...DEFAULT_SETTINGS };
settings.theme = 'dark';
```

---

## 📊 Métriques

- **Fichiers créés** : 6
- **Interfaces** : 10
- **Types** : 5
- **Fonctions** : 5
- **Constantes** : 1
- **Lignes de code** : ~230
- **Temps de développement** : ~30 minutes

---

**Auteur** : IA Assistant  
**Date de validation** : 2025-01-XX  
**Prochaine étape** : Prompt 03 - Parser