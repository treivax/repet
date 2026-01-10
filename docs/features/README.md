# Documentation des Fonctionnalités

Ce dossier contient la documentation détaillée des fonctionnalités de Répét.

## 📑 Index

### Tag de Méthode de Lecture

Fonctionnalité permettant d'afficher et de modifier rapidement la méthode de lecture active.

- **[Résumé Exécutif](reading-mode-tag-summary.md)** - Vue d'ensemble et impact
- **[Documentation Technique](reading-mode-tag.md)** - Implémentation et tests
- **[Guide Visuel](reading-mode-tag-visual.md)** - Schémas et exemples visuels
- **[Post-Mortem Bugs](reading-mode-tag-bugfixes.md)** - Corrections et leçons apprises

#### Aperçu Rapide

```
Mode Silencieux    : [LECTURE] (bleu)
Mode Audio         : [LECTURE AUDIO] (vert)
Mode Italiennes    : [ITALIENNES (PERSONNAGE)] (violet)
```

**Navigation** : Clic sur le tag → Écran de sélection de méthode

---

## 🎯 Organisation

### Structure des Documents

Chaque fonctionnalité majeure dispose de 3 niveaux de documentation :

1. **Résumé Exécutif** (`*-summary.md`)
   - Vue d'ensemble
   - Problème résolu
   - Impact utilisateur
   - Métriques

2. **Documentation Technique** (`*.md`)
   - Implémentation détaillée
   - Code et architecture
   - Tests et validation
   - Notes de développement

3. **Guide Visuel** (`*-visual.md`)
   - Schémas et diagrammes
   - Exemples d'utilisation
   - États et interactions
   - Design et accessibilité

---

## 📚 Conventions

### Nommage des Fichiers

- Format : `feature-name-{summary|technical|visual}.md`
- Séparateur : tiret (`-`)
- Casse : minuscules

### Structure des Documents

```markdown
# Titre de la Fonctionnalité

## Vue d'ensemble
(Description générale)

## Fonctionnalités
(Liste des capacités)

## Implémentation
(Détails techniques)

## Tests
(Stratégie de test)

## Historique
(Changelog de la fonctionnalité)
```

---

## 🔗 Liens Utiles

### Documentation Principale

- [Architecture Globale](../ARCHITECTURE.md)
- [Guide Utilisateur](../USER_GUIDE.md)
- [Tests](../TESTING.md)
- [Déploiement](../DEPLOYMENT.md)

### Outils Interactifs

- [Calculateur de Temps de Lecture](../reading-time/calculator.html)

---

## ✨ Contribuer

### Ajouter une Nouvelle Fonctionnalité

1. Créer les 3 documents (summary, technique, visual)
2. Ajouter une entrée dans ce README
3. Mettre à jour le CHANGELOG principal
4. Créer un commit dédié

### Template de Documentation

```markdown
# Nom de la Fonctionnalité

## Vue d'ensemble
Brève description...

## Fonctionnalités
- Capacité 1
- Capacité 2

## Implémentation
Détails techniques...

## Tests
Stratégie de test...

## Historique
- YYYY-MM-DD : Version initiale
```

---

## 📊 Statistiques

### Fonctionnalités Documentées

| Fonctionnalité | Résumé | Technique | Visuel | Post-Mortem | Total |
|----------------|--------|-----------|--------|-------------|-------|
| Tag Méthode de Lecture | ✅ | ✅ | ✅ | ✅ | 1027 lignes |

**Total** : 1 fonctionnalité · 1027 lignes de documentation

### Corrections et Bugs

| Bug | Statut | Document |
|-----|--------|----------|
| Route 404 sur navigation | ✅ Corrigé | [Post-Mortem](reading-mode-tag-bugfixes.md) |
| Cartes non cliquables en mode audio | ✅ Corrigé | [Post-Mortem](reading-mode-tag-bugfixes.md) |

---

*Dernière mise à jour : 2025-01-XX*