# 🚀 Guide de Démarrage - Plan d'Implémentation Répét

**Bienvenue dans le plan d'implémentation de l'application Répét !**

Ce guide explique comment utiliser les prompts pour construire l'application de A à Z.

---

## ⚠️ STANDARDS OBLIGATOIRES - À LIRE EN PREMIER

**AVANT TOUTE CHOSE** : Chaque prompt, chaque session IA, chaque ligne de code **DOIT** impérativement respecter les standards définis dans :

📋 **`.github/prompts/common.md`**

### Pourquoi c'est critique ?

Ce fichier définit :
- ✅ **Principes de développement** : Simplicité, maintenabilité, pas de sur-ingénierie
- ✅ **Conventions TypeScript strict** : Pas de `any`, typage complet, gestion d'erreurs
- ✅ **Architecture React** : Composants, hooks, state management, props
- ✅ **Gestion d'erreurs** : Try-catch, logging, messages explicites
- ✅ **Documentation** : JSDoc pour fonctions publiques, commentaires inline
- ✅ **Tests et validation** : Type-check, tests manuels, critères de validation

### 🚨 RÈGLE ABSOLUE

**Si tu utilises une IA pour exécuter les prompts** (Claude, ChatGPT, etc.) :

1. **TOUJOURS charger** `.github/prompts/common.md` dans le contexte de la session
2. **TOUJOURS vérifier** que l'IA respecte ces standards
3. **TOUJOURS valider** que le code généré n'utilise pas de `any`
4. **TOUJOURS tester** manuellement après chaque prompt

**Sans le respect strict de ces standards, le projet sera incohérent et non maintenable.**

---

## 📚 Fichiers du Plan

| Fichier | Description |
|---------|-------------|
| `README.md` | Vue d'ensemble du plan (12 prompts) |
| `PROMPTS_SUMMARY.md` | Résumé détaillé de tous les prompts |
| `GETTING_STARTED.md` | Ce fichier - Comment démarrer |
| `01-setup-initial.md` | ✅ Prompt 01 complet (prêt à l'emploi) |
| `02-models-types.md` | ✅ Prompt 02 complet (prêt à l'emploi) |
| `03-XX.md` à `12-XX.md` | À créer en s'inspirant de PROMPTS_SUMMARY.md |

---

## 🎯 Méthodologie

### Principe

Chaque prompt est une **session unique** où tu demandes à l'IA de réaliser un ensemble cohérent de tâches. Les prompts sont **séquentiels** et **dépendants** : tu dois les exécuter dans l'ordre.

### Format d'un Prompt

Chaque fichier prompt contient :
1. **Contexte** - Rôle et objectif
2. **Tâches** - Liste précise des fichiers à créer avec leur contenu
3. **Validation** - Commandes pour vérifier que tout fonctionne
4. **Livrables** - Checklist des fichiers créés

---

## 🚀 Démarrage Rapide

### Étape 1 : Lire le Plan

```bash
cd /home/resinsec/dev/repet/plans
cat README.md
```

Comprendre la vision globale, les 12 prompts et leurs dépendances.

### Étape 2 : Consulter les Standards ⚠️ OBLIGATOIRE

```bash
cat ../.github/prompts/common.md
```

**🚨 CRITIQUE** : 
- **Lis ENTIÈREMENT** `.github/prompts/common.md` avant de commencer
- **Garde ce fichier ouvert** pendant toute l'implémentation
- **Charge-le systématiquement** dans chaque session IA
- **Vérifie** que chaque code généré respecte TOUS les standards

### Étape 3 : Exécuter le Premier Prompt

1. **Ouvrir une nouvelle session IA** (Claude, ChatGPT, etc.)

2. **Copier-coller le contenu COMPLET** de `plans/01-setup-initial.md`

3. **Laisser l'IA exécuter** toutes les tâches

4. **Valider** :
   ```bash
   cd /home/resinsec/dev/repet
   npm run type-check  # Doit passer sans erreur
   npm run dev         # Doit démarrer l'app
   ```

5. **Tester manuellement** :
   - Ouvrir http://localhost:5173
   - Vérifier que "Répét" s'affiche
   - Pas d'erreur dans la console

### Étape 4 : Passer au Prompt Suivant

**Uniquement si le prompt précédent est 100% validé !**

1. Ouvrir `plans/02-models-types.md`
2. Nouvelle session IA
3. Copier-coller le contenu
4. Valider
5. Continuer avec 03, 04, etc.

---

## 📋 Checklist par Prompt

### Avant d'Exécuter

- [ ] **J'ai lu ET compris `.github/prompts/common.md`** ⚠️
- [ ] J'ai lu le fichier prompt en entier
- [ ] Je comprends l'objectif
- [ ] Tous les prompts précédents sont validés
- [ ] J'ai vérifié que le code précédent compile

### Pendant l'Exécution

- [ ] **J'ai chargé `.github/prompts/common.md` dans le contexte de l'IA** ⚠️
- [ ] Je laisse l'IA terminer complètement
- [ ] Je ne modifie pas le code généré (sauf bugs évidents)
- [ ] Je vérifie activement que l'IA respecte TOUS les standards de `common.md`
- [ ] Je vérifie qu'il n'y a AUCUN `any` dans le code TypeScript

### Après l'Exécution

- [ ] **Vérifié conformité avec `.github/prompts/common.md`** ⚠️
- [ ] **Aucun type `any` dans le code** ⚠️
- [ ] `npm run type-check` passe (0 erreur)
- [ ] `npm run lint` passe (0 warning ou justification)
- [ ] Test manuel de la fonctionnalité ajoutée
- [ ] Pas d'erreur console
- [ ] JSDoc présent sur fonctions publiques
- [ ] Gestion d'erreurs explicite
- [ ] Commit avec message clair

---

## 🛠️ Si Quelque Chose Ne Fonctionne Pas

### Erreurs TypeScript

```bash
npm run type-check
```

Si erreurs :
1. Lire le message d'erreur
2. Corriger le fichier concerné
3. Re-valider
4. **Ne PAS** passer au prompt suivant tant que ça ne compile pas

### Erreurs d'Import

Vérifier :
- Les chemins relatifs sont corrects
- Les exports/imports sont cohérents
- Pas de dépendances circulaires

### Application Ne Démarre Pas

```bash
npm run dev
```

Vérifier :
- `package.json` contient toutes les dépendances
- `node_modules` est à jour (`npm install`)
- Port 5173 disponible

### Fonctionnalité Ne Marche Pas

1. Ouvrir la console navigateur (F12)
2. Lire les erreurs
3. Vérifier que le code généré correspond au prompt
4. Si bug : corriger et documenter
5. Si conception : revenir au prompt et clarifier

---

## 💡 Conseils et Bonnes Pratiques

### Pour l'IA

- **⚠️ CHARGE `.github/prompts/common.md`** : Systématiquement dans chaque session
- **Sois précis** : Donne tout le code nécessaire dans chaque prompt
- **Reste cohérent** : Respecte TOUS les standards de `common.md`
- **Pas de `any`** : TypeScript strict obligatoire
- **Teste** : Valide manuellement chaque fonctionnalité
- **Commente** : JSDoc + commentaires inline explicites
- **Gère les erreurs** : Try-catch + messages clairs

### Pour Toi

- **Patience** : Ne saute pas d'étapes
- **Validation** : Teste vraiment, ne suppose pas que ça marche
- **Commits** : Commit après chaque prompt validé
- **Documentation** : Note les problèmes rencontrés et solutions

### Gestion du Temps

- **Session courte** : 1-2 prompts par session max
- **Breaks** : Pause entre les prompts pour tester
- **Itération** : Si un prompt est trop complexe, le scinder

---

## 📖 Créer les Prompts Manquants

Les prompts 03 à 12 ne sont pas encore créés en fichiers individuels, mais leur contenu est détaillé dans `PROMPTS_SUMMARY.md`.

### Pour Créer un Prompt

1. **Copier le template** de `01-setup-initial.md`
2. **Adapter le contenu** en s'inspirant de `PROMPTS_SUMMARY.md`
3. **Suivre la structure** :
   ```markdown
   # 🎯 Prompt XX : Titre
   
   **Durée** : Xh | **Dépend de** : Prompts YY
   
   ## 📋 Contexte
   [Explication]
   
   ## 🎯 Tâches
   [Liste détaillée avec code]
   
   ## ✅ Validation
   [Commandes et tests]
   
   ## 📝 Livrables
   [Checklist]
   ```

4. **Inclure le code complet** de chaque fichier à créer

---

## 🎯 Objectif Final

À la fin des 12 prompts, tu auras :

✅ Une PWA complète et fonctionnelle
✅ Import de textes théâtraux
✅ 3 modes de lecture (silencieux, audio, italiennes)
✅ Stockage local (IndexedDB)
✅ Synthèse vocale (Web Speech API)
✅ Interface responsive et accessible
✅ Thème clair/sombre
✅ Installation mobile (PWA)
✅ Code TypeScript strict et maintenable
✅ Documentation complète

---

## 📞 Support

En cas de blocage :

1. **⚠️ RELIS** `.github/prompts/common.md` - la réponse est souvent là
2. **Vérifie** que l'IA a bien chargé `common.md` dans son contexte
3. **Consulte** `PROMPTS_SUMMARY.md` pour les détails
4. **Vérifie** que tu as bien suivi l'ordre
5. **Teste** manuellement à chaque étape
6. **Cherche** les `any` dans le code - c'est souvent la source du problème
7. **Documente** le problème pour future référence

---

## 🚦 Statut du Projet

Mets à jour après chaque prompt :

```
✅ Prompt 01 : Setup Initial - Terminé le [DATE]
✅ Prompt 02 : Models & Types - Terminé le [DATE]
⏳ Prompt 03 : Parser - En cours
⏳ Prompt 04 : Storage - À faire
⏳ Prompt 05 : TTS Engine - À faire
⏳ Prompt 06 : Utilities - À faire
⏳ Prompt 07 : State Management - À faire
⏳ Prompt 08 : Common Components - À faire
⏳ Prompt 09 : Specific Components - À faire
⏳ Prompt 10 : Main Screens - À faire
⏳ Prompt 11 : Reading Screens - À faire
⏳ Prompt 12 : PWA & Polish - À faire
```

---

**Bon courage et bonne implémentation ! 🎭**

_L'équipe Répét_