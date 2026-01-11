# Changelog - Aide et Mode Sombre/Clair

## Version 2024-01-XX - Nouvelles fonctionnalités UI

### 🎨 Ajout du mode sombre/clair

**Fonctionnalité** : Vous pouvez maintenant basculer entre le mode clair et le mode sombre pour réduire la fatigue visuelle lors de longues sessions de répétition.

- **Icône de thème** disponible en haut à droite de tous les écrans
  - 🌙 Lune = cliquez pour activer le mode sombre
  - ☀️ Soleil = cliquez pour activer le mode clair
- **Persistance** : Votre choix est sauvegardé et conservé entre les sessions
- **Détection automatique** : Si aucune préférence n'est enregistrée, le thème suit la préférence de votre système
- **Application complète** : Tous les écrans, modals et composants supportent le mode sombre

### 📖 Écran d'aide intégré

**Fonctionnalité** : Une documentation complète est maintenant accessible depuis n'importe quel écran de l'application.

Cliquez sur l'icône **?** (point d'interrogation) en haut à droite pour ouvrir l'aide.

**Contenu de l'aide** :
- ✨ **Bienvenue** : Introduction à Répét
- 🚀 **Démarrage rapide** : Guide en 4 étapes pour commencer
- 🎭 **Modes de lecture** : Explication détaillée
  - 📖 Mode Silencieux (lecture classique)
  - 🔊 Mode Audio (avec synthèse vocale)
  - 🎭 Mode Italien (répliques masquées pour mémorisation)
- ⚙️ **Paramètres par pièce** : Configuration personnage, voix, vitesse
- 🎮 **Contrôles de lecture** : Guide des boutons et navigation
- 📄 **Format des fichiers** : Documentation du format Markdown
- 💡 **Astuces et conseils** : Bonnes pratiques d'utilisation

### 🎯 Headers standardisés

Tous les écrans ont maintenant un header cohérent avec :
- **Écran d'accueil** : Titre "Répét" + aide + thème
- **Écran de détails** : Bouton retour + aide + thème
- **Écrans de lecture** : Retour + titre + badge mode + sommaire + aide + thème

### 🔧 Améliorations techniques

**Composants créés** :
- `StandardHeader` : Header pour les écrans principaux
- `ReadingHeader` : Header pour les écrans de lecture
- `HelpScreen` : Écran modal d'aide complet

**State management** :
- Ajout de `theme` et `isHelpOpen` dans le `uiStore`
- Actions `toggleTheme()`, `setTheme()`, `toggleHelp()`
- Initialisation automatique du thème au démarrage

**Accessibilité** :
- Tous les boutons incluent des `aria-label` descriptifs
- Tooltips au survol pour guider l'utilisateur
- Navigation au clavier supportée
- Contraste optimisé en mode sombre

### 📝 Utilisation

#### Changer le thème
1. Cliquez sur l'icône 🌙 (lune) pour passer en mode sombre
2. Cliquez sur l'icône ☀️ (soleil) pour repasser en mode clair
3. Votre préférence est automatiquement sauvegardée

#### Accéder à l'aide
1. Cliquez sur l'icône **?** depuis n'importe quel écran
2. Lisez la section qui vous intéresse
3. Fermez avec le bouton **X** ou en cliquant à l'extérieur

### 🐛 Correctifs

- Correction du header de `PlayScreen` pour inclure les nouvelles icônes
- Correction du header de `ReaderScreen` pour les modes silencieux et audio/italien
- Mise à jour de `PlayDetailScreen` avec le header standardisé
- Suppression de l'ancien `SettingsScreen` (remplacé par les paramètres par pièce)

### 📦 Fichiers ajoutés

```
src/screens/HelpScreen.tsx                   (316 lignes)
src/components/common/StandardHeader.tsx     (150 lignes)
src/components/reader/ReadingHeader.tsx      (150 lignes)
docs/HELP_AND_THEME_FEATURE.md              (178 lignes)
docs/MANUAL_TEST_HELP_THEME.md              (285 lignes)
```

### 📦 Fichiers modifiés

```
src/App.tsx                          (+23 lignes)  - Initialisation thème + HelpScreen
src/state/uiStore.ts                 (+60 lignes)  - State thème et aide
src/router.tsx                       (+2 lignes)   - StandardHeader
src/screens/PlayScreen.tsx           (-67 lignes)  - Utilisation ReadingHeader
src/screens/ReaderScreen.tsx         (-150 lignes) - Utilisation ReadingHeader
src/screens/PlayDetailScreen.tsx     (-10 lignes)  - Utilisation StandardHeader
src/components/common/index.ts       (+1 ligne)    - Export StandardHeader
src/components/reader/index.ts       (+4 lignes)   - Export ReadingHeader
src/screens/index.ts                 (+1 ligne)    - Export HelpScreen
```

### ✅ Tests

Un guide de test manuel complet a été créé : `docs/MANUAL_TEST_HELP_THEME.md`

Points de test principaux :
- ✅ Thème persiste après rechargement de la page
- ✅ Aide accessible depuis tous les écrans
- ✅ Mode sombre appliqué à tous les composants
- ✅ Transitions fluides et feedback visuel
- ✅ Aucune erreur console
- ✅ Accessibilité (aria-label, navigation clavier)

### 🎉 Impact utilisateur

**Expérience améliorée** :
- 🌙 Confort visuel avec le mode sombre
- 📚 Aide toujours disponible, plus besoin de chercher la documentation
- 🎨 Interface plus moderne et cohérente
- ⚡ Navigation plus intuitive avec des icônes claires

**Aucun changement breaking** :
- Toutes les fonctionnalités existantes continuent de fonctionner
- Les données (pièces, paramètres) sont préservées
- Compatibilité complète avec l'existant

---

**Développé par** : L'équipe Répét
**Date** : Janvier 2025
**Version** : 0.2.0