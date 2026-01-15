# Notes de version 0.3.1

**Date de sortie :** 2025-01-XX

## 🐛 Corrections de bugs

### Correction du double parsing de la section Cast

**Problème :** La section de présentation des personnages (Personnages/Comédiens/Rôles/Présentation/Introduction) apparaissait deux fois :
1. Une première fois comme carte "Distribution des rôles" (affichée avant le titre)
2. Une deuxième fois parsée comme des répliques normales, créant un acte et une scène fantômes

**Solution :**
- Modifié `parseCastSection()` pour retourner l'index final du parsing
- Corrigé `parseStructure()` pour détecter et sauter complètement la section Cast
- Simplifié la validation pour vérifier directement la présence d'ACTE ou Scène dans le texte
- Inversé l'ordre d'affichage : le titre apparaît maintenant avant la section de présentation

### Suppression de la lecture audio double

**Problème :** La section Cast était lue deux fois en audio :
1. Une fois via `speakCastSection()` (ancienne logique)
2. Une fois via la carte de présentation (nouvelle logique)

**Solution :**
- Supprimé la fonction obsolète `speakCastSection()`
- Supprimé l'appel dans `handleLineClick()` qui causait la duplication
- La section Cast est maintenant uniquement gérée par `playPresentation()` via la carte

## ✨ Améliorations

### Formatage visuel de la section de présentation

La section de présentation est maintenant affichée avec un formatage approprié :

- **Blocs de texte libre** : affichés en italique (style didascalie)
- **Noms de personnages** : affichés en gras et en couleur (style réplique)
- **Descriptions** : affichées en italique (style didascalie)

**Implémentation :**
- Ajouté `castSection` (structure complète) à `PresentationPlaybackItem`
- Refondu `PresentationCard` pour afficher la structure plutôt qu'un texte plat
- Passage de `charactersMap` pour afficher les couleurs des personnages

### Mise à jour de l'écran d'aide

L'écran d'aide a été mis à jour avec :
- Documentation des dernières fonctionnalités (répliques multi-personnages, voix off, etc.)
- Section détaillée sur la section de présentation des personnages
- Exemples de formatage pour les répliques multi-personnages
- **Crédits ajoutés** :
  - Auteur : Xavier Talon
  - Association : "En Compagnie des Alliés Nés"
  - Licence MIT

## 📚 Documentation

### Nettoyage et consolidation

- Suppression des documents de développement temporaires et obsolètes
- Suppression des dossiers `docs/bugfixes`, `docs/features`, `docs/implementation`, `docs/reading-time`
- Création d'un `docs/README.md` pour organiser la documentation
- Conservation uniquement des documents essentiels :
  - Guides utilisateur
  - Architecture technique
  - Documentation du parser
  - Guides de déploiement

### Nouveaux guides

- **GUIDE_FORMAT_FLEXIBLE.md** : Guide complet sur le format flexible des fichiers (avec/sans deux-points)
- **GUIDE_SECTION_CAST.md** : Guide détaillé de la section de présentation des personnages

## 🔧 Changements techniques

### Parser

**Fichier :** `src/core/parser/textParser.ts`

- `parseCastSection()` retourne maintenant `{ section: CastSection; endIndex: number }`
- `extractMetadata()` utilise l'index final pour éviter le re-parsing
- `parseStructure()` détecte et saute la section Cast complètement
- Validation simplifiée : vérifie directement la présence d'ACTE/Scène dans le texte

### Modèles de données

**Fichier :** `src/core/models/types.ts`

```typescript
export interface PresentationPlaybackItem extends PlaybackItem {
  type: 'presentation'
  text: string                  // Texte pour la lecture audio
  castSection: CastSection      // Structure complète pour l'affichage
  shouldRead?: boolean
}
```

### Composants

**Nouveau :** `src/components/play/PlaybackCards.tsx`
- `PresentationCard` : Affichage structuré de la section Cast
- Support des couleurs de personnages
- Formatage différencié (texte libre vs présentations)

**Fichier :** `src/utils/playbackSequence.ts`
- Ordre corrigé : Titre → Présentation → Acte → Scène → Répliques
- Passage de `castSection` complète à `PresentationPlaybackItem`

### Écrans

**Fichier :** `src/screens/PlayScreen.tsx`
- Suppression de `speakCastSection()` (obsolète)
- Suppression de l'appel dans `handleLineClick()`
- La lecture de la section Cast est maintenant gérée par `playPresentation()`

## ✅ Tests

Tous les tests unitaires passent (96/96) :
- Tests du parser mis à jour
- Tests de migration de voix
- Tests de diagnostics de voix

## 📦 Builds

- **Build offline** : ✅ OK
- **Build online** : ✅ OK
- **Type-check** : ✅ OK
- **Lint** : ✅ OK

## 🎯 Résultat

La section de présentation :
- ✅ N'apparaît qu'**une seule fois** (après le titre)
- ✅ Est **correctement formatée** (noms en gras/couleur, descriptions en italique)
- ✅ Est **lue une seule fois** avec la voix off (quand on clique sur la carte)
- ✅ Ne crée **pas d'acte ou scène fantômes**

---

**Auteur :** Xavier Talon  
**Association :** En Compagnie des Alliés Nés  
**Licence :** MIT