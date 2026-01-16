# Checklist de déploiement v0.2.3

**Version**: 0.2.3  
**Date**: 2025-01-XX  
**Correctif**: Scroll manuel en mode silencieux  
**Statut**: ✅ Déployé sur GitHub

---

## ✅ Étapes de développement (COMPLÉTÉ)

- [x] Identification du bug (scroll saccadé en mode silencieux)
- [x] Analyse de la cause racine (conflit IntersectionObserver + scroll auto)
- [x] Implémentation de la solution (early return si readingMode === 'silent')
- [x] Retrait des console.warn de debug
- [x] Tests de validation manuels
- [x] Vérification de non-régression (modes audio/italiennes)

## ✅ Étapes de versioning (COMPLÉTÉ)

- [x] Bump `APP_VERSION` dans `src/config/version.ts` (0.2.2 → 0.2.3)
- [x] Bump `version` dans `package.json` (0.2.2 → 0.2.3)
- [x] Vérification `npm run type-check` (pas d'erreurs)
- [x] Build complet `npm run build` (succès)

## ✅ Étapes Git (COMPLÉTÉ)

- [x] `git add` des fichiers modifiés
- [x] `git commit` avec message détaillé
- [x] Création du tag `v0.2.3` avec description
- [x] `git push origin main`
- [x] `git push origin v0.2.3`
- [x] Vérification sur GitHub (commit + tag visibles)

## 📋 Étapes de déploiement PWA (À FAIRE)

### 1. Déploiement offline (app.repet.com)

- [ ] **Se connecter au serveur de déploiement**
  ```bash
  ssh user@app.repet.com
  ```

- [ ] **Naviguer vers le répertoire du projet**
  ```bash
  cd /path/to/repet
  ```

- [ ] **Pull les derniers changements**
  ```bash
  git fetch origin
  git checkout main
  git pull origin main
  git checkout v0.2.3
  ```

- [ ] **Installer les dépendances (si nécessaire)**
  ```bash
  npm ci
  ```

- [ ] **Build offline**
  ```bash
  npm run build:offline
  ```

- [ ] **Déployer les fichiers**
  ```bash
  # Copier dist-offline vers le répertoire web
  # Exemple:
  rsync -av dist-offline/ /var/www/app.repet.com/
  ```

- [ ] **Vérifier le déploiement**
  - Ouvrir https://app.repet.com
  - Vérifier la version dans la console (0.2.3)
  - Tester le scroll en mode silencieux
  - Vérifier la PWA update notification

### 2. Déploiement online (ios.repet.com)

- [ ] **Se connecter au serveur iOS**
  ```bash
  ssh user@ios.repet.com
  ```

- [ ] **Naviguer et pull**
  ```bash
  cd /path/to/repet
  git fetch origin
  git checkout main
  git pull origin main
  git checkout v0.2.3
  ```

- [ ] **Build online**
  ```bash
  npm ci
  npm run build:online
  ```

- [ ] **Déployer**
  ```bash
  rsync -av dist-online/ /var/www/ios.repet.com/
  ```

- [ ] **Vérifier le déploiement**
  - Ouvrir https://ios.repet.com
  - Vérifier la version (0.2.3)
  - Tester sur iOS Safari
  - Vérifier le téléchargement des modèles depuis CDN

### 3. Vérification PWA Auto-Update

- [ ] **Sur un appareil avec v0.2.2 installée**
  - Ouvrir l'app PWA
  - Attendre la détection de mise à jour (peut prendre 1-2 minutes)
  - Vérifier que la notification "Nouvelle version disponible" apparaît
  - Cliquer sur "Mettre à jour"
  - Vérifier que l'app recharge et affiche v0.2.3

- [ ] **Test force refresh**
  - Ouvrir DevTools (F12)
  - Application → Service Workers → Unregister
  - Hard refresh (Ctrl+Shift+R)
  - Vérifier que v0.2.3 est chargée

## 🧪 Tests post-déploiement

### Tests fonctionnels

- [ ] **Mode silencieux - Scroll manuel**
  - Ouvrir une pièce en mode silencieux
  - Scroller manuellement vers le bas/haut
  - ✅ Attendu: Scroll fluide, arrêt immédiat au relâchement
  - ❌ Échec: Saccades ou reprises

- [ ] **Mode silencieux - Badge de scène**
  - Scroller à travers plusieurs scènes
  - ✅ Attendu: Badge mis à jour correctement
  - ❌ Échec: Badge décalé ou pas à jour

- [ ] **Mode audio - Scroll automatique (non-régression)**
  - Lancer la lecture audio
  - ✅ Attendu: Centrage automatique de chaque réplique
  - ❌ Échec: Pas de scroll auto ou scroll erratique

- [ ] **Mode italiennes - Scroll automatique (non-régression)**
  - Cliquer sur des répliques
  - ✅ Attendu: Centrage automatique
  - ❌ Échec: Pas de scroll

### Tests multi-appareils

- [ ] Desktop Chrome (Windows/macOS/Linux)
- [ ] Desktop Firefox
- [ ] Desktop Safari (macOS)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)
- [ ] Tablette iPad
- [ ] Tablette Android

### Tests PWA

- [ ] Installation PWA (Add to Home Screen)
- [ ] Mode offline (couper le réseau)
- [ ] Cache des modèles vocaux
- [ ] Notifications de mise à jour

## 📊 Monitoring post-déploiement

### Jour 1
- [ ] Vérifier les logs serveur (erreurs 500/404)
- [ ] Vérifier Analytics (taux d'erreur JS)
- [ ] Vérifier les rapports d'erreur utilisateur
- [ ] Monitorer le trafic réseau

### Jour 7
- [ ] Analyse des retours utilisateurs
- [ ] Vérification des métriques de performance
- [ ] Validation du taux de mise à jour PWA

## 🐛 Rollback (si nécessaire)

En cas de problème critique :

```bash
# Sur le serveur
cd /path/to/repet
git checkout v0.2.2
npm ci
npm run build:offline  # ou build:online selon le serveur
rsync -av dist-*/  /var/www/...

# Puis supprimer le tag v0.2.3
git tag -d v0.2.3
git push origin :refs/tags/v0.2.3
```

## ✅ Critères de succès

Le déploiement est considéré réussi si :

1. ✅ Les deux sites (app + ios) affichent v0.2.3
2. ✅ Le scroll manuel en mode silencieux est fluide (pas de saccades)
3. ✅ Aucune régression détectée sur les autres modes
4. ✅ La PWA auto-update fonctionne correctement
5. ✅ Aucune erreur critique dans les logs (24h)
6. ✅ Les utilisateurs existants se mettent à jour sans problème

## 📝 Notes de déploiement

**Personnes à notifier** :
- Équipe de développement
- Testeurs
- Support utilisateurs (pour infos sur le correctif)

**Horaire recommandé** :
- Préférer un déploiement en journée (pour monitoring immédiat)
- Éviter les vendredis soirs

**Durée estimée** :
- Build + déploiement : 15-20 minutes
- Vérification : 30 minutes
- Total : ~1 heure

## 📚 Documentation à consulter

- `BUGFIX_SILENT_MODE_SCROLL.md` - Détails techniques du bug
- `TEST_SILENT_SCROLL_FIX.md` - Tests de validation
- `RELEASE_v0.2.3.md` - Notes de release
- Docs PWA : https://vite-pwa-org.netlify.app/

---

**Statut global** : 🟢 Prêt pour déploiement production

**Responsable** : _______________  
**Date effective de déploiement** : _______________  
**Signature** : _______________