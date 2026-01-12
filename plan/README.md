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
| **PIPER_WASM_ACTION_PLAN.md** | Plan détaillé complet (4 phases) | Document de référence principal |
| **PIPER_WASM_QUICK_REFERENCE.md** | Référence rapide et checklist | Guide quotidien de développement |
| **PIPER_WASM_ARCHITECTURE_DIAGRAMS.md** | Diagrammes ASCII de l'architecture | Compréhension visuelle du système |
| **PIPER_WASM_POC_RESULTS.md** | Résultats du POC (Phase 0) | À créer lors de la Phase 0 |

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
   - `PIPER_WASM_ACTION_PLAN.md` (détails de la phase en cours)
   - `PIPER_WASM_QUICK_REFERENCE.md` (checklist et snippets)

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
| **Phase 0** : POC Piper-WASM | 1 jour | 🔴 À faire | Action Plan (L18) |
| **Phase 1** : Architecture de Base | 2-3 jours | 🔴 À faire | Action Plan (L140) |
| **Phase 2** : Intégration Piper-WASM | 3-5 jours | 🔴 À faire | Action Plan (L471) |
| **Phase 3** : UI Sélecteur | 2-3 jours | 🔴 À faire | Action Plan (L813) |
| **Phase 4** : Documentation | 1 jour | 🔴 À faire | Action Plan (L1148) |

**Total estimé** : 9-13 jours

---

## ✅ Critères de Succès

### Fonctionnel
- [ ] Sélecteur de moteur dans les paramètres
- [ ] "Piper" sélectionné par défaut au premier lancement
- [ ] Changement de moteur fluide et immédiat
- [ ] Lecture audio fonctionne avec les 2 moteurs
- [ ] Cache audio accélère les lectures répétées

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
1. Lire `PIPER_WASM_QUICK_REFERENCE.md` (vue d'ensemble)
2. Consulter `PIPER_WASM_ARCHITECTURE_DIAGRAMS.md` (architecture visuelle)

### Pour Implémenter
1. Lire `PIPER_WASM_ACTION_PLAN.md` (phase en cours)
2. Suivre les checklists de validation
3. Utiliser les code snippets de `QUICK_REFERENCE.md`

### Pour Déboguer
1. Consulter "Troubleshooting" dans `QUICK_REFERENCE.md`
2. Vérifier les diagrammes de flux dans `ARCHITECTURE_DIAGRAMS.md`

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
- **Standards de code** → Consulter `.github/prompts/common.md`
- **Checklist rapide** → Consulter `QUICK_REFERENCE.md`

---

## ⏭️ Prochaine Étape

**Phase 0 : POC Piper-WASM**

1. Rechercher la librairie Piper-WASM officielle
2. Créer `poc-piper.html` pour tester
3. Tester génération audio basique
4. Documenter résultats dans `PIPER_WASM_POC_RESULTS.md`
5. Valider faisabilité technique

**Go/No-Go** : Si POC réussit → Phase 1, sinon → réévaluer approche

---

**Dernière mise à jour** : 2025-01-XX  
**Mainteneur** : Équipe Répét  
**Licence** : MIT