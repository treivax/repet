# 🚀 Prompt 09 : Composants Spécifiques (Play, Reader)

**Durée estimée** : ~2h30 | **Dépend de** : Prompts 01-08

---

## ⚠️ PRÉREQUIS OBLIGATOIRE

**AVANT D'EXÉCUTER CE PROMPT**, charge le fichier `.github/prompts/common.md` dans ton contexte.

Ce fichier contient TOUS les standards du projet (TypeScript, React, architecture, conventions).
Sans lui, tu ne pourras pas respecter les exigences du projet.

---

## 📋 Contexte

Tu vas créer les **composants métier** spécifiques à l'application théâtre.

**Standards** : Respecte `.github/prompts/common.md` (déjà chargé en prérequis)

### Principes clés

- ✅ TypeScript strict, hooks Zustand
- ✅ Logique métier séparée des composants UI
- ✅ Gestion couleurs personnages
- ❌ PAS de logique dans le JSX

---

## 🎯 Objectifs

1. PlayCard (affichage pièce dans liste)
2. CharacterBadge (badge personnage avec couleur)
3. LineCue (affichage réplique avec didascalies)
4. NavigationControls (boutons lecture)
5. SceneNavigator (navigation actes/scènes)

---

## 📦 Composants à créer

1. `src/components/play/PlayCard.tsx` — Carte pièce (titre, auteur, date, nb lignes, clic ouvre)
2. `src/components/play/CharacterBadge.tsx` — Badge personnage avec couleur générée
3. `src/components/play/CharacterSelector.tsx` — Liste personnages pour sélection utilisateur
4. `src/components/reader/LineCue.tsx` — Affichage ligne (personnage, réplique, didascalies inline)
5. `src/components/reader/NavigationControls.tsx` — Boutons prev/next, pause/play TTS
6. `src/components/reader/SceneNavigator.tsx` — Dropdown navigation actes/scènes
7. `src/components/play/index.ts` et `src/components/reader/index.ts` — Exports

---

## ✅ Critères de Validation

```bash
npm run type-check  # 0 erreur
npm run dev         # Pas d'erreur console
```

### Tests manuels

- [ ] PlayCard : affichage métadonnées, clic
- [ ] CharacterBadge : couleur déterministe
- [ ] CharacterSelector : sélection personnage
- [ ] LineCue : affichage réplique + didascalies
- [ ] NavigationControls : boutons prev/next
- [ ] SceneNavigator : dropdown actes/scènes

---

## 📝 Livrables

- [ ] 6 fichiers composants + 2 index
- [ ] Commit : "feat: add play and reader components (Prompt 09)"

---

## ➡️ Prompt suivant

**Prompt 10 - Écrans Principaux (Home, Library, Settings)**
