# 🚀 Prompt 10 : Écrans Principaux (Home, Library, Settings)

**Durée estimée** : ~2h | **Dépend de** : Prompts 01-09

---

## ⚠️ PRÉREQUIS OBLIGATOIRE

**AVANT D'EXÉCUTER CE PROMPT**, charge le fichier `.github/prompts/common.md` dans ton contexte.

Ce fichier contient TOUS les standards du projet (TypeScript, React, architecture, conventions).
Sans lui, tu ne pourras pas respecter les exigences du projet.

---

## 📋 Contexte

Tu vas créer les **écrans principaux** de l'application (routes React Router).

**Standards** : Respecte `.github/prompts/common.md` (déjà chargé en prérequis)

### Principes clés

- ✅ TypeScript strict, React Router v6
- ✅ Zustand stores + hooks
- ✅ Composants existants réutilisés
- ❌ PAS de logique dans les écrans (déléguer aux hooks/services)

---

## 🎯 Objectifs

1. HomeScreen (accueil, import rapide, dernières pièces)
2. LibraryScreen (liste pièces, recherche, suppression)
3. SettingsScreen (configuration TTS, voix, vitesse, volume)
4. Router principal

---

## 📦 Écrans à créer

1. `src/screens/HomeScreen.tsx` — Accueil (bouton import, liste dernières pièces, stats)
2. `src/screens/LibraryScreen.tsx` — Bibliothèque (liste pièces avec PlayCard, recherche, tri)
3. `src/screens/SettingsScreen.tsx` — Paramètres (sélection voix, sliders vitesse/volume, mode lecture)
4. `src/router.tsx` — Routes React Router (/, /library, /settings, /play/:id, /read/:id)
5. `src/screens/index.ts` — Exports

---

## ✅ Critères de Validation

```bash
npm run type-check  # 0 erreur
npm run dev         # Pas d'erreur console
```

### Tests manuels

- [ ] HomeScreen : affichage bouton import, dernières pièces
- [ ] LibraryScreen : liste pièces, recherche fonctionne
- [ ] SettingsScreen : sélection voix, sliders, changement mode
- [ ] Router : navigation entre pages (/), (/library), (/settings)
- [ ] Pas d'erreur 404

---

## 📝 Livrables

- [ ] 3 écrans + router + index
- [ ] Commit : "feat: add main screens and routing (Prompt 10)"

---

## ➡️ Prompt suivant

**Prompt 11 - Écrans Lecture (Play, Reader)**
