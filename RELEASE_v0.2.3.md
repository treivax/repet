# Release v0.2.3 - Correctif scroll manuel en mode silencieux

**Date de release**: 2025-01-XX  
**Commit**: `9b579fa`  
**Tag**: `v0.2.3`  
**Statut**: ✅ Déployé

---

## 📋 Résumé

Cette release corrige un bug critique affectant l'expérience utilisateur en mode de lecture silencieuse : le scroll manuel était saccadé et continuait de manière erratique après le relâchement.

## 🐛 Bug corrigé

### Symptômes
- Scroll manuel saccadé en mode silencieux
- Continuation ou reprise du scroll après relâchement
- Inversions de direction du scroll
- Durée des saccades : jusqu'à plusieurs secondes
- Comportement ressemblant à un conflit d'événements

### Cause racine
Le composant `PlaybackDisplay` effectuait un scroll automatique à chaque changement de `currentPlaybackIndex`, même en mode silencieux où ce comportement n'est pas souhaité.

**Boucle de conflit identifiée** :
1. Utilisateur scrolle manuellement
2. IntersectionObserver détecte les nouveaux éléments visibles
3. Observer met à jour `currentLineIndex` via `goToLine()`
4. Mise à jour de `currentPlaybackIndex` (effet cascade)
5. Scroll automatique se déclenche dans `PlaybackDisplay`
6. **Conflit** : scroll automatique interfère avec scroll manuel → saccades

### Solution implémentée
Ajout d'un early return dans le `useEffect` de scroll automatique de `PlaybackDisplay` lorsque `readingMode === 'silent'`.

```typescript
// En mode silencieux, ne pas faire de scroll automatique
if (readingMode === 'silent') {
  return
}
```

## 📝 Changements

### Code
- **`src/components/reader/PlaybackDisplay.tsx`**
  - Ajout du check de mode silencieux (lignes 125-130)
  - Ajout de `readingMode` aux dépendances du useEffect (ligne 211)
  - Retrait des console.warn de debug

- **`src/config/version.ts`**
  - APP_VERSION: `0.2.2` → `0.2.3`

- **`package.json`**
  - version: `0.2.2` → `0.2.3`

### Documentation ajoutée
- `BUGFIX_SILENT_MODE_SCROLL.md` - Analyse détaillée du problème
- `TEST_SILENT_SCROLL_FIX.md` - Checklist de validation

## ✅ Tests de validation

### Tests manuels réussis
- ✅ Scroll manuel fluide en mode silencieux
- ✅ Arrêt immédiat au relâchement
- ✅ Pas d'inversion ou de reprise
- ✅ Badge de scène mis à jour correctement
- ✅ Scroll multi-scènes sans saccades

### Tests de non-régression
- ✅ Mode audio : scroll automatique préservé
- ✅ Mode italiennes : scroll automatique préservé
- ✅ Multi-navigateurs (Chrome, Firefox, Safari)
- ✅ Mobile et desktop

## 🎯 Impact

| Mode | Scroll auto | Comportement |
|------|-------------|--------------|
| **Silencieux** | ❌ Désactivé | Contrôle total utilisateur, fluide |
| **Audio** | ✅ Actif | Centrage automatique (inchangé) |
| **Italiennes** | ✅ Actif | Centrage automatique (inchangé) |

### Avant cette release
```
Mode silencieux:
❌ Scroll manuel → saccades → reprise → frustration
```

### Après cette release
```
Mode silencieux:
✅ Scroll manuel → fluide → arrêt immédiat → expérience optimale
```

## 🚀 Déploiement

### Commandes exécutées
```bash
# Build et vérification
npm run type-check
npm run build

# Commit
git add src/components/reader/PlaybackDisplay.tsx src/config/version.ts package.json BUGFIX_SILENT_MODE_SCROLL.md TEST_SILENT_SCROLL_FIX.md
git commit -m "fix: Désactiver scroll automatique en mode silencieux"

# Tag
git tag -a v0.2.3 -m "Release v0.2.3 - Fix scroll manuel en mode silencieux"

# Push
git push origin main
git push origin v0.2.3
```

### URLs de déploiement
- **Production offline**: https://app.repet.com
- **Production online**: https://ios.repet.com
- **Repository**: https://github.com/treivax/repet

## 📊 Métriques

- **Lignes de code modifiées**: ~30 lignes
- **Fichiers modifiés**: 3 fichiers
- **Temps de développement**: ~1h
- **Temps de validation**: Tests validés
- **Complexité**: Faible (modification ciblée)
- **Risque**: Très faible (pas de régression détectée)

## 🔍 Détails techniques

### Architecture du scroll
Le projet utilise un système de scroll multi-couches :

1. **IntersectionObserver** (ReaderScreen)
   - Détecte les éléments visibles
   - Met à jour la position courante
   - Option `rootMargin: '-40% 0px -40% 0px'`

2. **Scroll automatique** (PlaybackDisplay)
   - Réagit aux changements de position
   - Centre l'élément en cours
   - **Désormais désactivé en mode silencieux**

3. **Scroll manuel** (utilisateur)
   - Événements natifs du navigateur
   - **Ne conflit plus avec le scroll auto en mode silencieux**

## 📚 Références

- **Issue**: Signalé via thread Zed
- **Thread original**: PlayScreen automatic line playback bug
- **Documentation technique**: `BUGFIX_SILENT_MODE_SCROLL.md`
- **Tests**: `TEST_SILENT_SCROLL_FIX.md`
- **Commit précédent**: v0.2.2 (6a3751a)

## 🎉 Conclusion

Cette release améliore significativement l'expérience utilisateur en mode de lecture silencieuse, tout en préservant le comportement attendu des autres modes de lecture.

**Recommandation** : Déploiement immédiat en production ✅

---

**Changelog complet** : https://github.com/treivax/repet/compare/v0.2.2...v0.2.3