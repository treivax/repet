# Documentation Archivée

Ce dossier contient des documents relatifs à des fonctionnalités qui ont été retirées du projet Répét.

## Fichiers Archivés

### AUDIO_CACHE_VERSIONING.md

**Date d'archivage :** Janvier 2025  
**Raison :** Système de versioning automatique du cache audio retiré

Ce fichier documentait un système de versioning automatique du cache audio qui invalidait automatiquement le cache lors de changements de version. Ce système a été retiré car il causait un **deadlock au démarrage de l'application**.

#### Problème Identifié

Le système de versioning créait une boucle d'attente infinie :
- `initialize()` appelait `checkAndInvalidateCache()`
- Qui appelait `clearCache()` si la version était obsolète
- `clearCache()` appelait à nouveau `initialize()`
- Ce qui créait un deadlock (les fonctions s'attendaient mutuellement)

#### Solution Appliquée

Le système a été complètement retiré pour résoudre le blocage. Les utilisateurs peuvent maintenant vider le cache manuellement via :
- L'interface "Piper Model Manager"
- La console développeur avec `window.clearAudioCache()`
- Les outils de développement du navigateur (IndexedDB)

#### Documentation de Référence

Pour plus de détails sur le retrait du système, voir :
- `/CHANGELOG_CACHE_VERSION_REMOVAL.md` - Changelog détaillé du retrait

---

**Note :** Ces documents sont conservés à titre d'archive historique et de référence. Les fonctionnalités qu'ils décrivent ne sont plus présentes dans le code actuel.