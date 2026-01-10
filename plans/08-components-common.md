# 🚀 Prompt 08 : Composants Communs (UI Primitives)

**Durée estimée** : ~2h | **Dépend de** : Prompts 01-07

---

## ⚠️ PRÉREQUIS OBLIGATOIRE

**AVANT D'EXÉCUTER CE PROMPT**, charge le fichier `.github/prompts/common.md` dans ton contexte.

Ce fichier contient TOUS les standards du projet (TypeScript, React, architecture, conventions).
Sans lui, tu ne pourras pas respecter les exigences du projet.

---

## 📋 Contexte

Tu vas créer les **composants UI réutilisables** de l'application (Button, Input, Modal, Spinner, Toast, Layout).

**Standards** : Respecte `.github/prompts/common.md` (déjà chargé en prérequis)

### Principes clés

- ✅ TypeScript strict, Tailwind CSS uniquement
- ✅ Accessibilité (ARIA, clavier)
- ✅ Composants découplés
- ❌ PAS de logique métier dans les composants UI

---

## 🎯 Objectifs

1. Button / Input accessibles
2. Modal avec gestion focus
3. Spinner et Toast
4. Layout principal

---

## 📦 Composants à créer

1. `src/components/common/Button.tsx` — Bouton avec variantes (primary/secondary/danger/ghost), tailles, loading
2. `src/components/common/Input.tsx` — Input text avec label, erreur, icônes
3. `src/components/common/Modal.tsx` — Modale accessible (overlay, focus trap, ESC)
4. `src/components/common/Spinner.tsx` — Loader animé
5. `src/components/common/Toast.tsx` — Notifications auto-dismiss
6. `src/components/common/Layout.tsx` — Layout principal (header, main, footer)
7. `src/components/common/index.ts` — Exports

---

## ✅ Critères de Validation

```bash
npm run type-check  # 0 erreur
npm run dev         # Pas d'erreur console
```

### Tests manuels

- [ ] Button : variantes, tailles, loading, disabled
- [ ] Input : label, error, onChange
- [ ] Modal : ouvre/ferme, ESC, clic overlay
- [ ] Spinner : affichage correct
- [ ] Toast : ajout erreur, auto-dismiss 5s
- [ ] Layout : structure correcte
- [ ] Accessibilité : navigation clavier, ARIA

---

## 📝 Livrables

- [ ] 7 fichiers composants
- [ ] Commit : "feat: add common UI components (Prompt 08)"

---

## ➡️ Prompt suivant

**Prompt 09 - Composants Spécifiques (Play, Reader)**
