# Fonctionnalités d'aide et de thème

## Vue d'ensemble

Ce document décrit les nouvelles fonctionnalités ajoutées à Répét :
- **Écran d'aide** : Documentation utilisateur complète accessible depuis n'importe où
- **Mode sombre/clair** : Possibilité de basculer entre les thèmes pour réduire la fatigue visuelle
- **Headers standardisés** : Interface cohérente avec icônes d'aide et de thème sur tous les écrans

## Composants créés

### 1. HelpScreen (`src/screens/HelpScreen.tsx`)

Écran modal d'aide contenant :
- **Bienvenue** : Introduction à Répét
- **Démarrage rapide** : Guide en 4 étapes pour commencer
- **Modes de lecture** : Explication détaillée des 3 modes (Silencieux, Audio, Italien)
- **Paramètres par pièce** : Comment configurer chaque pièce individuellement
- **Contrôles de lecture** : Guide des boutons et raccourcis
- **Format des fichiers** : Documentation du format Markdown attendu
- **Astuces et conseils** : Bonnes pratiques d'utilisation

L'écran est affiché via le store `uiStore.isHelpOpen` et peut être ouvert depuis n'importe quel écran en cliquant sur l'icône d'aide (?) dans le header.

### 2. StandardHeader (`src/components/common/StandardHeader.tsx`)

Header standardisé pour les écrans principaux (bibliothèque, détails) avec :
- **Titre** ou contenu personnalisé à gauche
- **Contenu central** optionnel
- **Icône d'aide** : Ouvre le HelpScreen
- **Icône de thème** : Bascule entre mode clair/sombre
- Support du mode sombre avec classes Tailwind

### 3. ReadingHeader (`src/components/reader/ReadingHeader.tsx`)

Header spécialisé pour les écrans de lecture (PlayScreen, ReaderScreen) avec :
- **Bouton retour** : Navigation vers l'accueil
- **Titre** : Nom de la pièce
- **Badge du mode** : Indicateur visuel du mode de lecture (cliquable pour retourner aux détails)
- **Icône sommaire** : Ouvre le sommaire des scènes
- **Icône d'aide** : Ouvre le HelpScreen
- **Icône de thème** : Bascule entre mode clair/sombre

## État ajouté au uiStore

```typescript
interface UIState {
  // Nouveaux états
  isHelpOpen: boolean        // Modal d'aide ouverte/fermée
  theme: Theme               // 'light' | 'dark'
  
  // Nouvelles actions
  toggleHelp: () => void     // Toggle modal d'aide
  setTheme: (theme: Theme) => void    // Change le thème
  toggleTheme: () => void    // Bascule entre light/dark
}
```

### Gestion du thème

Le thème est :
1. **Sauvegardé** dans `localStorage` sous la clé `'theme'`
2. **Initialisé** au démarrage de l'app (`App.tsx`)
3. **Appliqué** en ajoutant/retirant la classe `dark` sur `document.documentElement`
4. **Détecté** automatiquement via `prefers-color-scheme` si aucune préférence sauvegardée

## Intégration dans les écrans

### LibraryScreen (Bibliothèque)
- Utilise `StandardHeader` avec le titre "Répét"
- Icônes d'aide et de thème disponibles

### PlayDetailScreen (Détails de la pièce)
- Utilise `StandardHeader` avec bouton retour personnalisé
- Icônes d'aide et de thème disponibles

### PlayScreen (Lecture audio)
- Utilise `ReadingHeader`
- Affiche : retour, titre, badge mode, sommaire, aide, thème

### ReaderScreen (Lecteur silencieux/italien)
- Utilise `ReadingHeader`
- Même interface que PlayScreen

## Icônes utilisées

- **Aide** : Point d'interrogation dans un cercle
- **Mode sombre** : Croissant de lune
- **Mode clair** : Soleil
- **Sommaire** : Trois lignes horizontales (hamburger)
- **Retour** : Chevron gauche

## Comportement utilisateur

1. **Clic sur l'icône d'aide (?)** 
   - Ouvre le HelpScreen en modal
   - Affiche toute la documentation
   - Peut être fermé avec X ou en cliquant à l'extérieur

2. **Clic sur l'icône de thème (lune/soleil)**
   - Bascule instantanément entre mode clair et sombre
   - Sauvegarde la préférence dans localStorage
   - Change l'icône selon le mode actif

3. **Clic sur l'icône sommaire (sur écrans de lecture)**
   - Ouvre le sommaire des scènes
   - Permet de naviguer rapidement dans la pièce

## Accessibilité

Tous les boutons incluent :
- `aria-label` descriptif
- `title` pour le tooltip
- Classes de transition pour le feedback visuel
- Support complet du mode sombre pour le contraste

## Classes Tailwind pour le mode sombre

Le mode sombre utilise la stratégie `class` de Tailwind :
- Classes standard : `bg-white`, `text-gray-900`
- Classes dark : `dark:bg-gray-800`, `dark:text-gray-100`

Configuration dans `tailwind.config.js` :
```javascript
module.exports = {
  darkMode: 'class',
  // ...
}
```

## Tests

Pour tester les fonctionnalités :

1. **Aide**
   - Ouvrir l'app, cliquer sur l'icône d'aide
   - Vérifier que le contenu s'affiche correctement
   - Vérifier que le scroll fonctionne
   - Fermer avec X et en cliquant à l'extérieur

2. **Thème**
   - Cliquer sur l'icône lune → passe en mode sombre
   - Vérifier que tous les éléments changent de couleur
   - Recharger la page → le thème doit être conservé
   - Cliquer sur l'icône soleil → repasse en mode clair

3. **Headers**
   - Vérifier que toutes les icônes sont présentes sur tous les écrans
   - Vérifier l'espacement et l'alignement
   - Tester les transitions au survol

## Améliorations futures possibles

- [ ] Ajouter des raccourcis clavier (ex: `?` pour l'aide, `Ctrl+Shift+D` pour le thème)
- [ ] Ajouter une recherche dans l'aide
- [ ] Personnaliser les couleurs du thème sombre
- [ ] Ajouter un mode "auto" qui suit la préférence système
- [ ] Traduire l'aide en plusieurs langues
- [ ] Ajouter des vidéos ou GIFs explicatifs dans l'aide
- [ ] Permettre de marquer des pages d'aide en favoris

## Fichiers modifiés

- `src/App.tsx` : Initialisation du thème + affichage HelpScreen
- `src/router.tsx` : Utilisation de StandardHeader
- `src/state/uiStore.ts` : Ajout état/actions thème et aide
- `src/screens/PlayScreen.tsx` : Utilisation de ReadingHeader
- `src/screens/ReaderScreen.tsx` : Utilisation de ReadingHeader
- `src/screens/PlayDetailScreen.tsx` : Utilisation de StandardHeader
- `src/components/common/index.ts` : Export StandardHeader
- `src/components/reader/index.ts` : Export ReadingHeader
- `src/screens/index.ts` : Export HelpScreen (remplace SettingsScreen supprimé)

## Fichiers créés

- `src/screens/HelpScreen.tsx`
- `src/components/common/StandardHeader.tsx`
- `src/components/reader/ReadingHeader.tsx`
