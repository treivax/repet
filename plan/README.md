# 📋 Plan d'Intégration Piper-WASM

**Branche** : `piper-wasm`  
**Objectif** : Ajouter Piper-WASM comme moteur TTS alternatif avec sélecteur utilisateur  
**Statut** : 🟡 En attente de démarrage

---

## 📚 Documents de Planification

Ce répertoire contient tous les documents de planification pour l'intégration de Piper-WASM dans Répét.

### 📄 Documents Disponibles

| Document | Description | Utilisation |
|----------|-------------|-------------|
| **IMPLEMENTATION_GUIDE.md** | 🆕 Guide d'implémentation complet avec flux détaillés | Guide principal d'implémentation |
| **IMPLEMENTATION_TRACKER.md** | 🆕 Tracker de progression (checklists, métriques) | Suivi quotidien de l'avancement |
| **PIPER_WASM_ACTION_PLAN.md** | Plan détaillé complet (6 phases) | Document de référence technique |
| **PIPER_WASM_QUICK_REFERENCE.md** | Référence rapide et checklist | Guide quotidien de développement |
| **PIPER_WASM_ARCHITECTURE_DIAGRAMS.md** | Diagrammes ASCII de l'architecture | Compréhension visuelle du système |
| **VOICE_ASSIGNMENT_SPECIFICATION.md** | Spécification assignation voix par genre | Fonctionnalité critique (diversité vocale) |
| **TODO_PHASE_0.md** | Checklist détaillée Phase 0 (POC optionnel) | Actions concrètes POC |
| **SESSION_SUMMARY.md** | Résumé de la session de planification | Historique et décisions |
| **CHANGES_VALIDATION_USER.md** | Validation des changements utilisateur | Traçabilité des décisions |

---

## 🚀 Démarrage Rapide

### Avant Chaque Session de Développement

1. **Charger le contexte projet** (OBLIGATOIRE) :
   ```
   - .github/prompts/common.md
   - docs/ARCHITECTURE.md
   - docs/TTS_ARCHITECTURE_PROPOSAL.md
   - PROJECT_STATUS.md
   ```

2. **Lire les documents de plan** :
   - `IMPLEMENTATION_GUIDE.md` (guide d'implémentation complet)
   - `IMPLEMENTATION_TRACKER.md` (progression et checklists)
   - `PIPER_WASM_QUICK_REFERENCE.md` (référence rapide)

3. **Vérifier la branche** :
   ```bash
   git branch --show-current  # Doit afficher : piper-wasm
   ```

---

## 🎯 Objectif du Projet

Permettre aux utilisateurs de Répét de choisir entre deux moteurs de génération vocale :

- **"Natif Device"** - Web Speech API (existant)
- **"Piper"** - Piper-WASM (nouveau) - **SÉLECTIONNÉ PAR DÉFAUT**

---

## 📐 Phases du Projet

| Phase | Durée | Statut | Document |
|-------|-------|--------|----------|
| **Phase 1** : Fondations (Data Model & Types) | 1-2 jours | 🔴 À faire | Implementation Guide - Phase 1 |
| **Phase 2** : Provider Architecture | 2-3 jours | 🔴 À faire | Implementation Guide - Phase 2 |
| **Phase 3** : Store & State Management | 1-2 jours | 🔴 À faire | Implementation Guide - Phase 3 |
| **Phase 4** : UI Components | 2-3 jours | 🔴 À faire | Implementation Guide - Phase 4 |
| **Phase 5** : TTS Engine Integration | 1 jour | 🔴 À faire | Implementation Guide - Phase 5 |
| **Phase 6** : Tests & Validation | 2 jours | 🔴 À faire | Implementation Guide - Phase 6 |

**Total estimé** : 9-13 jours

> **Note** : Phase 0 (POC) est optionnelle et peut être effectuée plus tard pour l'intégration WASM réelle de Piper.

---

## ✅ Critères de Succès

### Fonctionnel
- [ ] Sélecteur de moteur dans les paramètres
- [ ] "Piper" sélectionné par défaut au premier lancement
- [ ] Changement de moteur fluide et immédiat
- [ ] Lecture audio fonctionne avec les 2 moteurs
- [ ] Cache audio accélère les lectures répétées
- [ ] **Voix différenciées par genre (M/F)**
- [ ] **Diversité maximale des voix entre personnages**

### Technique
- [ ] Code respecte `.github/prompts/common.md`
- [ ] Aucun hardcoding
- [ ] Types TypeScript stricts (pas de `any`)
- [ ] Build production réussit
- [ ] PWA fonctionne hors-ligne

### Documentation
- [ ] Guide utilisateur mis à jour
- [ ] Documentation technique complète
- [ ] Changelog à jour
- [ ] README mis à jour

---

## 🔧 Commandes Utiles

```bash
# Développement
npm run dev              # Serveur dev
npm run type-check       # Vérifier types
npm run lint             # Vérifier code style

# Build
npm run build            # Compiler production
npm run preview          # Tester build

# Git
git status               # Fichiers modifiés
git add .                # Ajouter fichiers
git commit -m "feat(tts): ..."  # Commit
git push -u origin piper-wasm   # Push branche
```

---

## 📖 Guide de Lecture des Documents

### Pour Comprendre le Projet
1. **Lire `IMPLEMENTATION_GUIDE.md`** (guide complet avec flux détaillés)
2. Consulter `PIPER_WASM_ARCHITECTURE_DIAGRAMS.md` (architecture visuelle)
3. Lire `VOICE_ASSIGNMENT_SPECIFICATION.md` (fonctionnalité clé)

### Pour Implémenter
1. **Suivre `IMPLEMENTATION_GUIDE.md`** (ordre bottom-up, phase par phase)
2. **Tracker progression dans `IMPLEMENTATION_TRACKER.md`**
3. Utiliser les code snippets de `QUICK_REFERENCE.md`
4. Référencer `PIPER_WASM_ACTION_PLAN.md` pour détails techniques

### Pour Déboguer
1. Consulter "Troubleshooting" dans `QUICK_REFERENCE.md`
2. Vérifier les diagrammes de flux dans `ARCHITECTURE_DIAGRAMS.md`
3. Vérifier l'algorithme d'assignation dans `VOICE_ASSIGNMENT_SPECIFICATION.md`

---

## 🚨 Règles Importantes

### ❌ INTERDIT
- Hardcoding (valeurs en dur)
- Type `any` en TypeScript
- Code temporaire / dette technique
- Oublier les tests manuels

### ✅ OBLIGATOIRE
- Header copyright sur tous nouveaux fichiers
- JSDoc pour fonctions complexes
- Types TypeScript explicites
- Tests manuels systématiques
- Named exports (pas de default)

---

## 📞 Support

- **Questions architecture** → Consulter `ARCHITECTURE_DIAGRAMS.md`
- **Détails implémentation** → Consulter `ACTION_PLAN.md`
- **Assignation de voix** → Consulter `VOICE_ASSIGNMENT_SPECIFICATION.md`
- **Standards de code** → Consulter `.github/prompts/common.md`
- **Checklist rapide** → Consulter `QUICK_REFERENCE.md`

---

## ⏭️ Prochaine Étape

**Phase 1 : Fondations (Data Model & Types)**

Commencer l'implémentation directement selon le guide :

1. Créer `src/core/tts/types.ts` (types partagés)
2. Modifier `src/core/models/Settings.ts` (ajouter champs TTS)
3. Mettre à jour schéma Dexie (migration DB)

📘 **Référence** : `IMPLEMENTATION_GUIDE.md` - Section Phase 1  
📊 **Tracker** : `IMPLEMENTATION_TRACKER.md` - Cocher les tâches au fur et à mesure

> **Note** : Le POC Piper-WASM (Phase 0) peut être effectué plus tard pour valider l'intégration WASM réelle. Pour l'instant, nous utiliserons des placeholders dans `PiperWASMProvider`.

---

**Dernière mise à jour** : 2025-01-XX  
**Mainteneur** : Équipe Répét  
**Licence** : MIT