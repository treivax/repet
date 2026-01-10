# 📝 Changelog - Mise à Jour des Prompts

## 🔄 Modification du 2025-01-10

### Changement : Instruction Explicite de Charger common.md

**Problème identifié :**
Les prompts mentionnaient `common.md` mais ne demandaient pas explicitement de le charger dans le contexte avant exécution. Une IA exécutant uniquement le prompt n'avait donc pas accès aux standards complets.

**Solution implémentée :**
Ajout d'une section **"⚠️ PRÉREQUIS OBLIGATOIRE"** au début de TOUS les prompts (01-12) qui indique clairement :

```markdown
## ⚠️ PRÉREQUIS OBLIGATOIRE

**AVANT D'EXÉCUTER CE PROMPT**, charge le fichier `.github/prompts/common.md` dans ton contexte.

Ce fichier contient TOUS les standards du projet (TypeScript, React, architecture, conventions).
Sans lui, tu ne pourras pas respecter les exigences du projet.
```

### Prompts modifiés

- ✅ `plans/01-setup-initial.md`
- ✅ `plans/02-models-types.md`
- ✅ `plans/03-parser.md`
- ✅ `plans/04-storage.md`
- ✅ `plans/05-tts-engine.md`
- ✅ `plans/06-utilities.md`
- ✅ `plans/07-state-management.md`
- ✅ `plans/08-components-common.md`
- ✅ `plans/09-components-specific.md`
- ✅ `plans/10-screens-main.md`
- ✅ `plans/11-screens-reading.md`
- ✅ `plans/12-pwa-polish.md`

**Total : 12 prompts mis à jour**

### Avantages

1. ✅ **Source unique de vérité** : `common.md` contient TOUTES les règles
2. ✅ **Complétude** : L'IA a accès aux 200+ lignes de standards
3. ✅ **Maintenabilité** : Modification = 1 seul fichier (`common.md`)
4. ✅ **Précision** : Pas de risque d'incohérence ou d'oubli
5. ✅ **Clarté** : Instruction impossible à rater (en haut de chaque prompt)

### Usage

**Pour exécuter un prompt :**

1. Ouvrir une nouvelle session IA
2. **Charger `.github/prompts/common.md` dans le contexte**
3. Copier-coller le contenu du prompt (ex: `plans/07-state-management.md`)
4. Laisser l'IA exécuter
5. Valider (`npm run type-check`, tests)
6. Committer

### Cohérence avec la Documentation

Les fichiers suivants rappellent également cette obligation :
- ✅ `plans/INDEX.md`
- ✅ `plans/GETTING_STARTED.md`
- ✅ `plans/README.md`

---

**Auteur :** Claude (Assistant IA)  
**Date :** 2025-01-10  
**Raison :** Suggestion pertinente de l'utilisateur pour garantir le respect des standards
