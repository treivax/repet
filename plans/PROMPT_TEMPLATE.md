# 🚀 Prompt [XX] : [Titre du Prompt]

**Durée estimée** : ~Xh | **Dépend de** : Prompt [XX]

---

## 📋 Contexte

[Description claire du contexte de ce prompt - ce qui a été fait avant, ce qu'on va faire maintenant]

**⚠️ STANDARDS OBLIGATOIRES** : Ce prompt DOIT respecter impérativement les standards définis dans `.github/prompts/common.md`

### Principes clés à respecter

- ✅ Code simple et lisible (pas de sur-ingénierie)
- ✅ TypeScript strict (pas de `any`, typage complet)
- ✅ Composants réutilisables et découplés
- ✅ Documentation inline (JSDoc pour fonctions publiques)
- ✅ Gestion d'erreurs explicite
- ❌ PAS de dépendances inutiles
- ❌ PAS de solutions temporaires créant de la dette technique

---

## 🎯 Objectifs

[Liste des objectifs principaux de ce prompt]

---

## 📦 Tâches

### 1. [Nom de la tâche]

[Description détaillée]

#### Fichier : `src/path/to/file.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

// Code ici
```

### 2. [Nom de la tâche suivante]

[Description détaillée]

[Répéter pour chaque tâche...]

---

## ✅ Critères de Validation

**Avant de passer au prompt suivant, valider :**

```bash
npm run type-check  # DOIT retourner 0 erreur
npm run lint        # DOIT retourner 0 warning (ou justifier)
npm run dev         # DOIT démarrer sans erreur
```

### Tests manuels

- [ ] [Critère de test 1]
- [ ] [Critère de test 2]
- [ ] [Critère de test 3]
- [ ] Pas d'erreur dans la console navigateur
- [ ] Pas de régression sur fonctionnalités existantes

### Tests TypeScript

- [ ] Aucun type `any` utilisé
- [ ] Tous les imports/exports fonctionnent
- [ ] Tous les types sont correctement inférés

---

## 📝 Livrables

- [ ] Fichier `src/path/to/file1.ts`
- [ ] Fichier `src/path/to/file2.ts`
- [ ] Tests manuels passés
- [ ] Documentation mise à jour (si nécessaire)
- [ ] Commit avec message descriptif

---

## 🔗 Liens utiles

- Standards : `.github/prompts/common.md`
- Architecture : `plans/PROJECT_STRUCTURE.md`
- Modèles de données : `src/core/models/`

---

## 📌 Notes importantes

[Toute information critique ou point d'attention spécifique à ce prompt]

---

## ➡️ Prompt suivant

Après validation complète : **Prompt [XX+1] - [Titre]**