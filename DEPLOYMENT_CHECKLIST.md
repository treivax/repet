# 🚀 Checklist de déploiement production

**Date de création** : 2025-01-15  
**Version cible** : v0.4.1  
**Branche** : `feat/piper-fork-multi-speaker`

---

## 📋 Vue d'ensemble

Cette checklist détaille toutes les étapes nécessaires pour déployer Répét en production, en modes **offline** et **online**.

**Statut actuel** : ✅ Code prêt, builds fonctionnels, documentation complète  
**Statut requis** : ✅ Tests validés, optimisations appliquées, déployé en production

---

## ✅ Étape 1 : Tests fonctionnels (CRITIQUE)

### 1.1 Tests audio de base

- [ ] **Test #1 : Lecture audio fonctionne**
  ```bash
  npm run dev:offline
  # → http://localhost:5174
  # → Charger "Alegria"
  # → Cliquer "Lecture audio"
  # → Vérifier : Audio se lit, pas d'erreur console
  ```
  - [ ] Audio se lit correctement
  - [ ] Pas d'erreur `piper_phonemize` dans la console
  - [ ] Latence acceptable (< 3s par réplique)

- [ ] **Test #2 : Les 4 voix fonctionnent**
  - [ ] Siwis (F) - voix claire et audible
  - [ ] Tom (H) - voix claire et audible
  - [ ] Jessica (F, UPMC) - voix claire et audible
  - [ ] Pierre (H, UPMC) - voix claire et audible ⭐ NOUVEAU

- [ ] **Test #3 : Multi-speaker (Jessica vs Pierre)**
  - [ ] Créer 2 personnages (homme/femme)
  - [ ] Assigner Jessica à la femme
  - [ ] Assigner Pierre à l'homme
  - [ ] Lire des dialogues alternés
  - [ ] **Validation** : Voix clairement différentes (féminine vs masculine)

### 1.2 Tests de performance

- [ ] **Test #4 : Cache audio**
  - [ ] Première lecture : ~1-3s par réplique
  - [ ] Deuxième lecture (cache) : < 100ms
  - [ ] Console affiche : `✅ Audio trouvé en cache`

- [ ] **Test #5 : Lecture longue durée**
  - [ ] Charger "Alegria" (59 lignes)
  - [ ] Lire la pièce entière
  - [ ] **Validation** :
    - [ ] Aucune coupure audio
    - [ ] Pas de fuite mémoire (DevTools > Memory)
    - [ ] CPU stable (pas de pic prolongé)

- [ ] **Test #6 : Préchargement des voix**
  - [ ] Recharger l'app (Ctrl+R)
  - [ ] Observer le modal d'initialisation
  - [ ] **Validation** :
    - [ ] Progression fluide 0% → 100%
    - [ ] 4 voix chargées successivement
    - [ ] Pas d'erreur dans la console

### 1.3 Tests de compatibilité navigateurs

- [ ] **Chrome/Chromium** (v120+)
  - [ ] Audio fonctionne
  - [ ] PWA installable
  - [ ] Mode offline OK

- [ ] **Firefox** (v115+)
  - [ ] Audio fonctionne
  - [ ] PWA installable
  - [ ] Mode offline OK

- [ ] **Safari** (v16+) - macOS/iOS
  - [ ] Audio fonctionne
  - [ ] PWA installable
  - [ ] Mode offline OK

- [ ] **Edge** (v120+)
  - [ ] Audio fonctionne
  - [ ] PWA installable
  - [ ] Mode offline OK

### 1.4 Tests PWA et mode offline

- [ ] **Test #7 : Installation PWA**
  ```bash
  npm run build:offline
  npm run preview
  # → http://localhost:4173
  ```
  - [ ] Bouton "Installer l'application" apparaît
  - [ ] Installation réussie
  - [ ] Icône sur le bureau/dock
  - [ ] Lancement depuis l'icône fonctionne

- [ ] **Test #8 : Fonctionnement offline**
  - [ ] Charger l'app en ligne
  - [ ] DevTools > Application > Service Workers
  - [ ] Cocher "Offline"
  - [ ] Recharger la page
  - [ ] **Validation** :
    - [ ] App charge correctement
    - [ ] Audio fonctionne hors ligne
    - [ ] Toutes les fonctionnalités disponibles

- [ ] **Test #9 : Persistance des données**
  - [ ] Créer un personnage
  - [ ] Fermer l'app
  - [ ] Rouvrir l'app
  - [ ] **Validation** : Personnage toujours présent

### 1.5 Tests de régression

- [ ] **Fonctionnalités existantes**
  - [ ] Import de pièces (format texte)
  - [ ] Parsing automatique des actes/scènes
  - [ ] Édition de personnages
  - [ ] Réglages de lecture (vitesse, volume)
  - [ ] Didascalies (lecture optionnelle)
  - [ ] Profils vocaux (variantes)

**Rapport de tests** : 📝 Remplir `TEST_CHECKLIST.md`

---

## ✅ Étape 2 : Optimisations (RECOMMANDÉ)

### 2.1 Optimisations bundle

- [ ] **Analyser la taille du bundle**
  ```bash
  npm run build:offline -- --mode analyze
  # Ou utiliser vite-bundle-visualizer
  ```
  - [ ] Identifier les plus gros modules
  - [ ] Vérifier si code splitting possible

- [ ] **Vérifier les warnings Vite**
  ```
  (!) Some chunks are larger than 500 kB after minification
  ```
  - [ ] Si > 500 KB : envisager `dynamic import()`
  - [ ] Documenter la décision si non applicable

### 2.2 Optimisations WASM

- [ ] **Vérifier taille des fichiers WASM**
  ```bash
  ls -lh public/wasm/
  ls -lh dist/wasm/
  ```
  - [ ] `piper_phonemize.data` : ~18 MB (acceptable)
  - [ ] `piper_phonemize.wasm` : ~621 KB (acceptable)
  - [ ] `ort-wasm-simd.wasm` : ~10 MB (acceptable)
  - [ ] Total : ~29 MB (dans les normes pour PWA TTS)

- [ ] **Optimiser le chargement**
  - [ ] WASM chargés à la demande (déjà implémenté)
  - [ ] Compression gzip activée (vérifier serveur)

### 2.3 Optimisations cache

- [ ] **Service Worker**
  - [ ] Vérifier stratégie de cache (Workbox)
  - [ ] Modèles ONNX en `CacheFirst`
  - [ ] WASM en `CacheFirst`
  - [ ] App shell en `NetworkFirst`

- [ ] **IndexedDB**
  - [ ] Vérifier expiration cache audio (actuellement illimité)
  - [ ] Envisager nettoyage automatique si > 100 MB

### 2.4 Optimisations performance

- [ ] **Mesurer les Core Web Vitals**
  - [ ] LCP (Largest Contentful Paint) < 2.5s
  - [ ] FID (First Input Delay) < 100ms
  - [ ] CLS (Cumulative Layout Shift) < 0.1

- [ ] **Lighthouse audit**
  ```bash
  npm run build:offline
  npm run preview
  # → Chrome DevTools > Lighthouse
  ```
  - [ ] Performance : > 90
  - [ ] Accessibility : > 90
  - [ ] Best Practices : > 90
  - [ ] SEO : > 90
  - [ ] PWA : 100 (si mode offline)

---

## ✅ Étape 3 : Préparation Git et versioning

### 3.1 Nettoyer l'historique Git

- [ ] **Vérifier les commits**
  ```bash
  git log --oneline -20
  ```
  - [ ] Messages de commit clairs
  - [ ] Pas de commits "WIP" ou "fix typo"
  - [ ] Si nécessaire : squash commits avec `git rebase -i`

- [ ] **Vérifier qu'aucun fichier sensible n'est commité**
  ```bash
  git log --all --full-history -- "*.env"
  git log --all --full-history -- "*secret*"
  git log --all --full-history -- "*key*"
  ```

### 3.2 Mettre à jour la version

- [ ] **package.json**
  ```json
  "version": "0.4.1"
  ```

- [ ] **CHANGELOG.md**
  - [ ] Date de release ajoutée : `## [0.4.1] - 2025-01-XX`
  - [ ] Toutes les modifications documentées
  - [ ] Lien vers les commits principaux

- [ ] **README.md** (si applicable)
  - [ ] Badges de version mis à jour
  - [ ] Section "Nouvelles fonctionnalités" ajoutée

### 3.3 Créer une Pull Request

- [ ] **Pousser la branche**
  ```bash
  git push origin feat/piper-fork-multi-speaker
  ```

- [ ] **Créer la PR sur GitHub/GitLab**
  - [ ] Titre : `feat: Add Pierre voice and fix audio playback (v0.4.1)`
  - [ ] Description :
    - [ ] Résumé du problème résolu
    - [ ] Solution appliquée (PiperWASMProvider + fork)
    - [ ] Lien vers `SOLUTION_SUMMARY.md`
    - [ ] Checklist des tests effectués
  - [ ] Labels : `enhancement`, `audio`, `ready-for-review`
  - [ ] Assigné à : reviewer(s)

- [ ] **Review de code**
  - [ ] Attendre approbation
  - [ ] Appliquer les changements demandés
  - [ ] Re-tester après modifications

---

## ✅ Étape 4 : Merge et tag

### 4.1 Merger dans main

- [ ] **Vérifier CI/CD** (si configuré)
  - [ ] Tous les tests passent
  - [ ] Build réussit
  - [ ] Pas de conflits

- [ ] **Merger la PR**
  ```bash
  git checkout main
  git pull origin main
  git merge feat/piper-fork-multi-speaker
  git push origin main
  ```

### 4.2 Créer un tag de version

- [ ] **Tag Git**
  ```bash
  git tag -a v0.4.1 -m "Release v0.4.1 - Pierre voice + audio fix"
  git push origin v0.4.1
  ```

- [ ] **GitHub Release** (optionnel)
  - [ ] Créer release sur GitHub
  - [ ] Titre : `v0.4.1 - Pierre voice and audio playback fix`
  - [ ] Description : Copier depuis `CHANGELOG.md`
  - [ ] Attacher assets : builds offline/online (si applicable)

---

## ✅ Étape 5 : Builds de production

### 5.1 Build offline

- [ ] **Générer le build**
  ```bash
  npm run build:offline
  ```
  - [ ] Vérifier : Pas d'erreurs
  - [ ] Vérifier : Warnings acceptables
  - [ ] Durée de build : ~2-3s

- [ ] **Vérifier le contenu du build**
  ```bash
  ls -lh dist/
  ls -lh dist/wasm/
  ls -lh dist/models/
  ```
  - [ ] `index.html` présent
  - [ ] `assets/` présent
  - [ ] `wasm/` présent (tous les WASM)
  - [ ] `models/` présent (tous les modèles)
  - [ ] `sw.js` présent (Service Worker)
  - [ ] `manifest.webmanifest` présent

- [ ] **Tester le build en local**
  ```bash
  npm run preview
  # → http://localhost:4173
  ```
  - [ ] App se charge
  - [ ] Audio fonctionne
  - [ ] Mode offline fonctionne

### 5.2 Build online

- [ ] **Générer le build**
  ```bash
  npm run build:online
  ```
  - [ ] Vérifier : Pas d'erreurs
  - [ ] Durée de build : ~2-3s

- [ ] **Vérifier le contenu du build**
  ```bash
  ls -lh dist-online/
  ```
  - [ ] `index.html` présent
  - [ ] `assets/` présent
  - [ ] `wasm/` présent
  - [ ] **Pas de `models/`** (chargés depuis Hugging Face)
  - [ ] `sw.js` présent
  - [ ] `manifest.webmanifest` présent

- [ ] **Tester le build en local**
  ```bash
  npm run preview:online
  # → Vérifier que les modèles se chargent depuis HF
  ```

### 5.3 Vérifier les fichiers critiques

- [ ] **Service Worker actif**
  - [ ] DevTools > Application > Service Workers
  - [ ] État : "activated and running"
  - [ ] Cache storage : présent et peuplé

- [ ] **Manifest valide**
  - [ ] DevTools > Application > Manifest
  - [ ] Nom, icônes, couleurs corrects
  - [ ] Pas d'erreurs

- [ ] **WASM chargés**
  - [ ] Console : Pas d'erreur 404 pour WASM
  - [ ] Network tab : WASM chargés avec succès

---

## ✅ Étape 6 : Configuration serveur/hébergement

### 6.1 Configuration serveur web

- [ ] **Headers HTTP requis**
  ```nginx
  # Pour ONNX Runtime Web (SharedArrayBuffer)
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  
  # Cache des fichiers statiques
  Cache-Control: public, max-age=31536000, immutable  # WASM, models
  Cache-Control: no-cache                              # index.html
  ```

- [ ] **HTTPS activé** (obligatoire pour PWA)
  - [ ] Certificat SSL valide
  - [ ] Redirection HTTP → HTTPS

- [ ] **Compression activée**
  - [ ] Gzip pour `.js`, `.css`, `.html`
  - [ ] Brotli (optionnel, recommandé)

- [ ] **MIME types corrects**
  ```nginx
  application/wasm    .wasm
  application/json    .json
  text/javascript     .js
  ```

### 6.2 Choix de l'hébergement

**Option A : Hébergement statique (RECOMMANDÉ pour offline)**

- [ ] **Netlify**
  - [ ] Connecter repo GitHub
  - [ ] Build command : `npm run build:offline`
  - [ ] Publish directory : `dist`
  - [ ] Configurer headers (`netlify.toml`)

- [ ] **Vercel**
  - [ ] Connecter repo GitHub
  - [ ] Framework preset : Vite
  - [ ] Build command : `npm run build:offline`
  - [ ] Output directory : `dist`

- [ ] **GitHub Pages**
  - [ ] Activer GitHub Pages
  - [ ] Source : GitHub Actions
  - [ ] Workflow configuré (`.github/workflows/deploy.yml`)

**Option B : Serveur personnalisé**

- [ ] Nginx/Apache configuré
- [ ] Headers CORS configurés
- [ ] HTTPS configuré
- [ ] CD pipeline configuré

### 6.3 Créer les fichiers de configuration

- [ ] **netlify.toml** (si Netlify)
  ```toml
  [build]
    command = "npm run build:offline"
    publish = "dist"
  
  [[headers]]
    for = "/*"
    [headers.values]
      Cross-Origin-Opener-Policy = "same-origin"
      Cross-Origin-Embedder-Policy = "require-corp"
  
  [[headers]]
    for = "/wasm/*"
    [headers.values]
      Cache-Control = "public, max-age=31536000, immutable"
  
  [[headers]]
    for = "/models/*"
    [headers.values]
      Cache-Control = "public, max-age=31536000, immutable"
  ```

- [ ] **vercel.json** (si Vercel)
  ```json
  {
    "buildCommand": "npm run build:offline",
    "outputDirectory": "dist",
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
          { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
        ]
      }
    ]
  }
  ```

- [ ] **.github/workflows/deploy.yml** (si GitHub Actions)
  ```yaml
  name: Deploy to GitHub Pages
  on:
    push:
      branches: [main]
  jobs:
    build-and-deploy:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-node@v3
          with:
            node-version: '20'
        - run: npm ci
        - run: npm run build:offline
        - uses: peaceiris/actions-gh-pages@v3
          with:
            github_token: ${{ secrets.GITHUB_TOKEN }}
            publish_dir: ./dist
  ```

---

## ✅ Étape 7 : Déploiement

### 7.1 Déploiement staging/preview (RECOMMANDÉ)

- [ ] **Créer un environnement de staging**
  - [ ] URL : `https://staging.repet.app` (ou preview Netlify/Vercel)
  - [ ] Déployer le build offline

- [ ] **Tests sur staging**
  - [ ] Re-tester tous les tests fonctionnels
  - [ ] Tester depuis différents appareils (mobile, tablette, desktop)
  - [ ] Vérifier les headers HTTP (DevTools > Network)
  - [ ] Vérifier performance (Lighthouse)

- [ ] **Valider avec les utilisateurs**
  - [ ] Partager URL staging avec beta-testeurs
  - [ ] Collecter feedback
  - [ ] Corriger bugs critiques si nécessaire

### 7.2 Déploiement production offline

- [ ] **Déployer sur production**
  ```bash
  # Méthode 1 : Push sur main (si CD configuré)
  git push origin main
  
  # Méthode 2 : Deploy manuel
  npm run build:offline
  # → Upload dist/ vers serveur
  ```

- [ ] **Vérifier le déploiement**
  - [ ] URL production accessible
  - [ ] Certificat SSL valide
  - [ ] Service Worker actif
  - [ ] App installable (PWA)

- [ ] **Tests post-déploiement**
  - [ ] Audio fonctionne
  - [ ] 4 voix disponibles
  - [ ] Mode offline fonctionne
  - [ ] Cache fonctionne

### 7.3 Déploiement production online

- [ ] **Déployer build online**
  ```bash
  npm run build:online
  # → Upload dist-online/ vers serveur online
  ```

- [ ] **Vérifier modèles chargés depuis CDN**
  - [ ] Network tab : Modèles chargés depuis Hugging Face
  - [ ] Pas d'erreur CORS
  - [ ] Latence acceptable

---

## ✅ Étape 8 : Monitoring et validation post-déploiement

### 8.1 Analytics et monitoring

- [ ] **Configurer analytics** (optionnel)
  - [ ] Google Analytics / Plausible / Matomo
  - [ ] Tracking :
    - [ ] Installations PWA
    - [ ] Voix utilisées
    - [ ] Erreurs JavaScript

- [ ] **Monitoring uptime**
  - [ ] UptimeRobot / Pingdom
  - [ ] Alertes si site down

- [ ] **Error tracking** (optionnel)
  - [ ] Sentry / Rollbar
  - [ ] Capturer erreurs runtime

### 8.2 Tests utilisateurs réels

- [ ] **Recueillir feedback**
  - [ ] Installer l'app sur 3+ appareils différents
  - [ ] Tester pendant 1 semaine
  - [ ] Noter bugs/améliorations

- [ ] **Vérifier métriques**
  - [ ] Temps de chargement < 3s
  - [ ] Taux d'installation PWA
  - [ ] Taux d'erreur < 1%

### 8.3 Documentation utilisateur

- [ ] **Guide d'installation**
  - [ ] Instructions pour installer la PWA
  - [ ] Screenshots

- [ ] **Guide d'utilisation**
  - [ ] Comment assigner les voix
  - [ ] Comment utiliser les profils vocaux
  - [ ] Différence Jessica/Pierre

- [ ] **FAQ**
  - [ ] Pourquoi l'audio ne se lit pas ? (headers CORS)
  - [ ] Comment utiliser hors ligne ?
  - [ ] Quelle voix choisir ?

---

## ✅ Étape 9 : Communication et release

### 9.1 Annonce de la release

- [ ] **Préparer l'annonce**
  - [ ] Titre : "Répét v0.4.1 - Nouvelle voix Pierre et correction audio"
  - [ ] Highlights :
    - [ ] 4 voix françaises maintenant disponibles
    - [ ] Correction du bug de lecture audio
    - [ ] Support multi-speaker
  - [ ] Captures d'écran / GIF

- [ ] **Publier l'annonce**
  - [ ] Blog (si existant)
  - [ ] Réseaux sociaux
  - [ ] Newsletter (si existant)
  - [ ] Forum / communauté

### 9.2 Documentation publique

- [ ] **Mettre à jour le site web**
  - [ ] Page d'accueil : Mentionner Pierre
  - [ ] Page "Voix" : Liste des 4 voix
  - [ ] Changelog public

- [ ] **Mettre à jour le README**
  - [ ] Badge version : `v0.4.1`
  - [ ] Section "Nouvelles fonctionnalités"
  - [ ] Lien vers demo online

---

## ✅ Étape 10 : Maintenance post-release

### 10.1 Surveiller les premiers jours

- [ ] **J+1** : Vérifier logs d'erreurs
- [ ] **J+3** : Vérifier feedback utilisateurs
- [ ] **J+7** : Analyser métriques

### 10.2 Hotfixes si nécessaire

- [ ] Si bug critique détecté :
  - [ ] Fix en priorité
  - [ ] Tag `v0.4.2` (patch)
  - [ ] Redéploiement urgent

### 10.3 Planifier v0.5.0

- [ ] Collecter demandes d'amélioration
- [ ] Prioriser roadmap
- [ ] Ouvrir issues GitHub

---

## 📊 Résumé des étapes

| Étape | Description | Durée estimée | Priorité |
|-------|-------------|---------------|----------|
| 1. Tests fonctionnels | Valider audio, voix, multi-speaker | 2-3h | 🔴 CRITIQUE |
| 2. Optimisations | Bundle, WASM, cache, performance | 1-2h | 🟡 RECOMMANDÉ |
| 3. Préparation Git | Nettoyer, versionner, PR | 30min | 🔴 CRITIQUE |
| 4. Merge et tag | Merger dans main, créer tag | 15min | 🔴 CRITIQUE |
| 5. Builds production | Générer builds offline/online | 30min | 🔴 CRITIQUE |
| 6. Config serveur | Headers, HTTPS, compression | 1h | 🔴 CRITIQUE |
| 7. Déploiement | Staging + production | 1-2h | 🔴 CRITIQUE |
| 8. Monitoring | Analytics, error tracking | 1h | 🟢 OPTIONNEL |
| 9. Communication | Annonce, docs publiques | 1h | 🟡 RECOMMANDÉ |
| 10. Maintenance | Surveillance post-release | Continu | 🟡 RECOMMANDÉ |

**Total estimé** : 8-12 heures (sur 1-2 jours)

---

## 🎯 Checklist minimale (déploiement rapide)

Si vous voulez déployer rapidement (< 4h) :

1. ✅ **Tests critiques** (1h)
   - [ ] Audio fonctionne (Siwis, Tom, Jessica, Pierre)
   - [ ] Multi-speaker OK (Jessica ≠ Pierre)
   - [ ] Mode offline OK

2. ✅ **Merge** (15min)
   - [ ] Pousser branche
   - [ ] Merger dans main

3. ✅ **Build** (15min)
   - [ ] `npm run build:offline`
   - [ ] Vérifier dist/

4. ✅ **Deploy** (30min)
   - [ ] Upload sur serveur
   - [ ] Vérifier headers CORS
   - [ ] Tester en production

5. ✅ **Valider** (30min)
   - [ ] URL accessible
   - [ ] Audio fonctionne
   - [ ] PWA installable

**Total** : ~2h30 pour un déploiement fonctionnel minimum

---

## 📚 Ressources

- `TEST_CHECKLIST.md` - Tests détaillés
- `SOLUTION_SUMMARY.md` - Résumé de la solution
- `CLEANUP_SUMMARY.md` - Résumé du nettoyage
- `docs/AUDIO_PLAYBACK_FIX.md` - Documentation technique
- `CHANGELOG.md` - Historique des modifications

---

**Dernière mise à jour** : 2025-01-15  
**Maintenu par** : Répét Contributors