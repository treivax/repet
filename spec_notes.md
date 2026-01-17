# Spécification: Fonctionnalité Notes

**Version**: 1.0  
**Date**: 2025-01-XX  
**Branche**: `new_annotations`  
**Statut**: 📝 Spécification

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Terminologie](#terminologie)
3. [Cas d'usage](#cas-dusage)
4. [Apparence visuelle](#apparence-visuelle)
5. [Interactions utilisateur](#interactions-utilisateur)
6. [Modèle de données](#modèle-de-données)
7. [Stockage et persistance](#stockage-et-persistance)
8. [Intégration dans l'UI](#intégration-dans-lui)
9. [Export PDF](#export-pdf)
10. [Considérations techniques](#considérations-techniques)
11. [Plan d'implémentation](#plan-dimplémentation)
12. [Tests et validation](#tests-et-validation)

---

## Vue d'ensemble

### Objectif
Permettre aux utilisateurs d'ajouter des notes personnelles sur **n'importe quel élément** d'une pièce de théâtre pour enrichir leur expérience de lecture et de mémorisation. Les notes peuvent être attachées à :
- **Éléments de structure** : titre, actes, scènes
- **Annotations hors réplique** : didascalies, présentation
- **Répliques** : dialogues des personnages

Les comportements, le design et les interactions sont **identiques pour tous les types d'éléments**.

### Principes de conception
- **Visuel**: Notes style "sticky note" jaune pastel, non intrusives
- **Flexibilité**: Minimiser/maximiser selon les besoins
- **Persistance**: Les notes font partie intégrante du document
- **Export**: Intégration complète dans les PDF exportés
- **UX**: Interactions simples et intuitives (long-press pour créer, clic pour ouvrir/fermer)

### Portée fonctionnelle
- ✅ **Création de notes sur tous les éléments** :
  - Éléments de structure (titre, acte, scène)
  - Annotations hors réplique (didascalies, présentation)
  - Répliques (dialogues)
- ✅ **Comportement unifié** : mêmes interactions pour tous les types d'éléments
- ✅ Édition du contenu textuel des notes
- ✅ Minimisation/maximisation individuelle
- ✅ Minimisation/maximisation globale (toutes les notes)
- ✅ Suppression avec confirmation
- ✅ Persistance locale (IndexedDB)
- ✅ Export PDF avec notes
- ❌ Partage de notes entre utilisateurs (hors scope v1)
- ❌ Notes audio/vidéo (hors scope v1)
- ❌ Annotations de sélection de texte (hors scope v1)

---

## Terminologie

| Terme | Définition |
|-------|------------|
| **Note** | Annotation personnelle attachée à un élément de la pièce |
| **Élément attachable** | Élément de structure, annotation hors réplique ou réplique sur lequel on peut attacher une note |
| **Note maximisée** | Note affichée sous forme complète (sticky note visible) |
| **Note minimisée** | Note affichée sous forme d'icône compacte |
| **Long-press** | Appui long (>500ms) sur un élément pour déclencher une action |
| **Sticky note** | Note adhésive de style post-it |

---

## Cas d'usage

### UC-1: Créer une note sur un élément
**Acteur**: Utilisateur  
**Préconditions**: L'utilisateur lit une pièce dans PlayScreen ou ReaderScreen  
**Flux principal**:
1. L'utilisateur fait un long-press sur **n'importe quel élément** (structure, didascalie, ou réplique)
2. Le système crée une note vide maximisée
3. La note apparaît juste au-dessus de l'élément, décalée à droite
4. Le curseur est automatiquement placé dans le champ de texte
5. L'utilisateur saisit son texte
6. Le système sauvegarde automatiquement lors de la perte de focus

**Résultat**: Une note est créée et associée à l'élément

**Note**: Le comportement est identique quel que soit le type d'élément (structure, didascalie, réplique).

### UC-2: Modifier une note existante
**Acteur**: Utilisateur  
**Préconditions**: Une note existe sur un élément  
**Flux principal**:
1. Si la note est minimisée, l'utilisateur clique sur l'icône pour la maximiser
2. L'utilisateur clique dans le champ de texte de la note
3. L'utilisateur modifie le texte
4. Le système sauvegarde automatiquement lors de la perte de focus

**Résultat**: Le contenu de la note est mis à jour

### UC-3: Minimiser une note
**Acteur**: Utilisateur  
**Préconditions**: Une note est maximisée  
**Flux principal**:
1. L'utilisateur fait un **long-press n'importe où sur la note**
2. Le système minimise la note
3. La note disparaît et une icône apparaît en bas à droite de l'élément qui précède

**Résultat**: La note est minimisée

**Note**: Seul le long-press minimise la note. Un clic simple dans le champ texte permet l'édition.

### UC-4: Maximiser une note
**Acteur**: Utilisateur  
**Préconditions**: Une note est minimisée  
**Flux principal**:
1. L'utilisateur clique sur l'icône de la note
2. Le système maximise la note
3. La note apparaît sous sa forme complète

**Résultat**: La note est maximisée

### UC-5: Supprimer une note
**Acteur**: Utilisateur  
**Préconditions**: Une note existe (peu importe son état)  
**Flux principal**:
1. Si la note est minimisée, l'utilisateur la maximise d'abord
2. L'utilisateur clique sur l'icône 'x' en haut à droite de la note
3. Le système affiche une confirmation "Supprimer cette note ?"
4. L'utilisateur confirme
5. Le système supprime la note

**Flux alternatif**: L'utilisateur annule → la note reste  
**Résultat**: La note est supprimée définitivement

### UC-6: Minimiser/Maximiser toutes les notes
**Acteur**: Utilisateur  
**Préconditions**: L'utilisateur est dans un écran de lecture  
**Flux principal**:
1. L'utilisateur ouvre le menu (3 points en haut à droite)
2. L'utilisateur clique sur le switch "Minimiser/Maximiser les notes"
3. Le système applique l'état à toutes les notes du document
4. L'état est sauvegardé comme préférence utilisateur

**Résultat**: Toutes les notes sont minimisées ou maximisées selon le choix

### UC-7: Exporter un PDF avec notes
**Acteur**: Utilisateur  
**Préconditions**: L'utilisateur a créé des notes sur la pièce  
**Flux principal**:
1. L'utilisateur ouvre le menu et sélectionne "Exporter en PDF"
2. Le système inclut les notes dans le PDF sous leur forme maximisée
3. Les notes apparaissent avec leur style visuel (fond jaune, texte gris italique, cadre fin)
4. Le PDF est généré et téléchargé

**Résultat**: Un PDF contenant le texte et les notes est créé

---

## Apparence visuelle

### Note maximisée

```
┌─────────────────────────────────────────┐
│  [Élément : structure/didascalie/réplique]
│                                         │
│              ┌──────────────────────┐   │
│              │ 📝                 × │   │  ← Icône supprimer (dans la note)
│              │ Texte de la note en  │   │
│              │ gris italique...     │   │
│              │                      │   │
│              └──────────────────────┘   │
│  [Élément suivant]                      │
└─────────────────────────────────────────┘
```

**Caractéristiques** :
- **Position**: Juste au-dessus de l'élément attaché, décalée à droite
- **Fond**: Jaune pastel (`#FEF3C7` ou équivalent Tailwind `bg-yellow-100`)
- **Bordure**: Bordure fine jaune plus foncé (`border border-yellow-300`)
- **Icône**: 📝 (ou équivalent SVG) en haut à gauche
- **Texte**: Gris (`text-gray-600`), italique (`italic`)
- **Police**: Taille réduite (`text-sm`)
- **Padding**: Généreux pour l'aspect "note adhésive" (`p-3` ou `p-4`)
- **Ombre**: Légère ombre portée (`shadow-md`)
- **Largeur**: Maximum 80% de l'élément parent, décalage margin-left
- **Bouton supprimer**: Icône 'x' **dans la note** en haut à droite, hover:text-red-600

### Note minimisée

```
┌─────────────────────────────────────────┐
│  [Élément avec note]               [📝] │  ← Icône compacte
│                                         │
│  [Élément suivant]                      │
└─────────────────────────────────────────┘
```

**Caractéristiques** :
- **Position**: Icône en bas à droite de l'élément qui précède
- **Icône**: 📝 ou sticky note SVG
- **Taille**: Petite (`w-6 h-6` ou équivalent)
- **Fond**: Jaune pastel (`bg-yellow-100`)
- **Bordure**: Bordure fine (`border border-yellow-300`)
- **Arrondi**: Coins arrondis (`rounded`)
- **Effet hover**: Légère mise en évidence (`hover:bg-yellow-200`, `cursor-pointer`)
- **Padding**: Compact (`p-1`)

### Champ de texte (édition)

**Caractéristiques** :
- **Type**: `<textarea>` redimensionnable
- **Placeholder**: "Ajoutez votre note..."
- **Style**: Transparent, sans bordure visible, fond jaune hérité
- **Texte**: Gris italique même en édition
- **Focus**: Bordure légère ou outline subtil
- **Sauvegarde**: Automatique au blur (perte de focus)
- **Hauteur**: Auto-adjust ou min-height avec rows

---

## Interactions utilisateur

### Tableau des interactions

| Action utilisateur | Élément cible | Résultat | Durée/Type |
|-------------------|---------------|----------|------------|
| Long-press | **Tout élément** (structure/didascalie/réplique) sans note | Créer note maximisée | >500ms |
| Long-press | **Note maximisée** (n'importe où sur la note) | Minimiser la note | >500ms |
| Clic | Icône note minimisée | Maximiser la note | Instantané |
| Clic | Champ texte de la note | Éditer le texte | Instantané |
| Clic | Bouton 'x' (dans la note) | Confirmer puis supprimer | Instantané |
| Toggle switch | Menu → "Minimiser/Maximiser notes" | Appliquer à toutes les notes | Instantané |

### Gestion des événements

**Priorités pour éviter les conflits** :
1. **Long-press sur élément** : Priorité création de note (structure/didascalie/réplique)
2. **Long-press sur note** : Minimise la note uniquement
3. **Scroll manuel** : Ne doit PAS déclencher de long-press
4. **Clic simple** : 
   - Sur réplique en mode audio → lecture TTS
   - Sur icône note → maximiser
   - Sur champ texte → éditer
   - Sur bouton 'x' → supprimer
5. **IntersectionObserver** : Ne doit PAS être affecté par les notes

**Implémentation technique** :
- Utiliser `onTouchStart` / `onTouchEnd` / `onTouchMove` pour détecter long-press
- Si `onTouchMove` détecté → annuler le long-press (c'est un scroll)
- Timer de 500ms pour différencier clic et long-press
- `stopPropagation()` sur les événements de la note pour éviter propagation aux éléments parents
- Flag `isScrolling` pour désactiver long-press pendant scroll
- **Long-press sur note** : détecté uniquement sur la zone de la note (pas sur textarea ni bouton 'x')

### Feedback visuel

- **Long-press en cours** : Légère animation ou changement d'opacité pour indiquer détection
- **Création note** : Animation d'apparition (fade-in + slide-in depuis le haut)
- **Minimisation** : Animation de réduction vers l'icône
- **Maximisation** : Animation d'expansion depuis l'icône
- **Suppression** : Animation de fade-out
- **Hover icône** : Changement couleur de fond

---

## Modèle de données

### Interface TypeScript

```typescript
/**
 * Note attachée à un élément de la pièce
 */
interface Note {
  /** Identifiant unique de la note */
  id: string

  /** ID de la pièce à laquelle la note appartient */
  playId: string

  /** Type d'élément attachable */
  attachedToType: 'line' | 'structure' | 'stage-direction' | 'presentation'

  /** Index de l'élément attaché selon son type */
  attachedToIndex: number

  /** Pour les éléments de structure : précisions */
  structureDetails?: {
    structureType: 'title' | 'act' | 'scene'
    actIndex?: number
    sceneIndex?: number
  }

  /** Contenu textuel de la note */
  content: string

  /** État d'affichage de la note */
  isMinimized: boolean

  /** Date de création */
  createdAt: string // ISO 8601

  /** Date de dernière modification */
  updatedAt: string // ISO 8601
}

/**
 * Préférences utilisateur pour les notes
 */
interface NotesPreferences {
  /** Préférence globale : toutes les notes minimisées par défaut */
  globalMinimized: boolean
}
```

### Génération d'ID

```typescript
// Utiliser uuid ou un système similaire
import { v4 as uuidv4 } from 'uuid'

const noteId = uuidv4() // "550e8400-e29b-41d4-a716-446655440000"
```

### Indexation

Pour retrouver rapidement les notes associées à un élément :

```typescript
// Clé composite pour indexation
function getNoteKey(
  playId: string,
  attachedToType: string,
  attachedToIndex: number
): string {
  return `${playId}:${attachedToType}:${attachedToIndex}`
}
```

---

## Stockage et persistance

### Stratégie de stockage

**Option retenue** : IndexedDB via `idb` (wrapper moderne)

**Justification** :
- ✅ Capacité de stockage importante (notes longues possibles)
- ✅ Requêtes indexées performantes
- ✅ Transactions ACID
- ✅ Support offline
- ❌ localStorage trop limité (5-10MB max)

### Structure IndexedDB

**Base de données** : `repet-db`  
**Version** : 2 (ou suivante disponible)

**Object Stores** :

1. **`notes`**
   - Clé primaire : `id` (string, uuid)
   - Index `playId` : pour récupérer toutes les notes d'une pièce
   - Index `attachedTo` : composite `[playId, attachedToType, attachedToIndex]`

2. **`notesPreferences`**
   - Clé primaire : `playId`
   - Contenu : `NotesPreferences`

### API de stockage

```typescript
// src/core/storage/notesStorage.ts

class NotesStorage {
  /**
   * Créer ou mettre à jour une note
   */
  async saveNote(note: Note): Promise<void>

  /**
   * Récupérer une note par ID
   */
  async getNote(noteId: string): Promise<Note | undefined>

  /**
   * Récupérer toutes les notes d'une pièce
   */
  async getNotesByPlayId(playId: string): Promise<Note[]>

  /**
   * Récupérer la note attachée à un élément spécifique
   */
  async getNoteByAttachment(
    playId: string,
    attachedToType: string,
    attachedToIndex: number
  ): Promise<Note | undefined>

  /**
   * Supprimer une note
   */
  async deleteNote(noteId: string): Promise<void>

  /**
   * Supprimer toutes les notes d'une pièce
   */
  async deleteNotesByPlayId(playId: string): Promise<void>

  /**
   * Sauvegarder les préférences globales
   */
  async savePreferences(playId: string, prefs: NotesPreferences): Promise<void>

  /**
   * Récupérer les préférences
   */
  async getPreferences(playId: string): Promise<NotesPreferences | undefined>
}
```

### Sauvegarde automatique

- **Debounce** : 500ms après la dernière modification du texte
- **Trigger** : `onBlur` du textarea (perte de focus)
- **Optimistic UI** : Mise à jour immédiate de l'état React, sauvegarde async

---

## Intégration dans l'UI

### Composants à créer

#### 1. `Note.tsx`
Composant principal d'affichage d'une note

```typescript
interface NoteProps {
  note: Note
  isMinimized: boolean
  onToggle: () => void
  onUpdate: (content: string) => void
  onDelete: () => void
}
```

**Responsabilités** :
- Afficher la note maximisée ou minimisée
- Gérer l'édition du texte
- Déclencher les actions (toggle, update, delete)

#### 2. `NoteIcon.tsx`
Icône de note minimisée

```typescript
interface NoteIconProps {
  onClick: () => void
}
```

#### 3. `NotesManager.tsx`
Gestionnaire global des notes d'une pièce

```typescript
interface NotesManagerProps {
  playId: string
  children: React.ReactNode
}
```

**Responsabilités** :
- Charger les notes depuis IndexedDB au mount
- Fournir le contexte des notes via Context API
- Gérer l'état global (minimized/maximized)

#### 4. `useNotes.ts`
Hook personnalisé pour gérer les notes

```typescript
function useNotes(playId: string) {
  const notes = useState<Note[]>([])
  const preferences = useState<NotesPreferences>()
  
  const createNote = (attachedTo: ...) => { ... }
  const updateNote = (noteId: string, content: string) => { ... }
  const deleteNote = (noteId: string) => { ... }
  const toggleNote = (noteId: string) => { ... }
  const toggleAllNotes = (minimized: boolean) => { ... }
  
  return { notes, createNote, updateNote, deleteNote, ... }
}
```

### Modifications des écrans existants

#### PlayScreen.tsx / ReaderScreen.tsx

**Ajouts** :
1. Wrapper avec `<NotesManager playId={playId}>`
2. Menu : Ajouter item "Minimiser/Maximiser les notes" (switch)
3. Long-press handlers sur les éléments attachables
4. Rendu des notes associées à chaque élément

#### PlaybackDisplay.tsx

**Ajouts** :
1. Pour chaque item de `playbackSequence`, vérifier s'il a une note
2. Rendre la note avant ou après l'élément selon l'état
3. Gérer les interactions (long-press, clic, etc.)

#### LineRenderer.tsx

**Ajouts** :
1. Long-press handler pour créer une note sur la réplique
2. Affichage de l'icône si note minimisée
3. Props pour callback de création de note

### Gestion du contexte

```typescript
// src/contexts/NotesContext.tsx

interface NotesContextValue {
  notes: Map<string, Note> // Indexé par note.id
  notesByAttachment: Map<string, Note> // Indexé par getNoteKey()
  preferences: NotesPreferences
  createNote: (attachedTo: ...) => Promise<Note>
  updateNote: (noteId: string, content: string) => Promise<void>
  deleteNote: (noteId: string) => Promise<void>
  toggleNote: (noteId: string) => void
  toggleAllNotes: (minimized: boolean) => void
}

const NotesContext = createContext<NotesContextValue | undefined>(undefined)

export function useNotesContext() {
  const context = useContext(NotesContext)
  if (!context) {
    throw new Error('useNotesContext must be used within NotesManager')
  }
  return context
}
```

---

## Export PDF

### Intégration dans `pdfExportService.ts`

**Modifications** :
1. Charger les notes de la pièce avant export
2. Pour chaque élément, vérifier s'il a une note associée
3. Rendre la note APRÈS l'élément avec style spécifique

### Style PDF des notes

```typescript
// Pseudo-code de rendu PDF
function renderNoteInPDF(pdf: jsPDF, note: Note, yPosition: number) {
  const noteX = marginLeft + 20 // Décalage à droite
  const noteWidth = pageWidth - marginLeft - marginRight - 20
  const noteY = yPosition + 2 // Petit espacement
  
  // Fond jaune
  pdf.setFillColor(254, 243, 199) // #FEF3C7
  pdf.rect(noteX, noteY, noteWidth, noteHeight, 'F')
  
  // Bordure
  pdf.setDrawColor(252, 211, 77) // #FCD34D
  pdf.setLineWidth(0.5)
  pdf.rect(noteX, noteY, noteWidth, noteHeight, 'S')
  
  // Icône (optionnel ou texte "📝")
  pdf.setFontSize(10)
  pdf.setTextColor(107, 114, 128) // gray-600
  pdf.text('📝', noteX + 2, noteY + 5)
  
  // Contenu en gris italique
  pdf.setFont('helvetica', 'italic')
  pdf.setFontSize(9)
  pdf.setTextColor(107, 114, 128)
  
  // Diviser le texte en lignes
  const lines = pdf.splitTextToSize(note.content, noteWidth - 10)
  pdf.text(lines, noteX + 8, noteY + 5, { align: 'left', charSpace: 0 })
  
  return noteY + noteHeight + 2 // Nouvelle position Y
}
```

### Paramètre d'export

Ajouter une option dans la modale d'export :
- ☑ Inclure les notes (coché par défaut)

---

## Considérations techniques

### Leçons tirées de `feature_annotations`

#### ❌ Problèmes identifiés

1. **Conflit long-press / scroll**
   - Long-press se déclenchait pendant le scroll
   - Solution : Détecter `touchmove` et annuler le long-press

2. **Conflit avec IntersectionObserver**
   - Les notes affectaient la détection des éléments visibles
   - Solution : Exclure les notes de l'observation (pas de `data-playback-index`)

3. **Conflit long-press / click**
   - Le long-press empêchait le clic simple (lecture TTS, édition texte)
   - Solution : Timer et gestion fine des événements, `stopPropagation()` sur les notes

4. **Minimisation de la note**
   - Initialement : clic en dehors du textarea/bouton
   - Problème : conflit avec les clics sur les éléments parents
   - **Solution retenue** : long-press sur la note uniquement

4. **Performance avec beaucoup de notes**
   - Rendu lent si trop de notes maximisées
   - Solution : Virtualisation ou lazy-rendering si nécessaire

5. **Incomplétude export PDF**
   - Notes non intégrées dans le PDF
   - Solution : À implémenter dans cette version

#### ✅ Points positifs à réutiliser

1. **Design visuel** : Le style sticky note jaune était apprécié
2. **Interaction minimiser/maximiser** : Fluide et intuitive
3. **Icône** : Bien visible et reconnaissable
4. **Édition inline** : Pratique

### Gestion des conflits d'événements

```typescript
// Exemple d'implémentation anti-conflit
function useLongPress(
  onLongPress: () => void,
  onClick?: () => void,
  delay: number = 500
) {
  const timerRef = useRef<NodeJS.Timeout>()
  const isLongPressRef = useRef(false)
  const hasMoved = useRef(false)

  const start = (e: React.TouchEvent | React.MouseEvent) => {
    hasMoved.current = false
    isLongPressRef.current = false
    
    timerRef.current = setTimeout(() => {
      if (!hasMoved.current) {
        isLongPressRef.current = true
        onLongPress()
      }
    }, delay)
  }

  const move = () => {
    hasMoved.current = true
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }

  const end = (e: React.TouchEvent | React.MouseEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    
    // Si pas de long-press et onClick fourni
    if (!isLongPressRef.current && !hasMoved.current && onClick) {
      onClick()
    }
    
    isLongPressRef.current = false
  }

  const cancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    isLongPressRef.current = false
  }

  return {
    onTouchStart: start,
    onMouseDown: start,
    onTouchMove: move,
    onMouseMove: move,
    onTouchEnd: end,
    onMouseUp: end,
    onMouseLeave: cancel,
    onTouchCancel: cancel,
  }
}

// Utilisation pour une note :
// Appliquer sur la zone de la note mais PAS sur le textarea ni le bouton 'x'
```

### Performance

**Optimisations** :
- Utiliser `React.memo` sur `Note` component
- Index Map pour lookup O(1) des notes par élément
- Debounce sur la sauvegarde (éviter trop d'écritures IndexedDB)
- Lazy-load des notes (charger seulement pour la pièce courante)

### Accessibilité

- **Keyboard navigation** : Tabulation pour accéder aux notes
- **Screen readers** : ARIA labels appropriés
- **Focus management** : Focus automatique sur textarea lors de la création
- **Contraste** : Vérifier que le gris sur jaune est lisible (WCAG AA minimum)

---

## Plan d'implémentation

### Phase 1: Fondations (Priorité 1)

**Durée estimée** : 1-2 jours

- [ ] Créer le modèle de données (`Note`, `NotesPreferences`)
- [ ] Implémenter `NotesStorage` avec IndexedDB
- [ ] Créer le `NotesContext` et `NotesManager`
- [ ] Implémenter le hook `useNotes`
- [ ] Tests unitaires du storage

### Phase 2: Composants UI (Priorité 1)

**Durée estimée** : 2-3 jours

- [ ] Créer `Note.tsx` (maximisée + minimisée)
- [ ] Créer `NoteIcon.tsx`
- [ ] Implémenter le hook `useLongPress`
- [ ] Styles Tailwind pour sticky note
- [ ] Animations CSS (apparition, minimisation, suppression)
- [ ] Tests de rendu des composants

### Phase 3: Intégration écrans de lecture (Priorité 1)

**Durée estimée** : 2-3 jours

- [ ] Wrapper `PlayScreen` avec `NotesManager`
- [ ] Wrapper `ReaderScreen` avec `NotesManager`
- [ ] Ajouter long-press handlers sur **tous les éléments** (structure/didascalie/réplique)
- [ ] Intégrer rendu des notes dans `PlaybackDisplay`
- [ ] Intégrer rendu des notes dans `LineRenderer`
- [ ] Menu : Ajouter item "Minimiser/Maximiser notes"
- [ ] Tests d'intégration

### Phase 4: Interactions avancées (Priorité 2)

**Durée estimée** : 1-2 jours

- [ ] Gestion toggle global (minimiser/maximiser toutes)
- [ ] Confirmation de suppression (modale)
- [ ] Sauvegarde automatique avec debounce
- [ ] Gestion des erreurs (échec sauvegarde, etc.)
- [ ] Feedback utilisateur (toasts, animations)

### Phase 5: Export PDF (Priorité 1)

**Durée estimée** : 2-3 jours

- [ ] Charger les notes dans `pdfExportService`
- [ ] Implémenter rendu des notes dans le PDF
- [ ] Style : fond jaune, texte gris italique, cadre
- [ ] Positionnement décalé à droite
- [ ] Option "Inclure les notes" dans la modale d'export
- [ ] Tests d'export avec différents types de notes

### Phase 6: Tests et validation (Priorité 1)

**Durée estimée** : 2-3 jours

- [ ] Tests E2E (création, édition, suppression)
- [ ] Tests multi-appareils (desktop, mobile, tablette)
- [ ] Tests de performance (100+ notes)
- [ ] Tests d'accessibilité (keyboard, screen reader)
- [ ] Tests de non-régression (scroll, TTS, Observer)
- [ ] Validation UX utilisateurs

### Phase 7: Documentation et polish (Priorité 2)

**Durée estimée** : 1 jour

- [ ] Documentation utilisateur (aide inline)
- [ ] Documentation développeur (README, JSDoc)
- [ ] Changelog
- [ ] Migration guide (si nécessaire)

**Durée totale estimée** : 11-17 jours

---

## Tests et validation

### Tests unitaires

```typescript
// Exemple: notesStorage.test.ts
describe('NotesStorage', () => {
  it('should save and retrieve a note', async () => {
    const note = createMockNote()
    await storage.saveNote(note)
    const retrieved = await storage.getNote(note.id)
    expect(retrieved).toEqual(note)
  })

  it('should retrieve notes by playId', async () => {
    const notes = [createMockNote(), createMockNote()]
    await Promise.all(notes.map(n => storage.saveNote(n)))
    const retrieved = await storage.getNotesByPlayId(notes[0].playId)
    expect(retrieved.length).toBe(2)
  })

  it('should delete a note', async () => {
    const note = createMockNote()
    await storage.saveNote(note)
    await storage.deleteNote(note.id)
    const retrieved = await storage.getNote(note.id)
    expect(retrieved).toBeUndefined()
  })
})
```

### Tests d'intégration

```typescript
// Exemple: notes-integration.test.tsx
describe('Notes Integration', () => {
  it('should create a note on long-press', async () => {
    const { getByTestId } = render(<PlayScreen />)
    const line = getByTestId('line-0')
    
    fireEvent.touchStart(line)
    await sleep(600) // Long-press
    fireEvent.touchEnd(line)
    
    expect(getByTestId('note-form')).toBeInTheDocument()
  })

  it('should minimize and maximize a note', async () => {
    // Test du toggle
  })

  it('should save note content on blur', async () => {
    // Test de la sauvegarde auto
  })
})
```

### Tests E2E

```typescript
// Exemple: notes.spec.ts (Playwright)
test('should create, edit and delete a note', async ({ page }) => {
  await page.goto('/play/test-play/reader')
  
  // Créer note
  const line = page.locator('[data-line-index="0"]')
  await line.press('', { delay: 600 }) // long-press simulé
  
  // Éditer
  const textarea = page.locator('textarea[placeholder*="note"]')
  await textarea.fill('Ma note de test')
  await textarea.blur()
  
  // Vérifier sauvegarde
  await page.reload()
  await expect(textarea).toHaveValue('Ma note de test')
  
  // Supprimer
  await page.click('[aria-label="Supprimer la note"]')
  await page.click('text=Confirmer')
  await expect(textarea).not.toBeVisible()
})
```

### Checklist de validation

#### Fonctionnalités

- [ ] Créer une note sur structure (titre/acte/scène) - comportement identique
- [ ] Créer une note sur annotation hors réplique (didascalie) - comportement identique
- [ ] Créer une note sur réplique - comportement identique
- [ ] Éditer le contenu d'une note
- [ ] Minimiser une note (long-press n'importe où sur la note)
- [ ] Maximiser une note (clic icône)
- [ ] Supprimer une note avec confirmation
- [ ] Toggle global minimiser/maximiser
- [ ] Persistance (reload page = notes présentes)
- [ ] Export PDF avec notes

#### UX/Design

- [ ] Sticky note style jaune pastel visible
- [ ] Texte gris italique lisible
- [ ] Icône minimisée bien positionnée
- [ ] Animations fluides (apparition, toggle)
- [ ] Feedback visuel sur long-press
- [ ] Confirmation de suppression claire

#### Performance

- [ ] Pas de lag avec 50+ notes
- [ ] Sauvegarde rapide (<100ms perçu)
- [ ] Pas d'impact sur le scroll
- [ ] Pas d'impact sur IntersectionObserver

#### Compatibilité

- [ ] Desktop Chrome
- [ ] Desktop Firefox
- [ ] Desktop Safari
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)
- [ ] Tablette iPad
- [ ] Tablette Android

#### Accessibilité

- [ ] Navigation clavier fonctionnelle (Tab pour focus, Escape pour minimiser)
- [ ] Focus visible
- [ ] ARIA labels présents
- [ ] Screen reader compatible
- [ ] Contraste suffisant (WCAG AA)

#### Non-régression

- [ ] Scroll manuel fluide (mode silencieux)
- [ ] TTS fonctionne (mode audio)
- [ ] IntersectionObserver non affecté
- [ ] Badge de scène mis à jour
- [ ] Export PDF sans notes OK
- [ ] Export texte non affecté

---

## Annexes

### Références de design

**Inspiration** :
- Google Keep (sticky notes)
- Notion (inline comments)
- Apple Notes (minimalist design)

**Couleurs** :
- Jaune pastel : `#FEF3C7` (Tailwind `bg-yellow-100`)
- Bordure : `#FCD34D` (Tailwind `border-yellow-300`)
- Texte : `#4B5563` (Tailwind `text-gray-600`)
- Hover icône : `#FDE68A` (Tailwind `bg-yellow-200`)

### Icônes SVG

```svg
<!-- Sticky note icon -->
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
</svg>

<!-- Delete icon (x) -->
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
        d="M6 18L18 6M6 6l12 12" />
</svg>
```

### Ressources utiles

- [idb (IndexedDB wrapper)](https://github.com/jakearchibald/idb)
- [React Context best practices](https://react.dev/learn/passing-data-deeply-with-context)
- [Tailwind CSS colors](https://tailwindcss.com/docs/customizing-colors)
- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Fin de la spécification**

> Cette spécification est un document vivant. Elle sera mise à jour au fur et à mesure de l'implémentation et des retours utilisateurs.