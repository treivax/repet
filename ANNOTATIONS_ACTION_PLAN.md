# Plan d'Action : Système d'Annotations pour les Pièces

## 📋 Vue d'Ensemble

### Objectif
Permettre aux utilisateurs d'annoter les répliques des pièces avec des notes persistantes, visibles sous forme de sticky notes jaunes.

### Résumé des Fonctionnalités
- **Création** : Clic long sur une réplique → sticky note apparaît
- **Affichage** : Note étendue (texte visible) OU minimisée (icône uniquement)
- **Édition** : Texte modifiable dans la note
- **Support universel** : Annotations sur tous les types de cartes (répliques, didascalies, structure, présentation)
- **Persistance** : Notes sauvegardées avec la pièce
- **Contrôle global** : Menu permettant d'étendre/minimiser toutes les notes

---

## 🏗️ Architecture et Analyse Technique

### 1. Modèle de Données

#### 1.1 Nouvelle Interface `Annotation`
**Fichier** : `src/core/models/Annotation.ts`

```typescript
export interface Annotation {
  id: string                    // UUID unique
  playbackItemIndex: number     // Référence vers l'index du PlaybackItem dans la séquence
  content: string               // Texte de l'annotation
  isExpanded: boolean           // État d'affichage (étendu/minimisé)
  createdAt: Date              // Date de création
  updatedAt: Date              // Date de dernière modification
}
```

**Justification** :
- `lineId` : Lien avec la ligne existante (non modifiable)
- `isExpanded` : État local par note (indépendant du toggle global)
- Timestamps : Permettent futures fonctionnalités (tri, historique)

#### 1.2 Modification du Modèle `Play`
**Fichier** : `src/core/models/Play.ts`

Ajouter au niveau du `Play` (pas dans `PlayAST`) :
```typescript
export interface Play {
  id: string
  fileName: string
  ast: PlayAST
  annotations?: Annotation[]    // NOUVEAU : Liste des annotations
  createdAt: Date
  updatedAt: Date
}
```

**Justification** :
- Annotations au niveau `Play` : Elles sont spécifiques à l'instance de pièce importée
- Optionnel (`?`) : Rétrocompatibilité avec pièces existantes
- Séparé de l'AST : L'AST représente la structure du texte, les annotations sont des métadonnées utilisateur

#### 1.3 Migration de Base de Données
**Fichier** : `src/core/storage/database.ts`

**Actions** :
1. Incrémenter la version du schéma Dexie (v1 → v2)
2. Ajouter migration pour :
   - Initialiser `annotations: []` pour les pièces existantes
   - Préserver les données existantes

**Code indicatif** :
```typescript
this.version(2).stores({
  plays: 'id, title, createdAt, updatedAt',
  settings: 'id',
}).upgrade(trans => {
  return trans.table('plays').toCollection().modify(play => {
    if (!play.annotations) {
      play.annotations = []
    }
  })
})
```

---

### 2. Gestion d'État

#### 2.1 Nouveau Store : `annotationsStore`
**Fichier** : `src/state/annotationsStore.ts`

**Responsabilités** :
- Gérer l'état global des annotations (CRUD)
- Toggle global (étendre/minimiser toutes)
- Synchronisation avec IndexedDB via le `playsRepository`

**Interface** :
```typescript
interface AnnotationsState {
  // État
  annotations: Record<string, Annotation[]>  // clé = playId
  areAllExpanded: Record<string, boolean>    // état global par pièce
  
  // Actions
  addAnnotation: (playId: string, playbackItemIndex: number, content: string) => Promise<void>
  updateAnnotation: (playId: string, annotationId: string, content: string) => Promise<void>
  deleteAnnotation: (playId: string, annotationId: string) => Promise<void>
  toggleAnnotation: (playId: string, annotationId: string) => Promise<void>
  toggleAllAnnotations: (playId: string, expanded: boolean) => Promise<void>
  loadAnnotations: (playId: string, annotations: Annotation[]) => void
  clearAnnotations: (playId: string) => void
}
```

**Persistance** :
- Pas de `persist()` zustand direct (risque de conflit avec playsRepository)
- Chaque mutation appelle `playsRepository.update()` pour sauvegarder
- `loadAnnotations()` appelé lors du chargement de la pièce

#### 2.2 Alternative : Intégrer dans `playStore`
**Option** : Ajouter les actions annotations directement dans `playStore.ts`

**Avantages** :
- Centralisation (une seule source de vérité pour la pièce courante)
- Moins de synchronisation entre stores

**Inconvénients** :
- Store plus complexe
- Responsabilités multiples

**Recommandation** : Store séparé pour respecter le principe de séparation des responsabilités.

---

### 3. Composants UI

#### 3.1 Nouveau Composant : `AnnotationNote`
**Fichier** : `src/components/reader/AnnotationNote.tsx`

**Props** :
```typescript
interface Props {
  annotation: Annotation
  onUpdate: (content: string) => void
  onToggle: () => void
  onDelete?: () => void        // Optionnel : bouton supprimer
}
```

**Comportement** :
- **État minimisé** :
  - Icône jaune (📝 ou sticky note custom)
  - Position : absolute, en bas à droite de la réplique parente
  - `onClick` → passe en état étendu
  
- **État étendu** :
  - Fond jaune clair (`bg-yellow-50 dark:bg-yellow-900/20`)
  - Bordure subtile
  - Décalage à droite (`ml-8` ou `ml-12`)
  - `textarea` éditable (auto-resize)
  - **Appui long (500ms) sur la note** → minimise l'annotation
  - Bouton suppression (icône poubelle) en haut à droite
  - Sauvegarde automatique (debounce 500ms)

**Design** :
```
┌─────────────────────────────────────┐
│  PERSONNAGE                         │
│  Texte de la réplique...            │
│                              [📝]   │  ← État minimisé
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  PERSONNAGE                         │
│  Texte de la réplique...            │
└─────────────────────────────────────┘
    ┌─────────────────────────────┐
    │ 📝 Note personnelle    [🗑] │  ← État étendu (appui long pour minimiser)
    │ ┌─────────────────────────┐ │
    │ │ Texte de l'annotation   │ │
    │ │ ...                     │ │
    │ └─────────────────────────┘ │
    └─────────────────────────────┘
```

**Accessibilité** :
- `role="note"` ou `role="complementary"`
- `aria-label="Annotation pour la réplique"`
- Support clavier (Tab, Escape pour fermer)

#### 3.2 Modification : `LineRenderer`
**Fichier** : `src/components/reader/LineRenderer.tsx`

**Changements** :
1. Ajouter props :
   **Nouvelles Props** (ajoutées à tous les composants de cartes) :
   ```typescript
      annotation?: Annotation
      onAnnotationCreate?: () => void
      onAnnotationUpdate?: (content: string) => void
      onAnnotationToggle?: () => void
      onAnnotationDelete?: () => void
   ```

2. Ajouter des handlers d'appui long (500ms) :
   - `handleMouseDown` / `handleTouchStart` : démarrer le timer
   - `handleMouseUp` / `handleTouchEnd` : annuler le timer
   - Si `annotation` existe : ne pas créer de nouveau
   - Sinon : appeler `onAnnotationCreate()` après 500ms

3. Rendre `<AnnotationNote>` si annotation existe :
   ```tsx
   return (
     <div className="relative">
       {/* Carte de réplique existante */}
       <div className={cardClasses} ...>
         {/* Contenu actuel */}
       </div>
       
       {/* Annotation */}
       {annotation && (
         <AnnotationNote
           annotation={annotation}
           onUpdate={onAnnotationUpdate}
           onToggle={onAnnotationToggle}
         />
       )}
     </div>
   )
   ```

**Note** : L'icône minimisée doit être positionnée en `absolute` par rapport au conteneur de la réplique.

**Interaction** : L'appui long (500ms) sur la note étendue permet de la minimiser. Les événements doivent utiliser `stopPropagation()` pour éviter les conflits avec les handlers d'appui long du parent (`LineRenderer`).

#### 3.3 Modification : `PlaybackDisplay`
**Fichier** : `src/components/reader/PlaybackDisplay.tsx`

**Changements** :
1. Recevoir props annotations :
   **Nouvelles Props** :
   ```typescript
      annotations?: Annotation[]
      onAnnotationCreate: (playbackItemIndex: number) => void
      onAnnotationUpdate: (annotationId: string, content: string) => void
      onAnnotationToggle: (annotationId: string) => void
      onAnnotationDelete: (annotationId: string) => void
   ```

2. Pour chaque `LinePlaybackItem`, trouver l'annotation correspondante :
   ```typescript
   const lineAnnotation = annotations.find(a => a.lineId === line.id)
   ```

3. Passer les props à `LineRenderer`

#### 3.4 Menu Global : Toggle Toutes les Annotations
**Fichiers** : `src/screens/ReaderScreen.tsx` et `src/screens/PlayScreen.tsx`

**Changements** :
1. Ajouter item dans le menu `Header` (array `menuItems`) :
   ```typescript
   {
     id: 'toggle-annotations',
     label: areAllExpanded ? 'Minimiser toutes les notes' : 'Étendre toutes les notes',
     icon: <NotesIcon />,
     onClick: handleToggleAllAnnotations
   }
   ```

2. Implémenter handler :
   ```typescript
   const handleToggleAllAnnotations = () => {
     const nextState = !areAllExpanded
     toggleAllAnnotations(playId, nextState)
   }
   ```

**UI** : Icône suggérée
- Étendu : 📋 ou sticky note stack
- Minimisé : 📝 ou sticky note simple

---

### 4. Repository et Persistance

#### 4.1 Modification : `playsRepository`
**Fichier** : `src/core/storage/plays.ts`

**Méthodes à ajouter** :

```typescript
/**
 * Ajoute une annotation à une pièce
 */
async addAnnotation(playId: string, annotation: Annotation): Promise<void>

/**
 * Met à jour une annotation
 */
async updateAnnotation(playId: string, annotationId: string, updates: Partial<Annotation>): Promise<void>

/**
 * Supprime une annotation
 */
async deleteAnnotation(playId: string, annotationId: string): Promise<void>

/**
 * Remplace toutes les annotations d'une pièce (pour toggle global)
 */
async updateAllAnnotations(playId: string, annotations: Annotation[]): Promise<void>
```

**Implémentation** :
- Récupérer la pièce
- Modifier le tableau `annotations`
- Appeler `update()` avec `updatedAt: new Date()`

**Optimisation** : 
- Utiliser transactions Dexie pour les opérations multiples
- Éviter les lectures/écritures répétées

---

### 5. Flux de Données Complet

#### 5.1 Création d'une Annotation

```
User (appui long 500ms sur n'importe quelle carte)
    ↓
[Card Component].handleMouseDown/handleTouchStart (timer démarre)
    ↓
Après 500ms → onAnnotationCreate() [prop passée par parent]
    ↓
PlaybackDisplay → onAnnotationCreate(item.index)
    ↓
ReaderScreen/PlayScreen → handleAnnotationCreate(playbackItemIndex)
    ↓
annotationsStore.addAnnotation(playId, playbackItemIndex, "")
    ↓
Créer nouvel objet Annotation { id: uuid(), playbackItemIndex, content: "", isExpanded: true, ... }
    ↓
playsRepository.addAnnotation(playId, annotation)
    ↓
IndexedDB mise à jour
    ↓
Store mis à jour → Re-render
    ↓
AnnotationNote s'affiche (état étendu, vide, focus sur textarea)
```

#### 5.2 Édition d'une Annotation

```
User (tape dans textarea)
    ↓
AnnotationNote onChange (debounced)
    ↓
onUpdate(newContent) [prop]
    ↓
annotationsStore.updateAnnotation(playId, annotationId, newContent)
    ↓
playsRepository.updateAnnotation(...)
    ↓
IndexedDB mise à jour
    ↓
Store mis à jour → Re-render
```

#### 5.3 Toggle Global

```
User (clique menu "Étendre/Minimiser toutes")
    ↓
handleToggleAllAnnotations()
    ↓
annotationsStore.toggleAllAnnotations(playId, expanded)
    ↓
Pour chaque annotation : annotation.isExpanded = expanded
    ↓
playsRepository.updateAllAnnotations(playId, updatedAnnotations)
    ↓
IndexedDB mise à jour
    ↓
Store mis à jour → Re-render (toutes les notes changent d'état)
```

---

## 📝 Checklist d'Implémentation

### Phase 1 : Modèle et Persistance (Fondations)
- [ ] Créer `src/core/models/Annotation.ts`
- [ ] Modifier `src/core/models/Play.ts` (ajouter `annotations?`)
- [ ] Mettre à jour `src/core/storage/database.ts` (migration v2)
- [ ] Étendre `src/core/storage/plays.ts` (méthodes CRUD annotations)
- [ ] Tester migrations et CRUD avec des tests unitaires

### Phase 2 : Store et État (Logique)
- [ ] Créer `src/state/annotationsStore.ts`
- [ ] Implémenter actions CRUD
- [ ] Implémenter toggle global
- [ ] Lier store avec playsRepository
- [ ] Tests unitaires du store

### Phase 3 : Composant UI de Base (Annotation)
- [ ] Créer `src/components/reader/AnnotationNote.tsx`
- [ ] Implémenter état minimisé (icône)
- [ ] Implémenter état étendu (textarea, bouton fermer)
- [ ] Styling (fond jaune, décalage, bordures)
- [ ] Auto-save avec debounce
- [ ] Support mobile (touch events)
- [ ] Accessibilité (ARIA, clavier)

### Phase 4 : Intégration dans LineRenderer
- [ ] Modifier props de `LineRenderer`
- [ ] Adapter logique `onLongPress` (ne pas créer si annotation existe)
- [ ] Rendre `<AnnotationNote>` conditionnellement
- [ ] Positionner correctement (icône en bas à droite)
- [ ] Gérer z-index et overflow

### Phase 5 : Intégration dans PlaybackDisplay
- [ ] Modifier props de `PlaybackDisplay`
- [ ] Passer annotations depuis parent (ReaderScreen, PlayScreen)
- [ ] Mapper annotations aux lignes
- [ ] Propager callbacks vers LineRenderer

### Phase 6 : Intégration dans Écrans
- [ ] **ReaderScreen** :
  - [ ] Charger annotations depuis playStore
  - [ ] Connecter au annotationsStore
  - [ ] Passer props à PlaybackDisplay
  - [ ] Ajouter item menu "Toggle all"
- [ ] **PlayScreen** :
  - [ ] Mêmes étapes que ReaderScreen
  - [ ] Gérer interactions avec lecture audio (pause pendant édition ?)

### Phase 7 : Tests et Polissage
- [ ] Tests e2e :
  - [ ] Créer annotation (clic long)
  - [ ] Éditer annotation
  - [ ] Toggle annotation
  - [ ] Toggle toutes annotations
  - [ ] Persistance (recharger pièce)
- [ ] Tests d'accessibilité (clavier, screen reader)
- [ ] Tests de performance (pièce avec 100+ annotations)
- [ ] Polissage UI/UX :
  - [ ] Animations (apparition/disparition note)
  - [ ] Feedback visuel (sauvegarde en cours)
  - [ ] Gestion erreurs (échec sauvegarde)

### Phase 8 : Documentation et Déploiement
- [ ] Documenter modèle de données
- [ ] Documenter API du store
- [ ] Ajouter exemples d'utilisation
- [ ] Guide utilisateur (section aide)
- [ ] Changelog
- [ ] Bump version (minor : 0.2.0 → 0.3.0)

---

## 🎨 Spécifications de Design

### Couleurs
- **Fond note étendue** : `bg-yellow-50 dark:bg-yellow-900/20`
- **Bordure note** : `border border-yellow-200 dark:border-yellow-800`
- **Icône minimisée** : Jaune `#FCD34D` (yellow-300)
- **Texte** : `text-gray-900 dark:text-gray-100`

### Espacements
- **Décalage horizontal** : `ml-8` ou `ml-12` (32px ou 48px)
- **Padding interne** : `p-3` ou `p-4`
- **Marge verticale** : `mt-2` sous la réplique

### Icône Minimisée
- **Position** : `absolute bottom-2 right-2`
- **Taille** : `w-8 h-8` (32px)
- **Effet hover** : `hover:scale-110 transition-transform`
- **Symbole** : 📝 (emoji) ou SVG custom

### Textarea
- **Auto-resize** : Utiliser `autosize` lib ou custom hook
- **Placeholder** : "Ajouter une note..."
- **Min-height** : `min-h-[60px]`
- **Max-height** : `max-h-[300px]` avec scroll

### Animations
- **Apparition** : Fade-in + slide-down (150ms)
- **Disparition** : Fade-out (100ms)
- **Toggle** : Transition smooth sur hauteur

---

## 🚨 Points d'Attention et Contraintes

### 1. Performance
- **Problème** : Pièces avec centaines de répliques + annotations
- **Solution** : 
  - Lazy loading des annotations (ne charger que celles visibles)
  - Virtualisation si nécessaire (react-window)
  - Debounce agressif sur auto-save (500-1000ms)

### 2. Conflits avec Lecture Audio
- **Problème** : Édition annotation pendant lecture audio
- **Solutions possibles** :
  - Option A : Désactiver édition pendant lecture
  - Option B : Mettre en pause automatiquement lors de focus textarea
  - Option C : Permettre édition sans impact (annotations indépendantes)
- **Recommandation** : Option C (plus flexible)

### 3. Scroll et Positionnement
- **Problème** : Note étendue peut dépasser viewport
- **Solution** :
  - Détection de débordement (bottom viewport)
  - Ajuster position dynamiquement (ouvrir vers le haut si nécessaire)
  - Alternative : Modal/Dialog pour édition sur mobile

### 4. Lignes Masquées (Mode Italiennes)
- **Problème** : Annotation sur ligne masquée (hideUserLines = true)
- **Comportements possibles** :
  - A : Désactiver annotations sur lignes masquées
  - B : Permettre mais icône visible uniquement quand ligne révélée
  - C : Icône toujours visible même si ligne masquée
- **Recommandation** : B (cohérence avec visibilité ligne)

### 5. Export (PDF/TXT)
- **Question** : Inclure annotations dans exports ?
- **Recommandation** :
  - Export PDF : Option dans settings (inclure/exclure annotations)
  - Export TXT : Idem, avec format `[NOTE: contenu]` après réplique
- **Action** : Prévoir mais implémenter en Phase 9 (hors scope initial)

### 6. Rétrocompatibilité
- **Problème** : Pièces existantes sans champ `annotations`
- **Solution** : Migration auto (Phase 1) + validation au runtime
- **Validation** : `play.annotations = play.annotations ?? []`

### 7. Suppression d'Annotations
- **Question** : Permettre suppression ou seulement vider le contenu ?
- **Recommandation** : Les deux
  - Contenu vide → annotation reste (icône grise ?)
  - Bouton supprimer explicite → supprime l'annotation
- **UI** : Bouton poubelle discret dans note étendue

### 8. Undo/Redo
- **Scope** : Hors périmètre initial
- **Future** : Implémenter historique des modifications (stack undo/redo)

---

## 🧪 Stratégie de Tests

### Tests Unitaires
- **Models** : Validation Annotation (champs requis, types)
- **Store** : 
  - CRUD operations
  - Toggle logic
  - État global (areAllExpanded)
- **Repository** : Méthodes annotations (mock Dexie)

### Tests d'Intégration
- **Store + Repository** : Persistance complète
- **Composants** :
  - AnnotationNote rendu (minimisé/étendu)
  - LineRenderer avec annotation
  - PlaybackDisplay avec annotations multiples

### Tests E2E (Playwright)
**Fichier** : `tests/e2e/06-annotations.spec.ts`

**Scénarios** :
1. Créer annotation (clic long) → vérifier apparition textarea
2. Éditer annotation → vérifier sauvegarde (reload page, vérifier contenu)
3. Toggle annotation (minimiser/étendre) → vérifier états
4. Toggle toutes annotations → vérifier toutes changent
5. Navigation sommaire avec annotations → vérifier persistance état
6. Annotations sur lignes masquées (mode italiennes)

### Tests Accessibilité
- Lighthouse audit
- axe-core violations
- Navigation clavier complète
- Screen reader (NVDA/JAWS simulation)

---

## 📊 Estimation de Charge

### Temps Estimé par Phase
- **Phase 1** : 2-3h (modèle, DB, repository)
- **Phase 2** : 2-3h (store, logique)
- **Phase 3** : 4-5h (composant AnnotationNote)
- **Phase 4** : 2h (intégration LineRenderer)
- **Phase 5** : 1-2h (intégration PlaybackDisplay)
- **Phase 6** : 2-3h (intégration écrans)
- **Phase 7** : 4-5h (tests complets)
- **Phase 8** : 1-2h (doc, déploiement)

**Total** : ~20-25h de développement

### Ordre de Priorité
1. Phase 1 (fondations critiques)
2. Phase 2 (logique métier)
3. Phase 3 (UI core)
4. Phase 4-5 (intégration composants)
5. Phase 6 (intégration écrans)
6. Phase 7 (tests)
7. Phase 8 (finitions)

---

## 🔄 Améliorations Futures (Post-MVP)

### V1.1 - Annotations Riches
- Markdown support (gras, italique, listes)
- Couleurs personnalisables (pas que jaune)
- Catégories/tags (technique, émotion, mise en scène)

### V1.2 - Collaboration
- Export/import annotations séparément du texte
- Partage annotations entre utilisateurs
- Format standard (JSON, annotations.json)

### V1.3 - Intelligence
- Suggestions automatiques (analyse sentiment, détection didascalies)
- Recherche dans annotations
- Statistiques (nombre annotations par acte/personnage)

### V1.4 - Multimédia
- Annotations vocales (enregistrement audio)
- Photos/images attachées
- Liens externes

---

## 📚 Références Techniques

### Librairies Recommandées
- **UUID** : `crypto.randomUUID()` (natif, pas de lib)
- **Debounce** : Custom hook ou `lodash.debounce`
- **Auto-resize textarea** : `react-textarea-autosize` ou custom
- **Date formatting** : `date-fns` (déjà utilisé ?)

### Patterns Utilisés
- **Repository Pattern** : Isolation couche data
- **Store Pattern** : Zustand pour état global
- **Component Composition** : Props drilling contrôlé
- **Optimistic Updates** : Update UI avant save (UX fluide)

### Références UI/UX
- Google Docs comments
- Notion inline comments
- GitHub PR comments (positionnement)
- Sticky notes apps (Microsoft Sticky Notes, macOS Notes)

---

## ✅ Critères de Succès

### Fonctionnels
- ✅ Créer annotation avec clic long
- ✅ Éditer annotation avec sauvegarde auto
- ✅ Toggle annotation (minimiser/étendre)
- ✅ Toggle global (toutes annotations)
- ✅ Persistance complète (reload, navigation)
- ✅ Fonctionnel sur ReaderScreen ET PlayScreen
- ✅ Responsive (desktop + mobile)

### Non-Fonctionnels
- ✅ Performance : <50ms pour toggle, <500ms pour save
- ✅ Accessibilité : WCAG 2.1 AA
- ✅ Tests : >80% coverage
- ✅ Documentation complète
- ✅ 0 regression sur fonctionnalités existantes

### UX
- ✅ Feedback visuel immédiat
- ✅ Pas de blocage interface (debounce, async)
- ✅ Design cohérent avec l'app
- ✅ Intuitive (pas de tutoriel nécessaire)

---

## 🎯 Conclusion

Ce plan d'action couvre l'intégralité du système d'annotations, de la conception au déploiement. L'approche incrémentale (8 phases) permet de :
- Valider chaque étape avant de continuer
- Détecter problèmes tôt
- Livrer MVP fonctionnel rapidement (phases 1-6)
- Itérer sur qualité (phases 7-8)

**Prochaine étape recommandée** : Commencer par Phase 1 (modèle de données et migration DB) pour valider l'architecture de persistance avant d'investir dans l'UI.