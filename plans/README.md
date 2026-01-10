# 📋 Plan d'Action - Projet Répét

**Objectif** : Implémentation complète de l'application PWA de répétition théâtrale

---

## 🎯 Vue d'Ensemble

Ce plan décrit la séquence de prompts pour implémenter Répét de A à Z. Chaque prompt s'exécute dans une session unique (contexte 128k max).

### Stratégie

1. **Foundation** - Infrastructure et configuration
2. **Core Logic** - Modules métier (parser, storage, TTS)
3. **State** - Gestion d'état globale
4. **UI** - Composants et écrans
5. **PWA** - Finalisation

### Estimation

- **12 prompts** numérotés
- **2-3 semaines**
- **Ordre séquentiel strict**

---

## 📝 Liste des Prompts

### Phase 1 : Foundation

| # | Prompt | Durée | Livrables |
|---|--------|-------|-----------|
| **01** | Setup Initial | 1h | Vite, React, TS, Tailwind, PWA config, structure dossiers |
| **02** | Modèles & Types | 1h | Types TS pour Play, Character, Settings, ContentNode |
| **03** | Parser | 2h | Parser de textes théâtraux (tokenizer + AST) |

### Phase 2 : Core Modules

| # | Prompt | Durée | Livrables |
|---|--------|-------|-----------|
| **04** | Storage | 1.5h | IndexedDB avec Dexie (plays, settings) |
| **05** | TTS Engine | 2h | Web Speech API wrapper (queue, voix, didascalies) |
| **06** | Utilities | 1h | Colors, validation, formatting, UUID, constants |

### Phase 3 : State Management

| # | Prompt | Durée | Livrables |
|---|--------|-------|-----------|
| **07** | Zustand Stores | 1.5h | 4 stores (plays, settings, player, UI) |

### Phase 4 : UI Components

| # | Prompt | Durée | Livrables |
|---|--------|-------|-----------|
| **08** | Composants Communs | 2h | Button, Dropdown, Modal, Toggle, Spinner, Header |
| **09** | Composants Spécifiques | 2h | Play (8), Settings (3), Reader (3) components |

### Phase 5 : Screens

| # | Prompt | Durée | Livrables |
|---|--------|-------|-----------|
| **10** | Écrans Principaux | 2.5h | Home, PlayDetail, App routing, hooks |
| **11** | Écrans de Lecture | 3h | SilentRead, AudioRead, Italian + navigation |

### Phase 6 : Finalisation

| # | Prompt | Durée | Livrables |
|---|--------|-------|-----------|
| **12** | PWA & Polish | 2h | Icons, SW, loading, animations, docs |

---

## 📊 Dépendances

```
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12
```

**Important** : Respecter l'ordre. Chaque prompt dépend des précédents.

---

## 🚀 Utilisation

### Pour Chaque Prompt

1. **Lire** le fichier `plans/XX-nom-prompt.md`
2. **Ouvrir** une nouvelle session IA
3. **Copier-coller** tout le contenu du prompt
4. **Laisser** l'IA exécuter complètement
5. **Valider** :
   ```bash
   npm run type-check  # 0 erreur
   npm run lint        # 0 warning
   npm run dev         # Test manuel
   ```
6. **Passer** au prompt suivant

### En Cas de Problème

- Corriger avant de continuer
- Ne PAS passer au prompt suivant si le précédent n'est pas OK
- Scinder le prompt si trop complexe

---

## 📁 Fichiers du Plan

- `README.md` - Ce fichier (vue d'ensemble)
- `01-setup-initial.md` - Initialisation projet
- `02-models-types.md` - Modèles de données
- `03-parser.md` - Parser de textes
- `04-storage.md` - IndexedDB
- `05-tts-engine.md` - Text-to-Speech
- `06-utilities.md` - Utilitaires
- `07-state-management.md` - Zustand stores
- `08-common-components.md` - Composants communs
- `09-specific-components.md` - Composants spécifiques
- `10-main-screens.md` - Écrans principaux
- `11-reading-screens.md` - Écrans de lecture
- `12-pwa-polish.md` - Finalisation PWA

---

## ✅ Checklist Globale

### Avant chaque session
- [ ] Lire le prompt
- [ ] Vérifier les dépendances
- [ ] Avoir le contexte des prompts précédents

### Pendant chaque session
- [ ] Suivre le prompt strictement
- [ ] Respecter `common.md`
- [ ] En-têtes copyright
- [ ] Types stricts (pas de `any`)
- [ ] Commenter le code complexe

### Après chaque session
- [ ] `npm run type-check` ✅
- [ ] `npm run lint` ✅
- [ ] Test manuel ✅
- [ ] Documenter changements
- [ ] Commit

---

## 📚 Ressources

- **Standards** : `.github/prompts/common.md`
- **Stack** : React 18 + TypeScript + Vite + Tailwind + Zustand + Dexie
- **APIs** : Web Speech API, IndexedDB, File API

---

## 📊 Statut d'Exécution

| # | Prompt | Statut | Date | Notes |
|---|--------|--------|------|-------|
| 01 | Setup Initial | ⏳ | - | - |
| 02 | Models & Types | ⏳ | - | - |
| 03 | Parser | ⏳ | - | - |
| 04 | Storage | ⏳ | - | - |
| 05 | TTS Engine | ⏳ | - | - |
| 06 | Utilities | ⏳ | - | - |
| 07 | State Management | ⏳ | - | - |
| 08 | Common Components | ⏳ | - | - |
| 09 | Specific Components | ⏳ | - | - |
| 10 | Main Screens | ⏳ | - | - |
| 11 | Reading Screens | ⏳ | - | - |
| 12 | PWA & Polish | ⏳ | - | - |

**Légende** : ⏳ À faire | 🔄 En cours | ✅ Terminé | ⚠️ Bloqué | ❌ Abandonné

---

**Dernière mise à jour** : 2025-01-10