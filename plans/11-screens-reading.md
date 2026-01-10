# 🚀 Prompt 11 : Écrans Lecture (Play, Reader)

**Durée estimée** : ~2h30 | **Dépend de** : Prompts 01-10

---

## ⚠️ PRÉREQUIS OBLIGATOIRE

**AVANT D'EXÉCUTER CE PROMPT**, charge le fichier `.github/prompts/common.md` dans ton contexte.

Ce fichier contient TOUS les standards du projet (TypeScript, React, architecture, conventions).
Sans lui, tu ne pourras pas respecter les exigences du projet.

---

## 📋 Contexte

Tu vas créer les **écrans de lecture** : sélection personnage et mode lecteur.

**Standards** : Respecte `.github/prompts/common.md` (déjà chargé en prérequis)

### Principes clés

- ✅ TypeScript strict
- ✅ Intégration TTS Engine
- ✅ Gestion états lecture (play/pause/stop)
- ❌ PAS de logique TTS dans les composants (déléguer au service)

---

## 🎯 Objectifs

1. PlayScreen (sélection personnage, aperçu pièce, lancement lecture)
2. ReaderScreen (affichage ligne actuelle, navigation, TTS)
3. Intégration TTS Engine
4. Gestion modes lecture (silent, audio, italian)

---

## 📦 Écrans à créer

1. `src/screens/PlayScreen.tsx` — Sélection personnage (liste personnages, aperçu répliques, bouton "Commencer")
2. `src/screens/ReaderScreen.tsx` — Lecteur principal (ligne actuelle, navigation, SceneNavigator, pause/play TTS, masquage répliques utilisateur en italien)
3. `src/hooks/useTTSReader.ts` — Hook intégration TTS Engine (play/pause/stop, gestion queue)
4. `src/screens/index.ts` — Exports (mise à jour)

---

## ✅ Critères de Validation

```bash
npm run type-check  # 0 erreur
npm run dev         # Pas d'erreur console
```

### Tests manuels

- [ ] PlayScreen : sélection personnage, affichage aperçu, clic "Commencer" → ReaderScreen
- [ ] ReaderScreen : affichage ligne actuelle, boutons prev/next
- [ ] TTS : lecture audio fonctionne (mode audio)
- [ ] Mode silent : pas de lecture audio
- [ ] Mode italien : masquage répliques utilisateur, lecture autres
- [ ] Navigation actes/scènes : dropdown fonctionne
- [ ] Pause/Play TTS : bouton fonctionne

---

## 📝 Livrables

- [ ] 2 écrans + hook TTS + index
- [ ] Commit : "feat: add reading screens and TTS integration (Prompt 11)"

---

## ➡️ Prompt suivant

**Prompt 12 - PWA & Polish (Service Worker, Icônes, Optimisations)**
