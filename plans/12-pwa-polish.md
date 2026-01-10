# 🚀 Prompt 12 : PWA & Polish (Service Worker, Icônes, Optimisations)

**Durée estimée** : ~2h | **Dépend de** : Prompts 01-11

---

## ⚠️ PRÉREQUIS OBLIGATOIRE

**AVANT D'EXÉCUTER CE PROMPT**, charge le fichier `.github/prompts/common.md` dans ton contexte.

Ce fichier contient TOUS les standards du projet (TypeScript, React, architecture, conventions).
Sans lui, tu ne pourras pas respecter les exigences du projet.

---

## 📋 Contexte

Tu vas finaliser l'application en **PWA complète** : service worker, icônes, offline, optimisations.

**Standards** : Respecte `.github/prompts/common.md` (déjà chargé en prérequis)

### Principes clés

- ✅ PWA complète (manifest, service worker, icônes)
- ✅ Optimisations performances
- ✅ Tests finaux
- ❌ PAS de fonctionnalités nouvelles (uniquement polish)

---

## 🎯 Objectifs

1. Configuration PWA complète (vite-plugin-pwa)
2. Génération icônes (maskable, standard)
3. Service worker (cache stratégies)
4. Optimisations performances
5. Tests finaux (Lighthouse, offline)

---

## 📦 Tâches finales

1. **Manifest PWA** : `public/manifest.json` — nom, icônes, thème, start_url
2. **Icônes** : Générer icônes 192x192, 512x512, maskable (via outil en ligne ou script)
3. **Service Worker** : Configuration vite-plugin-pwa (workbox, stratégies cache)
4. **Optimisations** :
   - Code splitting (React.lazy)
   - Compression assets
   - Lazy load images
5. **Tests finaux** :
   - Lighthouse PWA score > 90
   - Offline mode fonctionne
   - Installation PWA (bouton "Add to Home Screen")
6. **Documentation** : `README.md` — instructions installation, dev, build, deploy

---

## ✅ Critères de Validation

```bash
npm run build       # Build production sans erreur
npm run preview     # Tester build en local
```

### Tests manuels

- [ ] Service worker enregistré (DevTools > Application > Service Workers)
- [ ] Icônes correctes (manifest)
- [ ] Offline mode : app fonctionne sans réseau (pages visitées)
- [ ] Installation PWA : bouton "Installer" apparaît
- [ ] Lighthouse PWA : score > 90
- [ ] Performance : FCP < 2s, LCP < 3s
- [ ] Accessibilité : score > 90
- [ ] Pas d'erreur console production

---

## 📝 Livrables

- [ ] Manifest + icônes
- [ ] Service worker configuré
- [ ] Build production optimisé
- [ ] README.md complet
- [ ] Commit : "feat: add PWA support and final polish (Prompt 12)"
- [ ] Tag release : `v1.0.0`

---

## 🎉 FIN

Application complète et prête au déploiement !

---

## 🚀 Déploiement (optionnel)

- Netlify : `npm run build` → déployer dossier `dist`
- Vercel : Connecter repo GitHub → auto-deploy
