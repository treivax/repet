# 📖 Index du Plan d'Implémentation - Répét

**Bienvenue dans le plan d'implémentation complet de Répét !**

Tous les fichiers dont tu as besoin pour construire l'application sont ici.

---

## ⚠️ STANDARDS OBLIGATOIRES

**AVANT DE COMMENCER** : Chaque prompt, chaque session IA, chaque ligne de code **DOIT** respecter les standards définis dans :

📋 **`.github/prompts/common.md`**

Ce fichier définit :
- ✅ Principes de développement (simplicité, maintenabilité)
- ✅ Conventions TypeScript strict (pas de `any`)
- ✅ Architecture React (composants, hooks, state)
- ✅ Gestion d'erreurs et logging
- ✅ Documentation et commentaires
- ✅ Tests et validation

**🚨 IMPORTANT** : Si tu utilises une IA pour exécuter les prompts, **charge systématiquement** `.github/prompts/common.md` dans le contexte de chaque session.

---

## 🗂️ Navigation Rapide

### 📌 Démarrer Ici
👉 **[GETTING_STARTED.md](GETTING_STARTED.md)** - **COMMENCE ICI !**

### 📋 Vue d'Ensemble
- **[README.md](README.md)** - Vue d'ensemble du plan (12 prompts)
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Structure finale du projet
- **[PROMPTS_SUMMARY.md](PROMPTS_SUMMARY.md)** - Résumé détaillé de chaque prompt

### 🚀 Prompts (À Exécuter dans l'Ordre)
1. **[01-setup-initial.md](01-setup-initial.md)** ✅ Complet - Setup & Configuration
2. **[02-models-types.md](02-models-types.md)** ✅ Complet - Modèles TypeScript
3. **[03-parser.md](03-parser.md)** ✅ Complet - Parser de textes
4. **[04-storage.md](04-storage.md)** ✅ Complet - IndexedDB
5. **[05-tts-engine.md](05-tts-engine.md)** ✅ Complet - Text-to-Speech
6. **[06-utilities.md](06-utilities.md)** ✅ Complet - Utilitaires
7. **[07-state-management.md](07-state-management.md)** ✅ Complet - Zustand Stores
8. **[08-components-common.md](08-components-common.md)** ✅ Complet - Composants communs
9. **[09-components-specific.md](09-components-specific.md)** ✅ Complet - Composants spécifiques
10. **[10-screens-main.md](10-screens-main.md)** ✅ Complet - Écrans principaux
11. **[11-screens-reading.md](11-screens-reading.md)** ✅ Complet - Écrans de lecture
12. **[12-pwa-polish.md](12-pwa-polish.md)** ✅ Complet - PWA & Finalisation

---

## 📚 Guide d'Utilisation

### Étape 1 : Comprendre le Projet
1. Lis **[GETTING_STARTED.md](GETTING_STARTED.md)** 📖
2. Parcours **[README.md](README.md)** pour la vue d'ensemble
3. Consulte **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** pour voir le résultat final

### Étape 2 : Consulter les Standards ⚠️ OBLIGATOIRE
- **Ouvre `.github/prompts/common.md`** (standards du projet)
- **Familiarise-toi avec TOUTES les règles** TypeScript, React, etc.
- **Garde ce fichier ouvert** pendant toute l'implémentation
- **Charge-le dans chaque session IA** si tu utilises une IA

### Étape 3 : Exécuter les Prompts
1. Commence par **[01-setup-initial.md](01-setup-initial.md)**
2. Ouvre une nouvelle session IA
3. Copie-colle TOUT le contenu du prompt
4. Laisse l'IA exécuter
5. Valide (`npm run type-check`, tests manuels)
6. Passe au prompt suivant

### Étape 4 : Créer les Prompts Manquants
- Utilise **[PROMPTS_SUMMARY.md](PROMPTS_SUMMARY.md)** comme référence
- Copie le template de `01-setup-initial.md`
- Adapte le contenu pour chaque prompt

---

## 🎯 Objectif Final

À la fin des 12 prompts, tu auras une **PWA complète** :
- ✅ Import de textes théâtraux
- ✅ 3 modes de lecture (silencieux, audio, italiennes)
- ✅ Synthèse vocale
- ✅ Stockage local (IndexedDB)
- ✅ Interface responsive
- ✅ Thèmes clair/sombre
- ✅ Installable (Android/iOS)

---

## 📊 Progression

| Phase | Prompts | Statut |
|-------|---------|--------|
| **Foundation** | 01-03 | ✅ Prompts créés |
| **Core Modules** | 04-06 | ✅ Prompts créés |
| **State Management** | 07 | ✅ Prompts créés |
| **UI Components** | 08-09 | ✅ Prompts créés |
| **Screens** | 10-11 | ✅ Prompts créés |
| **Finalisation** | 12 | ✅ Prompts créés |

---

## 💡 Conseils

### Pour Bien Démarrer
- 📖 **Lis d'abord** : Ne saute pas GETTING_STARTED.md
- ⏱️ **Prends ton temps** : 1-2 prompts par session max
- ✅ **Valide toujours** : Tests manuels après chaque prompt
- 💾 **Commit souvent** : Après chaque prompt validé

### En Cas de Problème
- 🔍 **Consulte common.md** pour les standards
- 📋 **Relis le prompt** pour vérifier que tu as tout fait
- 🧪 **Teste manuellement** : Ne suppose pas que ça marche
- 📝 **Documente** : Note les problèmes et solutions

---

## 🔗 Liens Utiles

### Documentation
- `.github/prompts/common.md` - Standards du projet
- `README.md` (racine) - README principal du projet

### Ressources Externes
- [React](https://react.dev) - Framework UI
- [TypeScript](https://www.typescriptlang.org) - Langage
- [Vite](https://vitejs.dev) - Build tool
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Dexie.js](https://dexie.org) - IndexedDB wrapper
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) - TTS

---

## ✅ Checklist Rapide

Avant de commencer :
- [ ] J'ai lu GETTING_STARTED.md
- [ ] J'ai compris la structure (README.md)
- [ ] **J'ai lu ET compris `.github/prompts/common.md`** ⚠️
- [ ] Node.js 18+ est installé
- [ ] Je suis dans `/home/resinsec/dev/repet`

Pour chaque prompt :
- [ ] J'ai lu le prompt entier
- [ ] Nouvelle session IA
- [ ] **Chargé `.github/prompts/common.md` dans le contexte** ⚠️
- [ ] Copié-collé le contenu complet du prompt
- [ ] Laissé l'IA terminer
- [ ] `npm run type-check` OK (0 erreur)
- [ ] Tests manuels OK
- [ ] Vérifié le respect des standards (pas de `any`, JSDoc, etc.)
- [ ] Commit fait

---

## 📞 Support

Questions fréquentes :

**Q : Par où commencer ?**
A : Lis [GETTING_STARTED.md](GETTING_STARTED.md) !

**Q : Les prompts 03-12 sont où ?**
A : Tous créés ! Ils sont dans le dossier `plans/` (03-parser.md à 12-pwa-polish.md)

**Q : Puis-je sauter un prompt ?**
A : Non ! L'ordre est strict, chaque prompt dépend des précédents.

**Q : Combien de temps ça prend ?**
A : ~20h réparties sur 2-3 semaines (1-2 prompts/jour)

**Q : Je suis bloqué, que faire ?**
A : Consulte common.md, relis le prompt, teste manuellement, documente le problème

---

## 🎓 Ressources Complémentaires

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app)

### React
- [React Documentation](https://react.dev/learn)
- [React Hooks](https://react.dev/reference/react)

### PWA
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app)

---

**Bonne chance pour l'implémentation ! 🎭**

**L'équipe Répét**

_Dernière mise à jour : 2025-01-10_
