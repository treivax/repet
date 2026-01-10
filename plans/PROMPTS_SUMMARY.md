# 📋 Résumé Détaillé des Prompts - Projet Répét

Ce fichier liste tous les prompts avec leur contenu essentiel. Chaque prompt sera développé dans son fichier dédié.

---

## Prompt 03 : Parser de Textes Théâtraux

**Durée** : ~2h | **Dépend de** : Prompts 01-02

### Objectif
Créer le parser qui transforme les fichiers .txt en AST (Play object).

### Fichiers à créer
- `src/core/parser/types.ts` - Types internes du parser
- `src/core/parser/tokenizer.ts` - Découpage en tokens
- `src/core/parser/parser.ts` - Construction de l'AST
- `src/core/parser/index.ts` - API publique

### Logique clé
1. **Tokenizer** : Découpe le texte en blocs (titre, auteur, acte, scène, réplique, didascalie)
2. **Parser** : Construit l'AST à partir des tokens
3. **Extraction** : Identifie automatiquement titre, auteur, année
4. **Personnages** : Détecte et crée les personnages (noms en MAJUSCULES suivis de ':')
5. **Didascalies** : Détecte texte entre parenthèses ET blocs non-répliques

### Règles du format
- Titre : premier bloc non-acte/scène/réplique
- Auteur : ligne commençant par "Auteur" ou "Auteur:"
- Année : ligne commençant par "Année" ou "Annee"
- Acte : ligne commençant par "Acte" (insensible à la casse)
- Scène : ligne commençant par "Scène" ou "Scene"
- Réplique : ligne vide + MAJUSCULES: + retour ligne
- Didascalie inline : texte entre parenthèses
- Didascalie bloc : bloc de texte non-réplique après acte/scène

---

## Prompt 04 : Storage (IndexedDB)

**Durée** : ~1.5h | **Dépend de** : Prompts 01-02

### Objectif
Configurer Dexie.js pour stocker les pièces et paramètres en local.

### Fichiers à créer
- `src/core/storage/database.ts` - Configuration Dexie
- `src/core/storage/plays.ts` - Repository des pièces
- `src/core/storage/settings.ts` - Repository des paramètres
- `src/core/storage/index.ts` - API publique

### Base de données
```typescript
class RepetDatabase extends Dexie {
  plays!: Table<Play, string>;
  settings!: Table<Settings, string>;
  
  constructor() {
    super('RepetDB');
    this.version(1).stores({
      plays: 'id, title, createdAt',
      settings: 'id'
    });
  }
}
```

### API Repository
- `playsRepository.getAll()` - Liste toutes les pièces
- `playsRepository.get(id)` - Récupère une pièce
- `playsRepository.add(play)` - Ajoute une pièce
- `playsRepository.update(id, changes)` - Met à jour
- `playsRepository.delete(id)` - Supprime
- `settingsRepository.get()` - Récupère les paramètres
- `settingsRepository.update(settings)` - Met à jour

---

## Prompt 05 : Text-to-Speech Engine

**Durée** : ~2h | **Dépend de** : Prompts 01-02

### Objectif
Wrapper autour de Web Speech API pour lire les répliques.

### Fichiers à créer
- `src/core/tts/engine.ts` - Wrapper Web Speech API
- `src/core/tts/queue.ts` - Gestion file d'attente
- `src/core/tts/voice-manager.ts` - Sélection des voix
- `src/core/tts/types.ts` - Types TTS
- `src/core/tts/index.ts` - API publique

### Fonctionnalités
1. **Engine** : speak(), pause(), resume(), stop()
2. **Queue** : Gestion automatique des répliques successives
3. **VoiceManager** : Sélection voix homme/femme du système
4. **Didascalies** : Lecture avec voix off ou skip
5. **Vitesse/Volume** : Contrôle fin
6. **Events** : onStart, onEnd, onProgress (pour animation)

### Logique spéciale Italiennes
- Volume = 0 pour répliques utilisateur (lecture silencieuse)
- Vitesse différente (userSpeed) pour utilisateur

---

## Prompt 06 : Utilitaires

**Durée** : ~1h | **Dépend de** : Prompt 01

### Objectif
Fonctions utilitaires réutilisables.

### Fichiers à créer
- `src/utils/colors.ts` - Génération couleurs personnages
- `src/utils/validation.ts` - Validation fichiers
- `src/utils/formatting.ts` - Formatage texte
- `src/utils/uuid.ts` - Génération UUID
- `src/utils/constants.ts` - Constantes globales

### Fonctions clés
- `generateCharacterColor(name)` - Couleur unique par personnage (déterministe)
- `validateTextFile(content)` - Vérifie format fichier
- `generateUUID()` - UUID v4
- `formatDate(date)` - Formatage dates
- `cleanText(text)` - Nettoyage espaces multiples

### Constantes
- `MIN_SPEED`, `MAX_SPEED`, `DEFAULT_SPEED`
- `READABLE_COLORS` - Palette de couleurs accessibles
- `SUPPORTED_FILE_TYPES`

---

## Prompt 07 : State Management (Zustand)

**Durée** : ~1.5h | **Dépend de** : Prompts 01-06

### Objectif
Créer les stores Zustand pour l'état global.

### Fichiers à créer
- `src/state/usePlayStore.ts` - Store des pièces
- `src/state/useSettingsStore.ts` - Store paramètres
- `src/state/usePlayerStore.ts` - Store lecteur audio
- `src/state/useUIStore.ts` - Store UI

### Stores

#### usePlayStore
- State : `plays[]`, `currentPlay`, `loading`
- Actions : `loadPlays()`, `addPlay()`, `deletePlay()`, `setCurrentPlay()`

#### useSettingsStore
- State : `settings`
- Actions : `updateSettings()`, `resetSettings()`
- Persistence : localStorage

#### usePlayerStore
- State : `isPlaying`, `currentLine`, `progress`, `userCharacterId`
- Actions : `play()`, `pause()`, `stop()`, `setUserCharacter()`

#### useUIStore
- State : `theme`, `currentScreen`, `showTOC`
- Actions : `setTheme()`, `toggleTheme()`, `navigate()`

---

## Prompt 08 : Composants Communs

**Durée** : ~2h | **Dépend de** : Prompt 07

### Objectif
Composants UI réutilisables de base.

### Fichiers à créer
- `src/components/common/Button.tsx`
- `src/components/common/Dropdown.tsx`
- `src/components/common/Modal.tsx`
- `src/components/common/Toggle.tsx`
- `src/components/common/Spinner.tsx`
- `src/components/common/Header.tsx`

### Composants

#### Button
Props : `variant`, `size`, `onClick`, `disabled`, `children`
Variants : primary, secondary, danger

#### Dropdown
Props : `options`, `value`, `onChange`, `placeholder`
Accessible (clavier)

#### Modal
Props : `isOpen`, `onClose`, `title`, `children`
Overlay, fermeture ESC

#### Toggle
Props : `checked`, `onChange`, `label`
Switch on/off

#### Spinner
Props : `size`
Loading animation

#### Header
Props : `title`, `backButton`, `actions`
Navigation bar

---

## Prompt 09 : Composants Spécifiques

**Durée** : ~2h | **Dépend de** : Prompt 08

### Objectif
Composants métier de l'application.

### Fichiers à créer

#### Play Components (8 fichiers)
- `PlayList.tsx` - Liste des pièces
- `PlayCard.tsx` - Carte d'une pièce
- `ActHeader.tsx` - En-tête d'acte
- `SceneHeader.tsx` - En-tête de scène
- `Line.tsx` - Une réplique
- `Didascalie.tsx` - Didascalie
- `TableOfContents.tsx` - Sommaire
- `CharacterBadge.tsx` - Badge personnage

#### Settings Components (3 fichiers)
- `VoiceSettings.tsx` - Config voix personnages
- `ReadingSettings.tsx` - Vitesses, voix off, masquage
- `ThemeToggle.tsx` - Light/Dark

#### Reader Components (3 fichiers)
- `NavigationControls.tsx` - Scène précédente/suivante
- `ProgressIndicator.tsx` - Animation progression lecture
- `CharacterSelector.tsx` - Dropdown sélection personnage

### Détails importants

**Line.tsx** : 
- Coloration personnage
- Gestion didascalies inline
- Click pour lecture audio
- Masquage conditionnel (italiennes)
- Animation progression

**TableOfContents.tsx** :
- Liste actes/scènes
- Navigation rapide
- Acte en cours surligné

---

## Prompt 10 : Écrans Principaux

**Durée** : ~2.5h | **Dépend de** : Prompts 08-09

### Objectif
Créer les écrans Home et PlayDetail avec routing.

### Fichiers à créer
- `src/screens/HomeScreen.tsx`
- `src/screens/PlayDetailScreen.tsx`
- `src/hooks/useFileImport.ts`
- `src/hooks/useNavigation.ts`
- `src/App.tsx` (mise à jour avec React Router)

### HomeScreen
- Liste des pièces (PlayList)
- Bouton "Ajouter" (import fichier)
- Message si vide
- Gestion erreurs import

### PlayDetailScreen
- Infos pièce (titre, auteur, année)
- Sélection mode lecture (3 boutons)
- Configuration voix
- Paramètres
- Bouton suppression (avec confirmation)

### useFileImport Hook
```typescript
function useFileImport() {
  const importFile = async (file: File) => {
    // 1. Lire le fichier
    // 2. Parser le texte
    // 3. Générer couleurs personnages
    // 4. Sauver dans IndexedDB
    // 5. Mettre à jour le store
  };
  return { importFile, isImporting, error };
}
```

### Routing (App.tsx)
- `/` - HomeScreen
- `/play/:id` - PlayDetailScreen
- `/play/:id/read` - SilentReadScreen
- `/play/:id/audio` - AudioReadScreen
- `/play/:id/italian` - ItalianScreen

---

## Prompt 11 : Écrans de Lecture

**Durée** : ~3h | **Dépend de** : Prompts 08-10

### Objectif
Créer les 3 modes de lecture.

### Fichiers à créer
- `src/screens/SilentReadScreen.tsx`
- `src/screens/AudioReadScreen.tsx`
- `src/screens/ItalianScreen.tsx`
- `src/hooks/useTTS.ts`
- `src/hooks/useTheme.ts`
- `src/hooks/useSceneNavigation.ts`

### SilentReadScreen
- Affichage formaté du texte
- Navigation scènes (prev/next)
- Sommaire (TOC)
- Scroll fluide
- Coloration personnages
- Didascalies en italique gris

### AudioReadScreen
- Identique à SilentReadScreen +
- Click sur réplique → lecture audio
- Animation progression
- Click pendant lecture → pause/resume
- Click autre réplique → switch
- Lecture auto répliques suivantes

### ItalianScreen
- Identique à AudioReadScreen +
- Sélecteur personnage utilisateur
- Masquage répliques selon settings :
  - hideUserLines : gris sur gris au départ
  - showBefore : affichage avant lecture
  - showAfter : affichage après lecture
- Volume = 0 pour répliques utilisateur
- Vitesse userSpeed pour utilisateur

### useTTS Hook
Simplifie l'utilisation du TTS engine :
```typescript
function useTTS() {
  const { isPlaying, currentLine, play, pause, stop } = usePlayerStore();
  const speak = (line: LineNode) => { /* ... */ };
  return { speak, isPlaying, currentLine, pause, stop };
}
```

---

## Prompt 12 : PWA & Polish

**Durée** : ~2h | **Dépend de** : Prompts 01-11

### Objectif
Finaliser l'application PWA avec icônes, états de chargement, animations.

### Tâches

#### 1. Icônes PWA
- Générer ou placer `public/icons/icon-192.png`
- Générer ou placer `public/icons/icon-512.png`
- Vérifier manifest.json

#### 2. Service Worker
- Configuration cache (vite-plugin-pwa)
- Stratégie offline-first
- Update notification

#### 3. Loading States
- Spinner pendant chargement pièces
- Skeleton screens
- Messages d'erreur élégants

#### 4. Animations
- Transitions entre écrans
- Fade-in composants
- Progress indicator fluide
- Hover effects

#### 5. Page 404
- `src/screens/NotFoundScreen.tsx`
- Lien retour accueil

#### 6. Documentation
- `docs/USER_GUIDE.md` - Guide utilisateur
- `docs/FILE_FORMAT.md` - Format des fichiers
- `docs/DEPLOYMENT.md` - Guide déploiement
- `CHANGELOG.md` - Historique des versions

#### 7. Tests Manuels Complets
- [ ] Import fichier .txt
- [ ] Création personnage auto
- [ ] Génération couleurs
- [ ] Storage IndexedDB
- [ ] Lecture silencieuse
- [ ] Lecture audio
- [ ] Mode italiennes avec masquage
- [ ] Navigation scènes
- [ ] Sommaire
- [ ] Thème clair/sombre
- [ ] Tous les settings
- [ ] Suppression pièce
- [ ] PWA install (mobile)
- [ ] Offline mode
- [ ] Responsive (mobile/tablet/desktop)

#### 8. Optimisations
- Lazy loading écrans
- Memoization composants lourds
- Code splitting
- Compression assets

#### 9. Fichiers Exemple
- `public/examples/exemple-piece.txt`
- Fichier de démonstration

---

## 📊 Estimation Globale

| Phase | Prompts | Durée Totale |
|-------|---------|--------------|
| Foundation | 01-03 | 4h |
| Core Modules | 04-06 | 4.5h |
| State | 07 | 1.5h |
| UI Components | 08-09 | 4h |
| Screens | 10-11 | 5.5h |
| Finalisation | 12 | 2h |
| **TOTAL** | **12 prompts** | **~21.5h** |

---

## 🎯 Points d'Attention

### Performance
- Virtualisation si textes > 10 000 lignes
- Debounce sur paramètres
- Memoization Line components

### Accessibilité
- ARIA labels
- Navigation clavier
- Contraste couleurs
- Focus visible

### Compatibilité
- Web Speech API : vérifier disponibilité voix
- IndexedDB : gestion erreurs quota
- PWA : tester iOS Safari + Android Chrome

### UX
- Feedback visuel sur toutes actions
- Messages d'erreur clairs
- Loading states
- Animations subtiles

---

## 📝 Ordre d'Exécution Strict

```
01 (Setup) → 02 (Models) → 03 (Parser) → 04 (Storage) → 05 (TTS) → 06 (Utils)
                                                                        ↓
12 (PWA) ← 11 (Reading) ← 10 (Main) ← 09 (Specific) ← 08 (Common) ← 07 (State)
```

**Ne JAMAIS** sauter un prompt ou changer l'ordre !

---

**Date de création** : 2025-01-10
**Version** : 1.0